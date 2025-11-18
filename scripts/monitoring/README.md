**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Production Monitoring System

Track and validate token usage metrics for MCP progressive disclosure (96.2% token savings).

## Quick Start

```bash
npm run monitor:tokens      # Real-time token tracking
npm run monitor:alerts      # Check for anomalies
npm run monitor:report      # Generate weekly report
```

## Scripts

1. **track-token-usage.ts** - Token consumption tracking
   - Period: day/week/month
   - Validates against MCP baselines
   - Output: JSON metrics

2. **check-token-anomalies.ts** - Alert system
   - System prompt validation (180-220 tokens)
   - Tool failure rate monitoring
   - Cost threshold checking
   - Output: Alert reports

3. **generate-weekly-report.ts** - Weekly aggregation
   - Token breakdown analysis
   - Savings validation (MCP vs Traditional)
   - Cost projections
   - Actionable recommendations

4. **dashboard-query.sql** - Analytics queries
   - 10 SQL queries for detailed analysis
   - Token usage patterns
   - Error tracking
   - Cost analysis

## Baselines

- **MCP System Prompt**: 198 tokens
- **MCP Total per Request**: 400 tokens
- **Expected Savings**: 96.2%
- **Traditional System Prompt**: 5200 tokens

## Output

- `logs/monitoring/token-usage-*.json`
- `logs/monitoring/token-alerts-*.json`
- `ARCHIVE/completion-reports-2025-11/WEEKLY_REPORT_*.md`
