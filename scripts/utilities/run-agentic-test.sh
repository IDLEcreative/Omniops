#!/bin/bash

# Agentic Search Capabilities Test Runner
# Usage: ./run-agentic-test.sh [options]
# Options:
#   --verbose    Enable verbose output
#   --url=URL    Set custom base URL (default: http://localhost:3000)

set -e

# Default configuration
BASE_URL="http://localhost:3000"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --url=*)
      BASE_URL="${1#*=}"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --verbose         Enable verbose output"
      echo "  --url=URL         Set custom base URL (default: http://localhost:3000)"
      echo "  -h, --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Set environment variables
export TEST_BASE_URL="$BASE_URL"
export VERBOSE="$VERBOSE"

echo "🔬 Starting Agentic Search Capabilities Test"
echo "📍 Target URL: $BASE_URL"
echo "📝 Verbose Mode: $VERBOSE"
echo ""

# Check if development server is running
echo "🔍 Checking if development server is running..."
if curl -s --connect-timeout 5 "$BASE_URL/api/health" >/dev/null 2>&1 || curl -s --connect-timeout 5 "$BASE_URL" >/dev/null 2>&1; then
    echo "✅ Server is running at $BASE_URL"
else
    echo "⚠️  Server doesn't appear to be running at $BASE_URL"
    echo "   Make sure to start your development server first:"
    echo "   npm run dev"
    echo ""
    echo "   Or specify a different URL with --url=https://your-domain.com"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Executing test suite..."
echo "⏱️  This may take 2-5 minutes to complete..."
echo ""

# Run the test
npx tsx test-agentic-search-capabilities.ts

echo ""
echo "✅ Test execution complete!"