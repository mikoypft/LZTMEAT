# LZT Meat Project - Master Reference Guide

**Last Updated:** February 6, 2026  
**Project Status:** ✅ Production Deployed  
**GitHub:** https://github.com/mikoypft/LZTMEAT  
**Live Site:** https://lztmeat.com  
**Branch:** `prod` (production), `main` (development)

---

## 1. PROJECT OVERVIEW

### What This Project Is
- **Frontend:** React SPA (Single Page Application) with Vite
- **Backend:** Standalone PHP API (no Laravel/Composer required on production)
- **Database:** MySQL with 14 core tables
- **Server:** Plesk hosting with Apache + PHP 8.4.17
- **Deployment:** Git-based (no SSH scripts - all manual via Plesk UI)

### Project Goals
✅ Manage meat product sales, inventory, and production  
✅ Track transfers between multiple stores  
✅ Monitor wholesale discounts and pricing  
✅ Maintain system activity history  
✅ No downtime deployments via Git updates  

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **TypeScript:** Yes
- **UI Components:** Custom + Shadcn
- **State Management:** React Context
- **Package Manager:** npm
- **Build Output:** `dist/` folder

### Backend
- **Language:** PHP 8.4.17 (standalone, no framework required)
- **Database:** MySQL 5.7+
- **API Style:** RESTful JSON
- **Authentication:** Session-based
- **Entry Point:** `backend/index.php` (not Laravel)

### DevOps
- **Version Control:** Git
- **Hosting:** Plesk
- **Web Server:** Apache 2.4+
- **Module:** mod_rewrite enabled
- **SSL:** Yes (HTTPS required)

---

## 3. CRITICAL PROJECT STRUCTURE

```
/httpdocs (document root on Plesk)
├── index.php                          ⭐ ROOT ROUTER - ALL requests flow here
├── .htaccess                          ⭐ Apache routing rules
├── /dist                              ⭐ React build output (served as static files)
│   ├── index.html
│   ├── .htaccess                      (SPA routing, optional since root handles it)
│   └── /assets                        (JS, CSS, images)
├── /src                               Frontend TypeScript source
├── /backend
│   ├── index.php                      ⭐ STANDALONE API SERVER - handles all /api/* routes
│   ├── .env.production                ⭐ DB CREDENTIALS (DB_HOST, DB_USERNAME, DB_PASSWORD)
│   ├── validate-deployment.php        ⭐ VALIDATION SCRIPT - checks endpoints/tables before push
│   ├── setup-database.php             ⭐ SETUP SCRIPT - creates all DB tables
│   └── /database/migrations           (Schema definitions - for reference only)
├── package.json                       npm dependencies
├── vite.config.ts                     Build configuration
├── postcss.config.mjs                 CSS processing
├── .git/hooks
│   ├── pre-push                       ⭐ BLOCKS BROKEN PUSHES - validates before push to prod
│   └── post-merge                     (Alerts on backend changes after merge)
├── DEPLOYMENT_GUIDE.md                API endpoint reference (30+ endpoints)
├── DEPLOYMENT_PREVENTION_SYSTEM.md    Workflow guide + error prevention
├── ERROR_HANDLING_GUIDE.md            MIME types, caching, error responses
├── PROJECT_MASTER_GUIDE.md            ⭐ THIS FILE
├── setup-and-validate.sh              Quick setup script for Linux/Mac
├── setup-and-validate.bat             Quick setup script for Windows
├── test-error-handling.sh             Error handling verification (Linux/Mac)
└── test-error-handling.bat            Error handling verification (Windows)
```

**⭐ = CRITICAL FILES - Don't delete or break these**

---

## 4. DATABASE SCHEMA

### 14 Required Tables

| Table | Purpose | Key Columns |
|-------|---------|------------|
| **users** | User accounts | id, username, full_name, password, role, store_id |
| **stores** | Store locations | id, name, address, phone, email, manager_id |
| **categories** | Product categories | id, name, description, type |
| **products** | Product master data | id, name, category_id, price, sku |
| **sales** | Sales transactions | id, store_id, user_id, subtotal, tax, global_discount, status |
| **sales_items** | Items per sale | id, sale_id, product_id, quantity, price, discount |
| **ingredients** | Ingredient definitions | id, name, category_id, unit, price_per_unit |
| **inventory** | Stock levels | id, product_id, ingredient_id, location_id, quantity |
| **production** | Production records | id, product_id, quantity, user_id, status, type |
| **transfers** | Store-to-store transfers | id, from_store_id, to_store_id, product_id, quantity, status |
| **suppliers** | Supplier info | id, name, address, phone, email |
| **system_history** | Activity audit log | id, action, entity, entity_id, details, user_id, created_at |
| **discount_settings** | Global discounts | id, wholesale_min_units, discount_type, wholesale_discount_percent |
| **stock_adjustments** | Inventory adjustments | id, inventory_id, adjustment_type, quantity_change, reason, user_id |

