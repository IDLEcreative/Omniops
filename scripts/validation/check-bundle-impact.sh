#!/bin/bash
# Checks bundle size impact of new dependencies
# Usage: ./check-bundle-impact.sh [package-name]

set -e

PACKAGE=$1

if [ -z "$PACKAGE" ]; then
  echo "❌ Usage: $0 <package-name>"
  exit 1
fi

echo "📦 Checking bundle size impact of: $PACKAGE"
echo ""

# Use bundlephobia API
SIZE_DATA=$(curl -s "https://bundlephobia.com/api/size?package=$PACKAGE")
SIZE=$(echo "$SIZE_DATA" | jq -r '.size')
GZIP=$(echo "$SIZE_DATA" | jq -r '.gzip')

# Convert to KB
SIZE_KB=$((SIZE / 1024))
GZIP_KB=$((GZIP / 1024))

echo "Size: ${SIZE_KB} KB"
echo "Gzip: ${GZIP_KB} KB"
echo ""

# Warn if large
if [ $GZIP_KB -gt 50 ]; then
  echo "⚠️  WARNING: Large package (${GZIP_KB} KB gzipped)"
  echo "   Consider alternatives or dynamic import"
elif [ $GZIP_KB -gt 20 ]; then
  echo "⚠️  NOTICE: Moderate size (${GZIP_KB} KB gzipped)"
  echo "   Ensure it's worth the bundle cost"
else
  echo "✅ Acceptable size (${GZIP_KB} KB gzipped)"
fi
