#!/bin/bash
# Analyzes a file to identify refactoring opportunities
# Usage: ./analyze-file-complexity.sh [file.ts]

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: $0 [file.ts]"
  exit 1
fi

echo "🔍 Analyzing: $FILE"
echo ""

# Count LOC
LOC=$(wc -l < "$FILE")
echo "📏 Lines of Code: $LOC"

if [ "$LOC" -gt 300 ]; then
  echo "   ⚠️  Exceeds 300 LOC limit by $((LOC - 300)) lines"
fi
echo ""

# Count classes
CLASSES=$(grep -c "^class " "$FILE" || true)
echo "📦 Classes: $CLASSES"
if [ "$CLASSES" -gt 1 ]; then
  echo "   ⚠️  Multiple classes in one file"
fi
echo ""

# Count functions/methods
FUNCTIONS=$(grep -c "^\s*\(async \)\?function\|^\s*\(public\|private\|protected\)\?\s*\(async \)\?\w\+(" "$FILE" || true)
echo "🔧 Functions/Methods: $FUNCTIONS"
if [ "$FUNCTIONS" -gt 10 ]; then
  echo "   ⚠️  High function count - consider extraction"
fi
echo ""

# Check for potential dependencies
IMPORTS=$(grep -c "^import " "$FILE" || true)
echo "📥 Imports: $IMPORTS"
if [ "$IMPORTS" -gt 15 ]; then
  echo "   ⚠️  High import count - possible tight coupling"
fi
echo ""

# Check for 'new' keyword (potential hidden dependencies)
NEW_INSTANCES=$(grep -c " new " "$FILE" || true)
echo "🆕 'new' keyword usage: $NEW_INSTANCES"
if [ "$NEW_INSTANCES" -gt 3 ]; then
  echo "   ⚠️  High 'new' usage - consider dependency injection"
fi
echo ""

# Calculate complexity score
COMPLEXITY=0
[ "$LOC" -gt 300 ] && COMPLEXITY=$((COMPLEXITY + 3))
[ "$CLASSES" -gt 1 ] && COMPLEXITY=$((COMPLEXITY + 2))
[ "$FUNCTIONS" -gt 10 ] && COMPLEXITY=$((COMPLEXITY + 2))
[ "$IMPORTS" -gt 15 ] && COMPLEXITY=$((COMPLEXITY + 2))
[ "$NEW_INSTANCES" -gt 3 ] && COMPLEXITY=$((COMPLEXITY + 2))

echo "🎯 Complexity Score: $COMPLEXITY/11"

if [ "$COMPLEXITY" -ge 6 ]; then
  echo "   🔴 HIGH - Refactoring strongly recommended"
elif [ "$COMPLEXITY" -ge 3 ]; then
  echo "   🟡 MEDIUM - Consider refactoring"
else
  echo "   🟢 LOW - File is maintainable"
fi
echo ""

# Refactoring suggestions
if [ "$COMPLEXITY" -ge 3 ]; then
  echo "💡 Refactoring Suggestions:"
  [ "$LOC" -gt 300 ] && echo "   • Extract responsibilities to new modules"
  [ "$CLASSES" -gt 1 ] && echo "   • Move classes to separate files"
  [ "$FUNCTIONS" -gt 10 ] && echo "   • Extract helper functions to utilities"
  [ "$IMPORTS" -gt 15 ] && echo "   • Use facade pattern to reduce dependencies"
  [ "$NEW_INSTANCES" -gt 3 ] && echo "   • Apply dependency injection pattern"
fi
