# Process Monitoring & Prevention System

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-30
**Purpose:** Prevent runaway processes, database overload, and environment configuration issues

## Overview

This document describes the automated safeguards to prevent:
- ✅ Runaway Jest test workers (high CPU)
- ✅ Duplicate MCP server instances
- ✅ Orphaned Next.js processes
- ✅ Invalid `.env.local` configuration
- ✅ Supabase connection issues

## Quick Commands

```bash
# Validate environment before starting
npm run validate:env

# Clean up runaway processes
npm run cleanup:processes

# Check application health
npm run monitor:health

# Backup your environment file
npm run backup:env
```

## Automatic Safeguards

### 1. Pre-Dev Validation (`predev` hook)

**Runs automatically before `npm run dev`**

- ✅ Validates `.env.local` format
- ✅ Checks for quoted API keys (common error)
- ✅ Verifies Supabase keys are present
- ✅ Warns about placeholder values

**Location:** [scripts/validate-env.sh](../../scripts/validate-env.sh)

### 2. Pre-Test Cleanup (`pretest` hook)

**Runs automatically before `npm test`**

- ✅ Kills runaway Jest workers (>50% CPU)
- ✅ Cleans up duplicate MCP servers
- ✅ Removes orphaned Next.js processes

**Location:** [scripts/cleanup-processes.sh](../../scripts/cleanup-processes.sh)

### 3. Health Monitoring

**Manual command: `npm run monitor:health`**

Checks:
- ✅ Database connection (Supabase)
- ✅ Redis connection
- ✅ Memory usage
- ✅ High CPU processes
- ✅ Process counts

**Location:** [scripts/monitor-health.sh](../../scripts/monitor-health.sh)

## What Each Script Does

### `validate-env.sh`

**Purpose:** Catch environment configuration issues early

**Checks:**
1. **Quoted API Keys** - Common mistake that breaks authentication
   ```bash
   # ❌ WRONG (quotes included in value)
   SUPABASE_ANON_KEY="eyJ..."

   # ✅ CORRECT
   SUPABASE_ANON_KEY=eyJ...
   ```

2. **Missing Keys** - Ensures required keys are present
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

3. **Placeholder Values** - Warns if example values detected

**Exit Codes:**
- `0` - Validation passed
- `1` - Critical errors found

### `cleanup-processes.sh`

**Purpose:** Prevent database overload from runaway processes

**What it kills:**
1. **Jest Workers** - If CPU > 50%
   - Common cause: Infinite loops in tests
   - Symptom: High Supabase CPU usage

2. **Duplicate MCP Servers** - If count > 2
   - Keeps newest 2 instances
   - Prevents connection pool exhaustion

3. **Orphaned Next.js** - Leftover dev servers
   - Frees up port 3000
   - Prevents memory leaks

**Safe to run:** Yes, doesn't kill current active processes

### `monitor-health.sh`

**Purpose:** Real-time system health check

**What it monitors:**
- **Database:** Connection status, latency
- **Redis:** Connection status (optional)
- **Memory:** Heap usage percentage
- **Processes:** Jest workers, MCP servers

**Exit Codes:**
- `0` - System healthy or degraded (operational)
- `1` - System unhealthy

### `backup-env.sh`

**Purpose:** Prevent accidental loss of API keys

**How it works:**
1. Detects real keys (looks for `eyJ` JWT prefix)
2. Creates timestamped backup in `.env-backups/`
3. Keeps last 10 backups automatically
4. Ignores placeholder values

**Restore from backup:**
```bash
ls -la .env-backups/           # List available backups
cp .env-backups/.env.local.20251030_143122 .env.local
```

## Common Issues & Solutions

### Issue 1: Runaway Jest Process

**Symptoms:**
- High CPU (>90%)
- Supabase dashboard shows high CPU
- Tests running for >5 minutes

**Solution:**
```bash
npm run cleanup:processes
```

**Prevention:** Automatic via `pretest` hook

---

### Issue 2: Multiple MCP Servers

**Symptoms:**
- Multiple `mcp-server-supabase` processes
- Connection errors
- Slow database queries

**Solution:**
```bash
npm run cleanup:processes
```

**Prevention:** Automatic via `pretest` hook

---

### Issue 3: Quoted API Keys in .env.local

**Symptoms:**
- "Invalid API key" errors
- 401 authentication failures
- Database connection fails

**Solution:**
```bash
npm run validate:env  # See what's wrong
# Then edit .env.local to remove quotes
```

**Prevention:** Automatic via `predev` hook

---

### Issue 4: Lost .env.local File

**Symptoms:**
- File replaced with template
- All API keys are placeholders

**Solution:**
```bash
ls -la .env-backups/                      # Find latest backup
cp .env-backups/.env.local.TIMESTAMP .env.local
npm run validate:env                      # Verify it's correct
```

**Prevention:**
- Run `npm run backup:env` after updating keys
- Automatic backups created by backup script

## Continuous Monitoring (Optional)

For long-running development sessions, use continuous monitoring:

```bash
# Watch health status every 30 seconds
watch -n 30 npm run monitor:health

# Or create a simple loop
while true; do
  npm run monitor:health
  sleep 30
done
```

## Integration with Git Hooks

**Recommended:** Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Validate environment before committing
npm run validate:env || {
  echo "❌ Environment validation failed"
  echo "Fix .env.local before committing"
  exit 1
}
```

## Troubleshooting

### Script Won't Execute

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Validation Fails with False Positive

Check the specific error:
```bash
npm run validate:env
# Read the output carefully
# Some warnings are informational only
```

### Cleanup Kills Current Dev Server

This shouldn't happen, but if it does:
- The cleanup script has a bug
- Report the issue with `ps aux` output

## Metrics & Monitoring

**What to watch:**
- Database latency: < 200ms is healthy
- Memory usage: < 90% is safe
- Jest workers: Should be 0 when not testing
- MCP servers: 1-2 is normal

**Red flags:**
- ❌ Database latency > 500ms
- ❌ Memory > 95%
- ❌ Jest workers running when not testing
- ❌ >3 MCP server instances

## See Also

- [Environment Configuration](../00-GETTING-STARTED/SETUP_ENVIRONMENT.md)
- [Health Monitoring API](REFERENCE_API_ENDPOINTS.md#health)
- [Testing Guide](../02-GUIDES/GUIDE_TESTING.md)
