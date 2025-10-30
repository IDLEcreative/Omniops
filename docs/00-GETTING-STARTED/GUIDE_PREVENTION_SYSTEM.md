# 🛡️ Automated Prevention System

**Quick Reference** - Created: 2025-10-30

## What's Protected

✅ **No more runaway Jest processes** (auto-killed before tests)
✅ **No more duplicate MCP servers** (auto-cleanup)
✅ **No more quoted API key errors** (validated before dev)
✅ **No more lost .env.local** (auto-backup with restore)

## Daily Usage

```bash
# Start development (auto-validates env)
npm run dev

# Run tests (auto-cleans processes)
npm test

# Check system health
npm run monitor:health

# Clean up processes manually
npm run cleanup:processes

# Backup environment
npm run backup:env
```

## What Runs Automatically

### Before `npm run dev`:
- ✅ Validates `.env.local` format
- ✅ Checks for quoted API keys
- ✅ Verifies Supabase keys present

### Before `npm test`:
- ✅ Kills runaway Jest workers (>50% CPU)
- ✅ Removes duplicate MCP servers
- ✅ Cleans orphaned processes

## If Problems Happen

### High Supabase CPU
```bash
npm run cleanup:processes
```

### "Invalid API key" error
```bash
npm run validate:env
# Check output for issues
# Edit .env.local to fix
```

### Lost your API keys
```bash
ls -la .env-backups/
cp .env-backups/.env.local.TIMESTAMP .env.local
```

## Files Created

| File | Purpose |
|------|---------|
| `scripts/cleanup-processes.sh` | Kill runaway processes |
| `scripts/validate-env.sh` | Check .env.local format |
| `scripts/monitor-health.sh` | System health check |
| `scripts/backup-env.sh` | Backup environment file |
| `.env-backups/` | Timestamped env backups (last 10 kept) |

## npm Scripts Added

| Command | Runs | When |
|---------|------|------|
| `npm run validate:env` | Validate environment | Manual or pre-dev |
| `npm run cleanup:processes` | Clean processes | Manual or pre-test |
| `npm run monitor:health` | Health check | Manual |
| `npm run backup:env` | Backup environment | Manual |

## Prevention Checklist

**After making changes to `.env.local`:**
- [ ] Run `npm run validate:env`
- [ ] Run `npm run backup:env`
- [ ] Restart dev server

**If system seems slow:**
- [ ] Run `npm run monitor:health`
- [ ] Check Supabase dashboard for CPU
- [ ] Run `npm run cleanup:processes`

**Weekly maintenance:**
- [ ] Run `npm run cleanup:processes`
- [ ] Check `.env-backups/` has recent backups
- [ ] Review process count with `npm run monitor:health`

## Full Documentation

See [docs/07-REFERENCE/REFERENCE_PROCESS_MONITORING.md](docs/07-REFERENCE/REFERENCE_PROCESS_MONITORING.md) for complete details.
