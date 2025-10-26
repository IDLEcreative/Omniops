# Brand Reference Monitoring Setup

## Overview
Automated monitoring to detect hardcoded brand references in production code, logs, and commits. This ensures the system remains fully brand-agnostic for multi-tenant use.

## Why This Matters

This is a **multi-tenant, brand-agnostic system**. Any hardcoded brand references will:
- Break the system for other tenants
- Violate the multi-tenant architecture
- Create maintenance nightmares
- Reduce system flexibility

**All business-specific data MUST come from the database configuration, NOT from code.**

## Scripts

### 1. Real-Time Log Monitor

Monitors application logs in real-time for brand references.

**Usage:**
```bash
# Start monitoring (default log file)
./scripts/monitor-brand-references.sh

# Monitor specific log file
./scripts/monitor-brand-references.sh /var/log/app.log

# With email alerts
BRAND_ALERT_EMAIL="alerts@company.com" ./scripts/monitor-brand-references.sh
```

**Features:**
- Real-time log monitoring with `tail -f`
- Color-coded console output
- Optional email alerts
- Monitors for 8+ brand-specific terms

**Monitored Terms:**
- thompsonseparts
- Thompson's / Thompsons
- Cifa
- Agri Flip / agri-flip
- A4VTG90 (product SKU)
- K2053463 (product SKU)

### 2. Code Audit Script

Scans production code for hardcoded brand references.

**Usage:**
```bash
# Run full audit
npx tsx scripts/audit-brand-references.ts

# Add to package.json scripts
npm run audit:brands
```

**Features:**
- Scans `lib/`, `components/`, `app/api/` directories
- Categorizes violations by severity (critical/warning)
- Excludes test files, documentation, deprecated code
- Exit code 1 if critical violations found (CI/CD friendly)

**Severity Levels:**
- **Critical**: Brand names (Thompson's, Cifa, Agri Flip)
- **Warning**: Product SKUs (A4VTG90, K2053463)

**Output Example:**
```
======================================================================
📊 BRAND REFERENCE AUDIT REPORT
======================================================================

🔴 Critical Violations: 2
🟡 Warnings: 1
📊 Total: 3

🔴 CRITICAL VIOLATIONS:

  File: lib/some-file.ts:42
  Brand: Thompson's
  Content: const companyName = "Thompson's E-Parts"; // WRONG!
```

### 3. Pre-Commit Hook

Prevents commits with brand references.

**Installation:**
```bash
# Option 1: Manual installation
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Option 2: With Husky (recommended)
npm install husky --save-dev
npx husky add .husky/pre-commit "bash scripts/pre-commit-hook.sh"
```

**Features:**
- Checks staged files only
- Skips test files and documentation
- Blocks commit if violations found
- Fast execution (only checks staged changes)

**Usage:**
```bash
# Normal commit flow
git add .
git commit -m "feat: add new feature"
# Hook runs automatically and blocks if violations found
```

### 4. CI/CD Integration

GitHub Actions workflow that runs on every PR and push.

**Location:** `.github/workflows/brand-check.yml`

**Features:**
- Runs on PR and push to main/develop
- Fails build if critical violations found
- Provides detailed audit report in GitHub Actions logs
- Node.js 18 environment

**Manual Trigger:**
```bash
# Run locally before pushing
npx tsx scripts/audit-brand-references.ts
```

## Alert Configuration

### Email Alerts (Log Monitor)

Set environment variable:
```bash
export BRAND_ALERT_EMAIL="team@company.com"
```

Or add to `.env.local`:
```
BRAND_ALERT_EMAIL=alerts@company.com
```

### Slack Alerts (Future)

TODO: Integrate with Slack webhook for real-time alerts.

## NPM Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "audit:brands": "tsx scripts/audit-brand-references.ts",
    "monitor:logs": "bash scripts/monitor-brand-references.sh",
    "check:all": "npm run lint && npm run typecheck && npm run audit:brands"
  }
}
```

## Testing the Scripts

### Test the Audit Script
```bash
# Should find violations
echo 'const company = "Thompson'"'"'s";' > test-violation.ts
npx tsx scripts/audit-brand-references.ts
rm test-violation.ts
```

### Test the Pre-Commit Hook
```bash
# Stage a file with violation
echo 'const company = "Thompson'"'"'s";' > test-violation.ts
git add test-violation.ts
git commit -m "test"
# Should block commit
git reset HEAD test-violation.ts
rm test-violation.ts
```

### Test the Log Monitor
```bash
# Create test log
echo "User accessed Thompson's E-Parts page" > test.log

# Start monitor (in one terminal)
./scripts/monitor-brand-references.sh test.log

# Append to log (in another terminal)
echo "Another Thompson's reference" >> test.log
# Should trigger alert in monitor terminal
```

## Maintenance

### Adding New Brand Terms

Edit both scripts:

**1. Update `monitor-brand-references.sh`:**
```bash
BRANDS=(
  "thompsonseparts"
  # ... existing terms ...
  "new-brand-term"
)
```

**2. Update `audit-brand-references.ts`:**
```typescript
const BRANDS = [
  { term: 'thompsonseparts', severity: 'critical' as const },
  // ... existing terms ...
  { term: 'new-brand-term', severity: 'critical' as const },
];
```

### Adding Exclusion Patterns

Edit `audit-brand-references.ts`:
```typescript
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'REMOVED',
  // Add new patterns here
  'example-code',
];
```

## Production Deployment

### Docker Integration

Add to `Dockerfile`:
```dockerfile
# Copy monitoring scripts
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# Run audit during build
RUN npx tsx scripts/audit-brand-references.ts
```

### Kubernetes CronJob (Log Monitor)

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: brand-monitor
spec:
  schedule: "*/5 * * * *"  # Every 5 minutes
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: monitor
            image: your-app-image
            command: ["/app/scripts/monitor-brand-references.sh"]
            env:
            - name: BRAND_ALERT_EMAIL
              value: "alerts@company.com"
```

## Troubleshooting

### "tail: cannot open '/var/log/app.log'"
- Check log file path exists
- Ensure read permissions
- Use `./scripts/monitor-brand-references.sh /path/to/actual/log`

### "grep: command not found"
- Install grep: `brew install grep` (macOS) or `apt-get install grep` (Linux)

### "mail: command not found"
- Email alerts require `mail` utility
- Install: `brew install mailutils` or use webhook alternative

### Pre-commit hook not running
```bash
# Check hook is executable
chmod +x .git/hooks/pre-commit

# Check hook exists
ls -la .git/hooks/pre-commit

# Test manually
bash .git/hooks/pre-commit
```

## Best Practices

1. **Run audit before every release**
   ```bash
   npm run audit:brands
   ```

2. **Monitor logs in production**
   - Set up log monitoring as systemd service or K8s DaemonSet
   - Configure email/Slack alerts

3. **Enforce pre-commit hooks**
   - Use Husky for team-wide enforcement
   - Add to onboarding documentation

4. **Review CI/CD failures**
   - Don't bypass brand check failures
   - Fix violations immediately

5. **Regular audits**
   - Weekly audit runs
   - Monthly review of exclusion patterns
   - Quarterly review of monitored terms

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Brand-agnostic requirements
- [ARCHITECTURE.md](/docs/01-ARCHITECTURE/README.md) - Multi-tenant architecture
- [Database Schema](/docs/01-ARCHITECTURE/database-schema.md) - Configuration storage

## Support

If you find false positives or need to add legitimate exclusions, update the `EXCLUDE_PATTERNS` in the audit script.

**Remember:** When in doubt, make it configurable. No hardcoded brand data!
