#!/bin/bash
# Verification script for E2E test timing fix
# Validates that timeout changes were applied correctly

set -e

echo "🔍 Verifying E2E Test Timing Fix..."
echo ""

# Check helper file changes
echo "1️⃣ Checking helper file (test-utils/playwright/dashboard/training/helpers.ts)..."

# Check for network idle wait
if grep -q "waitForLoadState('networkidle'" test-utils/playwright/dashboard/training/helpers.ts; then
  echo "  ✅ Network idle check added"
else
  echo "  ❌ Network idle check missing"
  exit 1
fi

# Check for 2000ms retry interval
if grep -q "await page.waitForTimeout(2000)" test-utils/playwright/dashboard/training/helpers.ts; then
  echo "  ✅ Retry interval increased to 2000ms"
else
  echo "  ❌ Retry interval not updated"
  exit 1
fi

# Check for 8000ms final timeout
if grep -q "timeout: 8000" test-utils/playwright/dashboard/training/helpers.ts; then
  echo "  ✅ Final timeout increased to 8000ms"
else
  echo "  ❌ Final timeout not updated"
  exit 1
fi

echo ""
echo "2️⃣ Checking test file timeout updates..."

# Count 10000ms timeouts in test files
count=$(grep -r "waitForItemInList.*10000" __tests__/playwright/dashboard/training/*.spec.ts | wc -l | tr -d ' ')

if [ "$count" -eq 27 ]; then
  echo "  ✅ All 27 test calls updated to 10000ms"
else
  echo "  ❌ Expected 27 calls with 10000ms, found: $count"
  exit 1
fi

# Verify no 5000ms calls remain
old_count=$(grep -r "waitForItemInList.*5000" __tests__/playwright/dashboard/training/*.spec.ts | wc -l | tr -d ' ')

if [ "$old_count" -eq 0 ]; then
  echo "  ✅ No 5000ms timeouts remain"
else
  echo "  ⚠️  WARNING: Found $old_count calls still using 5000ms"
  echo "  Showing first few:"
  grep -r "waitForItemInList.*5000" __tests__/playwright/dashboard/training/*.spec.ts | head -3
fi

echo ""
echo "3️⃣ Checking modified files..."

modified_files=(
  "test-utils/playwright/dashboard/training/helpers.ts"
  "__tests__/playwright/dashboard/training/01-upload-url.spec.ts"
  "__tests__/playwright/dashboard/training/02-upload-text.spec.ts"
  "__tests__/playwright/dashboard/training/03-upload-qa.spec.ts"
  "__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts"
  "__tests__/playwright/dashboard/training/05-delete-data.spec.ts"
)

for file in "${modified_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file not found"
    exit 1
  fi
done

echo ""
echo "✅ All timing fix changes verified successfully!"
echo ""
echo "📋 Summary of Changes:"
echo "  • Network idle check added to waitForItemInList"
echo "  • Retry interval: 1500ms → 2000ms"
echo "  • Final timeout: 5000ms → 8000ms"
echo "  • Test timeouts: 5000ms → 10000ms (27 calls)"
echo ""
echo "🚀 To run tests:"
echo "  npm run test:e2e -- \"dashboard/training\" --project=chromium-auth"
echo ""
echo "📊 Expected improvements:"
echo "  Before: ~74% pass rate (6-8 failures per browser)"
echo "  After:  ~90-95% pass rate (1-2 failures per browser)"
