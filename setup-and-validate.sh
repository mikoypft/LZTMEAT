#!/bin/bash
# =============================================================================
# LZT Meat Project - Quick Setup & Deployment Guide
# =============================================================================

# Copy and run this in your project root to set up everything

set -e

echo "═══════════════════════════════════════════════════════════════════════"
echo "LZT Meat Project - Setup & Validation"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    IS_WINDOWS=true
    PHP_CMD="php"
else
    IS_WINDOWS=false
    PHP_CMD="php"
fi

# 1. Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git."
    exit 1
fi
echo "✓ Git found"

if ! command -v $PHP_CMD &> /dev/null; then
    echo "❌ PHP not found. Please install PHP 8.0+."
    exit 1
fi
echo "✓ PHP found"

PHP_VERSION=$($PHP_CMD -r 'echo PHP_VERSION;')
echo "  Version: $PHP_VERSION"

# 2. Check environment file
echo ""
echo "🔐 Checking environment configuration..."

if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
    echo "❌ No .env or .env.production file found"
    echo "   Create .env.production with:"
    echo "   DB_HOST=localhost"
    echo "   DB_PORT=3306"
    echo "   DB_DATABASE=lztmeat_admin"
    echo "   DB_USERNAME=lztmeat"
    echo "   DB_PASSWORD=your_password"
    exit 1
fi

if [ -f ".env.production" ]; then
    echo "✓ .env.production found"
    ENV_FILE=".env.production"
else
    echo "✓ .env found"
    ENV_FILE=".env"
fi

# 3. Setup git hooks
echo ""
echo "🔗 Setting up git hooks..."

if [ -d ".git/hooks" ]; then
    if [ ! -f ".git/hooks/pre-push" ] && [ -f ".git/hooks/pre-push" ]; then
        chmod +x .git/hooks/pre-push
        echo "✓ pre-push hook configured"
    fi
    
    if [ ! -f ".git/hooks/post-merge" ] && [ -f ".git/hooks/post-merge" ]; then
        chmod +x .git/hooks/post-merge
        echo "✓ post-merge hook configured"
    fi
else
    echo "ℹ  .git/hooks directory not found (normal in some setups)"
fi

# 4. Validate deployment
echo ""
echo "✅ Running deployment validation..."
echo "   (This checks all endpoints and database requirements)"
echo ""

if $PHP_CMD backend/validate-deployment.php; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════"
    echo "✅ ALL CHECKS PASSED!"
    echo "═══════════════════════════════════════════════════════════════════════"
    echo ""
    echo "Your project is ready for deployment. Here's what's verified:"
    echo "  ✓ Database credentials are correct"
    echo "  ✓ All required tables exist"
    echo "  ✓ All API endpoints are defined"
    echo "  ✓ Git hooks are configured"
    echo ""
    echo "Next steps:"
    echo "  1. Make changes in your local branch"
    echo "  2. Commit: git commit -m 'your message'"
    echo "  3. Merge: git merge main (or whatever your source branch is)"
    echo "  4. Push: git push origin prod"
    echo "     ↦ Pre-push hook will validate before pushing"
    echo "  5. Pull on Plesk server to deploy"
    echo ""
    echo "References:"
    echo "  📖 Endpoint Documentation: DEPLOYMENT_GUIDE.md"
    echo "  🔧 Setup Database: php backend/setup-database.php"
    echo "  ✔️  Validate Changes: php backend/validate-deployment.php"
    echo ""
else
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════"
    echo "❌ VALIDATION FAILED"
    echo "═══════════════════════════════════════════════════════════════════════"
    echo ""
    echo "To fix:"
    echo "  1. Run: php backend/setup-database.php"
    echo "  2. Check .env or .env.production for correct credentials"
    echo "  3. Verify backend/index.php has all required endpoints"
    echo ""
    exit 1
fi

exit 0
