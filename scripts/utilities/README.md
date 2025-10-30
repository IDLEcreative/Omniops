# Utility Scripts

**Purpose:** General-purpose utility scripts for various development tasks
**Last Updated:** 2025-10-30
**Usage:** Run utilities from project root

## Overview

This directory contains miscellaneous utility scripts for development, testing, and maintenance tasks that don't fit into other categories.

## Available Tools

### Embedding & Database Utilities

#### check-embeddings.js
**Purpose:** Quick check of embedding status

**Usage:**
```bash
node scripts/utilities/check-embeddings.js
```

#### check-embeddings-domains.js
**Purpose:** Check embeddings across all customer domains

---

#### check-embedding-metadata.js
**Purpose:** Verify embedding metadata is correctly populated

---

#### check-embeddings-fixed.js
**Purpose:** Verify embedding fixes have been applied

---

#### check-embeddings-relationship.js
**Purpose:** Check relationships between embeddings and source pages

---

### Docker Utilities

#### docker-dev.sh
**Purpose:** Docker development environment helper

**Usage:**
```bash
./scripts/utilities/docker-dev.sh [command]
```

**Commands:**
- `start` - Start Docker development environment
- `stop` - Stop Docker services
- `restart` - Restart Docker services
- `logs` - View Docker logs
- `clean` - Clean up Docker resources

---

### Testing Utilities

#### run-agent-tests.sh
**Purpose:** Run agent test suite

**Usage:**
```bash
./scripts/utilities/run-agent-tests.sh
```

---

#### run-agentic-test.sh
**Purpose:** Run agentic behavior tests

**Usage:**
```bash
./scripts/utilities/run-agentic-test.sh
```

---

### Data Management

#### add-metadata.sh
**Purpose:** Add metadata to files in bulk

**Usage:**
```bash
./scripts/utilities/add-metadata.sh [directory]
```

---

#### auto-regenerate-all.sh
**Purpose:** Regenerate all embeddings automatically

**Usage:**
```bash
./scripts/utilities/auto-regenerate-all.sh
```

**⚠️ Warning:** This is resource-intensive and may take hours for large datasets.

---

### Database Utilities

#### check-and-fix-index.js
**Purpose:** Check and fix database indexes

**Usage:**
```bash
node scripts/utilities/check-and-fix-index.js
```

---

#### direct-sql-fix.js
**Purpose:** Quick SQL fixes without migrations

**Usage:**
```bash
node scripts/utilities/direct-sql-fix.js
```

**⚠️ Caution:** Only for emergency fixes. Prefer migrations.

---

#### run-migration.sh
**Purpose:** Run database migration helper

**Usage:**
```bash
./scripts/utilities/run-migration.sh [migration-file]
```

---

### Search & Product Utilities

#### comprehensive-teng-search.ts
**Purpose:** Comprehensive product search testing

**Usage:**
```bash
npx tsx scripts/utilities/comprehensive-teng-search.ts
```

---

#### find-real-teng-products.ts
**Purpose:** Find actual products in database

**Usage:**
```bash
npx tsx scripts/utilities/find-real-teng-products.ts
```

---

#### check-full-scrape-stats.js
**Purpose:** Check statistics for full website scrapes

**Usage:**
```bash
node scripts/utilities/check-full-scrape-stats.js
```

---

#### check-latest-prices.js
**Purpose:** Check latest price data

**Usage:**
```bash
node scripts/utilities/check-latest-prices.js
```

---

### Prompt & AI Utilities

#### implement-simplified-prompt.ts
**Purpose:** Implement simplified AI prompt system

**Usage:**
```bash
npx tsx scripts/utilities/implement-simplified-prompt.ts
```

---

#### prompt-verbosity-summary.ts
**Purpose:** Analyze and summarize prompt verbosity

**Usage:**
```bash
npx tsx scripts/utilities/prompt-verbosity-summary.ts
```

---

### Quick Fixes

#### quick-fix.js
**Purpose:** Quick ad-hoc fixes for common issues

**Usage:**
```bash
node scripts/utilities/quick-fix.js
```

**What it can fix:**
- Missing embeddings
- Orphaned records
- Cache inconsistencies
- Common data issues

**⚠️ Note:** This is a template - edit the script for specific fixes.

---

## Common Workflows

### Full Embedding Regeneration

```bash
# 1. Check current status
node scripts/utilities/check-embeddings.js

# 2. Backup database
# Take Supabase snapshot

# 3. Regenerate all
./scripts/utilities/auto-regenerate-all.sh

# 4. Verify completion
node scripts/utilities/check-embeddings.js
```

### Docker Development Setup

```bash
# 1. Start Docker
./scripts/utilities/docker-dev.sh start

# 2. View logs
./scripts/utilities/docker-dev.sh logs

# 3. If issues, restart
./scripts/utilities/docker-dev.sh restart
```

### Quick Database Fix

```bash
# 1. Identify issue
node scripts/utilities/check-and-fix-index.js

# 2. Apply quick fix
node scripts/utilities/quick-fix.js

# 3. Verify fix
npx tsx scripts/validation/verify-fixes.js
```

## Prerequisites

Scripts in this directory may have varying requirements. Check individual script headers for specific needs.

Common requirements:
```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
REDIS_URL=...
```

## Troubleshooting

### "Script not executable"
```bash
chmod +x scripts/utilities/script-name.sh
```

### "Node module not found"
```bash
npm install  # Ensure all dependencies installed
```

### "Docker command fails"
```bash
# Ensure Docker is running
docker ps

# Or start Docker Desktop
open -a "Docker"
```

## Related Scripts

- **Analysis:** `scripts/analysis/` - Diagnostic tools
- **Monitoring:** `scripts/monitoring/` - System monitoring
- **Database:** `scripts/database/` - Database utilities

## Related Documentation

- [Main Scripts README](../README.md)
- [Docker Setup](../../docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Database Schema](../../docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
