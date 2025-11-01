#!/bin/bash
# Analyzes SQL queries in code for common performance issues
# Usage: ./analyze-query-performance.sh [file.ts] [file2.ts] ...

set -e

echo "🔍 Analyzing Query Performance..."
echo ""

FILES="$@"
ISSUES=0

if [ -z "$FILES" ]; then
  echo "❌ No files specified"
  exit 1
fi

for file in $FILES; do
  echo "📁 Checking: $file"
  echo ""

  # Check 1: SELECT * usage
  select_star=$(grep -n "\.select('\*')" "$file" | wc -l || true)
  if [ $select_star -gt 0 ]; then
    echo "  ⚠️  Found $select_star SELECT * usage(s)"
    echo "     Recommendation: Specify columns explicitly"
    ((ISSUES++))
  fi

  # Check 2: Missing .limit()
  missing_limit=$(grep -n "\.from(" "$file" | grep -v "\.limit(" | wc -l || true)
  if [ $missing_limit -gt 0 ]; then
    echo "  ⚠️  Found $missing_limit unbounded queries"
    echo "     Recommendation: Always use .limit() for safety"
    ((ISSUES++))
  fi

  # Check 3: Queries in loops
  queries_in_loops=$(grep -B5 "await.*\.from(" "$file" | grep -c "for\|while" || true)
  if [ $queries_in_loops -gt 0 ]; then
    echo "  ⚠️  Possible queries inside loops (N+1 problem)"
    echo "     Recommendation: Batch fetch before loop"
    ((ISSUES++))
  fi

  echo ""
done

echo "📊 Summary: Found $ISSUES potential query performance issues"

if [ $ISSUES -eq 0 ]; then
  echo "✅ No query performance issues detected"
  exit 0
else
  echo "⚠️  Review and optimize queries"
  exit 1
fi
