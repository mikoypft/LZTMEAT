# LZT Meat - Laravel Backend

This is the Laravel backend for the LZT Meat Management System with MySQL database.

## Requirements

- PHP 8.1+
- MySQL 8.0+
- Composer
- Laravel 11

## Installation

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Environment Configuration

Copy the example environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` and set your MySQL database credentials:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lzt_meat
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 3. Generate Application Key

```bash
php artisan key:generate
```

### 4. Create Database

Create a new MySQL database:

```sql
CREATE DATABASE lzt_meat;
```

### 5. Run Migrations

```bash
php artisan migrate
```

This will create all necessary tables:

- `users` - User accounts and employees
- `stores` - Store locations
- `categories` - Product categories
- `products` - Products
- `suppliers` - Suppliers
- `ingredients` - Ingredients inventory
- `inventory` - Product stock by location
- `production_records` - Production records
- `production_ingredients` - Ingredients used in production
- `sales` - Sales transactions
- `transfers` - Inter-store transfers
- `system_history` - Activity logs

### 6. Start the Development Server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000/api`

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication
- `POST /auth/login` - Login with username and password
- `POST /auth/refresh` - Refresh user session

### Products
- `GET /products` - Get all products
- `POST /products` - Create new product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `DELETE /products/delete-all` - Delete all products

### Categories
- `GET /categories` - Get all categories
- `POST /categories` - Create category
- `DELETE /categories/{id}` - Delete category

### Inventory
- `GET /inventory` - Get all inventory (optional: ?location=xxx)
- `POST /inventory` - Add inventory
- `PUT /inventory/update` - Update inventory quantity

### Ingredients
- `GET /ingredients` - Get all ingredients
- `POST /ingredients` - Create ingredient
- `PUT /ingredients/{id}` - Update ingredient
- `DELETE /ingredients/{id}` - Delete ingredient
- `POST /ingredients/reset` - Clear all ingredients

### Sales
- `GET /sales` - Get sales (optional: ?startDate=xxx&endDate=xxx)
- `POST /sales` - Create sale
- `PUT /sales/{id}` - Update sale

### Production
- `GET /production` - Get production records
- `POST /production` - Create production record
- `PATCH /production/{id}` - Update production status
- `DELETE /production/{id}` - Delete production record

### Transfers
- `GET /transfers` - Get all transfers
- `POST /transfers` - Create transfer
- `PUT /transfers/{id}` - Update transfer status

### Stores
- `GET /stores` - Get all stores
- `POST /stores` - Create store
- `PUT /stores/{id}` - Update store
- `DELETE /stores/{id}` - Delete store

### Users/Employees
- `GET /employees` - Get all employees
- `POST /employees` - Create employee
- `GET /users/all` - Get all users (system + employees)
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Suppliers
- `GET /suppliers` - Get all suppliers
- `POST /suppliers` - Create supplier
- `PUT /suppliers/{id}` - Update supplier
- `DELETE /suppliers/{id}` - Delete supplier

### History
- `GET /history` - Get all system history
- `GET /history/pos` - Get POS history
- `GET /history/inventory` - Get inventory history
- `GET /history/production` - Get production history
- `GET /history/ingredients` - Get ingredients history

## Frontend Configuration

Update the frontend `src/utils/api.ts` to point to your Laravel backend:

Change the API_BASE from Supabase to:

```typescript
const API_BASE = 'http://localhost:8000/api';
```

## CORS Configuration

CORS is configured in `.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

You can add a CORS middleware to `app/Http/Middleware/` if needed.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'STORE', 'PRODUCTION', 'POS', 'EMPLOYEE'),
  employee_role ENUM('Store', 'Production', 'Employee', 'POS'),
  store_id INT FOREIGN KEY,
  permissions JSON,
  can_login BOOLEAN DEFAULT true,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

Similar schema documentation for other tables is available in the migrations folder.

## Testing

To test the API, you can use tools like:

- Postman
- Insomnia
- cURL
- Thunder Client

## Support

For issues or questions, please refer to the main project README.
