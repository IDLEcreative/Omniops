#!/bin/bash
# Environment Validation for E2E Tests
# Ensures all prerequisites are met before running tests

set -e

ERRORS=0

echo "🔍 Checking E2E test environment..."
echo ""

# Check if dev server is running
echo -n "✓ Checking dev server (port 3000)... "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Running"
else
  echo "❌ Not running"
  echo "  Start with: npm run dev"
  ERRORS=$((ERRORS + 1))
fi

# Check if Playwright browsers are installed
echo -n "✓ Checking Playwright browsers... "
if npx playwright --version > /dev/null 2>&1; then
  echo "✅ Installed"
else
  echo "❌ Not installed"
  echo "  Install with: npx playwright install"
  ERRORS=$((ERRORS + 1))
fi

# Check Node version
echo -n "✓ Checking Node.js version... "
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
  echo "✅ v$(node -v | cut -d'v' -f2)"
else
  echo "⚠️  v$(node -v | cut -d'v' -f2) (recommended: v20+)"
fi

# Check if required directories exist
echo -n "✓ Checking test directories... "
if [ -d "__tests__/playwright" ]; then
  echo "✅ Found"
else
  echo "❌ Missing"
  ERRORS=$((ERRORS + 1))
fi

# Check environment variables
echo -n "✓ Checking environment variables... "
if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
else
  echo "⚠️  .env.local not found (may use defaults)"
fi

echo ""

if [ $ERRORS -gt 0 ]; then
  echo "❌ Environment check failed with $ERRORS error(s)"
  echo "   Fix the issues above before running E2E tests"
  exit 1
else
  echo "✅ Environment ready for E2E tests!"
  exit 0
fi
