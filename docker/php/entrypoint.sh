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

# Inject DB connection settings
sed -i "s|DB_HOST=.*|DB_HOST=${DB_HOST:-db}|" .env
sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE:-timetracker}|" .env
sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME:-timetracker}|" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD:-secret}|" .env
sed -i "s|APP_URL=.*|APP_URL=http://localhost:8000|" .env

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
