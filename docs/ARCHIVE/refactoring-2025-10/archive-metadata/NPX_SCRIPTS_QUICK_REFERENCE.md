# NPX Scripts Quick Reference

**Last Updated:** 2025-10-25
**Status:** ✅ All scripts production-ready

---

## Database Cleanup (`test-database-cleanup.ts`)

### Common Commands

```bash
# Check what's in the database
npx tsx test-database-cleanup.ts stats

# Preview cleanup (safe)
npx tsx test-database-cleanup.ts clean --dry-run

# Clean specific domain
npx tsx test-database-cleanup.ts clean --domain=example.com

# Clean everything (use with caution!)
npx tsx test-database-cleanup.ts clean
```

### When to Use

- Before re-scraping a website
- When embeddings seem outdated
- After major domain changes
- Database cleanup/maintenance

### Performance

- **Stats:** ~2 seconds
- **Dry-run:** ~4 seconds
- **Clean:** ~5 seconds + 3s confirmation

---

## Embeddings Health (`monitor-embeddings-health.ts`)

### Common Commands

```bash
# Check embeddings health
npx tsx monitor-embeddings-health.ts check

# Fix issues automatically
npx tsx monitor-embeddings-health.ts auto

# Continuous monitoring (every 5 min)
npx tsx monitor-embeddings-health.ts watch

# Check specific domain
npx tsx monitor-embeddings-health.ts check --domain=example.com
```

### When to Use

- Weekly health checks
- After scraping operations
- When search quality degrades
- Production monitoring

### Health Metrics

- **Coverage:** Should be 90%+
- **Staleness:** Embeddings > 90 days old
- **Missing:** Pages without embeddings
- **Average Age:** Mean embedding age

### Performance

- **Check:** ~2 seconds
- **Auto:** ~2-10 seconds (depends on issues)
- **Watch:** Continuous (configurable interval)

---

## Hallucination Prevention (`test-hallucination-prevention.ts`)

### Common Commands

```bash
# PREREQUISITE: Start dev server
npm run dev

# Run full test suite (10 tests)
npx tsx test-hallucination-prevention.ts

# Test specific category
npx tsx test-hallucination-prevention.ts --category=pricing

# Verbose output (show full responses)
npx tsx test-hallucination-prevention.ts --verbose

# Test specific domain
npx tsx test-hallucination-prevention.ts --domain=example.com
```

### When to Use

- After changing chat prompts
- Before production deployments
- When AI responses seem wrong
- Regular quality assurance

### Test Categories

- `specs` - Technical specifications
- `compatibility` - Product compatibility
- `stock` - Stock availability
- `delivery` - Delivery times
- `pricing` - Price comparisons/discounts
- `installation` - Installation instructions
- `warranty` - Warranty information
- `origin` - Product origin/manufacturing
- `alternatives` - Alternative products

### Performance

- **Single category:** ~40 seconds
- **Full suite (10 tests):** ~2 minutes
- **Per test:** 12-23 seconds

### Known Issues

⚠️ **"alternatives" category:** 1 failing test (AI suggests alternatives without compatibility data)
- **Impact:** Low - known issue
- **Fix:** Prompt refinement needed in `app/api/chat/route.ts`

---

## Troubleshooting

### "Development server not running"

```bash
# Start server
npm run dev

# Verify it's running
curl http://localhost:3000/api/health
```

### "Domain not found"

```bash
# List available domains
npx tsx test-database-cleanup.ts stats

# Use exact domain name
npx tsx test-database-cleanup.ts stats --domain=thompsonseparts.co.uk
```

### Deprecation Warnings

```bash
# Filter warnings (cosmetic only)
npx tsx script.ts 2>&1 | grep -v "DeprecationWarning"
```

### Slow Performance

```bash
# For hallucination tests, use categories
npx tsx test-hallucination-prevention.ts --category=pricing

# Instead of full suite
npx tsx test-hallucination-prevention.ts
```

---

## Safety Features

### Database Cleanup

✅ **Safe:**
- `stats` - Read-only
- `--dry-run` - Preview only
- 3-second countdown before deletion
- Domain-specific targeting

⚠️ **Use Caution:**
- `clean` without `--dry-run`
- `clean` without `--domain` (affects ALL domains)

### Embeddings Health

✅ **Safe:**
- `check` - Read-only
- `auto` - Only generates missing data

⚠️ **Use Caution:**
- `watch` - Continuous operation (uses resources)

### Hallucination Prevention

✅ **Safe:**
- All operations are read-only tests
- No data modification
- No production API calls (uses dev server)

---

## Best Practices

### Daily/Weekly Tasks

```bash
# Monday morning health check
npx tsx monitor-embeddings-health.ts check

# Check database stats
npx tsx test-database-cleanup.ts stats
```

### Before Production Deploy

