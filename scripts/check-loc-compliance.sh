#!/bin/bash

# LOC Compliance Check Script
# Enforces the strict 300 LOC limit for all TS/JS files (see CLAUDE.md, line ~1008)
# Usage: ./scripts/check-loc-compliance.sh [--staged]

set -e

echo "🔍 Checking LOC compliance..."

# Determine which files to check
if [ "$1" = "--staged" ]; then
  # Check only staged files (for pre-commit hook)
  files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' | grep -v -E '(\.bundle\.js|-bundle\.js)$' || true)
  if [ -z "$files" ]; then
    echo "✅ No TypeScript/JavaScript files staged"
    exit 0
  fi
else
  # Check all files in project
  files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.next/*" \
    -not -path "*/build/*" \
    -not -name "*-bundle.js" \
    -not -name "*.bundle.js")
fi

violations=()
warnings=()
total_checked=0
compliant=0

for file in $files; do
  # Skip if file doesn't exist (deleted in commit)
  if [ ! -f "$file" ]; then
    continue
  fi

  total_checked=$((total_checked + 1))

  # Count non-blank, non-comment lines
  # Remove blank lines, single-line comments, and JSX comments
  loc=$(grep -v '^\s*$' "$file" 2>/dev/null | \
        grep -v '^\s*//' | \
        grep -v '^\s*\*' | \
        grep -v '^\s*/\*' | \
        wc -l | \
        tr -d ' ')

  limit=300
  warning_threshold=280

  if [ "$loc" -gt "$limit" ]; then
    violations+=("$file ($loc LOC)")
  elif [ "$loc" -gt "$warning_threshold" ]; then
    warnings+=("$file ($loc LOC - approaching limit)")
    compliant=$((compliant + 1))
  else
    compliant=$((compliant + 1))
  fi
done

# Display results
echo ""
echo "📊 LOC Compliance Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Files checked: $total_checked"
echo "Compliant: $compliant"
echo "Violations: ${#violations[@]}"
echo "Warnings: ${#warnings[@]}"
echo ""

# Show warnings (files approaching limit)
if [ ${#warnings[@]} -gt 0 ]; then
  echo "⚠️  Files approaching LOC limit (300 LOC max across the board):"
  for warning in "${warnings[@]}"; do
    echo "   $warning"
  done
  echo ""
fi

# Show violations (files exceeding limit)
if [ ${#violations[@]} -gt 0 ]; then
  echo "❌ LOC Compliance Violations:"
  echo "   All TypeScript/JavaScript files: 300 LOC limit"
  echo ""
  for violation in "${violations[@]}"; do
    echo "   $violation"
  done
  echo ""
  echo "Please refactor these files before committing."
  echo "See: docs/02-GUIDES/GUIDE_LOC_COMPLIANCE_STRUCTURE.md"
  echo ""
  exit 1
fi

echo "✅ LOC compliance check passed!"
echo ""
exit 0
