# Scraping Operations Guide

## Quick Start

### Running Your First Scrape

```bash
# 1. Start the development server
npm run dev

# 2. Trigger a scrape via API
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "options": {
      "maxPages": -1,
      "useSitemap": true
    }
  }'
```

## Operational Runbook

### Before Starting a Large Scrape

#### 1. System Health Check
```bash
# Check available memory
free -h

# Check Redis
redis-cli ping

# Check disk space
df -h

# Verify env variables
npm run check:env
```

#### 2. Estimate Scope
```bash
# Check sitemap size
curl -s https://example.com/sitemap.xml | grep -c "<loc>"

# Estimate time (at 150 pages/min)
# 4,439 pages ÷ 150 = ~30 minutes

# Estimate API cost
# 4,439 pages × 10 chunks × $0.00002 = ~$0.89
```

### During Scraping

#### Monitor Progress
```bash
# Watch scraper output
ps aux | grep scraper-worker

# Check memory usage
watch -n 5 'ps aux | grep scraper-worker'

# View real-time logs
tail -f /tmp/scraper-*.log
```

#### Performance Dashboard
```bash
# Create monitoring script
cat > monitor-scrape.sh << 'EOF'
#!/bin/bash
while true; do
  clear
  echo "=== SCRAPING MONITOR ==="
  echo "Time: $(date)"
  echo ""
  echo "Process Info:"
  ps aux | grep scraper-worker | grep -v grep
  echo ""
  echo "Memory Usage:"
  free -m | grep Mem
  echo ""
  echo "Redis Keys:"
  redis-cli dbsize
  sleep 5
done
EOF

chmod +x monitor-scrape.sh
./monitor-scrape.sh
```

### After Scraping

#### Verify Results
```bash
# Check completion
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { count: pages } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .like('url', '%example.com%');
    
  const { count: embeddings } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true });
    
  console.log(\`Pages: \${pages}, Embeddings: \${embeddings}\`);
  console.log(\`Avg chunks per page: \${(embeddings/pages).toFixed(1)}\`);
})();
"
```

## Common Scenarios

### Scenario 1: Full Site Scrape

```javascript
// Full scrape with all optimizations
{
  "domain": "example.com",
  "options": {
    "maxPages": -1,
    "preset": "fast",
    "useSitemap": true,
    "incremental": true
  }
}
```

**Expected Performance:**
- 4,439 pages in ~25-30 minutes
- ~$0.50-1.00 in API costs
- 400-1000MB memory usage

### Scenario 2: Daily Update Scrape

```javascript
// Incremental update - only new/changed content
{
  "domain": "example.com",
  "options": {
    "maxPages": 100,
    "preset": "balanced",
    "incremental": true,
    "modifiedAfter": "2025-01-28"
  }
}
```

**Expected Performance:**
- Only processes changed pages
- Minimal API costs
- 5-10 minute completion

### Scenario 3: Memory-Constrained Environment

```javascript
// Low memory usage configuration
{
  "domain": "example.com",
  "options": {
    "maxPages": -1,
    "preset": "memory-efficient",
    "concurrency": 2
  }
}
```

**Expected Performance:**
- Slower but stable
- <500MB memory usage
- No OOM errors

## Performance Tuning

### Speed Optimization

```javascript
// Maximum speed configuration
const fastConfig = {
  maxConcurrency: 12,
  requestHandlerTimeoutSecs: 15,
  navigationTimeoutSecs: 10,
  maxRequestRetries: 1,
  batchSize: 100  // For embeddings
};
```

### Cost Optimization

```javascript
// Minimum API calls configuration
const costConfig = {
  incremental: true,
  deduplication: true,
  batchSize: 50,
  skipExisting: true,
  contentOnly: true  // Skip metadata extraction
};
```

### Reliability Optimization

```javascript
// Maximum reliability configuration
const reliableConfig = {
  maxConcurrency: 3,
  requestHandlerTimeoutSecs: 60,
  maxRequestRetries: 3,
  autoscaledPoolOptions: {
    desiredConcurrency: 2
  }
};
```

## Troubleshooting Guide

### Issue: Scraper Stops Unexpectedly

**Diagnosis:**
```bash
# Check if process is still running
ps aux | grep scraper-worker

# Check error logs
grep ERROR /tmp/scraper-*.log

# Check Redis for job status
redis-cli get "scrape:crawl_*"
```

**Solutions:**
1. Memory overflow → Reduce concurrency
2. Network timeout → Increase timeout values
3. Rate limiting → Use respectful preset

### Issue: Slow Performance

**Diagnosis:**
```bash
# Check current speed
tail -100 /tmp/scraper-*.log | grep "Progress:" | tail -10

# Calculate pages per minute
# (Latest page number - Earlier page number) / Time elapsed
```

