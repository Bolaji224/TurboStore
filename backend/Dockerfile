FROM php:8.3-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip curl \
    libzip-dev libpng-dev libonig-dev libxml2-dev libpq-dev \
    && docker-php-ext-install \
       pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    PORT=10000 \
    COMPOSER_ALLOW_SUPERUSER=1

# Serve from /public, allow .htaccess rewrites, and listen on Render's $PORT
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
        /etc/apache2/apache2.conf \
        /etc/apache2/conf-available/*.conf \
    && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
    && sed -ri 's!Listen 80!Listen ${PORT}!' /etc/apache2/ports.conf \
    && sed -ri 's!<VirtualHost \*:80>!<VirtualHost *:${PORT}>!' /etc/apache2/sites-available/000-default.conf \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/html

# Install dependencies first so this layer is cached between code changes
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts --no-autoloader

COPY . .

RUN composer dump-autoload --optimize --no-dev \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod +x docker/entrypoint.sh

EXPOSE 10000

CMD ["docker/entrypoint.sh"]