All auto-created by: `php backend/setup-database.php`

### Database Credentials (Plesk)
- **Host:** localhost
- **Port:** 3306
- **Username:** lztmeat
- **Password:** Lztmeat@2026
- **Database:** lztmeat_admin

Location: `/backend/.env.production`

---

## 5. API ENDPOINTS (30+)

### Health & Debug
- `GET /api/health` - Database connection status
- `GET /api/debug` - Environment variables loaded

### Authentication (6)
- `GET /api/auth/profile` - Current user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check-password` - Verify password
- `POST /api/auth/update-profile` - Update user
- `POST /api/auth/change-password` - Change password

### Products & Categories (5)
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

### Inventory & Ingredients (6)
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Create entry
- `PUT /api/inventory/{id}` - Update entry
- `GET /api/ingredients` - List ingredients
- `POST /api/ingredients` - Create ingredient
- `PUT /api/ingredients/{id}` - Update ingredient

### Sales (3)
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/{id}` - Get sale details

### Stores (3)
- `GET /api/stores` - List stores
- `POST /api/stores` - Create store
- `PUT /api/stores/{id}` - Update store

### Users (3)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user

### Production (2)
- `GET /api/production` - List production records
- `POST /api/production` - Create record

### Transfers (3)
- `GET /api/transfers` - List transfers
- `POST /api/transfers` - Create transfer
- `PUT /api/transfers/{id}` - Update transfer

### Other (3)
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/history` - System activity history

### Settings (2)
- `GET /api/discount-settings` - Get discount config
- `PUT /api/discount-settings` - Update discount config

**All endpoints must be defined in `backend/index.php` in the `$routes` array**

---

## 6. DEPLOYMENT WORKFLOW

### Local Development to Production

#### Step 1: Make Changes Locally
```bash
git checkout -b feature/my-feature main
# ... edit files ...
git add .
git commit -m "feat: description"
```

#### Step 2: Validate Locally
```bash
php backend/validate-deployment.php
# Must show: ✓ ALL VALIDATIONS PASSED
```

If validation fails:
- Fix the issue (add missing endpoint, correct column name, etc.)
- Validate again
- Commit fix

#### Step 3: Merge to Prod
```bash
git checkout prod
git merge feature/my-feature
```

#### Step 4: Push (Auto-Validates)
```bash
git push origin prod

# Pre-push hook runs automatically:
# 🔍 Running pre-push validation...
# ✓ All checks passed
# ✅ Ready to push
```

If pre-push hook blocks you:
```bash
# Read the error message carefully
# Fix the issue
git add .
git commit --amend
git push origin prod
```

#### Step 5: Deploy on Server
```bash
# SSH to Plesk
ssh user@lztmeat.com
cd /httpdocs

# Pull latest code
git pull origin prod

# Create/update database tables
php backend/setup-database.php

# Verify deployment
php backend/validate-deployment.php

