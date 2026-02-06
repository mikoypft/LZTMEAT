# LZT Meat - Deployment Prevention System

## What This Solves

This system prevents the errors you encountered during deployment:
- ❌ Missing API endpoints → ✅ Automated validation catches these before push
- ❌ Database column mismatches → ✅ Schema validation ensures columns exist
- ❌ Missing database tables → ✅ Auto-create all required tables
- ❌ Wrong environment variables → ✅ Pre-deployment validation
- ❌ Pushing broken code → ✅ Pre-push hook validates everything

## How It Works

### Before You Push

1. **Make your changes locally**
   ```bash
   git checkout -b my-feature main
   # ... make changes ...
   git add .
   git commit -m "my changes"
   ```

2. **Merge with production branch**
   ```bash
   git merge main prod
   ```

3. **Push (automatic validation)**
   ```bash
   git push origin prod
   ```
   
   **What happens automatically:**
   - Pre-push hook validates:
     - All endpoints exist in `backend/index.php`
     - All database tables can be created
     - All critical columns exist
     - PHP syntax is correct
   - If validation fails, push is blocked with clear error messages
   - You fix the issues and try again

### When Something Goes Wrong

**Scenario 1: Missing endpoint**
```bash
$ git push origin prod
❌ Error: Missing endpoints:
  - GET /api/my-new-endpoint

To fix:
  1. Add to backend/index.php:
     'GET /api/my-new-endpoint' => function() use ($pdo) { ... }
  2. Run: php backend/validate-deployment.php
  3. Push again
```

**Scenario 2: Database column error**
```bash
$ git push origin prod
❌ Error: Missing columns:
  - users.name

To fix:
  1. Column should be "full_name" not "name"
     Change: u.name → u.full_name
  2. Run: php backend/validate-deployment.php
  3. Push again
```

**Scenario 3: Broken PHP syntax**
```bash
$ git push origin prod
❌ Error: Syntax error in backend/index.php!

To fix:
  1. Check the error above
  2. Fix the syntax error
  3. Run: php -l backend/index.php (to verify)
  4. Push again
```

## Key Files & What They Do

### 📋 `backend/validate-deployment.php`
**Purpose:** Comprehensive validation script
**Checks:**
- Database connection works
- All required tables exist
- All required endpoints defined
- All critical columns exist
**When to run:** Before pushing or manually anytime
```bash
php backend/validate-deployment.php
```

### 🗄️ `backend/setup-database.php`
**Purpose:** Create/update all database schema
**Creates:**
- All 14 required database tables
- Correct columns with proper types
- Indexes for performance
- Default values and constraints
**When to run:** 
- On server after first pull: `php backend/setup-database.php`
- When validation shows missing tables
```bash
php backend/setup-database.php
```

### 🔗 `.git/hooks/pre-push`
**Purpose:** Automatic validation before pushing
**Runs:** Every time you `git push origin prod`
**Validates:**
- All endpoints present
- PHP syntax correct
- No removed critical code
**If validation fails:** Push is blocked, errors shown, you fix and retry

### 🔗 `.git/hooks/post-merge`
**Purpose:** Alert after merging code
**Runs:** After `git merge` or pulling code
**Alerts:** If backend files changed, reminds you to validate

### 📖 `DEPLOYMENT_GUIDE.md`
**Complete reference for:**
- All 30+ API endpoints (with methods)
- All 14 database tables (with columns)
- Pre-deployment checklist
- Adding new endpoints
- Common error fixes

### ⚙️ `setup-and-validate.sh` (Linux/Mac) or `.bat` (Windows)
**Quick setup script**
- Checks all prerequisites
- Validates entire project
- Shows detailed status report
```bash
# Linux/Mac
bash setup-and-validate.sh

# Windows
setup-and-validate.bat
```

## Typical Workflow

### 1️⃣ Daily Development
```bash
# Start new feature
git checkout -b feature/my-feature main

# Make changes to API, database, etc.
vim backend/index.php
# ... code ...

# Validate before committing
php backend/validate-deployment.php

# Commit
git add .
git commit -m "feat: add new endpoint"
```

### 2️⃣ Ready to Deploy
```bash
# Merge with production
git merge main prod

# Try to push (automatic validation)
git push origin prod

# If validation fails:
# - See error message
# - Fix issue
# - Retry push
```

### 3️⃣ Deploy on Server
```bash
# SSH to Plesk server
ssh user@lztmeat.com

# Go to project
cd /httpdocs  # or wherever deployed

# Pull latest code
git pull origin prod

# Setup database (auto-creates missing tables)
php backend/setup-database.php

# Verify (optional)
php backend/validate-deployment.php

# Done! Site is updated
```

