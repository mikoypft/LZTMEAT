#!/bin/bash
# Plesk Git Deployment Script for LZT Meat
# This script runs after Plesk pulls from Git

set -e

echo "=== LZT Meat Deployment Started ==="
echo "Timestamp: $(date)"

# Navigate to project root
cd "$(dirname "$0")"

# ================================
# Disable Passenger if present
# ================================
echo ""
echo ">>> Checking for Passenger..."
if [ -f "tmp/restart.txt" ]; then
    echo ">>> Passenger detected, touching restart.txt..."
    touch tmp/restart.txt
fi

# ================================
# Frontend Build
# ================================
echo ""
echo ">>> Installing frontend dependencies..."
npm ci --production=false

echo ""
echo ">>> Building frontend..."
npm run build

# Ensure dist/.htaccess exists after build
if [ -f "dist/.htaccess.bak" ]; then
    cp dist/.htaccess.bak dist/.htaccess
fi

# ================================
# Backend Setup
# ================================
echo ""
echo ">>> Setting up Laravel backend..."
cd backend

# Create required storage directories
echo ">>> Creating storage directories..."
mkdir -p storage/app/public
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/testing
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Install composer dependencies
echo ">>> Installing composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Copy production environment if .env doesn't exist or is outdated
if [ ! -f .env ] || [ .env.production -nt .env ]; then
    if [ -f .env.production ]; then
        echo ">>> Copying production environment..."
        cp .env.production .env
    else
        echo "!!! WARNING: .env.production not found. Create it manually with database credentials."
    fi
fi

# Generate app key if not set
if grep -q "^APP_KEY=$" .env 2>/dev/null || ! grep -q "^APP_KEY=" .env 2>/dev/null; then
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
# Final setup
# ================================

# Ensure the root index.php is executable
chmod 644 index.php 2>/dev/null || true

echo ""
echo ">>> Deployment complete!"
echo ""
echo "=== Post-Deployment Checklist ==="
echo "1. Ensure document root in Plesk points to project root (NOT dist/)"
echo "2. DISABLE Node.js in Plesk (Websites & Domains → Node.js → turn OFF)"
echo "3. Ensure Apache is serving PHP (not Passenger)"
echo "4. Update backend/.env.production with your database credentials"
echo "5. Verify the site at https://lztmeat.com"
echo ""
