#!/bin/bash
# Test script to verify all error handling and MIME types are working
# Run this after deployment

set -e

echo "═══════════════════════════════════════════════════════════════════════"
echo "LZT Meat - Error Handling & MIME Type Verification"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Get domain from .env or use default
DOMAIN=${1:-https://lztmeat.com}

echo "Testing: $DOMAIN"
echo ""

# 1. Test MIME Types
echo "📄 Testing MIME Types..."
echo ""

# Get a JavaScript file
JS_MIME=$(curl -s -I "$DOMAIN/assets/index-BIvEF3m7.js" 2>/dev/null | grep -i "content-type:" | head -1 | tr -d '\r\n')

if echo "$JS_MIME" | grep -q "application/javascript"; then
    echo "✓ JavaScript: $JS_MIME"
else
    echo "✗ JavaScript: $JS_MIME (expected application/javascript)"
fi

# Get a CSS file  
CSS_MIME=$(curl -s -I "$DOMAIN/assets/index-DOWovyKY.css" 2>/dev/null | grep -i "content-type:" | head -1 | tr -d '\r\n')

if echo "$CSS_MIME" | grep -q "text/css"; then
    echo "✓ CSS: $CSS_MIME"
else
    echo "✗ CSS: $CSS_MIME (expected text/css)"
fi

echo ""

# 2. Test Cache Headers
echo "💾 Testing Cache Headers..."
echo ""

CACHE=$(curl -s -I "$DOMAIN/assets/index-BIvEF3m7.js" 2>/dev/null | grep -i "cache-control:" | head -1 | tr -d '\r\n')
if echo "$CACHE" | grep -q "max-age"; then
    echo "✓ Asset Cache: $CACHE"
else
    echo "✗ Asset Cache: $CACHE (expected cache-control with max-age)"
fi

INDEX_CACHE=$(curl -s -I "$DOMAIN/" 2>/dev/null | grep -i "cache-control:" | head -1 | tr -d '\r\n')
if echo "$INDEX_CACHE" | grep -q "no-cache"; then
    echo "✓ Index Cache: $INDEX_CACHE"
else
    echo "✗ Index Cache: $INDEX_CACHE (expected no-cache)"
fi

echo ""

# 3. Test API Responses
echo "🔌 Testing API Responses..."
echo ""

HEALTH=$(curl -s "$DOMAIN/api/health" 2>/dev/null | grep -o '"status":"[^"]*"' | head -1)
if echo "$HEALTH" | grep -q "healthy\|unhealthy"; then
    echo "✓ Health Endpoint: $HEALTH"
else
    echo "✗ Health Endpoint: No response"
fi

DEBUG=$(curl -s "$DOMAIN/api/debug" 2>/dev/null | grep -o '"env_file_exists":[^,}]*' | head -1)
if echo "$DEBUG" | grep -q "true\|false"; then
    echo "✓ Debug Endpoint: $DEBUG"
else
    echo "✗ Debug Endpoint: No response"
fi

echo ""

# 4. Test CORS Headers
echo "🔗 Testing CORS Headers..."
echo ""

CORS=$(curl -s -I "$DOMAIN/api/health" 2>/dev/null | grep -i "access-control-allow-origin:" | head -1 | tr -d '\r\n')
if echo "$CORS" | grep -q "\*"; then
    echo "✓ CORS Headers: $CORS"
else
    echo "✗ CORS Headers: $CORS (expected Access-Control-Allow-Origin: *)"
fi

echo ""

# 5. Test 404 Handling
echo "⚠️  Testing Error Handling..."
echo ""

NOTFOUND=$(curl -s -w "\n%{http_code}" "$DOMAIN/api/nonexistent" | tail -1)
if [ "$NOTFOUND" = "404" ]; then
    echo "✓ 404 Endpoint: Correctly returns 404 status"
else
    echo "✗ 404 Endpoint: Returns $NOTFOUND (expected 404)"
fi

echo ""

# 6. Summary
echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ Error Handling Verification Complete"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "All the following should be ✓ :"
echo "  ✓ JavaScript MIME type: application/javascript"
echo "  ✓ CSS MIME type: text/css"
echo "  ✓ Asset Cache: Cache-Control with max-age"
echo "  ✓ Index Cache: Config with no-cache"
echo "  ✓ Health Endpoint: Responds with status"
echo "  ✓ Debug Endpoint: Responds with env info"
echo "  ✓ CORS Headers: Access-Control-Allow-Origin present"
echo "  ✓ 404 Handling: Returns 404 status code"
echo ""
echo "If any are ✗, check ERROR_HANDLING_GUIDE.md for troubleshooting"