## What Gets Validated

### Endpoints (30+)
Every endpoint the frontend requests must be defined in `backend/index.php`:
- `/api/products`, `/api/categories`, `/api/sales`
- `/api/inventory`, `/api/ingredients`, `/api/transfers`
- `/api/stores`, `/api/users`, `/api/suppliers`
- `/api/production`, `/api/history`, `/api/discount-settings`
- ... and 15+ more

### Database Tables (14)
All required tables with correct schema:
- `users`, `stores`, `products`, `categories`
- `sales`, `sales_items`, `inventory`, `ingredients`
- `production`, `transfers`, `suppliers`
- `system_history`, `discount_settings`, `stock_adjustments`

### Database Columns
Critical columns that APIs depend on:
- `users.full_name` (NOT `users.name`)
- `products.category_id`, `products.price`
- `sales.subtotal`, `sales.tax`, `sales.global_discount`
- ... and 40+ more verified automatically

## Emergency Overrides

### If Pre-Push Hook Blocks You
The hook is there to help, but if absolutely necessary:
```bash
# Bypass pre-push hook (use carefully!)
git push origin prod --no-verify
```

**⚠️ Only do this if:**
- You've manually validated with: `php backend/validate-deployment.php`
- You understand the risk
- You'll fix it on the server immediately

### If Validation Script Fails
```bash
# Create all missing tables
php backend/setup-database.php

# Then validate again
php backend/validate-deployment.php
```

## Examples

### Adding a New Endpoint

**Step 1:** Add to `backend/index.php` (before closing `];`)
```php
'GET /api/new-endpoint' => function() use ($pdo) {
    try {
        $stmt = $pdo->query('SELECT * FROM some_table');
        $records = $stmt->fetchAll();
        return ['data' => $records];
    } catch (Exception $e) {
        http_response_code(500);
        return ['error' => $e->getMessage()];
    }
},
```

**Step 2:** Validate
```bash
php backend/validate-deployment.php
```

**Step 3:** Check validation file
If endpoint needs a table, add to `backend/setup-database.php`

**Step 4:** Commit & push
```bash
git add backend/index.php backend/setup-database.php
git commit -m "feat: add new-endpoint"
git push origin prod
```

### Adding a New Database Column

**Step 1:** Add to table definition in `backend/setup-database.php`
```php
'my_table' => "
    CREATE TABLE IF NOT EXISTS my_table (
        ...existing columns...
        new_column VARCHAR(255),
        ...
    )
"
```

**Step 2:** Update validation in `validate-deployment.php`
```php
'my_table' => ['id', 'existing_col', 'new_column'],
```

**Step 3:** Validate & push
```bash
php backend/validate-deployment.php
git push origin prod
```

**Step 4:** On server
```bash
php backend/setup-database.php  # Creates column
```

## Common Issues & Solutions

### "Pre-push hook: command not found"
**Cause:** Git hooks aren't executable
**Fix:**
```bash
chmod +x .git/hooks/pre-push
chmod +x .git/hooks/post-merge
```

### "Can't connect to database"
**Cause:** Wrong credentials in `.env` or `.env.production`
**Fix:**
1. Check credentials in file
2. Test: `php backend/validate-deployment.php`
3. If still fails, verify MySQL is running

### "Column not found" errors after deploying
**Cause:** New column added but not in database
**Fix:** Run on server: `php backend/setup-database.php`

### Validation passes locally but fails on server
**Cause:** Different database state on server
**Fix:** SSH to server and run:
```bash
php backend/setup-database.php
php backend/validate-deployment.php
```

## Questions?

- 📖 **Reference:** Read `DEPLOYMENT_GUIDE.md` for full API documentation
- 🔧 **Setup Issues:** Run `php backend/setup-database.php`
- ✔️ **Validation:** Run `php backend/validate-deployment.php`
- 🐛 **Errors:** Check error message - it describes exact fix needed

## Quick Commands Reference

```bash
# Validate project (run this often!)
php backend/validate-deployment.php

# Setup/fix database
php backend/setup-database.php

# Check if syntax is valid
php -l backend/index.php

# Test endpoint locally
curl http://localhost:8000/api/health

# See what changed
git diff main..prod

# Commit changes
git commit -m "description"

# Push (with auto-validation)
git push origin prod

# Setup script (comprehensive check)
bash setup-and-validate.sh       # Linux/Mac
setup-and-validate.bat           # Windows
```

---

**You're all set!** 🎉 The system will catch errors before they reach production.
