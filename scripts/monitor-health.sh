#!/bin/bash
# Monitor application and Supabase health
# Usage: npm run monitor:health

set -e

# Check if server is running
if ! lsof -i:3000 > /dev/null 2>&1; then
  echo "❌ Dev server not running on port 3000"
  exit 1
fi

echo "🏥 Health Check - $(date)"
echo "======================================"

# Get health status
HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo '{"status":"error"}')
STATUS=$(echo "$HEALTH" | jq -r '.status' 2>/dev/null || echo "error")

echo "Overall Status: $STATUS"
echo ""

# Database check
DB_STATUS=$(echo "$HEALTH" | jq -r '.checks.database' 2>/dev/null || echo "error")
if [ "$DB_STATUS" = "ok" ]; then
  echo "✅ Database: Connected"
else
  echo "❌ Database: $DB_STATUS"
  echo "   Latency: $(echo "$HEALTH" | jq -r '.latency.database' 2>/dev/null || echo 'N/A')"
fi

# Redis check
REDIS_STATUS=$(echo "$HEALTH" | jq -r '.checks.redis' 2>/dev/null || echo "error")
if [ "$REDIS_STATUS" = "ok" ]; then
  echo "✅ Redis: Connected"
else
  echo "⚠️  Redis: $REDIS_STATUS (optional)"
fi

# Memory check
MEMORY=$(echo "$HEALTH" | jq -r '.checks.memory.percentage' 2>/dev/null || echo "0")
if [ "$MEMORY" -gt 90 ]; then
  echo "⚠️  Memory: ${MEMORY}% (high)"
else
  echo "✅ Memory: ${MEMORY}%"
fi

# Process check
echo ""
echo "Process Status:"
JEST_COUNT=$(ps aux | grep "jest-worker" | grep -v grep | wc -l | tr -d ' ')
MCP_COUNT=$(ps aux | grep "mcp-server" | grep -v grep | wc -l | tr -d ' ')

if [ "$JEST_COUNT" -gt 0 ]; then
  echo "⚠️  Jest workers running: $JEST_COUNT"
  # Check if any are high CPU
  HIGH_CPU=$(ps aux | grep "jest-worker" | grep -v grep | awk '{if ($3 > 50) print $2}' | wc -l | tr -d ' ')
  if [ "$HIGH_CPU" -gt 0 ]; then
    echo "   ⚠️  High CPU workers: $HIGH_CPU (may need cleanup)"
  fi
else
  echo "✅ No Jest workers"
fi

if [ "$MCP_COUNT" -gt 3 ]; then
  echo "⚠️  MCP servers: $MCP_COUNT (high, consider cleanup)"
else
  echo "✅ MCP servers: $MCP_COUNT"
fi

echo "======================================"

# Exit with appropriate code
if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ]; then
  echo "✅ System operational"
  exit 0
else
  echo "❌ System unhealthy"
  exit 1
fi
