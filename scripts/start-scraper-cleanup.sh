#!/bin/bash

# Scraper Auto-Cleanup Service Startup Script

echo "🚀 Starting Scraper Auto-Cleanup Service..."

# Check if cleanup is already running
if pgrep -f "scraper-cleanup.ts watch" > /dev/null; then
    echo "⚠️  Auto-cleanup service is already running"
    echo "To stop it, run: pkill -f 'scraper-cleanup.ts watch'"
    exit 1
fi

# Start the cleanup service in the background
nohup npx tsx scripts/scraper-cleanup.ts watch > scraper-cleanup.log 2>&1 &
CLEANUP_PID=$!

echo "✅ Auto-cleanup service started with PID: $CLEANUP_PID"
echo "📝 Logs are being written to: scraper-cleanup.log"
echo ""
echo "To monitor: tail -f scraper-cleanup.log"
echo "To stop: kill $CLEANUP_PID"
echo ""
echo "The service will:"
echo "  • Check for stale jobs every 15 minutes"
echo "  • Kill jobs running longer than 2 hours"
echo "  • Clean up orphaned jobs with dead workers"
echo "  • Remove jobs using excessive memory (>1GB)"
echo "  • Delete completed/failed jobs older than 30 days"

# Save PID to file for easy stopping later
echo $CLEANUP_PID > scraper-cleanup.pid
echo "PID saved to: scraper-cleanup.pid"