```bash
# Start dev server
npm run dev

# Run hallucination tests
npx tsx test-hallucination-prevention.ts

# Check embeddings health
npx tsx monitor-embeddings-health.ts check
```

### After Scraping

```bash
# Verify embeddings were generated
npx tsx monitor-embeddings-health.ts check --domain=example.com

# Fix any issues
npx tsx monitor-embeddings-health.ts auto --domain=example.com
```

### Database Maintenance

```bash
# Check current state
npx tsx test-database-cleanup.ts stats

# Preview cleanup
npx tsx test-database-cleanup.ts clean --dry-run

# Clean specific domain
npx tsx test-database-cleanup.ts clean --domain=old-domain.com
```

---

## Output Examples

### Database Stats

```
📊 Database Statistics
==================================================
Domain: thompsonseparts.co.uk

Records:
  Scraped pages:          4,491
  Website content:        3
  Embeddings:             20,229
  Structured extractions: 34
  Scrape jobs:            2
  Query cache:            0

Total records:            24,757
==================================================
```

### Embeddings Health

```
📦 thompsonseparts.co.uk
──────────────────────────────────────────────────
  Total pages:          4,491
  Total embeddings:     20,229
  Coverage:             100.0% ✅
  Missing embeddings:   0
  Stale embeddings:     0
  Average age:          35.9 days

  ✅ No issues detected
```

### Hallucination Test

```
📊 TEST SUMMARY

Total Tests:              2
Passed:                   2 (100.0%)
Failed:                   0 (0.0%)
Hallucinations Detected:  0
Average Response Time:    18794ms

🎉 SUCCESS: All hallucination prevention tests passed!
```

---

## Performance Benchmarks

| Script | Operation | Time | Records | Performance |
|--------|-----------|------|---------|-------------|
| cleanup | stats | 1.9s | 24,757 | ⚡ Excellent |
| cleanup | dry-run | 3.8s | 24,757 | ⚡ Excellent |
| embeddings | check | 2.0s | 20,229 | ⚡ Excellent |
| embeddings | auto | 2.0s | 0 issues | ⚡ Excellent |
| hallucination | category | 39s | 2 tests | ✅ Good |
| hallucination | full suite | 128s | 10 tests | ⚠️ Acceptable |

---

## Integration with Other Tools

### With Git

```bash
# Before committing prompt changes
npx tsx test-hallucination-prevention.ts

# Clean test data before PR
npx tsx test-database-cleanup.ts clean --domain=test-domain.com
```

### With CI/CD

```bash
# Add to GitHub Actions
- run: npx tsx monitor-embeddings-health.ts check
- run: npx tsx test-hallucination-prevention.ts
```

### With Cron Jobs

```bash
# Daily health check (crontab)
0 9 * * * cd /path/to/omniops && npx tsx monitor-embeddings-health.ts check
```

---

## When NOT to Use

### Database Cleanup

❌ **Don't use if:**
- You need the data
- Domain is still active
- No backup exists
- You're not sure

### Embeddings Health

❌ **Don't use auto if:**
- You haven't checked first
- OpenAI API is down
- You're over API quota

### Hallucination Prevention

❌ **Don't use if:**
- Dev server isn't running
- You're in production
- Network is unstable
- OpenAI API is down

---

## Quick Checklist

### Before Running Any Script

- [ ] Read the help: `script.ts --help`
- [ ] Know what it does
- [ ] Check prerequisites
- [ ] Have backups (if destructive)

### For Database Cleanup

- [ ] Run `stats` first
- [ ] Use `--dry-run` to preview
- [ ] Target specific domain if possible
- [ ] Confirm you want to delete

### For Embeddings Health

- [ ] Run `check` before `auto`
- [ ] Review health metrics
- [ ] Only auto-fix if needed
- [ ] Monitor coverage metric

### For Hallucination Tests

- [ ] Dev server running on port 3000
- [ ] OpenAI API key configured
- [ ] Enough quota for API calls
- [ ] Time for 2-minute full suite

---

## Support

### Documentation

- **Full Test Report:** `NPX_SCRIPTS_TEST_REPORT.md`
- **Implementation Details:** `NPX_SCRIPTS_IMPLEMENTATION.md`
- **Main README:** `CLAUDE.md`

### Common Questions

**Q: How often should I run health checks?**
A: Daily for production, weekly for development

**Q: Can I run cleanup without dry-run?**
A: Yes, but you'll get a 3-second confirmation prompt

**Q: Why are hallucination tests slow?**
A: Each test makes real OpenAI API calls (12-23s each)

**Q: What if embeddings health shows issues?**
A: Run `auto` to fix missing/stale embeddings

**Q: Can I automate these scripts?**
A: Yes, all are CI/CD and cron-job friendly

---

**For detailed information, see:** `NPX_SCRIPTS_TEST_REPORT.md`
