@echo off
REM Test script to verify all error handling and MIME types are working (Windows)
REM Run this after deployment
REM Usage: test-error-handling.bat https://lztmeat.com

setlocal enabledelayedexpansion

cls
echo ===============================================================================
echo LZT Meat - Error Handling ^& MIME Type Verification (Windows)
echo ===============================================================================
echo.

REM Get domain from argument or use default
if "%1"=="" (
    set DOMAIN=https://lztmeat.com
) else (
    set DOMAIN=%1
)

echo Testing: %DOMAIN%
echo.

REM 1. Test MIME Types
echo 📄 Testing MIME Types...
echo.

REM Note: curl on Windows may behave differently, adjust as needed
echo This script requires 'curl' command. Testing...

where curl >nul 2>nul
if errorlevel 1 (
    echo ❌ curl not found. Please install curl or use a Unix terminal
    echo    On Windows, you can use WSL, Git Bash, or install curl from: https://curl.se/download.html
    pause
    exit /b 1
)

echo ✓ curl found
echo.

REM Test JavaScript MIME
echo Testing JavaScript MIME type...
for /f "tokens=*" %%i in ('curl -s -I "%DOMAIN%/assets/index-BIvEF3m7.js" 2^>nul ^| find /i "content-type:"') do (
    set JS_MIME=%%i
)

if "!JS_MIME!"=="" (
    echo ✗ JavaScript: No response
) else (
    echo ✓ JavaScript: !JS_MIME!
)

REM Test CSS MIME
echo Testing CSS MIME type...
for /f "tokens=*" %%i in ('curl -s -I "%DOMAIN%/assets/index-DOWovyKY.css" 2^>nul ^| find /i "content-type:"') do (
    set CSS_MIME=%%i
)

if "!CSS_MIME!"=="" (
    echo ✗ CSS: No response
) else (
    echo ✓ CSS: !CSS_MIME!
)

echo.

REM 2. Test Cache Headers
echo 💾 Testing Cache Headers...
echo.

for /f "tokens=*" %%i in ('curl -s -I "%DOMAIN%/assets/index-BIvEF3m7.js" 2^>nul ^| find /i "cache-control:"') do (
    set CACHE=%%i
)

if "!CACHE!"=="" (
    echo ✗ Asset Cache: No cache header
) else (
    echo ✓ Asset Cache: !CACHE!
)

echo.

REM 3. Test API Responses
echo 🔌 Testing API Responses...
echo.

REM Test health endpoint
for /f "tokens=*" %%i in ('curl -s "%DOMAIN%/api/health" 2^>nul ^| find /i "status"') do (
    set HEALTH=%%i
)

if "!HEALTH!"=="" (
    echo ✗ Health Endpoint: No response
) else (
    echo ✓ Health Endpoint: !HEALTH!
)

REM Test debug endpoint
for /f "tokens=*" %%i in ('curl -s "%DOMAIN%/api/debug" 2^>nul ^| find /i "env_file"') do (
    set DEBUG=%%i
)

if "!DEBUG!"=="" (
    echo ✗ Debug Endpoint: No response
) else (
    echo ✓ Debug Endpoint: !DEBUG!
)

echo.

REM 4. Test CORS Headers
echo 🔗 Testing CORS Headers...
echo.

for /f "tokens=*" %%i in ('curl -s -I "%DOMAIN%/api/health" 2^>nul ^| find /i "access-control-allow-origin:"') do (
    set CORS=%%i
)

if "!CORS!"=="" (
    echo ✗ CORS Headers: Not found
) else (
    echo ✓ CORS Headers: !CORS!
)

echo.

REM 5. Summary
echo ===============================================================================
echo ✅ Error Handling Verification Complete
echo ===============================================================================
echo.
echo Check the results above. If you see ✗, refer to ERROR_HANDLING_GUIDE.md
echo.

pause
exit /b 0
