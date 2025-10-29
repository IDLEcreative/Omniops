# Quick NPX Scripts Reference

**Last Updated:** October 24, 2025

## Essential Scripts

### 🧹 Database Cleanup
```bash
# View statistics
npx tsx test-database-cleanup.ts stats
npx tsx test-database-cleanup.ts stats --domain=example.com

# Clean data (with 3-second countdown)
npx tsx test-database-cleanup.ts clean
npx tsx test-database-cleanup.ts clean --domain=example.com

# Dry run (preview only)
npx tsx test-database-cleanup.ts clean --dry-run
```

### 🏥 Embeddings Health
```bash
# Check health
npx tsx monitor-embeddings-health.ts check
npx tsx monitor-embeddings-health.ts check --domain=example.com

# Auto-fix issues
npx tsx monitor-embeddings-health.ts auto

# Continuous monitoring (every 5 minutes)
npx tsx monitor-embeddings-health.ts watch
npx tsx monitor-embeddings-health.ts watch --interval=60
```

### 🧪 Quality Assurance
```bash
# Prerequisites: npm run dev (server must be running)

# Run all hallucination tests
npx tsx test-hallucination-prevention.ts

# Verbose output
npx tsx test-hallucination-prevention.ts --verbose

# Test specific category
npx tsx test-hallucination-prevention.ts --category=pricing

# Test different domain
npx tsx test-hallucination-prevention.ts --domain=example.com
```

## Common Workflows

### Fresh Re-scrape
```bash
# 1. Check what will be deleted
npx tsx test-database-cleanup.ts stats --domain=example.com

# 2. Preview cleanup
npx tsx test-database-cleanup.ts clean --domain=example.com --dry-run

# 3. Execute cleanup
npx tsx test-database-cleanup.ts clean --domain=example.com

# 4. Trigger new scrape
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "domain": "example.com"}'
```

### Health Check & Maintenance
```bash
# 1. Check current health
npx tsx monitor-embeddings-health.ts check

# 2. Fix detected issues
npx tsx monitor-embeddings-health.ts auto

# 3. Start continuous monitoring
npx tsx monitor-embeddings-health.ts watch
```

### After Chat Prompt Changes
```bash
# 1. Start dev server (if not running)
npm run dev

# 2. Run hallucination tests
npx tsx test-hallucination-prevention.ts

# 3. If tests pass, commit changes
git add app/api/chat/route.ts
git commit -m "Update chat prompts - tests passing"
```

## Help Commands

All scripts have built-in help:
```bash
npx tsx test-database-cleanup.ts help
npx tsx monitor-embeddings-health.ts help
npx tsx test-hallucination-prevention.ts help
```

## Environment Requirements

All scripts require:
```bash
NEXT_PUBLIC_SUPABASE_URL          # Supabase URL
SUPABASE_SERVICE_ROLE_KEY         # Service role key
```

Hallucination tests also require:
```bash
OPENAI_API_KEY                    # OpenAI API key
```

## Quick Checks

### Is everything healthy?
```bash
# Check database stats
npx tsx test-database-cleanup.ts stats

# Check embeddings health
npx tsx monitor-embeddings-health.ts check

# If dev server is running, test AI quality
npx tsx test-hallucination-prevention.ts
```

### Something wrong?
```bash
# Clean and restart
npx tsx test-database-cleanup.ts clean --domain=problem-domain.com

# Check health after cleanup
npx tsx monitor-embeddings-health.ts check --domain=problem-domain.com
```

## Status Indicators

Scripts use emoji for quick status recognition:

- ✅ Success / Passed / No issues
- ❌ Error / Failed / Problem detected
- ⚠️  Warning / Attention needed
- 🔧 Maintenance / Fixing
- 📊 Statistics / Metrics
- 🏥 Health check
- 🧹 Cleanup operation
- 🧪 Testing

## Related Documentation

- **Detailed Implementation:** `NPX_SCRIPTS_IMPLEMENTATION.md`
- **Main Config:** `CLAUDE.md` (Key Commands section)
- **Database Cleanup:** `docs/DATABASE_CLEANUP.md`
- **Hallucination Prevention:** `docs/02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md`
- **All NPX Tools:** `docs/NPX_TOOLS_GUIDE.md`

---

**For comprehensive documentation, see:** `NPX_SCRIPTS_IMPLEMENTATION.md`
