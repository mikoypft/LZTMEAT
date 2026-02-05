# LZT Meat - Plesk Deployment Guide

## Overview
This project consists of:
- **Frontend**: Vite + React SPA (builds to `/dist`)
- **Backend**: Laravel 11 API (in `/backend`)

Production URL: https://lztmeat.com

---

## Plesk Configuration

### 1. Document Root Setup
Set the document root in Plesk to point to the **`dist`** folder:
```
/httpdocs/dist
```

Or if the repo is cloned directly:
```
/your-repo-folder/dist
```

### 2. PHP Version
Ensure PHP 8.1+ is selected for the domain.

### 3. Git Repository Settings
In Plesk Git panel:
- **Repository URL**: Your Git repo URL
- **Branch**: `plesk/prod-fixes-2`
- **Deployment mode**: Automatic
- **Post-deployment script**: `bash deploy.sh`

---

## Manual Deployment Steps

If not using the automated script:

### Frontend
```bash
npm ci
npm run build
```

### Backend
```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.production .env
# Edit .env with your database credentials
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
chmod -R 775 storage bootstrap/cache
```

---

## Environment Configuration

### Backend (.env)
Update these values in `backend/.env`:
```env
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

### Frontend
The frontend is pre-configured to use `/api` for API calls. No changes needed.

---

## Directory Structure on Server

```
/httpdocs (or your domain folder)
├── dist/                 ← Document Root (set in Plesk)
│   ├── index.html
│   ├── assets/
│   └── .htaccess
├── backend/
│   ├── public/
│   │   └── index.php    ← Laravel entry point
│   ├── .env
│   └── ...
├── deploy.sh
└── ...
```

---

## API Routing

The `.htaccess` in `/dist` routes:
- `/api/*` → Laravel backend (`/backend/public/index.php`)
- All other routes → `index.html` (SPA routing)

---

## Troubleshooting

### 500 Error on API
1. Check `backend/storage/logs/laravel.log`
2. Ensure storage permissions: `chmod -R 775 backend/storage`
3. Verify `.env` database credentials

### Frontend shows blank page
1. Check browser console for errors
2. Verify document root is set to `/dist`
3. Check `.htaccess` is in the dist folder

### CORS errors
The Laravel backend already has CORS configured. Ensure the request goes through `/api` path.

---

## Post-Deployment Checklist

- [ ] Document root set to `/dist`
- [ ] PHP 8.1+ enabled
- [ ] Database created and credentials in `backend/.env`
- [ ] `php artisan key:generate` run
- [ ] Migrations run
- [ ] Storage permissions set
- [ ] Site accessible at https://lztmeat.com
- [ ] API working at https://lztmeat.com/api
