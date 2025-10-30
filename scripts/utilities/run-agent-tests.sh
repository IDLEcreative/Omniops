#!/bin/bash
# Run comprehensive agent conversation tests

echo "🤖 Starting Agent Conversation Test Suite"
echo "=========================================="
echo ""

# Check if server is running
echo "Checking if server is running on port 3000..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server is not running on port 3000"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Run main conversation test suite
echo "1️⃣ Running Main Conversation Test Suite..."
echo "-------------------------------------------"
npx tsx test-agent-conversation-suite.ts
MAIN_EXIT_CODE=$?

echo ""
echo ""

# Run edge case tests
echo "2️⃣ Running Edge Case Test Suite..."
echo "-------------------------------------------"
npx tsx test-agent-edge-cases.ts
EDGE_EXIT_CODE=$?

echo ""
echo ""
echo "=========================================="
echo "📊 OVERALL TEST RESULTS"
echo "=========================================="

if [ $MAIN_EXIT_CODE -eq 0 ] && [ $EDGE_EXIT_CODE -eq 0 ]; then
    echo "✅ ALL TESTS PASSED!"
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    [ $MAIN_EXIT_CODE -ne 0 ] && echo "  - Main conversation tests: FAILED"
    [ $EDGE_EXIT_CODE -ne 0 ] && echo "  - Edge case tests: FAILED"
    exit 1
fi