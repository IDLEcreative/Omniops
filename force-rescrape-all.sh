#!/bin/bash

echo "🚀 Force Rescraping ALL Thompson's eParts Pages"
echo "================================================"
echo ""

# Set force mode environment variable
export FORCE_RESCRAPE=true

# Run with force flag in correct position
echo "Starting force rescrape with correct parameters..."
node lib/scraper-worker.js \
  "force_rescrape_complete_$(date +%s)" \
  "https://www.thompsonseparts.co.uk" \
  4500 \
  false \
  default \
  true \
  "[]" \
  false &

PID=$!
echo ""
echo "✅ Force rescrape started"
echo "   Process ID: $PID"
echo "   Max pages: 4,500"
echo "   Force mode: ENABLED"
echo ""
echo "Monitoring initial progress..."
sleep 5
ps aux | grep $PID | grep -v grep
