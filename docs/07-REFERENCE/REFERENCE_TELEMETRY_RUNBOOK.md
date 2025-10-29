# Telemetry Nightly Maintenance Runbook

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 7 minutes

## Purpose
This runbook orchestrates the nightly telemetry refresh, verification, and smoke validation cycles for the OmniOps dashboard. The goal is to keep `/dashboard/telemetry` backed by fresh Supabase rollups, ensure freshness alerts trigger reliably, and confirm the UI renders healthy metrics after each run.

## Quick Links
- [1. Prerequisites](#1-prerequisites)
- [1.1 GitHub Actions Setup](#11-github-actions-setup)
- [2. Nightly Pipeline Steps](#2-nightly-pipeline-steps)
- [3. Example GitHub Actions Workflow Snippet](#3-example-github-actions-workflow-snippet)
- [4. Operational Notes](#4-operational-notes)

## Keywords
actions, commands, example, github, nightly, notes, operational, pipeline, prerequisites, quick

---


This runbook orchestrates the nightly telemetry refresh, verification, and smoke validation cycles for the OmniOps dashboard. The goal is to keep `/dashboard/telemetry` backed by fresh Supabase rollups, ensure freshness alerts trigger reliably, and confirm the UI renders healthy metrics after each run.

---

## 1. Prerequisites

- `DATABASE_URL` for the staging Supabase database.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the telemetry/GDPR monitors.
- `MONITOR_ALERT_WEBHOOK_URL` pointing to the Slack channel webhook that should receive failures.
- Playwright browsers installed (`npx playwright install`).

Export the keys in your CI/cron environment:

```bash
export DATABASE_URL="postgres://..."
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
export MONITOR_ALERT_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

---

## 1.1 GitHub Actions Setup

1. Navigate to **Settings → Secrets and variables → Actions → Repository secrets**.
2. Create or update the following secrets:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MONITOR_ALERT_WEBHOOK_URL`
3. Once all secrets are present, open **Actions → Nightly Telemetry & GDPR Validation** and enable the workflow if it is disabled.
4. Trigger a manual run (**Run workflow → Run workflow**) to verify the environment wiring. A successful run should:
   - Seed staging data (`npm run seed:dashboard`).
   - Pass both monitors without triggering Slack alerts.
   - Complete the Playwright smokes.
   - Post a Slack notification only if a failure occurs.
5. Record the first successful run in the ops log (see `docs/GDPR_AUDIT_RUNBOOK.md`) and leave the cron schedule in place.

---

## 2. Nightly Pipeline Steps

### Step 1 – Refresh demo telemetry/conversations

```bash
npm run seed:dashboard
```

*Applies `supabase/seeds/20251020_dashboard_sample_data.sql` via `scripts/apply-dashboard-seed.sh`, repopulating conversations, messages, telemetry rows, and refreshing rollups.*

### Step 2 – Validate rollup freshness

```bash
npm run monitor:telemetry
```

*Runs `scripts/monitor-telemetry-rollups.ts` to confirm the `chat_telemetry_rollups`, `chat_telemetry_domain_rollups`, and `chat_telemetry_model_rollups` tables have recent buckets. Exits non-zero if rollups are stale or missing. On failure, a Slack alert is dispatched via `MONITOR_ALERT_WEBHOOK_URL`.*

### Step 3 – GDPR audit health

```bash
npm run monitor:gdpr
```

*Runs `scripts/monitor-gdpr-audit.ts` to ensure `gdpr_audit_log` has fresh entries. Any stale or missing entries trigger a Slack alert before the script exits non-zero.*

### Step 4 – UI smoke tests

```bash
npm run test:telemetry-smoke
npm run test:gdpr-smoke
```

*Launches the Playwright telemetry smoke spec (`__tests__/playwright/telemetry-smoke.spec.ts`) and GDPR privacy spec (`__tests__/playwright/gdpr-privacy.spec.ts`) to ensure both dashboards render the expected data and flows.*

---

## 3. Example GitHub Actions Workflow Snippet

```yaml
name: Telemetry Nightly

on:
  schedule:
    - cron: "0 4 * * *" # 04:00 UTC nightly
  workflow_dispatch:

jobs:
  telemetry-nightly:
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
      - run: npm run monitor:gdpr
      - run: npm run test:telemetry-smoke
      - run: npm run test:gdpr-smoke
      - name: Notify failure
        if: failure()
        run: npx tsx scripts/notify-monitor-failure.ts
```

---

## 4. Operational Notes

- The monitor scripts fail fast if rollups go stale or GDPR audit entries stop flowing; both dispatch Slack alerts limited to a single payload per run.
- The Playwright smoke route intercepts `/api/dashboard/telemetry`; no Supabase calls occur during the UI check.
- If the monitor raises a failure, reapply the full function definition from `supabase/migrations/20251020_chat_telemetry_domain_model_rollups.sql` via the Supabase SQL editor before re-running the pipeline.

---

## 5. Quick Commands

Run everything locally with one liner:

```bash
DATABASE_URL="postgres://..." \
SUPABASE_URL="https://..." \
SUPABASE_SERVICE_ROLE_KEY="..." \
make telemetry-nightly
```

*(Create a `telemetry-nightly` Makefile target that chains the three npm scripts if desired.)*

Keep this runbook alongside the integration blueprint to ensure telemetry remains reliable and observable.
