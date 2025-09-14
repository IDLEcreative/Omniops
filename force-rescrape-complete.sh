#!/bin/bash

echo "🚀 COMPLETE Force Rescrape with Enhanced Metadata Extraction"
echo "============================================================"
echo ""
echo "This script will:"
echo "  ✅ Force rescrape ALL pages (ignoring recency checks)"
echo "  ✅ Re-extract all rich metadata (brand, category, price, SKU)"
echo "  ✅ Regenerate all embeddings with enriched content"
echo "  ✅ Process full 4,500+ pages"
echo ""

# Set environment variable for force rescrape
export SCRAPER_FORCE_RESCRAPE_ALL=true

# Make sure Redis is running
echo "Checking Redis status..."
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Redis is not running. Starting Redis..."
    docker-compose up -d redis
    sleep 3
fi

# Generate unique job ID with timestamp
JOB_ID="force_rescrape_complete_$(date +%s)"

echo "📋 Job Configuration:"
echo "   Job ID: $JOB_ID"
echo "   Target URL: https://www.thompsonseparts.co.uk"
echo "   Max pages: 5000 (to ensure all 4,500+ pages)"
echo "   Force rescrape: ENABLED (via env variable)"
echo "   Turbo mode: true (for faster processing)"
echo ""

# Run the scraper with proper parameters
echo "🔄 Starting force rescrape process..."
node lib/scraper-worker.js \
  "$JOB_ID" \
  "https://www.thompsonseparts.co.uk" \
  5000 \
  true \
  default \
  true \
  "[]" \
  true &

PID=$!

echo ""
echo "✅ Force rescrape started successfully!"
echo "   Process ID: $PID"
echo "   Environment: SCRAPER_FORCE_RESCRAPE_ALL=true"
echo ""

# Monitor initial progress
echo "📊 Monitoring initial progress (first 30 seconds)..."
for i in {1..6}; do
  sleep 5
  if ps -p $PID > /dev/null; then
    echo "   [$((i*5))s] Process $PID is running..."
    # Check Redis for job status
    redis-cli hget "crawl:$JOB_ID" "stats.scraped" 2>/dev/null | xargs -I {} echo "   Pages scraped so far: {}"
  else
    echo "   Process completed or stopped"
    break
  fi
done

echo ""
echo "📌 To monitor ongoing progress:"
echo "   redis-cli hgetall \"crawl:$JOB_ID\""
echo ""
echo "📌 To check logs:"
echo "   tail -f logs/scraper.log (if logging is configured)"
echo ""
echo "📌 To check process status:"
echo "   ps aux | grep $PID"
echo ""
echo "🎯 The scraper is now running in the background."
echo "   It will process all 4,500+ pages with full metadata extraction."