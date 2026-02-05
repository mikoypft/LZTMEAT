#!/bin/bash
# Plesk Git Deployment Script for LZT Meat
# This script runs after Plesk pulls from Git

set -e

echo "=== LZT Meat Deployment Started ==="
echo "Timestamp: $(date)"

# Navigate to project root
cd "$(dirname "$0")"

# ================================
# Frontend Build
# ================================
echo ""
echo ">>> Installing frontend dependencies..."
npm ci --production=false

echo ""
echo ">>> Building frontend..."
npm run build

# ================================
# Backend Setup
# ================================
echo ""
echo ">>> Setting up Laravel backend..."
cd backend

# Install composer dependencies
echo ">>> Installing composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Copy production environment if .env doesn't exist or is outdated
if [ ! -f .env ] || [ .env.production -nt .env ]; then
    echo ">>> Copying production environment..."
    cp .env.production .env
    echo "!!! IMPORTANT: Update .env with your database credentials and run 'php artisan key:generate' !!!"
fi

# Generate app key if not set
if ! grep -q "^APP_KEY=base64" .env; then
    echo ">>> Generating application key..."
    php artisan key:generate --force
fi

# Run migrations
echo ">>> Running database migrations..."
php artisan migrate --force

# Clear and cache configurations
echo ">>> Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions
echo ">>> Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

cd ..

# ================================
# Copy built files to document root
# ================================
echo ""
echo ">>> Deployment complete!"
echo ""
echo "=== Post-Deployment Checklist ==="
echo "1. Ensure document root in Plesk is set to: /dist"
echo "2. Update backend/.env with your database credentials"
echo "3. Verify the site at https://lztmeat.com"
echo ""
