#!/bin/bash

# Run E2E Metadata Tracking Test
# This test requires a running dev server

set -e

echo "🚀 Starting dev server on port 3000..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Dev server is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Dev server failed to start after 30 seconds"
    kill $DEV_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

# Run the test
echo "🧪 Running E2E metadata tracking test..."
npm test -- __tests__/integration/agent-flow-metadata-tracking.test.ts
TEST_EXIT_CODE=$?

# Clean up
echo "🧹 Stopping dev server..."
kill $DEV_PID 2>/dev/null || true

# Exit with test result
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Tests failed with exit code $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE