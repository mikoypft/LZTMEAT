# LZT Meat - Error Handling & MIME Type Configuration

## Overview

This document explains all the error handling, MIME type configuration, and debugging systems in place to prevent the issues we encountered during deployment.

---

## 1. MIME Type Handling

### Problem We Solved
During initial deployment, static assets (JS, CSS) were returning with wrong Content-Type headers, causing:
- JavaScript modules failing to load
- CSS stylesheets not applying
- Browser console errors: "Uncaught SyntaxError: Failed to parse module"

### Current Solution

#### Root `index.php` - Dynamic MIME Type Detection
```php
$mimeTypes = [
    'js'    => 'application/javascript',
    'mjs'   => 'application/javascript',
    'css'   => 'text/css',
    'html'  => 'text/html',
    'json'  => 'application/json',
    'svg'   => 'image/svg+xml',
    'png'   => 'image/png',
    'jpg'   => 'image/jpeg',
    // ... more types
];

$ext = strtolower(pathinfo($distFile, PATHINFO_EXTENSION));
$mime = $mimeTypes[$ext] ?? mime_content_type($distFile);

header('Content-Type: ' . $mime);
```

**How it works:**
- Checks file extension
- Maps to correct MIME type
- Sets `Content-Type` header before serving file
- Falls back to PHP's mime_content_type() if unknown

#### `.htaccess` - Apache MIME Type Declarations
```apache
AddType application/javascript js
AddType application/javascript mjs
AddType text/css css
AddType image/svg+xml svg
AddType font/woff woff
AddType font/woff2 woff2
```

**How it works:**
- Tells Apache to serve files with correct MIME types
- Backup for when index.php routing isn't used
- Ensures correct types even with direct file access

#### `.htaccess` - HTTP Headers for MIME Enforcement
```apache
<FilesMatch "\.(js|mjs)$">
  Header set Content-Type "application/javascript; charset=utf-8"
  Header set Access-Control-Allow-Origin "*"
</FilesMatch>

<FilesMatch "\.css$">
  Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>
```

**How it works:**
- Explicitly sets Content-Type headers at HTTP level
- Forces MIME types even if file extension is wrong
- Applies CORS headers for cross-origin JS module loading
- Triple-layer protection: PHP check → Apache declaration → HTTP headers

---

## 2. Static Asset Caching

### Problem We Solved
Without proper cache headers, users would always download full assets even if they hadn't changed, causing:
- Slow page loads
- Excessive bandwidth usage
- Unnecessary server load

### Current Solution

#### Hashed Filenames
Vite generates filenames like: `index-BIvEF3m7.js`

The hash changes only when content changes. Combined with long cache headers:
```php
if (preg_match('/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/', $path)) {
    header('Cache-Control: public, max-age=31536000, immutable');
}
```

**Result:**
- Browser caches assets for 1 year: `public, max-age=31536000`
- `immutable` tells browsers never revalidate
- Users only re-download when hash changes (content updates)
- Old version of site loads instantly from cache
- New version loads fresh when you deploy with different hashes

#### Dynamic Pages
```php
header('Cache-Control: no-cache, no-store, must-revalidate');
```

**Result:**
- `index.html` never cached (always revalidated)
- Users always get latest version on refresh
- App structure can change without cache issues

---

## 3. Error Responses & Status Codes

### Static Files Not Found
**Behavior:** If file doesn't exist in dist/, let .htaccess handle it
```php
// If file doesn't exist in dist/, drop through to API/SPA routing
if (!file_exists($distFile)) {
    // Try next handler (API or SPA)
}
```

**Result:** 
- Real missing files → properly handled (404 via SPA router)
- Prevents "Cannot GET /some-path" confusion
- User sees React app's 404 page, not raw Apache 404

### API Errors
**500 Internal Server Error - Database Issues**
```php
'GET /api/products' => function() use ($pdo) {
    try {
        // ... database query ...
    } catch (Exception $e) {
        http_response_code(500);
        return ['error' => 'Failed to get products: ' . $e->getMessage()];
    }
}
```

**Result:**
- Errors don't crash entire server
- Returns JSON with error details
- Status code `500` alerts frontend something went wrong
- Frontend shows user-friendly error message

**404 Not Found - Missing Endpoint**
```php
if (!$matched) {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found', 'path' => $uri, 'method' => $method]);
}
```

