#!/bin/bash

# Monitor the force rescrape progress
JOB_ID="force_rescrape_thompson_1757876390"

echo "📊 Monitoring Force Rescrape Progress"
echo "====================================="
echo ""

while true; do
    clear
    echo "📊 Force Rescrape Monitor - $(date)"
    echo "====================================="
    echo ""
    
    # Get job status from Redis
    STATUS=$(redis-cli hget "crawl:$JOB_ID" "status" 2>/dev/null)
    SCRAPED=$(redis-cli hget "crawl:$JOB_ID" "stats.scraped" 2>/dev/null)
    TOTAL=$(redis-cli hget "crawl:$JOB_ID" "stats.total" 2>/dev/null)
    MEMORY=$(redis-cli hget "crawl:$JOB_ID" "stats.memoryMB" 2>/dev/null)
    CONCURRENCY=$(redis-cli hget "crawl:$JOB_ID" "stats.concurrency" 2>/dev/null)
    SUCCESS_RATE=$(redis-cli hget "crawl:$JOB_ID" "stats.successRate" 2>/dev/null)
    STARTED=$(redis-cli hget "crawl:$JOB_ID" "startedAt" 2>/dev/null)
    
    # Calculate progress percentage
    if [ ! -z "$SCRAPED" ] && [ ! -z "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
        PROGRESS=$(echo "scale=2; $SCRAPED * 100 / $TOTAL" | bc)
        
        # Calculate ETA
        if [ "$SCRAPED" -gt 0 ]; then
            START_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${STARTED%%.*}" "+%s" 2>/dev/null)
            NOW_EPOCH=$(date "+%s")
            if [ ! -z "$START_EPOCH" ]; then
                ELAPSED=$((NOW_EPOCH - START_EPOCH))
                RATE=$(echo "scale=2; $SCRAPED / $ELAPSED" | bc)
                REMAINING=$((TOTAL - SCRAPED))
                ETA_SECONDS=$(echo "scale=0; $REMAINING / $RATE" | bc 2>/dev/null)
                
                if [ ! -z "$ETA_SECONDS" ] && [ "$ETA_SECONDS" -gt 0 ]; then
                    ETA_HOURS=$((ETA_SECONDS / 3600))
                    ETA_MINUTES=$(((ETA_SECONDS % 3600) / 60))
                    ETA="${ETA_HOURS}h ${ETA_MINUTES}m"
                else
                    ETA="Calculating..."
                fi
            else
                ETA="Calculating..."
            fi
        else
            ETA="Calculating..."
        fi
    else
        PROGRESS="0"
        ETA="Calculating..."
    fi
    
    # Display status
    echo "📌 Job ID: $JOB_ID"
    echo "🔄 Status: $STATUS"
    echo ""
    echo "📈 Progress:"
    echo "   Pages Scraped: $SCRAPED / $TOTAL ($PROGRESS%)"
    echo "   Success Rate: $SUCCESS_RATE"
    echo "   ETA: $ETA"
    echo ""
    echo "💾 Performance:"
    echo "   Memory Usage: ${MEMORY}MB"
    echo "   Concurrency: $CONCURRENCY threads"
    echo ""
    
    # Get database stats
    DB_PAGES=$(npx tsx test-database-cleanup.ts stats 2>/dev/null | grep "Scraped Pages:" | awk '{print $3}')
    DB_EMBEDDINGS=$(npx tsx test-database-cleanup.ts stats 2>/dev/null | grep "Embeddings:" | awk '{print $2}')
    
    if [ ! -z "$DB_PAGES" ]; then
        echo "📊 Database Stats:"
        echo "   Total Pages in DB: $DB_PAGES"
        echo "   Total Embeddings: $DB_EMBEDDINGS"
        echo ""
    fi
    
    # Check if completed
    if [ "$STATUS" = "completed" ]; then
        echo "✅ SCRAPING COMPLETED!"
        echo ""
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ SCRAPING FAILED!"
        ERROR=$(redis-cli hget "crawl:$JOB_ID" "error" 2>/dev/null)
        echo "   Error: $ERROR"
        echo ""
        break
    fi
    
    echo "Press Ctrl+C to stop monitoring"
    
    # Wait 10 seconds before next update
    sleep 10
done

echo "Final database statistics:"
npx tsx test-database-cleanup.ts stats