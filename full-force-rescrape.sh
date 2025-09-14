#!/bin/bash

echo "🚀 Starting COMPLETE Force Rescrape (All 4,465 pages)"
echo "======================================================"
echo ""

# Start the scraper with a high page limit
echo "Launching scraper for ALL pages..."
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.thompsonseparts.co.uk",
    "maxPages": 4500,
    "force": true
  }' 2>/dev/null

echo ""
echo "✅ Force rescrape initiated for up to 4,500 pages"
echo ""
echo "Monitor progress with:"
echo "  ps aux | grep scraper-worker"
echo "  Or check the logs in the dev server"
