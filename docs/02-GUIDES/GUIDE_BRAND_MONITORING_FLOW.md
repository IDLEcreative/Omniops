# Brand Reference Monitoring Flow

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Brand Monitoring Setup](GUIDE_MONITORING_SETUP_V2.md)
- scripts/audit-brand-references.ts, scripts/monitor-brand-references.sh
**Estimated Read Time:** 23 minutes

## Purpose
Complete architectural flow documentation for 4-layer brand reference monitoring system (Development, Commit, PR/Push, Production) with detailed detection points, data flow diagrams, alert mechanisms, and performance characteristics. Provides visual architecture showing pre-commit hooks, GitHub Actions CI/CD, runtime log monitoring, and configuration management for maintaining brand-agnostic multi-tenant codebase.

## Quick Links
- [System Architecture](#system-architecture)
- [Detection Points](#detection-points)
- [Detection Flow (Detailed)](#detection-flow-detailed)
- [Data Flow](#data-flow)
- [Configuration Flow](#configuration-flow)
- [Alert Flow](#alert-flow)
- [Performance Flow](#performance-flow)
- [Integration Points](#integration-points)
- [Summary](#summary)

## Keywords
brand monitoring architecture, multi-layer defense, pre-commit hooks, GitHub Actions workflows, log monitoring, real-time alerts, detection flow, data flow, configuration management, CI/CD integration, audit scripts, monitoring system, brand-agnostic enforcement, violation detection, alert mechanisms

## Aliases
- "brand monitoring" (also known as: brand detection, reference monitoring, hardcoded brand checking, brand violation tracking)
- "4-layer defense" (also known as: multi-stage monitoring, layered security, defense in depth, staged validation)
- "pre-commit hook" (also known as: git hook, commit hook, pre-commit validation, staged file checking)
- "log monitoring" (also known as: runtime monitoring, real-time log analysis, log surveillance, production monitoring)
- "detection flow" (also known as: violation detection, monitoring pipeline, check sequence, validation flow)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BRAND MONITORING SYSTEM                           │
│                   Multi-Layer Defense Strategy                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 1: DEVELOPMENT PHASE                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Developer writes code                                              │
│           │                                                          │
│           ├─→ Manual audit (optional)                              │
│           │   $ npm run audit:brands                                │
│           │   [Scans: lib/, components/, app/api/]                 │
│           │                                                          │
│           └─→ Real-time feedback                                    │
│               Exit code: 0 = pass, 1 = violations found            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 2: COMMIT PHASE                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  $ git commit -m "message"                                          │
│           │                                                          │
│           ├─→ Pre-commit hook triggers                             │
│           │   [Checks ONLY staged files]                           │
│           │                                                          │
│           ├─→ Brand reference scan                                  │
│           │   Pattern: thompsonseparts|Thompson|Cifa|...           │
│           │                                                          │
│           ├─→ Violations found?                                     │
│           │   ├── YES → ❌ BLOCK COMMIT                            │
│           │   │         Display violations                          │
│           │   │         Exit code: 1                                │
│           │   │                                                      │
│           │   └── NO  → ✅ ALLOW COMMIT                            │
│           │             Exit code: 0                                │
│           │                                                          │
│           └─→ Emergency bypass available                            │
│               $ git commit --no-verify                              │
│               (logged for audit)                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 3: PR/PUSH PHASE (CI/CD)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  $ git push origin feature-branch                                   │
│           │                                                          │
│           ├─→ GitHub Actions triggered                             │
│           │   [Workflow: brand-check.yml]                          │
│           │                                                          │
│           ├─→ Environment setup                                     │
│           │   • Checkout code                                       │
│           │   • Setup Node.js 18                                    │
│           │   • npm ci (install deps)                              │
│           │                                                          │
│           ├─→ Run brand audit                                       │
│           │   $ npx tsx scripts/audit-brand-references.ts          │
│           │   [Scans ALL production code]                          │
│           │                                                          │
│           ├─→ Violations found?                                     │
│           │   ├── YES → ❌ FAIL BUILD                              │
│           │   │         • Block PR merge                            │
│           │   │         • Detailed report in Actions log            │
│           │   │         • Notify team                               │
│           │   │                                                      │
│           │   └── NO  → ✅ PASS BUILD                              │
│           │             • Allow PR merge                            │
│           │             • Continue deployment                       │
│           │                                                          │
│           └─→ Results logged to GitHub Actions                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 4: PRODUCTION PHASE (RUNTIME)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Application running in production                                  │
│           │                                                          │
│           ├─→ Log monitor service                                  │
│           │   $ ./scripts/monitor-brand-references.sh              │
│           │   [Monitors: /var/log/app.log]                         │
│           │                                                          │
│           ├─→ Real-time streaming with tail -f                     │
│           │   • Parse every log line                               │
│           │   • Pattern match: 8 brand terms                       │
│           │                                                          │
│           ├─→ Brand reference detected?                            │
│           │   ├── YES → 🚨 ALERT                                   │
│           │   │         • Console output (color-coded)             │
│           │   │         • Email alert (if configured)              │
│           │   │         • Log violation                            │
│           │   │         • Timestamp + context                      │
│           │   │                                                      │
│           │   └── NO  → Continue monitoring                        │
│           │                                                          │
│           └─→ Continuous 24/7 monitoring                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detection Points

### Layer 1: Development (Manual)
- **Tool:** Code Audit Script
- **Trigger:** On-demand (`npm run audit:brands`)
- **Coverage:** lib/, components/, app/api/
- **Speed:** ~2 seconds
- **Action:** Report violations

### Layer 2: Commit (Automatic)
- **Tool:** Pre-Commit Hook
- **Trigger:** Every `git commit`
- **Coverage:** Staged files only
- **Speed:** <500ms
- **Action:** Block commit

### Layer 3: PR/Push (Automatic)
- **Tool:** GitHub Actions
- **Trigger:** PR or push to main/develop
- **Coverage:** All production code
- **Speed:** 30-45 seconds
- **Action:** Fail build

### Layer 4: Production (Continuous)
- **Tool:** Log Monitor
- **Trigger:** Continuous (service/daemon)
- **Coverage:** Application logs
- **Speed:** Real-time
- **Action:** Alert team

---

## Detection Flow (Detailed)

```
Developer writes code with brand reference
                │
                ▼
    ┌───────────────────────┐
    │ Is audit run manually?│
    └───────────┬───────────┘
                │
        ┌───────┴────────┐
        │                │
      YES               NO
        │                │
        ▼                │
    Violation found      │
    Developer warned     │
    Fixes locally        │
        │                │
        └────────┬───────┘
                 │
                 ▼
    ┌───────────────────────┐
    │ Developer commits     │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Pre-commit hook runs  │
    └───────────┬───────────┘
                │
        ┌───────┴────────┐
        │                │
    Violation          No violation
    found              found
        │                │
        ▼                ▼
    COMMIT           COMMIT
    BLOCKED          ALLOWED
        │                │
        │                ▼
        │    ┌───────────────────────┐
        │    │ Push to GitHub        │
        │    └───────────┬───────────┘
        │                │
        │                ▼
        │    ┌───────────────────────┐
        │    │ GitHub Actions runs   │
        │    └───────────┬───────────┘
        │                │
        │        ┌───────┴────────┐
        │        │                │
        │    Violation          No violation
        │    found              found
        │        │                │
        │        ▼                ▼
        │    BUILD            BUILD
        │    FAILED           PASSED
        │        │                │
        │        │                ▼
        │        │    ┌───────────────────────┐
        │        │    │ Deployed to production│
        │        │    └───────────┬───────────┘
        │        │                │
        │        │                ▼
        │        │    ┌───────────────────────┐
        │        │    │ Log monitor active    │
        │        │    └───────────┬───────────┘
        │        │                │
        │        │        ┌───────┴────────┐
        │        │        │                │
        │        │    Brand ref        No brand ref
        │        │    in logs          in logs
        │        │        │                │
        │        │        ▼                ▼
        │        │    ALERT           CONTINUE
        │        │    TEAM            MONITORING
        │        │        │                │
        ├────────┴────────┴────────────────┘
        │
        ▼
    Developer fixes violation
    Cycle repeats
```

---

## Data Flow

```
┌─────────────────────┐
│   Source Code       │  ← Developer writes
│   (*.ts, *.tsx)     │
└──────────┬──────────┘
           │
           ├─────────────────────────────────────┐
           │                                     │
           ▼                                     ▼
┌──────────────────────┐            ┌──────────────────────┐
│  Audit Script        │            │  Pre-Commit Hook     │
│  (TypeScript)        │            │  (Bash)              │
│                      │            │                      │
│  • Grep search       │            │  • Git diff          │
│  • Pattern match     │            │  • Staged files      │
│  • Severity check    │            │  • Pattern match     │
└──────────┬───────────┘            └──────────┬───────────┘
           │                                   │
           ├───────────────┬───────────────────┤
           │               │                   │
           ▼               ▼                   ▼
    ┌───────────┐  ┌───────────┐      ┌───────────┐
    │  Console  │  │  Exit     │      │  Git      │
    │  Report   │  │  Code     │      │  Status   │
    └───────────┘  └───────────┘      └───────────┘
           │               │                   │
           │               │                   │
           ▼               ▼                   ▼
    Human review    CI/CD check        Commit blocked
```

```
┌─────────────────────┐
│  Application Logs   │  ← Runtime output
│  (/var/log/app.log) │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│  Log Monitor         │
│  (Bash + tail -f)    │
│                      │
│  • Stream logs       │
│  • Grep filter       │
│  • Pattern match     │
└──────────┬───────────┘
           │
           ├─────────────────────┐
           │                     │
           ▼                     ▼
    ┌───────────┐        ┌───────────┐
    │  Console  │        │  Email    │
    │  Alert    │        │  Alert    │
    └───────────┘        └───────────┘
           │                     │
           │                     │
           ▼                     ▼
    DevOps team           Team inbox
    monitors              receives alert
```

---

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURATION SOURCES                     │
└─────────────────────────────────────────────────────────────┘

    Environment Variables          Scripts Config
            │                            │
            │                            │
    ┌───────┴────────┐          ┌────────┴────────┐
    │                │          │                 │
    │ BRAND_ALERT_   │          │ BRANDS[]        │
    │ EMAIL          │          │ - thompson...   │
    │                │          │ - Cifa          │
    │ DEFAULT_TEST_  │          │ - A4VTG90       │
    │ DOMAIN         │          │ ...             │
    │                │          │                 │
    └────────┬───────┘          └────────┬────────┘
             │                           │
             └──────────┬────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Monitoring System   │
            │                       │
            │  • Log monitor        │
            │  • Code audit         │
            │  • Pre-commit hook    │
            │  • CI/CD workflow     │
            └───────────────────────┘
```

---

## Alert Flow

```
Brand Reference Detected
         │
         ▼
┌────────────────────┐
│ Identify Context   │
│ • File/Line        │
│ • Timestamp        │
│ • Brand term       │
└────────┬───────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌────────────────────┐          ┌────────────────────┐
│ Console Output     │          │ Email Alert        │
│                    │          │                    │
│ 🚨 Red alert       │          │ Subject: ⚠️        │
│ 🕐 Yellow timestamp│          │ Body: Details      │
│ 📄 File path       │          │ Recipient: Team    │
└────────┬───────────┘          └────────┬───────────┘
         │                               │
         ├───────────────┬───────────────┤
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ DevOps  │    │ On-call │    │ Email   │
    │ Monitor │    │ Engineer│    │ Inbox   │
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
         └──────┬───────┴──────┬───────┘
                │              │
                ▼              ▼
         Investigate      Fix issue
         root cause       Deploy patch
```

---

## Performance Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATION                  │
└─────────────────────────────────────────────────────────────┘

Code Audit:
    Read files → Grep search → Pattern match → Report
    ├── Parallel scanning (3 directories)
    ├── Smart exclusions (tests, docs)
    └── Exit early on critical violations

    Performance: ~2 seconds for entire codebase

Pre-Commit Hook:
    Git diff → Filter staged → Pattern match → Exit
    ├── Only staged files (not all files)
    ├── Skip non-TS/JS files
    └── Fast regex matching

    Performance: <500ms typical

GitHub Actions:
    Checkout → Setup → Install → Audit → Report
    ├── NPM cache enabled (faster installs)
    ├── Parallel job execution
    └── Early failure on violations

    Performance: 30-45 seconds with cache

Log Monitor:
    Tail -f → Stream → Grep filter → Alert
    ├── Real-time streaming (zero batch delay)
    ├── Efficient pattern matching
    └── Asynchronous alerts

    Performance: Real-time (0ms delay)
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATION                        │
└─────────────────────────────────────────────────────────────┘

Existing Systems:
    • package.json scripts
    • Husky pre-commit framework
    • GitHub Actions CI/CD
    • Application logging
    • Docker containers
    • Kubernetes pods

Brand Monitoring:
    • NPM scripts added (audit:brands, monitor:logs)
    • Compatible with existing hooks
    • New GitHub workflow (brand-check.yml)
    • Monitors app logs
    • Can run in Docker
    • K8s DaemonSet ready

Integration Method:
    ✅ Non-invasive (doesn't modify existing code)
    ✅ Additive (new scripts + configs)
    ✅ Compatible (uses standard tools)
    ✅ Extensible (easy to customize)
```

---

## Summary

This monitoring system provides **4-layer defense**:
1. **Development:** Optional manual checks
2. **Commit:** Automatic staged file checks
3. **PR/Push:** Comprehensive CI/CD audit
4. **Production:** Real-time log monitoring

**Coverage:** 100% of code lifecycle
**Performance:** Minimal overhead at each stage
**Automation:** Fully automated after setup
**Maintainability:** Simple configuration updates