**Result:**
- Non-existent endpoints return `404`
- Frontend knows endpoint doesn't exist
- Can show "This feature is not yet implemented" instead of blank page

### Backend Not Configured
```php
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Backend not configured',
        'details' => [
            'Laravel not found: ...',
            'Standalone API missing: ...',
        ],
    ]);
}
```

**Result:**
- Clear error if backend files are missing
- Helps quickly diagnose deployment issues
- Prevents silent failures

### Site Under Maintenance
```php
http_response_code(503);
echo '<!DOCTYPE html><html>...<h1>Site Under Maintenance</h1>...';
```

**Result:**
- Clean HTML page if `dist/index.html` doesn't exist
- Proper `503` status code (Service Unavailable)
- Better UX than raw Apache error page

---

## 4. CORS & Cross-Origin Issues

### Problem We Solved
JavaScript module loading fails when MIME types are wrong OR when CORS headers are missing for:
- Loading `.woff2` fonts from different paths
- Loading scripts from CDN
- Making API calls from Plesk domain

### Current Solution

#### In Root `index.php`
```php
if (str_starts_with($path, '/api')) {
    // Set CORS headers
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json');
    
    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
```

**How it works:**
- API endpoints allow requests from any origin
- `OPTIONS` preflight requests answered immediately
- Frontend can call `/api/*` without CORS errors
- Works from any domain (subdomain, different port, etc.)

#### In `.htaccess`
```apache
<FilesMatch "\.(js|mjs)$">
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

**Result:**
- Scripts load from any origin
- Fonts load correctly
- No "Blocked by CORS" errors

---

## 5. ERROR LOGGING

### Backend API Errors

#### Database Errors
Logged to: `backend/database_error.log`
```php
if (!$dbConnected) {
    error_log("Database connection failed: $dbError", 3, __DIR__ . '/database_error.log');
}
```

**Useful for:**
- Debugging connection issues post-deployment
- Seeing what credentials failed
- Tracking permission problems

#### Environment Variable Loading
Logged to: `backend/env_debug.log`
```php
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $uri === '/api/debug') {
    error_log("Checking env file: $envFile", 3, __DIR__ . '/env_debug.log');
}
```

**Useful for:**
- Understanding which .env file was loaded
- Seeing what environment variables are available
- Quick troubleshooting

#### API Request Logging
Logged to: `backend/api_requests.log`
```php
error_log("API Request: $method $uri", 3, __DIR__ . '/api_requests.log');
```

**Useful for:**
- Seeing what endpoints are being called
- Understanding user behavior
- Debugging missing endpoint issues

### Debug Endpoints (Available in Production)

#### `/api/health` - Database Check
```json
GET https://lztmeat.com/api/health

// Returns:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-06 13:45:10"
}

// Or on error:
{
  "status": "unhealthy",
  "database": "error",
  "error": "SQLSTATE[HY000]: Connection refused...",
  "config": {
    "host": "localhost",
    "port": "3306",
    "database": "lztmeat_admin",
    "user": "lztmeat"
  }
}
```

**Use case:** Quick check if database is working

#### `/api/debug` - Environment Debugging
```json
GET https://lztmeat.com/api/debug

