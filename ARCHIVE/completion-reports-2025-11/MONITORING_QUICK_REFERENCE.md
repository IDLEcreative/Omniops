# Monitoring System - Quick Reference

**Version:** 1.0
**Date:** 2025-11-05

## Essential Commands

### Daily Monitoring
```bash
# Check system health and alerts
npm run monitor:alerts
```

### Weekly Analysis
```bash
# Generate comprehensive weekly report
npm run monitor:report

# View weekly token trends
npm run monitor:tokens -- --period=week --verbose
```

### Monthly Deep Dive
```bash
# Full monthly analysis with savings validation
npm run monitor:tokens -- --period=month --save

# Track monthly trend
npm run monitor:tokens -- --period=month --verbose
```

### On-Demand Reports
```bash
# Real-time token tracking (24 hours)
npm run monitor:tokens

# System prompt validation
npm run monitor:alerts -- --verbose

# Specific cost threshold
npm run monitor:alerts -- --threshold=20
```

## Expected Output

### Alert Check
```
✅ Status: HEALTHY
Health Score: 95/100

System Prompt: 198 tokens (within 180-220 range)
Tool Execution: 92.5% success rate
Token Usage: 398 avg (target: ~400)
Daily Cost: $0.06 (under $10 threshold)
Error Rate: 4.2% (under 5% threshold)
```

### Token Report
```
Period: DAY

📊 SUMMARY
Total Requests: 42
Tool Executions: 18

🔢 TOKEN BREAKDOWN
System Prompt: 198 tokens (49.5%)
User Input: 120 tokens (30%)
Output: 82 tokens (20.5%)
Total/Request: 400 tokens

💰 COST ANALYSIS
Daily Cost: $0.0061
Monthly Projection: $0.18

✅ SAVINGS VALIDATION
MCP Tokens: 400
Traditional: 5400
Saved: 5000 tokens (92.6%)
```

### Weekly Report
```
# Weekly Token Usage Report

## Executive Summary
- Total Requests: 294
- Total Messages: 1,847
- Total Cost: $0.0427

## Savings Validation
- MCP Avg: 400 tokens
- Traditional: 5400 tokens
- Savings: 92.59%
- Monthly Projection: $1.87

## Recommendations
✅ System prompt within expected range
✅ Tool execution healthy (>95% success)
✅ Achieving excellent cost savings
```

## Baseline Values

| Metric | MCP | Traditional | Savings |
|--------|-----|-------------|---------|
| System Prompt | 198 tokens | 5200 tokens | 5002 tokens |
| Per Request | 400 tokens | 5400 tokens | 5000 tokens |
| Savings % | - | - | 92-96% |
| Cost/Day | ~$0.06 | ~$1.62 | ~$1.56 |
| Cost/Month | ~$1.80 | ~$48.60 | ~$46.80 |

## Alert Thresholds

| Check | Alert Level | Threshold | Action |
|-------|-------------|-----------|--------|
| System Prompt < 180 | WARNING | < 180 | Review |
| System Prompt > 220 | CRITICAL | > 220 | Investigate |
| Tool Failure Rate | CRITICAL | > 5% | Debug |
| Avg Tokens/Request | WARNING | > 600 | Analyze |
| Daily Cost | WARNING | > $10 | Monitor |
| Error Rate | CRITICAL | > 5% | Fix |

## File Locations

### Monitoring Scripts
- `/scripts/monitoring/track-token-usage.ts`
- `/scripts/monitoring/check-token-anomalies.ts`
- `/scripts/monitoring/generate-weekly-report.ts`
- `/scripts/monitoring/dashboard-query.sql`
- `/scripts/monitoring/README.md`

### Output Files
- `logs/monitoring/token-usage-{period}-{date}.json`
- `logs/monitoring/token-alerts-{date}-{time}.json`
- `ARCHIVE/completion-reports-2025-11/WEEKLY_REPORT_{date}.md`

## Troubleshooting

### No Data
```bash
# Check database connection
npm run monitor:alerts -- --verbose

# Verify Supabase credentials in .env.local
cat .env.local | grep SUPABASE
```

### High Token Count
```bash
# Check system prompt size
npm run monitor:tokens -- --verbose

# Look for error patterns
npm run monitor:alerts -- --verbose
```

### Cost Spike
```bash
# Check tool execution pattern
npm run monitor:tokens -- --period=week --verbose

# Check error rate
npm run monitor:alerts
```

## Automation Setup (Future)

### Daily (7 AM)
```bash
npm run monitor:alerts
```

### Weekly (Monday 8 AM)
```bash
npm run monitor:report
```

### Monthly (1st of month)
```bash
npm run monitor:tokens -- --period=month --save
```

## Success Indicators

System is healthy when:
- [x] System prompt tokens: 180-220 (target: 198)
- [x] Tool success rate: > 95%
- [x] Avg tokens/request: ~400
- [x] Error rate: < 5%
- [x] Daily cost: < $10
- [x] Savings: > 90%

## Contact & Support

For issues:
1. Check README.md in `/scripts/monitoring/`
2. Review baseline values above
3. Run verbose mode: `npm run monitor:alerts -- --verbose`
4. Check Supabase dashboard for data
