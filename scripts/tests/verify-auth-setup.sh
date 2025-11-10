#!/bin/bash

# Verify Authentication Setup for E2E Tests
# Checks that all required files and configurations are in place

echo "=== E2E Authentication Setup Verification ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track verification results
ERRORS=0
WARNINGS=0
SUCCESS=0

# Function to check file exists
check_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $description${NC}"
    ((SUCCESS++))
  else
    echo -e "${RED}❌ $description${NC}"
    echo "   Missing: $file"
    ((ERRORS++))
  fi
}

# Function to check directory exists
check_dir() {
  local dir=$1
  local description=$2

  if [ -d "$dir" ]; then
    echo -e "${GREEN}✅ $description${NC}"
    ((SUCCESS++))
  else
    echo -e "${YELLOW}⚠️  $description${NC}"
    echo "   Missing: $dir (will be created on first run)"
    ((WARNINGS++))
  fi
}

# Function to check env variable
check_env() {
  local var_name=$1
  local description=$2
  local required=$3

  # Check .env.test file
  if grep -q "^$var_name=" .env.test 2>/dev/null; then
    echo -e "${GREEN}✅ $description${NC}"
    ((SUCCESS++))
  else
    if [ "$required" = "required" ]; then
      echo -e "${RED}❌ $description${NC}"
      echo "   Missing: $var_name in .env.test"
      ((ERRORS++))
    else
      echo -e "${YELLOW}⚠️  $description${NC}"
      echo "   Optional: $var_name in .env.test"
      ((WARNINGS++))
    fi
  fi
}

echo "📁 Checking Auth Infrastructure Files..."
echo ""

# Check core auth files
check_file "__tests__/utils/playwright/auth-helpers.ts" "Auth helper functions"
check_file "__tests__/playwright/setup/auth.setup.ts" "Global auth setup"
check_file "scripts/tests/setup-test-user.ts" "Test user setup script"
check_file ".env.test" "Test environment configuration"
check_file "playwright.config.js" "Playwright configuration"

echo ""
echo "📂 Checking Directories..."
echo ""

check_dir "__tests__/playwright/setup" "Setup directory"
check_dir "playwright" "Playwright directory"
check_dir "playwright/.auth" "Auth state directory"

echo ""
echo "🔧 Checking Environment Variables..."
echo ""

check_env "TEST_USER_EMAIL" "Test user email configured" "required"
check_env "TEST_USER_PASSWORD" "Test user password configured" "required"
check_env "BASE_URL" "Base URL configured" "optional"

echo ""
echo "📝 Checking Playwright Configuration..."
echo ""

# Check if setup project exists in config
if grep -q "name: 'setup'" playwright.config.js; then
  echo -e "${GREEN}✅ Setup project configured in playwright.config.js${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Setup project not found in playwright.config.js${NC}"
  ((ERRORS++))
fi

# Check if storageState is configured
if grep -q "storageState.*user.json" playwright.config.js; then
  echo -e "${GREEN}✅ Auth state storage configured${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Auth state storage not configured${NC}"
  ((ERRORS++))
fi

echo ""
echo "📚 Checking Documentation..."
echo ""

check_file "__tests__/playwright/AUTH_SETUP.md" "Authentication setup guide"
check_file "ARCHIVE/completion-reports-2025-11/ANALYTICS_AUTH_SETUP_COMPLETE.md" "Completion report"

echo ""
echo "🔍 Checking .gitignore..."
echo ""

if grep -q "playwright/.auth" .gitignore; then
  echo -e "${GREEN}✅ Auth directory excluded from git${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  Auth directory not in .gitignore${NC}"
  echo "   Run: echo 'playwright/.auth/' >> .gitignore"
  ((WARNINGS++))
fi

echo ""
echo "=== Verification Summary ==="
echo ""

echo -e "${GREEN}✅ Passed: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $ERRORS${NC}"

echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 Authentication setup verified successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Create test user:  npx tsx scripts/tests/setup-test-user.ts"
  echo "  2. Run auth setup:    npx playwright test --project=setup"
  echo "  3. Run tests:         npx playwright test analytics-exports"
  exit 0
else
  echo -e "${RED}⚠️  Authentication setup incomplete!${NC}"
  echo ""
  echo "Fix the errors above, then run this script again."
  exit 1
fi