# Test (optional)
bash test-error-handling.sh https://lztmeat.com
```

#### Step 6: Verify
- Visit https://lztmeat.com
- Test major features
- Check browser console for errors

---

## 7. PROTECTION SYSTEMS IN PLACE

### ✅ Pre-Push Validation (`.git/hooks/pre-push`)
**When:** Every `git push origin prod`  
**Checks:**
- All API endpoints defined in `$routes`
- All database tables can be created
- All critical columns exist
- No PHP syntax errors
- Database credentials valid

**If fails:** Push is blocked, error shown, you fix & retry

### ✅ Database Auto-Setup (`backend/setup-database.php`)
**When:** Run manually on server: `php backend/setup-database.php`  
**Does:**
- Creates all 14 required tables if missing
- Adds missing columns to existing tables
- Initializes default values
- Sets up indexes for performance

**Result:** Database schema always matches code expectations

### ✅ Validation Script (`backend/validate-deployment.php`)
**When:** Run manually: `php backend/validate-deployment.php`  
**Checks:**
- Same as pre-push hook
- Can run anytime to verify state
- Shows detailed status of each check

**Result:** Know exactly what's missing before pushing

### ✅ MIME Type Protection (3 Layers)
1. **PHP Layer** (`index.php`): Maps extensions to MIME types, sets headers
2. **Apache Layer** (`.htaccess`): `AddType` declarations
3. **HTTP Headers** (`.htaccess`): Explicit `Content-Type` headers

**Result:** JavaScript/CSS always load with correct MIME types

### ✅ CORS Protection
**Where:** `index.php` and `.htaccess`  
**Allows:**
- Cross-origin API calls
- Font loading from different paths
- Module loading from any origin

**Result:** No "CORS policy" errors

### ✅ Error Handling
**Database errors:** Wrapped in try-catch, return JSON with error message  
**Missing endpoints:** Return 404 with clear error message  
**Missing tables:** Setup script creates them automatically  
**Broken credentials:** Emergency override detects old creds, switches to production  

### ✅ Asset Caching
- **Versioned assets** (`index-ABC123.js`): 1 year cache (immutable)
- **Dynamic pages** (`index.html`): No cache (always fresh)
- **Result:** Old version instant load from cache, new version loads fresh after deploy

### ✅ Error Logging
- `backend/database_error.log` - Connection errors
- `backend/env_debug.log` - Environment loading
- `backend/api_requests.log` - Request logging

---

## 8. CRITICAL COMMANDS

### Local Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Validate before pushing
php backend/validate-deployment.php

# Test locally
curl http://localhost:5173
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/name main

# Switch to prod
git checkout prod

# Merge from main
git merge main

# Push to production (with auto-validation)
git push origin prod

# Push without validation (emergency only)
git push origin prod --no-verify

# See what changed
git diff main..prod
git log --oneline main..prod
```

### Server Deployment
```bash
# SSH to server
ssh user@lztmeat.com

# Go to project
cd /httpdocs

# Pull latest
git pull origin prod

# Setup database
php backend/setup-database.php

# Validate
php backend/validate-deployment.php

# Test error handling
bash test-error-handling.sh https://lztmeat.com

# Check API health
curl https://lztmeat.com/api/health
curl https://lztmeat.com/api/debug

# View logs
tail -f backend/database_error.log
```

---

## 9. COMMON ISSUES & FIXES

### ❌ "Pre-push validation failed: Missing endpoints"

**Cause:** You added new code but didn't define the endpoint in `$routes`

**Fix:**
1. Open `backend/index.php`
2. Find the line: `$routes = [`
3. Add your endpoint before the closing `];`
   ```php
   'GET /api/my-endpoint' => function() use ($pdo) {
       // your code
   },
   ```
4. Save and commit: `git add . && git commit --amend`
5. Push again: `git push origin prod`

### ❌ "Missing columns: users.name"

**Cause:** Code references wrong column (should be `users.full_name`)

**Fix:**
1. Find where `users.name` is used
2. Change to `users.full_name`
3. Save and commit: `git add . && git commit --amend`
4. Validate: `php backend/validate-deployment.php`
5. Push: `git push origin prod`

### ❌ "Database connection failed"

**Cause:** Credentials wrong or database not running

**Fix:**
1. Check `.env.production` has correct credentials
2. On server, run: `php backend/setup-database.php`
3. Check if MySQL is running
4. Test: `curl https://lztmeat.com/api/health`

### ❌ "JavaScript not loading" or "Failed to parse module"

**Cause:** MIME type wrong

**Check:** `curl -I https://lztmeat.com/assets/index-ABC123.js`  
Should show: `Content-Type: application/javascript`

**Fix:** Already protected by 3-layer MIME type system - shouldn't happen

### ❌ "500 Internal Server Error"

**Cause:** Database query failed or missing endpoint

**Fix:**
1. Check: `curl https://lztmeat.com/api/health`
2. If DB connected, endpoint is missing - add it to `backend/index.php`
3. If DB not connected, run: `php backend/setup-database.php`

### ❌ "Cannot GET /some-path"

**Cause:** Missing `.htaccess` or document root wrong

**Should not happen** - but if it does:
1. Check document root is `/httpdocs` (not `/httpdocs/dist`)
2. Verify `.htaccess` exists in root
3. Verify `index.php` exists in root
4. Restart Apache in Plesk UI

