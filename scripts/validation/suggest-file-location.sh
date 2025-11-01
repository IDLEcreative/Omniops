#!/bin/bash
# Suggests correct location for a file based on its characteristics
# Usage: ./suggest-file-location.sh [filename] [description]

FILENAME="$1"
DESCRIPTION="$2"

if [ -z "$FILENAME" ]; then
  echo "Usage: $0 [filename] [optional: description]"
  exit 1
fi

echo "🔍 Analyzing: $FILENAME"
echo "Description: ${DESCRIPTION:-Not provided}"
echo ""

# Analyze filename patterns
if [[ "$FILENAME" == test-* ]] || [[ "$FILENAME" == *test*.ts ]] || [[ "$FILENAME" == *.test.ts ]]; then
  echo "📋 Type: Test Script"
  echo "📂 Suggested Location: __tests__/[category]/"
  echo ""
  echo "Common categories:"
  echo "  • __tests__/api/ - API endpoint tests"
  echo "  • __tests__/components/ - React component tests"
  echo "  • __tests__/integration/ - Integration tests"
  echo "  • __tests__/lib/[module]/ - Library/service tests"

elif [[ "$FILENAME" == *.sql ]]; then
  echo "📋 Type: SQL Script"
  echo "📂 Suggested Location: scripts/sql/[category]/"
  echo ""
  echo "Common categories:"
  echo "  • scripts/sql/migrations/ - Database migrations"
  echo "  • scripts/sql/queries/ - Reusable queries"
  echo "  • scripts/sql/seeds/ - Test data seeds"

elif [[ "$FILENAME" == *REPORT.md ]] || [[ "$FILENAME" == *COMPLETE.md ]] || [[ "$FILENAME" == *SUMMARY.md ]]; then
  echo "📋 Type: Completion Report"
  echo "📂 Suggested Location: ARCHIVE/completion-reports-$(date +%Y-%m)/"
  echo ""
  echo "Example: ARCHIVE/completion-reports-2025-10/WEEK1_FEATURE_COMPLETE.md"

elif [[ "$FILENAME" == *.md ]]; then
  echo "📋 Type: Documentation"
  echo "📂 Suggested Location: docs/[category]/"
  echo ""
  echo "Categories based on prefix:"
  echo "  • ARCHITECTURE_* → docs/01-ARCHITECTURE/"
  echo "  • GUIDE_* → docs/02-GUIDES/"
  echo "  • REFERENCE_* → docs/03-REFERENCE/"
  echo "  • ANALYSIS_* → docs/04-ANALYSIS/"
  echo "  • TROUBLESHOOTING_* → docs/05-TROUBLESHOOTING/"
  echo "  • INTEGRATION_* → docs/06-INTEGRATIONS/"
  echo ""

  # Check if follows naming convention
  if [[ "$FILENAME" =~ ^[A-Z]+_[A-Z_]+\.md$ ]]; then
    PREFIX=$(echo "$FILENAME" | cut -d_ -f1)
    echo "✅ Follows naming convention (PREFIX_NAME.md)"
    echo "📂 Recommended: docs/[0X-CATEGORY]/$FILENAME"
  else
    echo "⚠️  Should follow PREFIX_DESCRIPTIVE_NAME.md pattern"
    UPPER_NAME=$(echo "${FILENAME%.md}" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    echo "Example: ${FILENAME%.md} → GUIDE_${UPPER_NAME}.md"
  fi

elif [[ "$FILENAME" == *.ts ]] || [[ "$FILENAME" == *.js ]]; then
  echo "📋 Type: Script/Code File"

  if [[ "$DESCRIPTION" == *"test"* ]] || [[ "$DESCRIPTION" == *"spec"* ]]; then
    echo "📂 Suggested Location: __tests__/[category]/"
  elif [[ "$DESCRIPTION" == *"util"* ]] || [[ "$DESCRIPTION" == *"helper"* ]]; then
    echo "📂 Suggested Location: lib/utils/ OR scripts/[category]/"
  elif [[ "$DESCRIPTION" == *"database"* ]] || [[ "$DESCRIPTION" == *"migration"* ]]; then
    echo "📂 Suggested Location: scripts/database/"
  elif [[ "$DESCRIPTION" == *"monitor"* ]] || [[ "$DESCRIPTION" == *"health"* ]]; then
    echo "📂 Suggested Location: scripts/monitoring/"
  else
    echo "📂 Suggested Location: scripts/[category]/"
    echo ""
    echo "Common categories:"
    echo "  • scripts/database/ - Database utilities"
    echo "  • scripts/tests/ - Testing utilities"
    echo "  • scripts/monitoring/ - Health/monitoring scripts"
    echo "  • scripts/validation/ - Validation scripts"
  fi

elif [[ "$FILENAME" == *.log ]]; then
  echo "📋 Type: Log File"
  echo "📂 Suggested Location: logs/[category]/"
  echo ""
  echo "Common categories:"
  echo "  • logs/tests/ - Test execution logs"
  echo "  • logs/build/ - Build logs"
  echo "  • logs/app/ - Application logs"

elif [[ "$FILENAME" == *.json ]] && [[ "$DESCRIPTION" == *"test"* ]]; then
  echo "📋 Type: Test Result JSON"
  echo "📂 Suggested Location: ARCHIVE/test-results/"

else
  echo "📋 Type: Unknown"
  echo ""
  echo "Please provide more context. Common locations:"
  echo "  • __tests__/[category]/ - Test files"
  echo "  • scripts/[category]/ - Utility scripts"
  echo "  • docs/[category]/ - Documentation"
  echo "  • ARCHIVE/completion-reports-[date]/ - Reports"
  echo "  • logs/[category]/ - Log files"
fi

echo ""
echo "💡 Tip: Use 'git mv' to move files (preserves history)"
