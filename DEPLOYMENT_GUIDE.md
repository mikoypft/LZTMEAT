# API Endpoint Checklist & Documentation

## Quick Reference: All Required Endpoints

Every endpoint listed below MUST exist in `backend/index.php` in the `$routes` array.

### Health & Debug
- ✓ `GET /api/health` - Database connection check
- ✓ `GET /api/debug` - Environment variables status

### Authentication
- ✓ `GET /api/auth/profile` - Current user profile
- ✓ `POST /api/auth/login` - User login
- ✓ `POST /api/auth/logout` - User logout
- ✓ `GET /api/auth/check-password` - Verify password

### Products & Categories
- ✓ `GET /api/products` - List all products
- ✓ `POST /api/products` - Create product
- ✓ `PUT /api/products/{id}` - Update product
- ✓ `GET /api/categories` - List all categories
- ✓ `POST /api/categories` - Create category

### Inventory & Ingredients
- ✓ `GET /api/inventory` - List inventory
- ✓ `POST /api/inventory` - Create inventory entry
- ✓ `PUT /api/inventory/{id}` - Update inventory
- ✓ `GET /api/ingredients` - List ingredients
- ✓ `POST /api/ingredients` - Create ingredient
- ✓ `PUT /api/ingredients/{id}` - Update ingredient

### Sales
- ✓ `GET /api/sales` - List sales
- ✓ `POST /api/sales` - Create sale
- ✓ `GET /api/sales/{id}` - Get sale details

### Stores
- ✓ `GET /api/stores` - List all stores
- ✓ `POST /api/stores` - Create store
- ✓ `PUT /api/stores/{id}` - Update store

### Users
- ✓ `GET /api/users` - List users
- ✓ `POST /api/users` - Create user
- ✓ `PUT /api/users/{id}` - Update user

### Production
- ✓ `GET /api/production` - List production records
- ✓ `POST /api/production` - Create production record

### Transfers
- ✓ `GET /api/transfers` - List transfers
- ✓ `POST /api/transfers` - Create transfer
- ✓ `PUT /api/transfers/{id}` - Update transfer

### Suppliers
- ✓ `GET /api/suppliers` - List suppliers
- ✓ `POST /api/suppliers` - Create supplier

### System & Settings
- ✓ `GET /api/history` - System activity history
- ✓ `GET /api/discount-settings` - Get discount settings
- ✓ `PUT /api/discount-settings` - Update discount settings

---

## Required Database Tables

The following tables MUST exist in the database. They are automatically created by `backend/setup-database.php`:

1. **users** - User accounts and authentication
   - Required columns: id, username, email, full_name, password, role, store_id

2. **stores** - Store locations
   - Required columns: id, name, address, phone, email, manager_id

3. **categories** - Product categories
   - Required columns: id, name, description, type

4. **products** - Product master data
   - Required columns: id, name, category_id, price, sku

5. **sales** - Sales transactions
   - Required columns: id, store_id, user_id, subtotal, tax, global_discount, status

6. **sales_items** - Items in each sale
   - Required columns: id, sale_id, product_id, quantity, price, discount

7. **ingredients** - Ingredient definitions
   - Required columns: id, name, category_id, unit, price_per_unit

8. **inventory** - Stock levels
   - Required columns: id, product_id, ingredient_id, location_id, quantity

9. **production** - Production records
   - Required columns: id, product_id, quantity, user_id, status, type

10. **transfers** - Stock transfers between stores
    - Required columns: id, from_store_id, to_store_id, product_id, ingredient_id, quantity, status

11. **suppliers** - Supplier information
    - Required columns: id, name, address, phone, email

12. **system_history** - Activity audit log
    - Required columns: id, action, entity, entity_id, details, user_id, created_at

13. **discount_settings** - Global discount configuration
    - Required columns: id, wholesale_min_units, discount_type, wholesale_discount_percent

14. **stock_adjustments** - Inventory adjustments
    - Required columns: id, inventory_id, adjustment_type, quantity_change, reason, user_id

---

## Pre-Deployment Checklist

Before pushing to production:

1. **Run validation**
   ```bash
   php backend/validate-deployment.php
   ```
   - All endpoints exist ✓
   - All database tables exist ✓
   - All critical columns exist ✓

2. **Check environment file**
   ```bash
   # Make sure .env.production exists with:
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=lztmeat_admin
   DB_USERNAME=lztmeat
   DB_PASSWORD=Lztmeat@2026
   ```

3. **Test locally first**
   ```bash
   npm run build  # Build frontend
   php -S localhost:8000  # Test backend
   # Visit http://localhost:8000 and test major features
   ```

4. **Review changes**
   ```bash
   git diff main..prod  # See all changes
   git log --oneline main..prod  # See all commits
   ```

5. **Push to production**
   ```bash
   git push origin prod  # Pre-push hook will validate
   ```

6. **Deploy on Plesk**
   - Pull code via Git in Plesk UI
   - SSH and run: `php backend/setup-database.php` (if needed)
   - Clear any caches
   - Test at https://lztmeat.com

---

## Adding New Endpoints

When adding a new endpoint:

1. **Add route to `backend/index.php`** in the `$routes` array
   ```php
   'GET /api/my-endpoint' => function() use ($pdo) {
       try {
           // Your logic here
           return ['data' => 'value'];
       } catch (Exception $e) {
           http_response_code(500);
           return ['error' => $e->getMessage()];
       }
   },
   ```

2. **Create/add database table if needed** in `backend/setup-database.php`

3. **Add to validation checklist** in `backend/validate-deployment.php`

4. **Test with**
   ```bash
   curl http://localhost:8000/api/my-endpoint
   ```

5. **Validate before push**
   ```bash
   php backend/validate-deployment.php
   ```

---

## Common Error Patterns & Fixes

### Error: "Column not found in 'field list'"
- **Cause**: Wrong column name in SQL query
- **Fix**: Check schema with `php backend/setup-database.php` and verify column names match

### Error: "Endpoint not found"
- **Cause**: Route not defined in `$routes` array
- **Fix**: Add endpoint definition before closing `];` of routes

### Error: "SQLSTATE[42S02]: Table 'something'"
- **Cause**: Table doesn't exist
- **Fix**: Run `php backend/setup-database.php` to create all tables

### Error: "Column 'name' doesn't exist in table 'users'"
- **Cause**: Using wrong column name (was using 'name' instead of 'full_name')
- **Fix**: Check `backend/setup-database.php` for correct column names

---

## Environment Fallback System

The `backend/index.php` includes an emergency override that:
- Detects if old credentials are being used
- Automatically switches to production credentials
- Prevents database connection failures

This safety net prevents future deployment issues but DOESN'T replace proper setup.

---

## Questions?

Check:
1. `backend/validate-deployment.php` - Shows exactly what's missing
2. `backend/setup-database.php` - Creates all required tables
3. `backend/index.php` - Verify your endpoint exists in `$routes`
4. `.env.production` - Verify credentials are correct