---

## 10. FILE PURPOSES REFERENCE

| File | Purpose |
|------|---------|
| `index.php` | **ROOT ROUTER** - handles all incoming requests, MIME types, static files, API routing |
| `.htaccess` | **Apache rules** - mod_rewrite, MIME types, cache headers, CORS |
| `dist/` | **React build** - static HTML/JS/CSS to serve |
| `backend/index.php` | **Standalone API** - handles all `/api/*` routes, database queries, error responses |
| `backend/.env.production` | **Database credentials** - DB_HOST, DB_USERNAME, DB_PASSWORD |
| `backend/validate-deployment.php` | **Validation engine** - checks endpoints, tables, columns, credentials |
| `backend/setup-database.php` | **Database initializer** - creates/updates all 14 tables |
| `.git/hooks/pre-push` | **Push validation** - blocks broken code before pushing |
| `DEPLOYMENT_GUIDE.md` | **API reference** - all 30+ endpoints listed |
| `DEPLOYMENT_PREVENTION_SYSTEM.md` | **System guide** - workflow, examples, troubleshooting |
| `ERROR_HANDLING_GUIDE.md` | **Technical details** - MIME types, caching, error codes |
| `PROJECT_MASTER_GUIDE.md` | **THIS FILE** - project overview and master reference |

---

## 11. WHAT NOT TO BREAK

🚫 **Critical files** - Don't delete, move, or rename:
- `index.php` - Root router
- `backend/index.php` - API server
- `.htaccess` - Apache routing
- `backend/.env.production` - Database credentials
- `.git/hooks/pre-push` - Push validation

🚫 **Don't modify without knowing what you're doing:**
- `$routes` array in `backend/index.php` - Adding endpoints is OK, removing is dangerous
- `.htaccess` RewriteRules - Changing these breaks routing
- Pre-push hook - It's there to help you

✅ **Safe to modify:**
- Frontend code in `src/`
- Database schema in `backend/setup-database.php`
- API endpoints in `backend/index.php`
- Documentation files

---

## 12. DEPLOYMENT CHECKLIST

Before pushing to production:

- [ ] Changes tested locally
- [ ] Validation passes: `php backend/validate-deployment.php`
- [ ] New endpoints added to `backend/index.php` (if applicable)
- [ ] New database tables added to `backend/setup-database.php` (if applicable)
- [ ] Commit messages are clear
- [ ] Git history is clean
- [ ] Ready to push: `git push origin prod`

Before deploying on server:

- [ ] Pulled code: `git pull origin prod`
- [ ] Database ready: `php backend/setup-database.php`
- [ ] Validated: `php backend/validate-deployment.php`
- [ ] Tested: `curl https://lztmeat.com/api/health`
- [ ] Site loads without errors
- [ ] Major features tested in browser

---

## 13. QUICK START COMMANDS

```bash
# Local validation
php backend/validate-deployment.php

# Git workflow
git checkout -b feature/name main
# ... code ...
git checkout prod
git merge feature/name
git push origin prod

# Server deployment
ssh user@lztmeat.com
cd /httpdocs
git pull origin prod
php backend/setup-database.php
php backend/validate-deployment.php

# Debugging
curl https://lztmeat.com/api/health
curl https://lztmeat.com/api/debug
tail -f backend/database_error.log
```

---

## 14. CONTACT & REFERENCE

**GitHub:** https://github.com/mikoypft/LZTMEAT  
**Live Site:** https://lztmeat.com  
**Hosting:** Plesk  
**Last Updated:** February 6, 2026  
**Status:** ✅ Production Ready with Safety Systems

---

## Summary

This project is a production meat management system with:
- ✅ Git-based safe deployment (validation before push)
- ✅ Zero-downtime updates (just git pull on server)
- ✅ Automatic database schema management
- ✅ Comprehensive error handling
- ✅ MIME type protection (3 layers)
- ✅ CORS and cross-origin support
- ✅ Activity audit logging
- ✅ Emergency overrides for edge cases

**The system prevents you from deploying broken code.** Even if you accidentally:
- Forget to add an endpoint
- Use wrong column name
- Ship bad PHP syntax
- Create missing database tables

The pre-push hook will catch it and block the push with clear instructions on how to fix it.

**You're safe to experiment and make changes** - the system has your back! 🛡️
