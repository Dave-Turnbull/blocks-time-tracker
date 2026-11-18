#!/bin/bash
set -e

cd /var/www

# Create .env if it doesn't exist (image never bakes one in)
if [ ! -f .env ]; then
    touch .env
fi

# Inject runtime settings. Replace if the key exists, append if it doesn't.
patch_env() {
    local key="$1" val="$2"
    grep -q "^${key}=" .env \
        && sed -i "s|^${key}=.*|${key}=${val}|" .env \
        || echo "${key}=${val}" >> .env
}

patch_env APP_ENV        "${APP_ENV:-production}"
patch_env APP_DEBUG      "${APP_DEBUG:-false}"
patch_env APP_KEY        "${APP_KEY}"
patch_env APP_URL        "${APP_URL}"
patch_env DB_CONNECTION  mysql
patch_env DB_HOST        "${DB_HOST:-db}"
patch_env DB_PORT        "${DB_PORT:-3306}"
patch_env DB_DATABASE    "${DB_DATABASE}"
patch_env DB_USERNAME    "${DB_USERNAME}"
patch_env DB_PASSWORD    "${DB_PASSWORD}"

gosu appuser php artisan config:clear

echo "==> Waiting for database..."
until gosu appuser php artisan migrate --force 2>/dev/null; do
    echo "    DB not ready, retrying in 3s..."
    sleep 3
done

gosu appuser php artisan config:cache
gosu appuser php artisan route:cache
gosu appuser php artisan view:cache

echo "==> Starting php-fpm"
exec php-fpm
