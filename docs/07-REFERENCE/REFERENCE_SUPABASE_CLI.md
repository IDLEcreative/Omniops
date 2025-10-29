# Supabase CLI Documentation

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 32 minutes

## Purpose
> Complete guide for using Supabase CLI with the OmniOps project

## Quick Links
- [Table of Contents](#table-of-contents)
- [Installation & Setup](#installation--setup)
- [Core Commands](#core-commands)
- [Database Management](#database-management)
- [TypeScript Types](#typescript-types)

## Keywords
advanced, card, cli, commands, contents, core, database, development, edge, features

---


> Complete guide for using Supabase CLI with the OmniOps project

## Table of Contents
- [Installation & Setup](#installation--setup)
- [Core Commands](#core-commands)
- [Database Management](#database-management)
- [TypeScript Types](#typescript-types)
- [Edge Functions](#edge-functions)
- [Local Development](#local-development)
- [Project-Specific Workflows](#project-specific-workflows)
- [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Prerequisites
- macOS, Linux, or Windows
- Docker Desktop (for local development)
- Node.js 18+ (for Edge Functions)

### Installation

#### macOS (Homebrew) - Recommended
```bash
brew install supabase/tap/supabase
```

#### npm (Cross-platform)
```bash
npm install -g supabase
```

#### Direct Download
Visit: https://github.com/supabase/cli/releases

### Authentication

1. Get your access token from: https://supabase.com/dashboard/account/tokens
2. Set the token:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
# Or login interactively
supabase login
```

### Project Setup

```bash
# Initialize Supabase in your project
supabase init

# Link to existing project
supabase link --project-ref your-project-ref

# For OmniOps
supabase link --project-ref birugqyuqhiahxvxeyqg
```

---

## Core Commands

### Project Management

| Command | Description |
|---------|-------------|
| `supabase projects list` | List all your Supabase projects |
| `supabase projects create` | Create a new project |
| `supabase orgs list` | List organizations |
| `supabase link` | Link local folder to remote project |
| `supabase unlink` | Unlink from remote project |

### Service Control

| Command | Description |
|---------|-------------|
| `supabase start` | Start local Supabase stack |
| `supabase stop` | Stop local Supabase |
| `supabase stop --backup` | Stop and backup local data |
| `supabase status` | Show service status |

---

## Database Management

### Migrations

#### Create a Migration
```bash
# Create new migration file
supabase migration new add_user_profiles

# This creates: supabase/migrations/[timestamp]_add_user_profiles.sql
```

#### Apply Migrations
```bash
# Apply to local database
supabase db reset

# Push to remote database
supabase db push

# Preview changes (dry run)
supabase db push --dry-run
```

#### Pull Remote Schema
```bash
# Pull all remote changes
supabase db pull

# Pull and create migration
supabase db pull --create-migration pulled_changes
```

### Schema Diffing

```bash
# Compare local vs remote
supabase db diff

# Generate migration from diff
supabase db diff --use-migra -f new_migration

# Compare specific schemas
supabase db diff --schema public,auth
```

### Database Operations

```bash
# Reset local database
supabase db reset

# Seed database
supabase db seed

# Run remote database dump
supabase db dump -f dump.sql

# View database logs
supabase db logs
```

### Direct SQL Execution

```bash
# Execute SQL on local database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Using Supabase CLI
supabase db push --include-all
```

---

## TypeScript Types

### Generate Types

```bash
# From remote database
supabase gen types typescript --project-id your-project-id > types/supabase.ts

# From local database
supabase gen types typescript --local > types/supabase.ts

# For OmniOps project
supabase gen types typescript --project-id birugqyuqhiahxvxeyqg > types/supabase.ts
```

### Using Generated Types

```typescript
// Import generated types
import { Database } from '@/types/supabase'

// Type your Supabase client
import { createClient } from '@supabase/supabase-js'
const supabase = createClient<Database>(url, key)

// Automatic type inference
const { data } = await supabase
  .from('customer_configs')
  .select('*')
// data is fully typed!
```

### Other Languages

```bash
# Generate Go types
supabase gen types go --project-id your-project-id

# Generate Swift types  
supabase gen types swift --project-id your-project-id

# Generate Kotlin types
supabase gen types kotlin --project-id your-project-id
```

---

## Edge Functions

### Create & Deploy Functions

```bash
# Create new function
supabase functions new hello-world

# Serve locally (with hot reload)
supabase functions serve hello-world

# Deploy to production
supabase functions deploy hello-world

# Deploy with secrets
supabase functions deploy hello-world --no-verify-jwt
```

### Function Management

```bash
# List all functions
supabase functions list

# Delete function
supabase functions delete hello-world

# View function logs
supabase functions logs hello-world
```

### Environment Variables

```bash
# Set secrets for functions
supabase secrets set MY_SECRET_KEY=secret_value

# List secrets
supabase secrets list

# Remove secret
supabase secrets unset MY_SECRET_KEY
```

### Example Edge Function

```typescript
// supabase/functions/hello-world/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## Local Development

### Local Stack Components

When you run `supabase start`, you get:

| Service | URL | Description |
|---------|-----|-------------|
| **Studio** | http://localhost:54323 | Supabase Dashboard |
| **API** | http://localhost:54321 | REST API |
| **GraphQL** | http://localhost:54321/graphql/v1 | GraphQL API |
| **Auth** | http://localhost:54321/auth/v1 | Authentication |
| **Storage** | http://localhost:54321/storage/v1 | File storage |
| **Realtime** | http://localhost:54321/realtime/v1 | WebSocket |
| **Inbucket** | http://localhost:54324 | Email testing |
| **Database** | localhost:54322 | PostgreSQL |

### Local Environment Variables

```env
# .env.local for local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

### Access Credentials

After `supabase start`, get credentials:
```bash
supabase status
```

### Database Access

```bash
# Connect with psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Connect with any PostgreSQL client
Host: localhost
Port: 54322
Database: postgres
Username: postgres
Password: postgres
```

---

## Project-Specific Workflows

### OmniOps Development Workflow

#### 1. Daily Development Setup
```bash
# Start Docker
open -a "Docker"

# Start local Supabase
supabase start

# Start development server
npm run dev
```

#### 2. After Database Schema Changes
```bash
# Pull remote changes
supabase db pull

# Generate new TypeScript types
source ./scripts/supabase-helpers.sh
generate_types

# Run type checking
npm run typecheck
```

#### 3. Creating New Features

**Example: Adding a new table for chat analytics**
```bash
# Create migration
supabase migration new add_chat_analytics

# Edit the migration file
# supabase/migrations/[timestamp]_add_chat_analytics.sql
```

```sql
-- Create chat analytics table
CREATE TABLE chat_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  session_id text NOT NULL,
  message_count int DEFAULT 0,
  sentiment_score float,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX idx_chat_analytics_domain ON chat_analytics(domain);
CREATE INDEX idx_chat_analytics_created ON chat_analytics(created_at);
```

```bash
# Test locally
supabase db reset

# Generate types
generate_types

# Push to production
supabase db push
```

#### 4. Testing WooCommerce Integration
```bash
# Create test Edge Function
supabase functions new woo-webhook-handler

# Test locally with mock data
supabase functions serve woo-webhook-handler

# Deploy when ready
supabase functions deploy woo-webhook-handler
```

### Helper Scripts Usage

The project includes `scripts/supabase-helpers.sh`:

```bash
# Load helpers
source ./scripts/supabase-helpers.sh

# Available commands
show_commands       # Display all commands
generate_types      # Generate TypeScript types
pull_schema        # Pull remote schema
new_migration NAME # Create new migration
list_migrations    # List all migrations
start_local        # Start local Supabase
stop_local         # Stop local Supabase
```

---

## Troubleshooting

### Common Issues

#### 1. Docker Not Running
```
Error: Cannot connect to Docker daemon
```
**Solution:**
```bash
# macOS
open -a "Docker"

# Linux
sudo systemctl start docker
```

#### 2. Port Already in Use
```
Error: port 54321 already in use
```
**Solution:**
```bash
# Find and kill process
lsof -i :54321
kill -9 [PID]

# Or stop all Supabase services
supabase stop --no-backup
```

#### 3. Authentication Failed
```
Error: Invalid access token format
```
**Solution:**
```bash
# Re-authenticate
supabase login
# Or set token directly
export SUPABASE_ACCESS_TOKEN=sbp_your_new_token
```

#### 4. Migration Conflicts
```
Error: Migration version already exists
```
**Solution:**
```bash
# Pull remote migrations first
supabase db pull

# Reset local database
supabase db reset

# Rename conflicting migration
mv supabase/migrations/old_name.sql supabase/migrations/new_timestamp_name.sql
```

#### 5. Type Generation Fails
```
Error: Failed to generate types
```
**Solution:**
```bash
# Ensure you're authenticated
supabase login

# Use project ID directly
supabase gen types typescript --project-id birugqyuqhiahxvxeyqg > types/supabase.ts
```

### Debug Mode

For any command, add `--debug` for verbose output:
```bash
supabase db push --debug
supabase functions deploy my-function --debug
```

### Getting Help

```bash
# General help
supabase help

# Command-specific help
supabase db push --help
supabase functions deploy --help
```

### Useful Resources

- **Official Docs**: https://supabase.com/docs/guides/cli
- **GitHub**: https://github.com/supabase/cli
- **Discord**: https://discord.supabase.com
- **Status Page**: https://status.supabase.com

---

## Advanced Features

### Database Branching (Pro Feature)

```bash
# Create feature branch
supabase branches create feature/new-chat

# List branches
supabase branches list

# Switch branch
supabase branches switch feature/new-chat

# Delete branch
supabase branches delete feature/new-chat
```

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Deploy Database Changes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - run: supabase db push --project-id ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Performance Monitoring

```bash
# Database statistics
supabase inspect db

# Connection pooling info
supabase inspect db --include-pooler

# Table sizes
supabase inspect db --include-sizes
```

### Backup & Restore

```bash
# Backup remote database
supabase db dump -f backup.sql

# Backup local database
supabase db dump --local -f local-backup.sql

# Restore from backup
psql postgresql://postgres:postgres@localhost:54322/postgres < backup.sql
```

---

## Quick Reference Card

```bash
# 🚀 Start/Stop
supabase start                 # Start local stack
supabase stop                  # Stop local stack

# 🔗 Project
supabase link                  # Link to project
supabase status               # Check status

# 📊 Database
supabase db reset             # Reset local DB
supabase db push              # Deploy migrations
supabase db pull              # Pull remote schema
supabase migration new NAME   # New migration

# 📝 Types
supabase gen types typescript --project-id ID > types/supabase.ts

# ⚡ Functions
supabase functions new NAME   # Create function
supabase functions serve NAME # Test locally
supabase functions deploy NAME # Deploy

# 🔐 Secrets
supabase secrets set KEY=VALUE # Set secret
supabase secrets list          # List secrets
```

---

*Last updated: August 2024*
*Supabase CLI Version: 2.39.2*
