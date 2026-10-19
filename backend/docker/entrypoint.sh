#!/bin/sh
set -e

cd /var/www/html

# Render provides the public URL at runtime; use it unless APP_URL is set explicitly
if [ -z "$APP_URL" ] && [ -n "$RENDER_EXTERNAL_URL" ]; then
    export APP_URL="$RENDER_EXTERNAL_URL"
fi

# Render secret files are readable only by root, but PHP runs as www-data: copy the DB CA cert to a readable path
if [ -n "$MYSQL_ATTR_SSL_CA" ]; then
    if [ -r "$MYSQL_ATTR_SSL_CA" ]; then
        install -m 0644 "$MYSQL_ATTR_SSL_CA" /usr/local/share/db-ca.pem
        export MYSQL_ATTR_SSL_CA=/usr/local/share/db-ca.pem
    else
        echo "WARNING: MYSQL_ATTR_SSL_CA=$MYSQL_ATTR_SSL_CA does not exist; check the Secret File name in Render" >&2
    fi
fi

# Config is not cached: controllers read env() directly, which returns null once config is cached
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Migrations only add tables/columns; still opt-in so a deploy never touches the schema unexpectedly
if [ "$RUN_MIGRATIONS" = "true" ]; then
    php artisan migrate --force --no-interaction
fi

chown -R www-data:www-data storage bootstrap/cache

# Queue worker for OTP polling jobs (no free Render background workers, so run it alongside Apache)
if [ "$RUN_QUEUE_WORKER" != "false" ]; then
    (
        while true; do
            su -s /bin/sh www-data -c "php artisan queue:work --sleep=3 --tries=3 --max-time=3600" || true
            sleep 5
        done
    ) &
fi

exec apache2-foreground