**Solutions:**
1. Increase concurrency (if memory allows)
2. Use fast preset
3. Ensure resource blocking is enabled
4. Check network latency

### Issue: High Memory Usage

**Diagnosis:**
```bash
# Monitor memory
watch -n 1 'ps aux | grep scraper-worker'

# Check for memory leaks
node --expose-gc scraper-worker.js
```

**Solutions:**
1. Reduce concurrency
2. Enable aggressive GC
3. Use memory-efficient preset
4. Process in smaller batches

### Issue: Duplicate Content

**Diagnosis:**
```bash
# Run deduplication check
npm run check:dedup-stats

# Find duplicate embeddings
node scripts/check-dedup-stats.js
```

**Solutions:**
1. Run deduplication script
2. Clear Redis cache
3. Verify deduplicator is enabled

## Maintenance Procedures

### Weekly Maintenance

```bash
#!/bin/bash
# Weekly maintenance script

echo "Starting weekly maintenance..."

# 1. Clean old logs
find /tmp -name "scraper-*.log" -mtime +7 -delete

# 2. Check for duplicates
npm run check:dedup-stats

# 3. Optimize database
echo "VACUUM ANALYZE;" | psql $DATABASE_URL

# 4. Clear old Redis keys
redis-cli --scan --pattern "scrape:*" | xargs redis-cli del

echo "Maintenance complete!"
```

### Monthly Maintenance

```bash
#!/bin/bash
# Monthly maintenance script

echo "Starting monthly maintenance..."

# 1. Full deduplication
npm run deduplicate

# 2. Reindex old content
node scripts/reindex-old-content.js

# 3. Generate performance report
node scripts/generate-performance-report.js

# 4. Update sitemap cache
redis-cli del "sitemap:*"

echo "Monthly maintenance complete!"
```

## Emergency Procedures

### Emergency Stop

```bash
# Kill all scraper processes
pkill -f scraper-worker

# Clear Redis queue
redis-cli del "scrape:*"

# Mark jobs as failed
redis-cli set "scrape:emergency_stop" "$(date)"
```

### Recovery from Crash

```bash
# 1. Check last successful state
redis-cli get "scrape:last_checkpoint"

# 2. Resume from checkpoint
node scripts/resume-scrape.js --from-checkpoint

# 3. Verify data integrity
npm run verify:data
```

### Rollback Procedure

```bash
# 1. Stop current scraping
pkill -f scraper-worker

# 2. Restore from backup
pg_restore -d $DATABASE_URL backup.dump

# 3. Clear Redis
redis-cli FLUSHDB

# 4. Restart services
npm run dev
```

## Performance Benchmarks

### Baseline Performance (No Optimizations)
| Metric | Value |
|--------|-------|
| Speed | 50-60 pages/min |
| Memory | 800-1000MB |
| API Calls | 15-20 per page |
| Cost | $0.003 per page |

### Current Performance (With Optimizations)
| Metric | Value |
|--------|-------|
| Speed | 150-200 pages/min |
| Memory | 400-600MB |
| API Calls | 0.3 per page |
| Cost | $0.0001 per page |

### Performance by Site Type

| Site Type | Pages/min | Optimal Preset |
|-----------|-----------|----------------|
| Static HTML | 200-250 | fast |
| React SPA | 100-150 | balanced |
| E-commerce | 80-120 | balanced |
| News sites | 150-200 | fast |
| Forums | 50-80 | respectful |

## Monitoring & Alerting

### Key Metrics to Monitor

```javascript
const metrics = {
  // Performance
  pagesPerMinute: 150,      // Alert if <50
  successRate: 0.95,        // Alert if <0.90
  avgResponseTime: 3000,    // Alert if >10000ms
  
  // Resources
  memoryUsage: 600,         // Alert if >1500MB
  cpuUsage: 0.7,           // Alert if >0.9
  
  // Costs
  apiCallsPerPage: 0.3,    // Alert if >1.0
  costPerPage: 0.0001,     // Alert if >0.001
};
```

### Setting Up Alerts

```bash
# Create alert script
cat > check-scraper-health.sh << 'EOF'
#!/bin/bash

# Check if scraper is running
if ! pgrep -f scraper-worker > /dev/null; then
  echo "ALERT: Scraper not running!"
  # Send notification (email, Slack, etc.)
fi

# Check memory usage
MEM=$(ps aux | grep scraper-worker | awk '{print $4}')
if (( $(echo "$MEM > 75" | bc -l) )); then
  echo "ALERT: High memory usage: ${MEM}%"
fi

# Check error rate
ERRORS=$(grep -c ERROR /tmp/scraper-*.log 2>/dev/null || echo 0)
if [ $ERRORS -gt 10 ]; then
  echo "ALERT: High error rate: $ERRORS errors"
fi
EOF

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /path/to/check-scraper-health.sh
```

---

*Last Updated: January 2025*
*Version: 2.0*