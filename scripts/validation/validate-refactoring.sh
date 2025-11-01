#!/bin/bash
# Validates refactoring meets all quality criteria
# Usage: ./validate-refactoring.sh [file1.ts] [file2.ts] ...

set -e # Exit on first error

echo "🔍 Validating Refactoring..."
echo ""

# Get list of files to validate
FILES="$@"

if [ -z "$FILES" ]; then
  echo "❌ No files specified"
  echo "Usage: $0 [file1.ts] [file2.ts] ..."
  exit 1
fi

# Step 1: Check LOC limits
echo "📏 Checking LOC limits (max 300)..."
for file in $FILES; do
  loc=$(wc -l < "$file")
  if [ "$loc" -gt 300 ]; then
    echo "❌ $file has $loc lines (exceeds 300 LOC limit)"
    exit 1
  else
    echo "✅ $file: $loc lines (OK)"
  fi
done
echo ""

# Step 2: Run TypeScript compilation
echo "🔧 Running TypeScript compilation..."
npx tsc --noEmit $FILES --skipLibCheck
if [ $? -eq 0 ]; then
  echo "✅ TypeScript compilation successful (0 errors)"
else
  echo "❌ TypeScript compilation failed"
  exit 1
fi
echo ""

# Step 3: Run linting
echo "🧹 Running ESLint..."
npm run lint
if [ $? -eq 0 ]; then
  echo "✅ Linting passed (0 warnings)"
else
  echo "❌ Linting failed"
  exit 1
fi
echo ""

# Step 4: Run related tests
echo "🧪 Running related tests..."
npm test -- --findRelatedTests $FILES
if [ $? -eq 0 ]; then
  echo "✅ Related tests passed"
else
  echo "❌ Related tests failed"
  exit 1
fi
echo ""

# Step 5: Run full test suite
echo "🧪 Running full test suite..."
npm test
if [ $? -eq 0 ]; then
  echo "✅ Full test suite passed (all tests)"
else
  echo "❌ Full test suite failed"
  exit 1
fi
echo ""

echo "🎉 All validation checks passed!"
echo ""
echo "Summary:"
echo "  ✅ All files under 300 LOC"
echo "  ✅ TypeScript compilation successful"
echo "  ✅ Linting passed"
echo "  ✅ Related tests passed"
echo "  ✅ Full test suite passed"
echo ""
echo "Refactoring is complete and validated!"
