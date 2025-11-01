#!/bin/bash
# Checks production code for hardcoded brand references
# Usage: ./check-brand-agnostic.sh [file.ts] [file2.ts] ...

set -e

echo "🔍 Checking Brand-Agnostic Compliance..."
echo ""

FILES="$@"
VIOLATIONS=0

if [ -z "$FILES" ]; then
  echo "❌ No files specified"
  exit 1
fi

# Forbidden terms in production code
FORBIDDEN_TERMS=(
  "Thompson"
  "Cifa"
  "concrete pump"
  "hydraulic pump"
  "pump parts"
)

for file in $FILES; do
  echo "📁 Checking: $file"
  echo ""

  # Skip test files
  if [[ "$file" =~ __tests__/ ]] || [[ "$file" =~ \.test\. ]] || [[ "$file" =~ \.spec\. ]]; then
    echo "  ⏭️  Skipping test file (domain terms allowed)"
    echo ""
    continue
  fi

  # Check for forbidden terms
  for term in "${FORBIDDEN_TERMS[@]}"; do
    matches=$(grep -i -n "$term" "$file" | wc -l || true)
    if [ $matches -gt 0 ]; then
      echo "  ❌ Found hardcoded term: '$term'"
      grep -i -n "$term" "$file" || true
      ((VIOLATIONS++))
    fi
  done

  # Check for hardcoded emails
  hardcoded_emails=$(grep -E -n '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' "$file" | grep -v config | grep -v process.env | wc -l || true)
  if [ $hardcoded_emails -gt 0 ]; then
    echo "  ⚠️  Found hardcoded email address(es)"
    ((VIOLATIONS++))
  fi

  # Check for hardcoded URLs
  hardcoded_urls=$(grep -E -n 'https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' "$file" | grep -v config | grep -v process.env | wc -l || true)
  if [ $hardcoded_urls -gt 0 ]; then
    echo "  ⚠️  Found hardcoded URL(s)"
    ((VIOLATIONS++))
  fi

  echo ""
done

echo "📊 Summary: Found $VIOLATIONS brand-agnostic violations"

if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ All files are brand-agnostic"
  exit 0
else
  echo "❌ Fix violations before deployment"
  exit 1
fi
