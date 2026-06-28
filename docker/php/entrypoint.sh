#!/bin/bash
set -e

# Ensure appuser owns the working directory (Docker creates bind-mount dirs as root)
chown appuser:appgroup /var/www

cd /var/www

# First run: scaffold the Laravel project
if [ ! -f artisan ]; then
    echo "==> First run: creating Laravel project..."
    gosu appuser composer create-project laravel/laravel . --prefer-dist
fi

# Create .env from example if missing
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Inject DB connection settings.
# Use sed to replace if the key exists, append if it doesn't — the Laravel 11
# SQLite-default .env omits the MySQL keys entirely.
patch_env() {
    local key="$1" val="$2"
    grep -q "^${key}=" .env \
        && sed -i "s|^${key}=.*|${key}=${val}|" .env \
        || echo "${key}=${val}" >> .env
}

patch_env DB_CONNECTION mysql
patch_env DB_HOST        "${DB_HOST:-db}"
patch_env DB_PORT        3306
patch_env DB_DATABASE    "${DB_DATABASE:-timetracker}"
patch_env DB_USERNAME    "${DB_USERNAME:-timetracker}"
patch_env DB_PASSWORD    "${DB_PASSWORD:-secret}"
patch_env APP_URL        http://localhost:8000

# Generate app key on first run
if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
    gosu appuser php artisan key:generate
fi

# Install/update composer dependencies
gosu appuser composer install --no-interaction --prefer-dist --optimize-autoloader

# Wait for DB then run migrations
echo "==> Waiting for database..."
until gosu appuser php artisan migrate --force 2>/dev/null; do
    echo "    DB not ready, retrying in 3s..."
    sleep 3
done

echo "==> Starting php-fpm"
exec php-fpm
