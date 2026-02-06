# AI Assistant Reference - LZT Meat Project Context

**This file helps AI assistants understand your project in future conversations**

---

## 1. WHAT THIS PROJECT IS

- **Name:** LZT Meat
- **Type:** Meat product management & sales tracking system
- **Frontend:** React SPA with Vite (TypeScript)
- **Backend:** Standalone PHP API (no Laravel/Composer on production)
- **Database:** MySQL (14 tables)
- **Server:** Plesk hosting with Apache + PHP 8.4.17
- **URL:** https://lztmeat.com
- **GitHub:** https://github.com/mikoypft/LZTMEAT (branches: `main`, `prod`)

---

## 2. CRITICAL ARCHITECTURAL DECISIONS

### No Composer/Laravel on Production
❌ Laravel NOT installed on Plesk server  
✅ Backend is standalone PHP at `/backend/index.php`  
✅ Entry point: `/index.php` (routes all requests)  
✅ All API endpoints in `$routes` array in `backend/index.php`

### Document Root is NOT `/dist`
❌ Document root is NOT `/httpdocs/dist`  
✅ Document root is `/httpdocs` (project root)  
✅ `/index.php` serves everything (routes, static files, SPA)  
✅ This fixes Phusion Passenger conflicts

### Database Credentials
```
Host: localhost
Port: 3306
Database: lztmeat_admin
Username: lztmeat
Password: Lztmeat@2026
Location: /backend/.env.production
```

---

## 3. KEY FILES - DO NOT CONFUSE

| File | What It Does | Critical? |
|------|------|---|
| `/index.php` | **ROOT ROUTER** - handles ALL requests | 🔴 YES |
| `backend/index.php` | **API SERVER** - all `/api/*` endpoints | 🔴 YES |
| `backend/.env.production` | **CREDENTIALS** - DB connection | 🔴 YES |
| `.htaccess` | **Apache rules** - routing & MIME types | 🔴 YES |
| `backend/validate-deployment.php` | **Validation** - checks before push | 🟡 Important |
| `backend/setup-database.php` | **Setup** - creates/updates DB tables | 🟡 Important |
| `.git/hooks/pre-push` | **Push validation** - blocks broken code | 🟡 Important |
| `dist/` | **Frontend build** - static assets | 🟢 Normal |
| `src/` | **Frontend source** - React code | 🟢 Normal |

---

## 4. API ENDPOINTS - MUST EXIST

All these endpoints must be defined in `backend/index.php` in `$routes` array:

**Existence validation:** Code checks these endpoints exist before allowing push

```
GET /api/health                    // DB check
GET /api/debug                     // Env check
GET /api/products, POST, PUT       // Product management
GET /api/categories, POST          // Categories
GET /api/sales, POST               // Sales transactions
GET /api/inventory, POST, PUT       // Stock levels
GET /api/ingredients, POST, PUT     // Ingredient definitions
GET /api/stores, POST, PUT          // Store locations
GET /api/users, POST, PUT           // User accounts
GET /api/production, POST           // Production records
GET /api/transfers, POST, PUT        // Store transfers
GET /api/suppliers, POST            // Supplier info
GET /api/history                    // Activity logs
GET /api/discount-settings, PUT      // Discount config
GET /api/auth/...                  // Authentication
```

If ANY endpoint is missing = pre-push hook blocks deployment

---

## 5. DATABASE TABLES - MUST EXIST

All these tables must exist and be creatable:

```
users, stores, categories, products
sales, sales_items
inventory, ingredients
production, transfers
suppliers
system_history
discount_settings
stock_adjustments
```

Created by: `php backend/setup-database.php`

---

## 6. CRITICAL COLUMNS - MUST EXIST

Column name mistakes have caused errors before:

❌ **DON'T USE:** `users.name`  
✅ **USE:** `users.full_name`  
✅ **USE:** `users.username`  

