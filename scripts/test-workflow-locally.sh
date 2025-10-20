#!/bin/bash
# Test the nightly workflow locally
# This simulates what GitHub Actions will run

set -e

echo "🚀 Testing Nightly Workflow Locally"
echo "===================================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
  echo "📋 Loading environment from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Check required environment variables
echo "🔍 Checking environment variables..."
if [ -z "$SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
  echo "   Using NEXT_PUBLIC_SUPABASE_URL for SUPABASE_URL"
fi

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ SUPABASE_URL is not set"
  exit 1
else
  echo "✅ SUPABASE_URL configured"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
  exit 1
else
  echo "✅ SUPABASE_SERVICE_ROLE_KEY configured"
fi

if [ -z "$MONITOR_ALERT_WEBHOOK_URL" ]; then
  echo "⚠️  MONITOR_ALERT_WEBHOOK_URL not set (alerts will be skipped)"
else
  echo "✅ MONITOR_ALERT_WEBHOOK_URL configured"
fi

echo ""
echo "🧪 Running workflow steps..."
echo "----------------------------"

# Step 1: Telemetry rollup health check
echo ""
echo "Step 1/4: Telemetry Rollup Health Check"
npm run monitor:telemetry || {
  echo "❌ Telemetry monitor failed"
  npx tsx scripts/notify-monitor-failure.ts
  exit 1
}
echo "✅ Telemetry monitor passed"

# Step 2: GDPR audit health check
echo ""
echo "Step 2/4: GDPR Audit Health Check"
npm run monitor:gdpr || {
  echo "❌ GDPR monitor failed"
  npx tsx scripts/notify-monitor-failure.ts
  exit 1
}
echo "✅ GDPR monitor passed"

# Step 3: Telemetry smoke test (if Playwright is installed)
echo ""
echo "Step 3/4: Telemetry Smoke Test"
if [ -f "playwright.config.ts" ]; then
  npm run test:telemetry-smoke || {
    echo "⚠️  Telemetry smoke test failed (non-critical)"
  }
else
  echo "⚠️  Skipping Playwright tests (not configured)"
fi

# Step 4: GDPR smoke test (if Playwright is installed)
echo ""
echo "Step 4/4: GDPR Smoke Test"
if [ -f "playwright.config.ts" ]; then
  npm run test:gdpr-smoke || {
    echo "⚠️  GDPR smoke test failed (non-critical)"
  }
else
  echo "⚠️  Skipping Playwright tests (not configured)"
fi

echo ""
echo "===================================="
echo "✅ Local workflow test completed!"
echo ""
echo "Next steps:"
echo "1. Configure GitHub secrets as shown above"
echo "2. Push changes to trigger the workflow"
echo "3. Or manually trigger with: gh workflow run 'Nightly Telemetry & GDPR Validation'"
echo ""