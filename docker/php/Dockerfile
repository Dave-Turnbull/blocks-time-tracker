FROM php:8.3-fpm

ARG UID=1000
ARG GID=1000

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip gosu \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN groupadd -f -g ${GID} appgroup \
    && useradd -u ${UID} -g ${GID} -m -s /bin/bash appuser

# Configure php-fpm workers to run as appuser
RUN sed -i "s/user = www-data/user = appuser/" /usr/local/etc/php-fpm.d/www.conf \
    && sed -i "s/group = www-data/group = appgroup/" /usr/local/etc/php-fpm.d/www.conf

ENV COMPOSER_HOME=/home/appuser/.composer

WORKDIR /var/www

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
