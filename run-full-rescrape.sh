#!/bin/bash

echo "🚀 Starting COMPLETE Force Rescrape of Thompson's eParts"
echo "========================================================"
echo ""
echo "Target: 4,500+ pages"
echo "Mode: Force rescrape with metadata extraction"
echo ""

# Run the scraper directly
echo "Starting scraper-worker directly..."
node lib/scraper-worker.js \
  force_rescrape_thompsons_complete \
  "https://www.thompsonseparts.co.uk" \
  4500 \
  true \
  default \
  false \
  "[]" \
  false &

echo ""
echo "✅ Scraper worker launched for 4,500 pages"
echo "Process ID: $!"
echo ""
echo "Monitor with: ps aux | grep scraper-worker"
