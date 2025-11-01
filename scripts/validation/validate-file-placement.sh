#!/bin/bash
# Validates file placement follows project rules
# Usage: ./validate-file-placement.sh [file-path] OR ./validate-file-placement.sh (checks all)

set -e

# Allowed root files whitelist
ALLOWED_ROOT=(
  "package.json" "package-lock.json"
  "tsconfig.json" "tsconfig.test.json" "jsconfig.json" "tsconfig.tsbuildinfo"
  "next.config.js" "middleware.ts" "next-env.d.ts"
  "tailwind.config.js" "postcss.config.mjs"
  "jest.config.js" "playwright.config.js" "eslint.config.mjs"
  "components.json" "vercel.json"
  "Dockerfile" "Dockerfile.dev"
  "docker-compose.yml" "docker-compose.dev.yml"
  ".dockerignore" ".gitignore" ".eslintignore" ".vercelignore"
  ".env.example" ".env.docker.example" ".env.monitoring.example"
  ".mcp.json"
  "README.md" "CLAUDE.md"
)

echo "🔍 Validating File Placement..."
echo ""

# Function to check if file is in allowed root list
is_allowed_in_root() {
  local file="$1"
  for allowed in "${ALLOWED_ROOT[@]}"; do
    if [[ "$file" == "$allowed" ]]; then
      return 0
    fi
  done
  return 1
}

# If specific file provided, check that file
if [ -n "$1" ]; then
  FILE="$1"
  BASENAME=$(basename "$FILE")
  DIRNAME=$(dirname "$FILE")

  echo "Checking: $FILE"
  echo ""

  # Check if in root
  if [[ "$DIRNAME" == "." ]] || [[ "$DIRNAME" == "/" ]]; then
    if is_allowed_in_root "$BASENAME"; then
      echo "✅ $FILE is allowed in root directory"
    else
      echo "❌ $FILE should NOT be in root directory"
      echo ""
      echo "Suggested locations:"

      if [[ "$FILE" == test-* ]] || [[ "$FILE" == *test*.ts ]]; then
        echo "  → __tests__/[category]/"
      elif [[ "$FILE" == *.sql ]]; then
        echo "  → scripts/sql/[category]/"
      elif [[ "$FILE" == *REPORT.md ]] || [[ "$FILE" == *COMPLETE.md ]]; then
        echo "  → ARCHIVE/completion-reports-$(date +%Y-%m)/"
      elif [[ "$FILE" == *.md ]]; then
        echo "  → docs/[category]/"
      else
        echo "  → scripts/[category]/ (if utility script)"
        echo "  → __tests__/[category]/ (if test)"
        echo "  → docs/[category]/ (if documentation)"
      fi

      exit 1
    fi
  else
    echo "✅ $FILE is not in root directory"
  fi

  # Check naming convention for docs
  if [[ "$FILE" == docs/*.md ]]; then
    if [[ "$BASENAME" =~ ^[A-Z]+_[A-Z_]+\.md$ ]]; then
      echo "✅ Documentation naming convention followed (PREFIX_NAME.md)"
    else
      echo "⚠️  Documentation should follow PREFIX_DESCRIPTIVE_NAME.md pattern"
      echo "   Examples: GUIDE_SETUP.md, ARCHITECTURE_OVERVIEW.md"
    fi
  fi

  echo ""
  echo "✅ Validation complete"
  exit 0
fi

# If no specific file, check entire project
echo "Checking all files in root directory..."
echo ""

VIOLATIONS=0

for file in *; do
  # Skip directories
  [[ -d "$file" ]] && continue

  # Skip hidden files (except whitelisted ones)
  [[ "$file" == .* ]] && ! is_allowed_in_root "$file" && continue

  if ! is_allowed_in_root "$file"; then
    echo "❌ Violation: $file should not be in root"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

echo ""

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "✅ No file placement violations found!"
else
  echo "❌ Found $VIOLATIONS file placement violation(s)"
  echo ""
  echo "Please move files to appropriate directories:"
  echo "  - Test scripts → __tests__/[category]/"
  echo "  - Utility scripts → scripts/[category]/"
  echo "  - Documentation → docs/[category]/"
  echo "  - Completion reports → ARCHIVE/completion-reports-[date]/"
  echo ""
  echo "Use 'git mv' to preserve file history"
  exit 1
fi
