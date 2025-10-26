# Brand Monitoring - Quick Reference

**🚨 CRITICAL: This is a multi-tenant, brand-agnostic system**

## Quick Commands

```bash
# Run code audit
npm run audit:brands

# Monitor logs (real-time)
npm run monitor:logs

# Install pre-commit hook
npx husky add .husky/pre-commit "bash scripts/monitor-brand-references.sh"

# Test audit on specific directory
npx tsx scripts/audit-brand-references.ts
```

## What Gets Monitored

**Brand-Specific Terms (8):**
- thompsonseparts
- Thompson's / Thompsons
- Cifa
- Agri Flip / agri-flip
- A4VTG90 (product SKU)
- K2053463 (product SKU)

## Where It Monitors

1. **Code:** `lib/`, `components/`, `app/api/`
2. **Logs:** Application runtime logs
3. **Commits:** Pre-commit hook (when installed)
4. **CI/CD:** GitHub Actions on PR/push

## When It Runs

| Stage | Tool | Trigger | Action on Violation |
|-------|------|---------|---------------------|
| Development | Audit Script | Manual | Report only |
| Commit | Pre-Commit Hook | `git commit` | Block commit |
| PR/Push | GitHub Actions | Automatic | Fail build |
| Production | Log Monitor | Continuous | Alert team |

## Current Status

**✅ Complete:**
- Real-time log monitor
- Code audit script
- Pre-commit hook template
- CI/CD workflow
- Documentation

**⚠️ Action Required:**
- 18 existing violations need cleanup
- Pre-commit hook needs installation
- Environment variables need configuration

## Violation Examples

### ❌ Wrong (Will be detected)
```typescript
const domain = 'thompsonseparts.co.uk';
const company = "Thompson's E-Parts";
const product = { sku: 'A4VTG90' };
```

### ✅ Right (Brand-agnostic)
```typescript
const domain = process.env.DEFAULT_DOMAIN || 'example.com';
const company = customerConfig.companyName;
const product = { sku: fetchedProduct.sku };
```

## Emergency: Bypass Pre-Commit Hook

**⚠️ Use only for urgent hotfixes:**
```bash
git commit --no-verify -m "Emergency fix"
```

**NOTE:** This bypass will be logged and should be explained in PR.

## Common Issues

**Issue:** "Command not found: npx"
**Fix:** `npm install -g npx` or use `npm run` commands

**Issue:** Pre-commit hook not running
**Fix:** `chmod +x .git/hooks/pre-commit`

**Issue:** Audit script finds false positive
**Fix:** Add pattern to `EXCLUDE_PATTERNS` in `audit-brand-references.ts`

## Quick Links

- Full Documentation: [/docs/MONITORING_SETUP.md](docs/MONITORING_SETUP.md)
- Implementation Report: [/BRAND_MONITORING_IMPLEMENTATION.md](BRAND_MONITORING_IMPLEMENTATION.md)
- CLAUDE.md Guidelines: [/CLAUDE.md](CLAUDE.md)

## Team Contacts

**Questions?** Check documentation first, then reach out to:
- Development Lead: [Your contact]
- DevOps Team: [Your contact]
- On-call: [Your contact]

---

**Remember:** When in doubt, make it configurable. No hardcoded brand data!
