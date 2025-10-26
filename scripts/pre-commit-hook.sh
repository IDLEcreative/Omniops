#!/bin/bash
# Pre-commit hook to prevent brand references
# Install: cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Checking for brand references..."

# Check staged files for brand references
BRANDS="thompsonseparts|Thompson|Cifa|Agri.Flip|A4VTG90|K2053463"

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No TypeScript/JavaScript files to check"
  exit 0
fi

# Check each staged file
VIOLATIONS_FOUND=0

for FILE in $STAGED_FILES; do
  # Skip test files and documentation
  if echo "$FILE" | grep -qE "(test|spec|\.md$|BRAND_AGNOSTIC)"; then
    continue
  fi

  # Check for brand references
  if grep -inE "$BRANDS" "$FILE" | grep -vE "(REMOVED|deprecated|Example:)"; then
    echo "❌ Brand reference found in: $FILE"
    grep -inE "$BRANDS" "$FILE" | head -3
    VIOLATIONS_FOUND=1
  fi
done

if [ $VIOLATIONS_FOUND -eq 1 ]; then
  echo ""
  echo "❌ Commit blocked: Brand references detected"
  echo "   Please remove brand-specific terms before committing"
  exit 1
fi

echo "✅ No brand references found"
exit 0
