#!/bin/bash

# Test scraper-worker.js with mock environment variables

echo "Testing scraper-worker.js with mock environment variables..."

# Set mock environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://mock-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="mock-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="mock-service-role-key"
export OPENAI_API_KEY="sk-mock-openai-key"
export REDIS_URL="redis://localhost:6379"

# Run the worker with test parameters
JOB_ID="test_job_$(date +%s)"
URL="https://example.com"
MAX_PAGES="2"
TURBO_MODE="true"
CONFIG_PRESET="memoryEfficient"
IS_OWN_SITE="false"

echo "Starting worker with job ID: $JOB_ID"
echo "URL: $URL"
echo "Max pages: $MAX_PAGES"

# Run the worker and capture output
node lib/scraper-worker.js "$JOB_ID" "$URL" "$MAX_PAGES" "$TURBO_MODE" "$CONFIG_PRESET" "$IS_OWN_SITE" 2>&1 | tee worker-test-output.log &

# Get the PID
WORKER_PID=$!

# Wait a bit for initialization
sleep 3

# Check Redis for job status
echo ""
echo "Checking job status in Redis..."
redis-cli hgetall "crawl:$JOB_ID"

# Wait for worker to complete or timeout after 30 seconds
COUNTER=0
while kill -0 $WORKER_PID 2>/dev/null && [ $COUNTER -lt 30 ]; do
    sleep 1
    COUNTER=$((COUNTER + 1))
    echo -n "."
done

echo ""
echo "Final job status:"
redis-cli hgetall "crawl:$JOB_ID"

# Clean up
redis-cli del "crawl:$JOB_ID" > /dev/null
redis-cli del "crawl:$JOB_ID:results" > /dev/null

echo ""
echo "Test complete. Check worker-test-output.log for detailed output."