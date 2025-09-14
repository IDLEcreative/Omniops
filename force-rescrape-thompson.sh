#!/bin/bash

echo "🚀 Thompson's eParts COMPLETE Force Rescrape"
echo "============================================="
echo ""
echo "This will force rescrape ALL pages with:"
echo "  ✅ Full metadata extraction (brand, category, price, SKU)"
echo "  ✅ Regenerated embeddings with enriched content"
echo "  ✅ Processing ALL 4,500+ pages"
echo "  ✅ Force mode bypassing all cache checks"
echo ""

# Set environment variable to force rescrape globally
export SCRAPER_FORCE_RESCRAPE_ALL=true

# Check Redis
echo "Checking Redis..."
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Starting Redis..."
    docker-compose up -d redis
    sleep 3
fi

# Generate unique job ID
JOB_ID="force_rescrape_thompson_$(date +%s)"

echo "📋 Configuration:"
echo "   Job ID: $JOB_ID"
echo "   URL: https://www.thompsonseparts.co.uk"
echo "   Max pages: 10000 (to ensure all pages)"
echo "   Force rescrape: TRUE (both env and parameter)"
echo "   Turbo mode: true"
echo ""

# Run the scraper worker directly with correct parameters
# Based on the scraper-api.ts code, the parameters are:
# 1. jobId
# 2. url
# 3. maxPages
# 4. turboMode
# 5. configPreset
# 6. isOwnSite
# 7. sitemapUrls (JSON array)
# 8. forceRescrape

echo "🔄 Starting force rescrape..."
node lib/scraper-worker.js \
  "$JOB_ID" \
  "https://www.thompsonseparts.co.uk" \
  "10000" \
  "true" \
  "default" \
  "true" \
  "[]" \
  "true" &

PID=$!

echo ""
echo "✅ Force rescrape started!"
echo "   Process ID: $PID"
echo "   Force mode: ENABLED (env + parameter)"
echo ""

# Monitor progress
echo "📊 Initial monitoring (30 seconds)..."
for i in {1..6}; do
  sleep 5
  if ps -p $PID > /dev/null; then
    echo "   [$((i*5))s] Process running..."
    # Check job status in Redis
    SCRAPED=$(redis-cli hget "crawl:$JOB_ID" "stats.scraped" 2>/dev/null)
    TOTAL=$(redis-cli hget "crawl:$JOB_ID" "stats.total" 2>/dev/null)
    if [ ! -z "$SCRAPED" ]; then
      echo "   Progress: $SCRAPED pages scraped"
    fi
  else
    echo "   Process completed or stopped"
    break
  fi
done

echo ""
echo "📌 Monitor commands:"
echo "   Watch progress:  watch 'redis-cli hgetall \"crawl:$JOB_ID\"'"
echo "   Check process:   ps aux | grep $PID"
echo "   View stats:      npx tsx test-database-cleanup.ts stats"
echo "   View logs:       tail -f logs/scraper.log"
echo ""
echo "🎯 The scraper is running in background."
echo "   It will process ALL pages with full metadata extraction."
echo "   Expected time: 2-4 hours for 4,500+ pages"