// Returns:
{
  "env_file_checked": "/backend/.env.production",
  "env_file_exists": true,
  "env_file_readable": true,
  "env_vars": {
    "DB_HOST": "localhost",
    "DB_PORT": "3306",
    "DB_DATABASE": "lztmeat_admin",
    "DB_USERNAME": "lztmeat"
  }
}
```

**Use case:** Debug environment setup issues

---

## 6. Preventing Common Errors

### Error: "Uncaught SyntaxError: Failed to parse module"
**Cause:** JavaScript served with wrong MIME type
**Prevention:** 
- ✅ Root `index.php` checks extension: `application/javascript`
- ✅ `.htaccess` AddType: `application/javascript js`
- ✅ `.htaccess` Headers: `Content-Type: application/javascript`
- ✅ **Triple protection - impossible to get wrong MIME type**

### Error: "404 Uncaught (in promise) Error: Failed to fetch"
**Cause:** Endpoint doesn't exist
**Prevention:**
- ✅ Pre-push validation checks all endpoints exist
- ✅ Validation script shows exactly which endpoint is missing
- ✅ `backend/validate-deployment.php` blocks deployment if endpoint missing

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Cause:** Missing CORS headers
**Prevention:**
- ✅ Root `index.php` sets CORS headers for all `/api/*`
- ✅ `.htaccess` sets CORS headers for JS files
- ✅ `OPTIONS` preflight requests auto-answered

### Error: "500 Internal Server Error"
**Cause:** Database query failed, or uncaught exception
**Prevention:**
- ✅ All endpoints have try-catch
- ✅ Errors return JSON with message
- ✅ Errors logged to `backend/database_error.log`
- ✅ `GET /api/health` shows if database is connected
- ✅ `GET /api/debug` shows if environment is loaded correctly

### Error: "Endpoint not found"
**Cause:** Endpoint doesn't exist in `$routes` array
**Prevention:**
- ✅ Pre-push hook validates all endpoints exist
- ✅ Can't push code with missing endpoints
- ✅ Clear error message shows which endpoint is missing

---

## 7. Testing Error Handling

### Clear Browser Cache for Testing
```bash
# Before testing MIME type fixes
# Open DevTools → Settings → Network → "Disable cache"
# Or hard refresh: Ctrl+Shift+Delete → Clear cached images/files
```

### Test Static Assets
```bash
# Check MIME type of JS file
curl -I https://lztmeat.com/assets/index-BIvEF3m7.js
# Should show: Content-Type: application/javascript

# Check CSS
curl -I https://lztmeat.com/assets/index-DOWovyKY.css
# Should show: Content-Type: text/css
```

### Test API Errors
```bash
# Test health endpoint
curl https://lztmeat.com/api/health
# Should show database status

# Test missing endpoint
curl https://lztmeat.com/api/nonexistent
# Should show 404 with proper error message
```

### Test CORS Headers
```bash
# Check CORS headers on API
curl -H "Origin: https://different-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     https://lztmeat.com/api/products
# Should include: Access-Control-Allow-Origin: *
```

---

## 8. Performance Optimization

### Asset Caching Summary
| Type | Cache Duration | Revalidate | When Updates |
|------|---|---|---|
| JS/CSS with hash | 1 year | Never | File hash changes |
| Images (hashed) | 1 year | Never | Filename changes |
| index.html | Don't cache | Always | Next visit |
| Fonts (hashed) | 1 year | Never | Filename changes |
| API responses | Don't cache | Always | Server responds |

### Result
- Returning users load instantly (cached assets)
- New deployments work correctly (index.html always fresh)
- Zero stale content issues (hash changes trigger refresh)

---

## 9. Disaster Recovery

### If 500 Errors After Deploying
1. **Check database:**
   ```bash
   curl https://lztmeat.com/api/health
   ```
   If DB not connected, run on server:
   ```bash
   php backend/setup-database.php
   ```

2. **Check environment:**
   ```bash
   curl https://lztmeat.com/api/debug
   ```
   If env not loaded, check `.env.production` exists with correct credentials

3. **Check logs:**
   ```bash
   tail -f backend/database_error.log
   tail -f backend/api_requests.log
   ```

### If JavaScript Not Loading
1. **Clear browser cache**
2. **Check MIME type:**
   ```bash
   curl -I https://lztmeat.com/assets/index-BIvEF3m7.js
   # Should show: Content-Type: application/javascript
   ```
3. **Check file exists:**
   ```bash
   ls -la dist/assets/
   ```
4. **Check .htaccess MIME declarations**

### If API Not Responding
1. **Check endpoint exists:**
   ```bash
   curl https://lztmeat.com/api/products
   ```
   Should return JSON (not HTML error)

2. **Check pre-deployment validation was run:**
   ```bash
   php backend/validate-deployment.php
   ```

3. **Check database:**
   ```bash
   curl https://lztmeat.com/api/health
   ```

---

## Summary

| Issue | Solution | Where |
|-------|----------|-------|
| Wrong MIME types | PHP + Apache + Headers | index.php, .htaccess |
| CORS errors | CORS headers in PHP & .htaccess | index.php, .htaccess |
| Missing endpoints | Validation script blocks push | pre-push hook |
| Database errors | Try-catch + logging | backend/index.php |
| Stale content | Hash-based cache busting | Vite build + headers |
| 500 errors | Error endpoints (/health, /debug) | backend/index.php |
| Env not loaded | Emergency credential override | backend/index.php |

You're well-protected from the errors that occurred during initial deployment! 🛡️
