# Monitoring Scripts

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md), [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md), [Main Scripts README](/home/user/Omniops/scripts/README.md)
**Estimated Read Time:** 3 minutes

## Purpose

Real-time system health and performance monitoring tools including embeddings health, WooCommerce integration status, database performance benchmarking, and production load simulation.

## Quick Links

- [Main Scripts README](/home/user/Omniops/scripts/README.md)
- [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Analysis Tools](/home/user/Omniops/scripts/analysis/README.md)

## Keywords

monitoring, health checks, performance, metrics, embeddings, WooCommerce, real-time, alerts, benchmarking, load simulation

## Production Monitoring System

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

## Available Tools

### monitor-embeddings-health.ts
**Purpose:** Monitor embedding generation health and auto-maintenance

**Usage:**
```bash
npx tsx scripts/monitoring/monitor-embeddings-health.ts check  # Run health check
npx tsx scripts/monitoring/monitor-embeddings-health.ts auto   # Auto-maintenance mode
npx tsx scripts/monitoring/monitor-embeddings-health.ts watch  # Continuous monitoring
```

### monitor-woocommerce.ts
**Purpose:** Monitor WooCommerce integration status

**Usage:**
```bash
npx tsx scripts/monitoring/monitor-woocommerce.ts
```

### benchmark-database-improvements.ts
**Purpose:** Benchmark database optimizations and improvements

**Usage:**
```bash
npx tsx scripts/monitoring/benchmark-database-improvements.ts
```

### simulate-production-conversations.ts
**Purpose:** Simulate production load for testing

**Usage:**
```bash
npx tsx scripts/monitoring/simulate-production-conversations.ts
```

## Related Scripts

- **Analysis:** `scripts/analysis/` - Diagnostic tools
- **Benchmarks:** `scripts/benchmarks/` - Performance benchmarking
- **Tests:** `scripts/tests/` - System verification

## Related Documentation

- [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Main Scripts README](/home/user/Omniops/scripts/README.md)
