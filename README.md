# LZT Meat Management System

A comprehensive inventory and management system for LZT Meat with React frontend and Laravel backend.

**Original Design**: https://www.figma.com/design/pAaqFhwlHYEznWJE563KHZ/Centralized-Inventory-System

## Overview

LZT Meat is a modern POS and inventory management system designed for meat distribution businesses. It includes:

- **Multi-store management** with centralized inventory control
- **POS system** for retail sales transactions
- **Production tracking** with batch management
- **Ingredient inventory** with supplier management
- **Sales analytics** and reporting
- **Employee management** with role-based access
- **Audit logging** for compliance tracking

## Technology Stack

### Frontend

- **React** 18.3.1 with TypeScript
- **Tailwind CSS** 4.1.12 for styling
- **Vite** 6.3.5 for fast development
- **Radix UI** + **shadcn/ui** for component library
- **Recharts** for data visualization

### Backend

- **Laravel** 11 with PHP 8.1
- **MySQL** 8.0+ database
- **Eloquent ORM** for database management
- **RESTful JSON API**

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- PHP 8.1+
- MySQL 8.0+
- Composer

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev
```

### 3. Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env

# Edit .env with your MySQL credentials:
# DB_DATABASE=lzt_meat
# DB_USERNAME=root
# DB_PASSWORD=your_password

# Setup database
php artisan key:generate
php artisan migrate

# Start Laravel server (http://localhost:8000/api)
php artisan serve
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000/api
- **API Docs**: See `backend/README.md`

## Features

### ✅ Authentication & Authorization

- User login with roles (Admin, Store, Production, POS, Employee)
- Session management with auto-refresh
- Role-based access control (RBAC)

### ✅ Store Management

- Multiple store locations
- Store-specific inventory tracking
- Location-based sales
- Inter-store transfers

### ✅ Inventory Management

- Real-time stock tracking
- Multi-location inventory
- Automatic stock updates
- Inventory history

### ✅ POS System

- Fast transaction processing
- Multiple payment methods
- Customer tracking
- Receipt generation
- Discount and tax calculations

### ✅ Product Management

- Product catalog with categories
- Pricing management
- Product images
- Stock levels

### ✅ Ingredients Management

- Supplier tracking
- Stock level monitoring
- Reorder points
- Expiry date tracking
- Cost per unit

### ✅ Production

- Batch creation and tracking
- Ingredient usage tracking
- Production history
- Quality control logs

### ✅ Sales Analytics

- Sales reports by date range
- Store performance metrics
- Payment method analysis
- Discount tracking

### ✅ Audit & Compliance

- Complete action history
- User activity logs
- System audit trail
- Data change tracking

## Project Structure

```
LZTmeat/
├── backend/                      # Laravel REST API
│   ├── app/
│   │   ├── Http/Controllers/     # API endpoints
│   │   └── Models/               # Database models
│   ├── database/
│   │   └── migrations/           # Database schema
│   ├── routes/
│   │   └── api.php              # API route definitions
│   ├── .env.example             # Environment template
│   ├── composer.json            # PHP dependencies
│   └── README.md                # Backend documentation
├── src/                          # React frontend
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   ├── components/          # Page components
│   │   ├── context/             # React context
│   │   └── ui/                  # UI components
│   ├── utils/
│   │   └── api.ts              # API client
│   ├── styles/                  # CSS & Tailwind
│   ├── main.tsx                # Entry point
│   └── index.html              # HTML template
├── .env.local                   # Frontend config
├── vite.config.ts              # Vite configuration
├── package.json                # Frontend dependencies
├── SETUP_GUIDE.md              # Detailed setup guide
├── BACKEND_SETUP_SUMMARY.md    # Backend overview
└── README.md                    # This file
```

## Configuration

### Frontend Environment (.env.local)

```env
# Choose backend: 'laravel' or 'supabase'
VITE_API_MODE=laravel

# Laravel API URL (when using Laravel backend)
VITE_API_BASE=http://localhost:8000/api
```

### Backend Environment (backend/.env)

```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=lzt_meat
DB_USERNAME=root
DB_PASSWORD=

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# App
APP_URL=http://localhost:8000
```

## Database Schema

### Main Tables

- **users** - User accounts and authentication
- **stores** - Store locations
- **categories** - Product categories
- **products** - Product catalog
- **inventory** - Stock by location
- **ingredients** - Ingredient inventory
- **suppliers** - Supplier information
- **production_records** - Production batches
- **sales** - Sales transactions
- **transfers** - Inter-store transfers
- **system_history** - Audit logs

See `backend/database/migrations/` for complete schema definitions.

## API Endpoints

### Base URL

`http://localhost:8000/api`

### Main Endpoints

```
Authentication
POST   /auth/login
POST   /auth/refresh

Products
GET    /products
POST   /products
PUT    /products/{id}
DELETE /products/{id}

Categories
GET    /categories
POST   /categories
DELETE /categories/{id}

Inventory
GET    /inventory
POST   /inventory
PUT    /inventory/update

Sales
GET    /sales
POST   /sales
PUT    /sales/{id}

And more...
```

Full API documentation in `backend/README.md`

## Development Commands

### Frontend

```bash
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Backend

```bash
composer install                # Install dependencies
php artisan serve              # Start server
php artisan migrate            # Run migrations
php artisan db:seed            # Seed database
php artisan migrate:refresh    # Reset database
```

## Git Workflow

Current branch: `feature/backend`

```bash
# View current branch
git branch -a

# Switch to master
git checkout master

# Pull latest
git pull origin master

# Merge feature branch
git merge feature/backend
```

## Troubleshooting

### CORS Error

Update `backend/.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Database Connection Error

Check credentials in `backend/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lzt_meat
DB_USERNAME=root
DB_PASSWORD=
```

### Port Already in Use

```bash
# Use different port for Laravel
php artisan serve --port=8001

# Use different port for Vite
npm run dev -- --port 5174
```

## Deployment

### Frontend (Vercel, Netlify, etc.)

```bash
npm run build
# Deploy the dist/ folder
```

### Backend (Heroku, DigitalOcean, etc.)

```bash
git push heroku main
php artisan migrate
```

See `SETUP_GUIDE.md` for detailed deployment instructions.

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "feat: description"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

## Support & Documentation

- **Setup Guide**: `SETUP_GUIDE.md`
- **Backend Docs**: `backend/README.md`
- **Backend Summary**: `BACKEND_SETUP_SUMMARY.md`
- **Figma Design**: https://www.figma.com/design/pAaqFhwlHYEznWJE563KHZ/Centralized-Inventory-System

## License

MIT License - See LICENSE file for details

## Project Information

- **Repository**: https://github.com/mikoypft/LZTMEAT.git
- **Current Version**: 0.0.1
- **Last Updated**: January 29, 2026