Validation checks these critical columns:
- `users.id`, `users.username`, `users.full_name`, `users.password`, `users.role`
- `products.id`, `products.name`, `products.category_id`, `products.price`
- `sales.id`, `sales.store_id`, `sales.subtotal`, `sales.tax`
- `discount_settings.id`, `discount_settings.wholesale_min_units`, `discount_settings.discount_type`
- `system_history.id`, `system_history.action`, `system_history.entity`, `system_history.user_id`

If ANY critical column is missing = validation fails

---

## 7. ISSUES THAT WERE SOLVED

### Issue 1: Phusion Passenger 500 Errors
**Cause:** Node.js intercepting all requests  
**Solution:** Disable Passenger in Plesk, set document root to `/httpdocs`  
**File:** `index.php` - root router handles all requests

### Issue 2: Database Credentials Not Loading
**Cause:** `.env.production` not being read by PHP  
**Solution:** Emergency override in `backend/index.php` detects old creds, switches to production  
**Files:** `backend/index.php` lines 61-70

### Issue 3: Missing API Endpoints
**Cause:** Frontend requests endpoints that don't exist  
**Solution:** 
- Add endpoint to `backend/index.php` `$routes` array
- Validation script checks all endpoints exist before push
**Files:** `backend/index.php`, `backend/validate-deployment.php`

### Issue 4: Wrong Database Column Names
**Cause:** Code used `users.name` but only `users.full_name` exists  
**Solution:** Validation checks critical columns exist  
**Files:** `backend/validate-deployment.php`

### Issue 5: MIME Type Errors (JS/CSS)
**Cause:** Static files served with wrong `Content-Type`  
**Solution:** 3-layer MIME type protection:
1. PHP detection in `index.php`
2. Apache `AddType` in `.htaccess`
3. HTTP headers in `.htaccess`
**Files:** `index.php`, `.htaccess`

### Issue 6: Missing Database Tables
**Cause:** Schema not matching expectations, 404 errors  
**Solution:** Auto-create all tables with `php backend/setup-database.php`  
**Files:** `backend/setup-database.php`

---

## 8. PROTECTION SYSTEMS

### Pre-Push Hook (`.git/hooks/pre-push`)
**Runs:** Every `git push origin prod`  
**Validates:**
- All endpoints exist
- All tables can be created
- All critical columns exist
- PHP syntax valid
- Database credentials work

**If fails:** Push is blocked, clear error shown, user fixes and retries

### Validation Script (`backend/validate-deployment.php`)
**Run:** `php backend/validate-deployment.php` anytime  
**Same checks as pre-push hook**  
**Can use before committing to catch issues early**

### Setup Script (`backend/setup-database.php`)
**Run:** `php backend/setup-database.php` on production server  
**Creates:**
- All 14 required tables
- Correct columns, types, indexes
- Default values
- Relationships

---

## 9. TYPICAL WORKFLOW FOR USER

```bash
# 1. Make changes
git checkout -b feature/name main
# ... edit code ...
git add .
git commit -m "feat: description"

# 2. Validate locally
php backend/validate-deployment.php

# 3. Merge to prod
git checkout prod
git merge feature/name

# 4. Push (auto-validates via pre-push hook)
git push origin prod

# 5. Deploy on server
ssh user@lztmeat.com
cd /httpdocs
git pull origin prod
php backend/setup-database.php
php backend/validate-deployment.php

# 6. Verify
curl https://lztmeat.com/api/health
```

---

## 10. DEPLOY INSTRUCTIONS FOR AI ASSISTANT

When user asks to help with deployment changes, follow this checklist:

**Before pushing to production:**
1. ✅ Check if new endpoints need to be added to `backend/index.php`
2. ✅ Check if new database tables need to be added to `backend/setup-database.php`
3. ✅ Check if validation checks need to be updated in `backend/validate-deployment.php`
4. ✅ Make all code changes
5. ✅ Commit with clear message referencing what was added
6. ✅ Push (pre-push hook validates)

**On production server:**
1. ✅ Pull latest code
2. ✅ Run `php backend/setup-database.php`
3. ✅ Run `php backend/validate-deployment.php`
4. ✅ Verify with `curl /api/health` or browser

---

## 11. THINGS TO BE CAREFUL ABOUT

