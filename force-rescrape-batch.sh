#!/bin/bash

echo "🚀 Thompson's eParts BATCH Force Rescrape"
echo "=========================================="
echo ""
echo "Running multiple scraping jobs from different entry points"
echo "to ensure complete site coverage (4,500+ pages)"
echo ""

# Set force rescrape environment
export SCRAPER_FORCE_RESCRAPE_ALL=true

# Check Redis
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Starting Redis..."
    docker-compose up -d redis
    sleep 3
fi

# Entry points for better coverage
ENTRY_POINTS=(
    "https://www.thompsonseparts.co.uk"
    "https://www.thompsonseparts.co.uk/shop"
    "https://www.thompsonseparts.co.uk/product-category/featured-hot-deals/"
    "https://www.thompsonseparts.co.uk/product-category/tipper-trailer-sheeting-systems-spares/"
    "https://www.thompsonseparts.co.uk/product-category/hydraulic-pumps-repair-kits/"
    "https://www.thompsonseparts.co.uk/product-category/hydraulic-cylinders-spares/"
    "https://www.thompsonseparts.co.uk/product-category/hydraulic-valves-spares/"
    "https://www.thompsonseparts.co.uk/product-category/crane-parts/"
    "https://www.thompsonseparts.co.uk/product-category/hydraulic-motors-spares/"
    "https://www.thompsonseparts.co.uk/product-category/tipper-accessories-and-spares/"
)

echo "📋 Starting batch scraping from ${#ENTRY_POINTS[@]} entry points..."
echo ""

# Track all job IDs
JOB_IDS=()

# Start a scraping job for each entry point
for i in "${!ENTRY_POINTS[@]}"; do
    URL="${ENTRY_POINTS[$i]}"
    JOB_ID="batch_rescrape_$(date +%s)_${i}"
    
    echo "Starting job $((i+1))/${#ENTRY_POINTS[@]}: ${URL}"
    echo "  Job ID: ${JOB_ID}"
    
    # Run scraper for this entry point
    node lib/scraper-worker.js \
        "$JOB_ID" \
        "$URL" \
        "1000" \
        "true" \
        "default" \
        "true" \
        "[]" \
        "true" > /dev/null 2>&1 &
    
    PID=$!
    JOB_IDS+=("$JOB_ID")
    
    echo "  Started with PID: $PID"
    
    # Small delay between starts to avoid overwhelming the system
    sleep 2
done

echo ""
echo "✅ All batch jobs started!"
echo ""
echo "📊 Monitor progress with:"
echo ""

for JOB_ID in "${JOB_IDS[@]}"; do
    echo "  redis-cli hget \"crawl:$JOB_ID\" \"stats.scraped\""
done

echo ""
echo "📊 Check overall database stats:"
echo "  npx tsx test-database-cleanup.ts stats"
echo ""
echo "🎯 The batch scraper will process pages from multiple entry points"
echo "   to ensure complete coverage of all 4,500+ pages."