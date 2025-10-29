# GDPR Audit & Nightly Validation Runbook

This runbook complements the telemetry schedule by automating GDPR export/delete validation and ensuring the new `gdpr_audit_log` table stays healthy.

---

## 1. Environment Requirements

- `DATABASE_URL` for Supabase (staging)
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `MONITOR_ALERT_WEBHOOK_URL` for Slack notifications on failures.
- Playwright browsers installed (`npx playwright install`)

```bash
export DATABASE_URL="postgres://..."
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
export MONITOR_ALERT_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

---

## 2. Nightly GDPR Pipeline

1. **Apply telemetry seed (includes conversations/telemetry)**
   ```bash
   npm run seed:dashboard
   ```

2. **Run telemetry monitor and UI smoke (existing pipeline)**
   ```bash
   npm run monitor:telemetry
   npm run test:telemetry-smoke
   ```

3. **Run GDPR Playwright smoke**
   ```bash
   npm run test:gdpr-smoke
   ```

4. **Audit-log verification**
   ```bash
   npm run monitor:gdpr
   # optional deep dive
   psql "$DATABASE_URL" -c "SELECT request_type, COUNT(*) FROM gdpr_audit_log GROUP BY 1 ORDER BY 1;"
   ```

Run the one-off backfill (if upgrading an existing environment):

```bash
npm run backfill:gdpr
```

5. **CSV export (optional)**
   - From the dashboard, apply filters/date range and use the **Export CSV** button to download up to 5,000 entries (powered by `/api/gdpr/audit?format=csv`).
   - CLI equivalent (requires authenticated cookie/session if endpoint is protected):
     ```bash
     curl "https://your-app.example.com/api/gdpr/audit?format=csv&start_date=$(date -u +%Y-%m-01T00:00:00Z)&end_date=$(date -u +%Y-%m-%dT23:59:59Z)" \
       -o gdpr-audit.csv
     ```

6. **Retention (automated)**
   - Supabase cron job `prune-gdpr-audit-log` runs every Sunday at 03:15 UTC (`SELECT public.prune_gdpr_audit_log();`) to purge records older than two years.
   - To force a manual prune or shorten the window (e.g., for QA), run:
     ```bash
     psql "$DATABASE_URL" -c "SELECT public.prune_gdpr_audit_log(INTERVAL '30 days');"
     ```

---

## 3. GitHub Actions Snippet

```yaml
jobs:
  nightly-gdpr-telemetry:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      MONITOR_ALERT_WEBHOOK_URL: ${{ secrets.MONITOR_ALERT_WEBHOOK_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run seed:dashboard
      - run: npm run monitor:telemetry
      - run: npm run test:telemetry-smoke
      - run: npm run monitor:gdpr
      - run: npm run test:gdpr-smoke
      - name: Notify failure
        if: failure()
        run: npx tsx scripts/notify-monitor-failure.ts
```

The workflow is committed at `.github/workflows/nightly-telemetry-gdpr.yml`.

Both monitors automatically dispatch a Slack alert when they fail. Place this alongside `docs/TELEMETRY_NIGHTLY_RUNBOOK.md` so operational teams have both telemetry and GDPR playbooks. Once `gdpr_audit_log` is wired into the UI, extend the Playwright spec to assert audit entries appear with the correct metadata.
