#!/bin/bash
# Combined Development Environment
# Runs dev server + unit tests + E2E tests all in watch mode
# Perfect for AI agents - immediate feedback on all changes

set -e

echo "🚀 Starting Full Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Starting 3 processes:"
echo "  1. Next.js dev server (port 3000)"
echo "  2. Unit/Integration test watcher"
echo "  3. E2E test watcher (runs on file changes)"
echo ""
echo "Press Ctrl+C to stop all processes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap Ctrl+C to kill all child processes
trap 'echo ""; echo "🛑 Stopping all processes..."; kill 0' SIGINT

# Start dev server
echo "📦 Starting Next.js dev server..."
npm run dev > /tmp/omniops-dev.log 2>&1 &
DEV_PID=$!
echo "   Started (PID: $DEV_PID)"

# Wait for dev server to be ready
echo "⏳ Waiting for dev server to be ready..."
timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null 2>&1; do sleep 2; done' || {
  echo "❌ Dev server failed to start. Check /tmp/omniops-dev.log"
  exit 1
}
echo "✅ Dev server ready at http://localhost:3000"
echo ""

# Start unit test watcher
echo "🧪 Starting unit/integration test watcher..."
npm run test:watch > /tmp/omniops-unit-tests.log 2>&1 &
UNIT_PID=$!
echo "   Started (PID: $UNIT_PID)"
echo ""

# Start E2E test watcher
echo "🎭 Starting E2E test watcher..."
npm run test:e2e:watch-files > /tmp/omniops-e2e-tests.log 2>&1 &
E2E_PID=$!
echo "   Started (PID: $E2E_PID)"
echo ""

echo "✅ All processes running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Logs available at:"
echo "   Dev server: /tmp/omniops-dev.log"
echo "   Unit tests: /tmp/omniops-unit-tests.log"
echo "   E2E tests:  /tmp/omniops-e2e-tests.log"
echo ""
echo "💡 Tip: Use 'tail -f /tmp/omniops-*.log' in another terminal"
echo ""
echo "🤖 AI Agent Mode: ACTIVE"
echo "   All code changes will trigger automatic testing"
echo ""

# Wait for all processes
wait