⚠️ **DON'T:**
- Delete or move `/index.php` or `backend/index.php`
- Remove endpoints from `$routes` array without good reason
- Use wrong column names (e.g., `users.name` instead of `users.full_name`)
- Modify `.htaccess` RewriteRules without testing
- Push to prod without validation passing
- Delete `.git/hooks/pre-push` (prevents broken code)

✅ **DO:**
- Run validation before pushing
- Add all new endpoints to the right place in `backend/index.php`
- Update validation script when adding new tables/columns
- Test locally first if possible
- Read pre-push error messages carefully - they explain what's wrong

---

## 12. QUICK REFERENCE COMMANDS

```bash
# Validate before push
php backend/validate-deployment.php

# Create all database tables
php backend/setup-database.php

# Check database health
curl https://lztmeat.com/api/health

# Check environment loading
curl https://lztmeat.com/api/debug

# View database errors
tail -f backend/database_error.log

# Push to production (with auto-validation)
git push origin prod

# Build frontend
npm run build

# Start dev server
npm run dev
```

---

## 13. FILE LOCATIONS SUMMARY

- **Document Root:** `/httpdocs` (on Plesk server)
- **Frontend Build:** `/dist/` (gets served as static files)
- **Frontend Source:** `/src/` (TypeScript + React)
- **Backend API:** `/backend/index.php` (standalone PHP)
- **Database Setup:** `/backend/setup-database.php`
- **Validation:** `/backend/validate-deployment.php`
- **Credentials:** `/backend/.env.production`
- **Git Config:** `/.git/` (with `/hooks/pre-push`, `/hooks/post-merge`)
- **Docs:** `DEPLOYMENT_*.md`, `ERROR_HANDLING_GUIDE.md`, `PROJECT_MASTER_GUIDE.md`

---

## 14. WHEN SOMETHING GOES WRONG

**Pre-push hook blocks the push:**
1. Read the error message
2. It tells you exactly what's wrong
3. Follow its instructions to fix
4. Commit fix: `git add . && git commit --amend`
5. Try pushing again: `git push origin prod`

**Database connection error:**
1. Check: `curl https://lztmeat.com/api/health` shows error details
2. Verify credentials in `/backend/.env.production`
3. Run: `php backend/setup-database.php` to create tables
4. Test again: `curl https://lztmeat.com/api/health`

**API endpoint returns 404:**
1. Endpoint doesn't exist in `backend/index.php`
2. Add it to the `$routes` array
3. Make sure it follows the pattern of other endpoints
4. Validate: `php backend/validate-deployment.php`

**JavaScript/CSS not loading:**
1. Check MIME types: `curl -I https://lztmeat.com/assets/...`
2. Should show `application/javascript` or `text/css`
3. MIME type protection (3 layers) should prevent this - unlikely to happen

---

## 15. FOR FUTURE AI CONVERSATIONS

When user says:
- **"Add new endpoint"** → Add to `$routes` in `backend/index.php`
- **"Add new table"** → Add to `backend/setup-database.php`
- **"Deployment error"** → Run `php backend/validate-deployment.php` to diagnose
- **"Can't access API"** → Check `curl https://lztmeat.com/api/health`
- **"Database error"** → Check `backend/database_error.log` or run setup script
- **"Push blocked"** → Read pre-push hook error, fix, retry
- **"Want to deploy"** → Run all validation, push to prod, deploy on server

---

## REFERENCE DOCUMENTS

- **`PROJECT_MASTER_GUIDE.md`** - Full project overview
- **`DEPLOYMENT_PREVENTION_SYSTEM.md`** - Detailed workflow guide
- **`DEPLOYMENT_GUIDE.md`** - Complete API endpoint reference
- **`ERROR_HANDLING_GUIDE.md`** - MIME types, caching, error codes
- **`THIS FILE`** - Quick AI assistant reference

---

**Last Updated:** February 6, 2026  
**Project Status:** ✅ Production Ready and Protected

Read `PROJECT_MASTER_GUIDE.md` for the complete reference!
