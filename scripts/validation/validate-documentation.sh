#!/bin/bash
# Validates documentation files against AI-discoverability standards
# Usage: ./validate-documentation.sh [file.md] [file2.md] ...

set -e

echo "📚 Validating Documentation..."
echo ""

# Get list of files to validate
FILES="$@"

if [ -z "$FILES" ]; then
  echo "❌ No files specified"
  echo "Usage: $0 [file1.md] [file2.md] ..."
  exit 1
fi

# Initialize counters
TOTAL_FILES=0
PASSED_FILES=0
FAILED_FILES=0

# Validation function
validate_file() {
  local file=$1
  local issues=0

  echo "🔍 Validating: $file"
  echo ""

  # Check 1: File exists and is markdown
  if [ ! -f "$file" ]; then
    echo "  ❌ File not found: $file"
    return 1
  fi

  if [[ ! "$file" =~ \.md$ ]]; then
    echo "  ⏭️  Not a markdown file (skipping)"
    return 0
  fi

  # Check 2: Metadata header (first 20 lines)
  local has_type=$(head -20 "$file" | grep -c "^\*\*Type:\*\*" || true)
  local has_status=$(head -20 "$file" | grep -c "^\*\*Status:\*\*" || true)
  local has_updated=$(head -20 "$file" | grep -c "^\*\*Last Updated:\*\*" || true)
  local has_purpose=$(head -30 "$file" | grep -c "^## Purpose" || true)

  if [ $has_type -eq 0 ]; then
    echo "  ❌ Missing **Type:** field in metadata header"
    ((issues++))
  else
    echo "  ✅ Has Type field"
  fi

  if [ $has_status -eq 0 ]; then
    echo "  ❌ Missing **Status:** field in metadata header"
    ((issues++))
  else
    echo "  ✅ Has Status field"
  fi

  if [ $has_updated -eq 0 ]; then
    echo "  ❌ Missing **Last Updated:** field in metadata header"
    ((issues++))
  else
    echo "  ✅ Has Last Updated field"
  fi

  if [ $has_purpose -eq 0 ]; then
    echo "  ❌ Missing ## Purpose section"
    ((issues++))
  else
    echo "  ✅ Has Purpose section"
  fi

  # Check 3: File naming convention
  local filename=$(basename "$file")
  local has_prefix=0

  # Check for valid prefixes
  if [[ "$filename" =~ ^(ARCHITECTURE|GUIDE|REFERENCE|ANALYSIS|SETUP|TESTING|TROUBLESHOOTING|API|INTEGRATION)_ ]]; then
    has_prefix=1
    echo "  ✅ Filename has valid prefix"
  else
    echo "  ❌ Filename missing valid prefix (should be PREFIX_DESCRIPTIVE_NAME.md)"
    ((issues++))
  fi

  # Check for generic names
  if [[ "$filename" =~ ^(notes|todo|misc|temp|test|draft)\.md$ ]]; then
    echo "  ❌ Filename is generic (use descriptive name)"
    ((issues++))
  fi

  # Check 4: Table of contents for long docs
  local line_count=$(wc -l < "$file")
  if [ $line_count -gt 100 ]; then
    local has_toc=$(head -50 "$file" | grep -c "^## Table of Contents" || true)
    if [ $has_toc -eq 0 ]; then
      echo "  ⚠️  Document >100 lines but no Table of Contents"
      ((issues++))
    else
      echo "  ✅ Has Table of Contents"
    fi
  fi

  # Check 5: Broken internal links (basic check)
  local broken_links=$(grep -o '\[.*\](docs/[^)]*\.md[^)]*)' "$file" | while read link; do
    local path=$(echo "$link" | sed -E 's/.*\((docs\/[^)]*\.md).*/\1/')
    if [ ! -f "$path" ]; then
      echo "$path"
    fi
  done | wc -l)

  if [ $broken_links -gt 0 ]; then
    echo "  ❌ Found $broken_links broken internal link(s)"
    ((issues++))
  else
    echo "  ✅ No broken internal links detected"
  fi

  # Summary for this file
  echo ""
  if [ $issues -eq 0 ]; then
    echo "  🎉 $file passed validation (0 issues)"
    return 0
  else
    echo "  ⚠️  $file has $issues issue(s)"
    return 1
  fi
}

# Validate each file
for file in $FILES; do
  ((TOTAL_FILES++))

  if validate_file "$file"; then
    ((PASSED_FILES++))
  else
    ((FAILED_FILES++))
  fi

  echo ""
  echo "----------------------------------------"
  echo ""
done

# Final summary
echo "📊 Validation Summary"
echo "====================="
echo "Total files:  $TOTAL_FILES"
echo "Passed:       $PASSED_FILES ($(( PASSED_FILES * 100 / TOTAL_FILES ))%)"
echo "Failed:       $FAILED_FILES ($(( FAILED_FILES * 100 / TOTAL_FILES ))%)"
echo ""

if [ $FAILED_FILES -eq 0 ]; then
  echo "✅ All documentation files passed validation!"
  exit 0
else
  echo "❌ Some documentation files need fixes"
  exit 1
fi
