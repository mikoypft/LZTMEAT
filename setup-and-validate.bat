@echo off
REM =============================================================================
REM LZT Meat Project - Quick Setup & Deployment Guide (Windows)
REM =============================================================================
REM Copy and run this in your project root to set up everything

setlocal enabledelayedexpansion

cls
echo ===============================================================================
echo LZT Meat Project - Setup ^& Validation (Windows)
echo ===============================================================================
echo.

REM 1. Check PHP
echo 📋 Checking prerequisites...

where php >nul 2>nul
if errorlevel 1 (
    echo ❌ PHP not found. Please install PHP 8.0+.
    pause
    exit /b 1
)

echo ✓ PHP found
for /f "tokens=*" %%i in ('php -r "echo PHP_VERSION;"') do set PHP_VERSION=%%i
echo   Version: !PHP_VERSION!

REM 2. Check environment file
echo.
echo 🔐 Checking environment configuration...

if not exist ".env.production" if not exist ".env" (
    echo ❌ No .env or .env.production file found
    echo    Create .env.production with:
    echo    DB_HOST=localhost
    echo    DB_PORT=3306
    echo    DB_DATABASE=lztmeat_admin
    echo    DB_USERNAME=lztmeat
    echo    DB_PASSWORD=your_password
    pause
    exit /b 1
)

if exist ".env.production" (
    echo ✓ .env.production found
    set ENV_FILE=.env.production
) else (
    echo ✓ .env found
    set ENV_FILE=.env
)

REM 3. Validate deployment
echo.
echo ✅ Running deployment validation...
echo    (This checks all endpoints and database requirements)
echo.

php backend/validate-deployment.php

if errorlevel 1 (
    echo.
    echo ===============================================================================
    echo ❌ VALIDATION FAILED
    echo ===============================================================================
    echo.
    echo To fix:
    echo   1. Run: php backend/setup-database.php
    echo   2. Check .env or .env.production for correct credentials
    echo   3. Verify backend/index.php has all required endpoints
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo ✅ ALL CHECKS PASSED!
echo ===============================================================================
echo.
echo Your project is ready for deployment. Here's what's verified:
echo   ✓ Database credentials are correct
echo   ✓ All required tables exist
echo   ✓ All API endpoints are defined
echo.
echo Next steps:
echo   1. Make changes in your local branch
echo   2. Commit: git commit -m "your message"
echo   3. Merge: git merge main (or whatever your source branch is)
echo   4. Push: git push origin prod
echo      → Pre-push hook will validate before pushing
echo   5. Pull on Plesk server to deploy
echo.
echo References:
echo   📖 Endpoint Documentation: DEPLOYMENT_GUIDE.md
echo   🔧 Setup Database: php backend/setup-database.php
echo   ✔️  Validate Changes: php backend/validate-deployment.php
echo.

pause
exit /b 0
