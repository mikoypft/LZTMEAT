# LZT Meat - Complete Setup Guide

## Project Structure

```
LZTmeat/
├── backend/                          # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/Api/     # API Controllers
│   │   └── Models/                   # Eloquent Models
│   ├── database/
│   │   └── migrations/               # Database migrations
│   ├── routes/
│   │   └── api.php                   # API routes
│   ├── .env.example                  # Environment template
│   ├── composer.json                 # PHP dependencies
│   └── README.md                     # Backend documentation
├── src/                              # React frontend
│   ├── app/
│   ├── utils/
│   │   └── api.ts                    # API client (updated for dual backend)
│   └── styles/
├── .env.local                        # Frontend environment config
├── vite.config.ts                    # Vite config
└── package.json                      # Frontend dependencies
```

## Quick Start

### Option 1: Using Laravel Backend (Recommended)

#### Step 1: Setup Laravel Backend

```bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Edit .env and configure MySQL database
# Set these values:
# DB_DATABASE=lzt_meat
# DB_USERNAME=root
# DB_PASSWORD=your_password

# Generate application key
php artisan key:generate

# Create MySQL database
mysql -u root -p
> CREATE DATABASE lzt_meat;
> EXIT;

# Run migrations to create tables
php artisan migrate

# Start Laravel server (runs on port 8000)
php artisan serve
```

#### Step 2: Setup React Frontend

```bash
# In project root
npm install

# The .env.local is already configured to use Laravel backend
# It's set to VITE_API_MODE=laravel with VITE_API_BASE=http://localhost:8000/api

# Start Vite dev server (runs on port 5173)
npm run dev
```

#### Step 3: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

### Option 2: Using Supabase Backend

If you want to use the original Supabase backend instead:

```bash
# Edit .env.local in the root directory
VITE_API_MODE=supabase
# VITE_API_BASE is not needed when using supabase
```

Then restart the frontend. It will use your existing Supabase configuration.

## Database Setup (MySQL)

### Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE lzt_meat;
USE lzt_meat;
```

### Run Migrations

```bash
cd backend
php artisan migrate
```

This creates:
- `users` - User accounts (Admin, Store Manager, Production, POS, Employee)
- `stores` - Store locations
- `categories` - Product categories
- `products` - Products with prices
- `suppliers` - Supplier information
- `ingredients` - Ingredients inventory
- `inventory` - Product stock by location
- `production_records` - Production batches
- `production_ingredients` - Ingredients used per production
- `sales` - Sales transactions
- `transfers` - Inter-store transfers
- `system_history` - Audit log

### Seed Test Data (Optional)

To create sample data, you can create a seeder:

```bash
php artisan make:seeder SampleDataSeeder
```

Then edit `database/seeders/SampleDataSeeder.php` and run:

```bash
php artisan db:seed
```

## API Endpoints

### Base URL
- **Laravel**: `http://localhost:8000/api`
- **Supabase**: `https://{project-id}.supabase.co/functions/v1/...`

### Authentication
```
POST /auth/login
POST /auth/refresh
```

### Resources
- `/products` - Product management
- `/categories` - Product categories
- `/inventory` - Stock management
- `/ingredients` - Ingredients management
- `/sales` - Sales transactions
- `/production` - Production records
- `/transfers` - Inter-store transfers
- `/stores` - Store management
- `/employees` - Employee management
- `/suppliers` - Supplier management
- `/history` - Activity logs

Detailed API documentation available in `backend/README.md`

## Environment Variables

### Frontend (.env.local)

```env
# API Mode: 'laravel' or 'supabase'
VITE_API_MODE=laravel

# Laravel API base URL
VITE_API_BASE=http://localhost:8000/api
```

### Backend (.env)

```env
# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lzt_meat
DB_USERNAME=root
DB_PASSWORD=

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API Base URL
API_BASE_URL=http://localhost:8000
```

## Development Workflow

### Terminal 1: Backend
```bash
cd backend
php artisan serve
```

### Terminal 2: Frontend
```bash
npm run dev
```

### Terminal 3 (Optional): Database
```bash
# Monitor database or run artisan commands
cd backend
php artisan tinker
```

## Common Tasks

### Reset Database

```bash
cd backend
php artisan migrate:refresh
```

### Clear All Data

```bash
cd backend
php artisan migrate:refresh --seed
```

### Check Database

```bash
cd backend
php artisan tinker
> User::count()
> Product::count()
```

### View Logs

```bash
cd backend
tail -f storage/logs/laravel.log
```

## Switching Between Backends

### To use Laravel:
Edit `.env.local`:
```env
VITE_API_MODE=laravel
VITE_API_BASE=http://localhost:8000/api
```

### To use Supabase:
Edit `.env.local`:
```env
VITE_API_MODE=supabase
```

Then restart the frontend dev server.

## Troubleshooting

### CORS Errors
If you see CORS errors, check `.env` in backend:
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Database Connection Error
Check `.env` in backend:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lzt_meat
DB_USERNAME=root
DB_PASSWORD=
```

### 404 on API Requests
Ensure Laravel is running:
```bash
php artisan serve
```

Should show: `Laravel development server started on http://127.0.0.1:8000`

### Port Already in Use

**For Laravel (port 8000):**
```bash
php artisan serve --port=8001
```

**For Vite (port 5173):**
```bash
npm run dev -- --port 5174
```

## Next Steps

1. Create admin user and store locations
2. Add products and categories
3. Configure ingredients inventory
4. Set up sales transactions
5. Track production and transfers

## Support

- Backend issues: See `backend/README.md`
- Frontend issues: See main project README
- Database: MySQL 8.0+ documentation

---

**Technology Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Backend: Laravel 11 + PHP 8.1
- Database: MySQL 8.0+
- API: RESTful JSON API with Laravel Eloquent ORM
