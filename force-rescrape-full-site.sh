#!/bin/bash

echo "🚀 FULL SITE Force Rescrape with Complete Metadata Extraction"
echo "=============================================================="
echo ""
echo "This script will force rescrape the ENTIRE site with:"
echo "  ✅ Complete metadata extraction (brand, category, price, SKU)"
echo "  ✅ Enriched embeddings with product data"
echo "  ✅ Force mode to bypass all caching"
echo "  ✅ Processing ALL 4,500+ pages"
echo ""

# Ensure environment is set up
export SCRAPER_FORCE_RESCRAPE_ALL=true

# Make sure Redis is running
echo "Checking Redis status..."
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Redis is not running. Starting Redis..."
    docker-compose up -d redis
    sleep 3
fi

# Start the development server if not running
echo "Checking if development server is running..."
lsof -i :3000 > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Starting development server..."
    npm run dev > /dev/null 2>&1 &
    sleep 5
fi

echo ""
echo "📋 Starting force rescrape via API..."
echo ""

# Call the scraper API with force flag
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.thompsonseparts.co.uk",
    "maxPages": 10000,
    "turboMode": true,
    "forceRescrape": true,
    "configPreset": "default",
    "isOwnSite": true
  }' | jq '.'

echo ""
echo "✅ Force rescrape job submitted!"
echo ""
echo "📊 To monitor progress:"
echo "   redis-cli --scan --pattern 'crawl:*' | xargs -I {} redis-cli hgetall {}"
echo ""
echo "📊 To check database stats:"
echo "   npx tsx test-database-cleanup.ts stats"
echo ""
echo "🎯 The scraper will process in the background."
echo "   Expected time: 2-3 hours for full 4,500+ pages"