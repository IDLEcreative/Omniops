#!/bin/bash
# Cleanup script to prevent runaway processes
# Usage: npm run cleanup:processes

set -e

echo "🧹 Cleaning up processes..."

# 1. Kill runaway Jest workers (running > 5 minutes or > 50% CPU)
echo ""
echo "Checking for runaway Jest workers..."
JEST_PIDS=$(ps aux | grep "jest-worker" | grep -v grep | awk '{if ($3 > 50) print $2}' || true)
if [ -n "$JEST_PIDS" ]; then
  echo "⚠️  Found high-CPU Jest workers: $JEST_PIDS"
  echo "$JEST_PIDS" | xargs kill -9 2>/dev/null || true
  echo "✅ Killed runaway Jest workers"
else
  echo "✅ No runaway Jest workers found"
fi

# 2. Kill duplicate MCP server instances (keep only 1 per type)
echo ""
echo "Checking for duplicate MCP servers..."
MCP_COUNT=$(ps aux | grep "mcp-server-supabase" | grep -v grep | wc -l | tr -d ' ')
if [ "$MCP_COUNT" -gt 2 ]; then
  echo "⚠️  Found $MCP_COUNT MCP server instances (expected 1-2)"
  # Keep the newest one, kill the rest
  ps aux | grep "mcp-server-supabase" | grep -v grep | head -n -2 | awk '{print $2}' | xargs kill 2>/dev/null || true
  echo "✅ Cleaned up duplicate MCP servers"
else
  echo "✅ MCP server count is normal ($MCP_COUNT)"
fi

# 3. Kill orphaned Next.js processes (not the current dev server)
echo ""
echo "Checking for orphaned Next.js processes..."
ORPHANED=$(ps aux | grep "next dev" | grep -v grep | grep -v $$ | wc -l | tr -d ' ')
if [ "$ORPHANED" -gt 0 ]; then
  echo "⚠️  Found $ORPHANED orphaned Next.js processes"
  ps aux | grep "next dev" | grep -v grep | grep -v $$ | awk '{print $2}' | xargs kill 2>/dev/null || true
  echo "✅ Cleaned orphaned processes"
else
  echo "✅ No orphaned processes found"
fi

# 4. Summary
echo ""
echo "======================================"
echo "Process Status:"
echo "======================================"
echo "Jest workers:    $(ps aux | grep "jest-worker" | grep -v grep | wc -l | tr -d ' ')"
echo "MCP servers:     $(ps aux | grep "mcp-server" | grep -v grep | wc -l | tr -d ' ')"
echo "Next.js servers: $(ps aux | grep "next dev" | grep -v grep | wc -l | tr -d ' ')"
echo "======================================"
echo ""
echo "✅ Cleanup complete!"
