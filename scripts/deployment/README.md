**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Deployment Scripts

**Purpose:** Production deployment and cleanup utilities
**Last Updated:** 2025-10-30
**Usage:** Run deployment scripts from project root

## Overview

This directory contains scripts for deploying the application to production (Vercel) and performing pre-deployment cleanup.

## Available Tools

### deploy-to-vercel.sh
**Purpose:** Deploy application to Vercel production

**Usage:**
```bash
./scripts/deployment/deploy-to-vercel.sh
```

**What it does:**
1. Runs pre-deployment checks
2. Builds production bundle
3. Deploys to Vercel
4. Verifies deployment success
5. Runs post-deployment smoke tests

**Prerequisites:**
```bash
# Vercel CLI installed
npm install -g vercel

# Authenticated with Vercel
vercel login

# Project linked
vercel link
```

**Deployment process:**
```
1. Pre-deployment checks
   ✓ Git working directory clean
   ✓ All tests passing
   ✓ Build successful
   ✓ Environment variables set

2. Build production
   ✓ Next.js production build
   ✓ Asset optimization
   ✓ Bundle size check

3. Deploy to Vercel
   ✓ Upload build
   ✓ Deploy to production domain
   ✓ Update environment variables

4. Verification
   ✓ Health check endpoints
   ✓ Smoke tests
   ✓ Performance validation
```

**Environment variables required:**
```bash
# In Vercel dashboard or .env.production
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
REDIS_URL=...
```

---

### cleanup-root.sh
**Purpose:** Clean up root directory before deployment

**Usage:**
```bash
./scripts/deployment/cleanup-root.sh
```

**What it cleans:**
- Temporary test files
- Benchmark results
- Debug logs
- Build artifacts not needed in production
- Old migration files
- Cached data

**Files cleaned:**
```
Removed:
- *.json (test results, benchmarks)
- *.log (debug logs)
- .next/cache/* (build cache)
- node_modules/.cache/* (dependency cache)
- /tmp/claude/* (temporary files)

Preserved:
- .env.local (local development)
- .env.production (production config)
- Source code
- Dependencies
- Configuration files
```

**Safe to run:**
- Idempotent (safe to run multiple times)
- Only removes generated/temporary files
- Never removes source code
- Creates backup of important files

**Usage in deployment:**
```bash
# Before deployment
./scripts/deployment/cleanup-root.sh

# Then deploy
./scripts/deployment/deploy-to-vercel.sh
```

---

## Deployment Workflow

### Complete Deployment Process

```bash
# 1. Ensure code is ready
git status  # Should be clean
npm test    # Should pass
npm run build  # Should succeed

# 2. Clean up temporary files
./scripts/deployment/cleanup-root.sh

# 3. Deploy to Vercel
./scripts/deployment/deploy-to-vercel.sh

# 4. Verify deployment
curl https://your-app.vercel.app/api/health

# 5. Run post-deployment tests
npx tsx scripts/tests/test-complete-system.ts
```

### Rollback Procedure

If deployment fails or has issues:

```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy specific version
vercel --prod --force
```

## Environment-Specific Deployments

### Preview Deployments

```bash
# Deploy to preview URL
vercel

# Deploy specific branch
vercel --name=feature-branch
```

### Production Deployments

```bash
# Deploy to production domain
vercel --prod

# With specific environment
vercel --prod --env-file=.env.production
```

## Pre-Deployment Checklist

Before running deployment scripts:

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] API keys rotated (if needed)
- [ ] Changelog updated
- [ ] Git working directory clean
- [ ] Latest changes pulled from main

## Post-Deployment Verification

After deployment completes:

```bash
# 1. Health check
curl https://your-app.vercel.app/api/health

# 2. Test critical endpoints
curl https://your-app.vercel.app/api/chat
curl https://your-app.vercel.app/api/scrape/status

# 3. Run system tests
npx tsx scripts/tests/test-complete-system.ts

# 4. Check error logs
vercel logs --follow

# 5. Monitor performance
# Check Vercel Analytics dashboard
```

## Troubleshooting

### "Build failing on Vercel"
```bash
# Test build locally first
npm run build

# Check build logs
vercel logs

# Verify environment variables
vercel env ls
```

### "Deployment succeeds but app not working"
```bash
# Check runtime logs
vercel logs --follow

# Verify environment variables are set
vercel env pull

# Test API endpoints
curl https://your-app.vercel.app/api/health -v
```

### "cleanup-root.sh removing important files"
```bash
# Review what will be deleted
./scripts/deployment/cleanup-root.sh --dry-run

# Restore from git if needed
git checkout file-that-was-removed
```

## Vercel-Specific Configuration

### Build Configuration

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Environment Variables

Set in Vercel dashboard:
- Production: Used for `vercel --prod`
- Preview: Used for branch deployments
- Development: Used for local development

### Custom Domains

```bash
# Add custom domain
vercel domains add your-domain.com

# Point to deployment
vercel alias your-deployment-url.vercel.app your-domain.com
```

## Deployment Best Practices

1. **Test locally first** - Always build and test before deploying
2. **Deploy during low-traffic** - Minimize user impact
3. **Monitor after deployment** - Watch logs and metrics
4. **Have rollback ready** - Know how to quickly rollback
5. **Incremental deployments** - Deploy small changes frequently
6. **Document changes** - Update changelog and release notes

## Automated Deployments

### GitHub Actions Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: ./scripts/deployment/cleanup-root.sh
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Related Scripts

- **Validation:** `scripts/validation/` - Pre-deployment validation
- **Tests:** `scripts/tests/test-complete-system.ts` - Post-deployment testing

## Related Documentation

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Docker Setup](../../docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Environment Variables](../../.env.example)
- [Main Scripts README](../README.md)
