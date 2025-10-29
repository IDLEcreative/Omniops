# OmniOps Customer Service SaaS – End-to-End Integration Blueprint

## 1. Objective
- Deliver an Intercom-caliber platform with live data powering every visualization, workflow, and automation.
- Eradicate placeholder fixtures by mapping each UI element to authoritative Supabase tables, APIs, or external connectors (WooCommerce, scraping, telemetry).
- Ensure the chat agent, analytics, CRM surfaces, and configuration flows operate on a unified, auditable data foundation.

## 2. Product Pillars & Experience Goals
- **Proactive Conversational AI**: Embedded widget, agent handoff, smart routing, omnichannel transcripts.
- **Actionable Analytics**: Real-time health, sentiment, revenue impact, SLA compliance, funnel drop-offs.
- **Customer 360 CRM**: Unified profile of contacts, conversations, orders, feedback, billing status.
- **Automation & Training**: Content ingestion, knowledge gaps detection, playbooks, QA loops, campaign triggers.
- **Enterprise Operations**: Multi-tenant isolation, GDPR tooling, role-based access, audit trails, cost controls.

## 3. Platform Topology
| Layer | Components | Notes |
| --- | --- | --- |
| Client Experience | Next.js dashboard (`app/dashboard/*`), Embedded widget (`components/ChatWidget.tsx`) | Replace mock state with data fetched via SWR/React Query. |
| Edge APIs | Next.js routes under `app/api/*` | Primary contract between UI and Supabase/business logic. |
| AI Services | Chat Orchestration (`app/api/chat/route.ts`), telemetry (`lib/chat-telemetry.ts`), search tools | Supports streaming, tool calls, WooCommerce queries. |
| Data Platform | Supabase Postgres, Storage, Auth | Authoritative tables: `customers`, `conversations`, `messages`, `chat_telemetry`, `customer_configs`, scraping, WooCommerce. |
| Background Workers | Scrapers, WooCommerce sync, cron tasks (`supabase/migrations` functions), queue | Maintain freshness of content, embeddings, analytics rollups. |
| Observability | Telemetry manager, Supabase logging, dashboards | Provide cost, performance, error visibility. |

## 4. Data Sources & Pipelines
1. **Web Knowledge**
   - Scraped pages stored in `scraped_pages`, embeddings in `page_embeddings`, structured extractions in `structured_extractions`.
   - Ingestion flows driven by `/api/scrape`, `lib/scraper-*`, cron jobs.
2. **Conversational Data**
   - Chat widget posts to `/api/chat` → persists `conversations`, `messages`, `chat_telemetry`.
   - Feedback endpoints capture thumbs up/down, satisfaction, categories (to add).
3. **Commerce & Customer**
   - WooCommerce dynamic client (`lib/woocommerce-dynamic.ts`, `lib/agents/commerce-provider.ts`), stored in `woocommerce_*` tables and `customers`.
   - Orders, cart tracking, abandoned-cart stats captured via APIs + Cron.
4. **Training & Knowledge Ops**
   - `/api/training`, `/api/scrape` ingest URLs, text, QA pairs into `training_data`, `content_refresh_jobs`.
5. **System Telemetry**
   - `chat_telemetry` table (created `20250117_create_chat_telemetry.sql`) logs model usage, cost, duration, tool calls.
   - Aggregated views (`chat_telemetry_metrics`) + live sessions via `telemetryManager`.

## 5. Domain Model Snapshot
| Domain Area | Table / View | Key Fields | Primary Use |
| --- | --- | --- | --- |
| Accounts | `customers`, `customer_configs`, `domains`, `team_members` | Tenant info, branding, auth links | Dashboard settings, embedding config |
| Conversations | `conversations`, `messages`, `chat_sessions`, `chat_messages` | Session metadata, transcripts | Inbox, analytics, exports |
| Analytics | `chat_telemetry`, `chat_telemetry_metrics`, `messages` (sentiment heuristics) | Cost, tool success, response time, search logs | Analytics dashboards, anomaly alerts |
| Knowledge | `scraped_pages`, `page_embeddings`, `structured_extractions`, `training_data` | Structured knowledge base | RAG pipeline, training UI |
| Commerce | `woocommerce_*`, `order_modifications`, `structured_extractions (products)` | Orders, carts, catalog | Customer 360, revenue analytics |
| Compliance | `gdpr_requests`, `privacy_logs` (to add) | Audit, retention | GDPR UI, privacy policy enforcement |

## 6. API Inventory & Gaps
| Route | Source | Purpose | UI Consumers | Status |
| --- | --- | --- | --- | --- |
| `POST /api/chat` | `app/api/chat/route.ts` | Orchestrate chat, persist data, telemetry | Widget, testing suites | Production-ready; integrate conversation states |
| `GET /api/dashboard/conversations` | `app/api/dashboard/conversations/route.ts` | Conversation counts, recents | Dashboard home, Inbox | Implement pagination, filters, assignment |
| `GET /api/dashboard/analytics` | `app/api/dashboard/analytics/route.ts` | Response time, satisfaction heuristics, top queries | Analytics page | Expand to use telemetry metrics, intents |
| `GET /api/dashboard/telemetry` | `app/api/dashboard/telemetry/route.ts` | Cost, model usage, live sessions | Ops analytics | Requires front-end binding, surface trends |
| `GET /api/dashboard/scraped` | `app/api/dashboard/scraped/route.ts` | Content coverage stats | Training, knowledge health | Await UI integration |
| `GET /api/dashboard/missing-products` | `app/api/dashboard/missing-products/route.ts` | Detect knowledge gaps via failed searches | Product ops widgets | Needs UI panel |
| `GET /api/dashboard/woocommerce` | `app/api/dashboard/woocommerce/route.ts` | Commerce KPIs | Revenue dashboards | Replace placeholder order estimates with real metrics |
| `GET/POST /api/dashboard/config` | `app/api/dashboard/config/route.ts` | Widget + commerce configuration | Customize page | Hook up form, handle encryption |
| `GET /api/customer/config` | `app/api/customer/config/route.ts` | Tenant config for widgets | Widget, embed loader | Already used, ensure caching |
| `GET /api/training` etc. | `app/api/training/*` | Training data management | Training page | Wire table, progress bars |
| GDPR endpoints | `app/api/gdpr/*` | Export/delete requests | Privacy dashboard | Add UI + audit trail |

## 7. Chat Widget → Analytics Data Flow
1. **Widget Session Boot** – generates `session_id`, fetches `/api/customer/config` to pull privacy, WooCommerce flags.
2. **User Message** – `fetch('/api/chat')` with `session_id`, domain, config flags.
3. **Chat API** – inserts conversation if absent, persists user message (`messages`), builds system prompt with anti-hallucination directives, runs ReAct loop with tools.
4. **Tool Calls** – `searchSimilarContent`, WooCommerce dynamic search, order lookup; results appended to message log.
5. **Assistant Reply** – persisted in `messages`, returned to widget; telemetry tracked (iterations, tokens, cost, search usage).
6. **Telemetry Pipeline** – `chat_telemetry` row recorded + log buffer; live metrics accessible via `telemetryManager`.
7. **Analytics Consumption** – Dashboard endpoints query `messages`, `chat_telemetry`, aggregated views → graphs, KPIs, anomalies.

## 8. Dashboard Pages & Required Data Connections
### 8.1 Home (`app/dashboard/page.tsx`)
- **Current**: `chartData`, `stats`, `quickActions` constants.
- **Required Data**:
  - Conversation totals over selectable periods via `/api/dashboard/conversations?days=n`.
  - Active user count: unique `customers` engaged or `messages` per domain.
  - Response time & resolution: derived from `chat_telemetry` + `messages`.
  - SLA panels: escalate count, backlog, average wait.
- **Actions**:
  1. Replace static state with data hooks (SWR).
  2. Provide skeleton loaders & empty states.
  3. Drill-through: clicking cards navigates to analytics/inbox filters.
  4. Add export action to call `/api/dashboard/analytics?format=csv` (to build).

### 8.2 Analytics (`app/dashboard/analytics/page.tsx`)
- **Current**: placeholder arrays for metrics, top queries, language distribution.
- **Required Data**:
  - `GET /api/dashboard/analytics?days=n` for response time, satisfaction heuristics, failed searches.
  - `GET /api/dashboard/telemetry` for cost, token, model usage, hourly trend.
  - `GET /api/dashboard/missing-products` for knowledge gaps.
- **Enhancements**:
  - Merge analytics + telemetry responses into multi-tab view (Performance, Quality, Content Coverage).
  - Add charts: response time percentile, sentiment trend, search tool success, cost projections.
  - Provide filters: domain, channel, conversation tags (needs backend support).

### 8.3 Conversations (`app/dashboard/conversations/page.tsx`)
- **Current**: hard-coded conversation list and transcript.
- **Required Data**:
  - `GET /api/dashboard/conversations` (extend) → paginated inbox with metadata (status, priority, unread count).
  - `GET /api/conversations/{id}` (new) for full transcript, tool calls, order lookups.
  - Websocket/SSE for live updates (phase 2).
- **Operations**:
  - Add assignment endpoints (`PATCH /api/conversations/{id}`) to record owner, status.
  - Logging of manual replies, tagging, CSAT.
  - Escalation flows (open ticket, schedule callback).

### 8.4 Customers (`app/dashboard/customers/page.tsx`)
- **Current**: static array; no Supabase link.
- **Required Data**:
  - `customers` table joined with `conversations`, `woocommerce_orders`, `messages`.
  - Provide timeline of interactions, order history, satisfaction trend.
  - Add search, filters (status, value tier, activity).
  - Hook “Add Customer” to POST endpoint.

### 8.5 Customize (`app/dashboard/customize/page.tsx`)
- **Current**: local state, fake embed code.
- **Required Data**:
  - Fetch `/api/dashboard/config` → populate form.
  - Save via POST; handle optimistic updates, toasts.
  - Generate real embed snippet referencing deployed loader (e.g., `https://app.omniops.ai/embed.js?domain=<domain>`).
  - Persist theme tokens, privacy settings, auto-open behavior to `customer_configs` + `customer_branding` (to create).

### 8.6 Training (`app/dashboard/training/page.tsx`)
- **Current**: hooks exist but minimal UI binding.
- **Required Data**:
  - `/api/training` for data table, pagination.
  - `/api/scrape` progress, job queue status.
  - `/api/dashboard/scraped` for coverage stats.
  - Provide re-crawl, delete, review actions.

### 8.7 Telemetry / Ops (New View)
- Build a dedicated page to visualize `GET /api/dashboard/telemetry`: model usage, cost trend, error logs, live sessions, search tool heatmap.

### 8.8 GDPR / Privacy
- Implement UI to consume `app/api/gdpr/export`, `delete` routes; show request history, retention status per domain, and toggle anonymization.

## 9. Knowledge & Analytics Linking
- **Failed Search loop**: `missing-products` endpoint surfaces product gaps → feed into training queue suggestions.
- **Content Coverage**: Compare `scraped_pages` vs `structured_extractions` per domain; highlight stale pages (>30 days) and missing embeddings.
- **Response Quality**: Annotate messages with heuristics (positive/negative patterns) and optional human QA tags; materialize satisfaction score per conversation.
- **Revenue Influence**: Join `messages` (order lookups, cross-sell) with `woocommerce_orders` to attribute revenue influenced by chat interactions.
- **Automation Triggers**: When `missing-products` count crosses threshold, auto-create tasks in CRM or send email; when telemetry error rate > x%, alert ops Slack.

## 10. Configuration & Branding
- **Tenant Config**: `customer_configs` holds domain, connectors; extend schema with:
  - `widget_theme` JSON (colors, fonts, shapes).
  - `privacy_preferences` (consent, retention, opt-out text).
  - `embed_settings` (position, auto-open).
- **Storage**: Use Supabase storage bucket for logos/avatars; store signed URLs in config.
- **Embed Loader**: Serve `embed.js` that fetches config by domain, bootstraps widget (ensuring CORS + auth).
- **Audit**: Log config changes in `config_audit_log` (new table) with diff, actor.

## 11. Automation & Workflow Integration
- **Ticketing/Email**: Provide connectors (webhooks, Zapier) triggered by conversation tags or escalations.
- **Agent Assist**: In conversation view, show suggested replies (OpenAI), knowledge articles, order context.
- **Macros / Playbooks**: Template responses stored in Supabase to apply via UI; log usage.
- **Campaigns**: Trigger proactive outreach (email/SMS) based on customer segments + chat behavior.

## 12. Observability & Operations
- **Telemetry Dashboard**: Real-time view of active sessions, cost/hour, model breakdown, search counts, error spike detection (SLO: success rate > 97%).
- **Logging**: Structured logs shipped to Supabase or external log sink; include conversation ID, domain, tool call diagnostics.
- **Alerts**: Supabase functions + cron to email/Slack when:
  - Error rate > threshold.
  - Cost projection exceeds budget.
  - Search tools return zero results > x times.
- **Performance**: Index optimization (see `20250118_performance_*` migrations), caching in `/api` endpoints, rate limiting via `checkDomainRateLimit`.

## 13. Security, Privacy, Compliance
- **Multi-Tenant Isolation**: Ensure all `SELECT` queries filter by tenant; add row-level security policies for `conversations`, `messages`, `chat_telemetry`, `customer_configs`.
- **PII Handling**: Encrypt WooCommerce credentials (`encryptWooCommerceConfig`); extend to Shopify, custom APIs.
- **Data Retention**: Respect `privacySettings.retentionDays` from widget; implement worker to purge old conversations/messages.
- **GDPR Tools**: UI to initiate exports/deletion via `/api/gdpr/*`; maintain `gdpr_audit_log`.
- **Consent Management**: Store explicit consent events from widget (`handleConsent`); propagate to analytics filtering.

## 14. Implementation Roadmap
### Phase 0 – Foundation
1. Confirm Supabase schema & migrations; run seed data or connect to staging.
2. Document API contracts & TypeScript types shared between endpoints and UI (shared via `types/dashboard.ts`).

### Phase 1 – Live Dashboard Wiring
1. Introduce data fetching layer (SWR hooks under `hooks/dashboard`).
2. Replace home dashboard cards/charts with real data; add loading/error states.
3. Connect Analytics page to `/api/dashboard/analytics` + telemetry blend.

### Phase 2 – Conversations & CRM
1. Build paginated inbox pulling from `conversations` + `messages`.
2. Implement assignment/status updates (PATCH endpoint).
3. Create customer detail drawer with orders, conversation history, satisfaction metrics.

### Phase 3 – Telemetry & Cost Governance
1. Surface telemetry metrics in dedicated dashboard _(Telemetry page now consumes `/api/dashboard/telemetry` with live metrics, cost trend, and live session views)_.
2. Schedule Supabase functions to aggregate hourly/daily stats into `chat_telemetry_metrics` _(cron-backed rollups populate `chat_telemetry_rollups` for fast queries)_.
3. Implement budgeting alerts, anomaly detection, cost trend charts.

### Phase 4 – Configuration & Embed
1. Wire Customize page to `/api/dashboard/config`.
2. Store widget theme/privacy; update embed loader to fetch config.
3. Provide embed snippet manager with environment detection (prod/sandbox).

### Phase 5 – Knowledge Ops
1. Connect Training page to job status, scraped coverage, missing products.
2. Add CTA to queue re-scrapes or add manual QA pairs from analytics insights.
3. Build deflection report linking content coverage to resolution rate.

### Phase 6 – Automations & Integrations
1. Implement API/webhook for escalations, macros, campaigns.
2. Add WooCommerce revenue attribution dashboards, abandonment recovery workflows.

### Phase 7 – Compliance & Audit
1. Roll out GDPR UI, retention policies, audit logs.
2. Validate encryption, RLS, API rate limiting.
3. Prepare SOC2-style logging (access reports, configuration changes).

## 15. Detailed Task Backlog (Excerpt)
| Priority | Task | Owner | Dependencies |
| --- | --- | --- | --- |
| P0 | Create `useDashboardMetrics`, `useAnalytics`, `useTelemetry` hooks | Frontend | API contracts |
| P0 | Implement `/api/conversations/{id}` GET/PATCH | Backend | Supabase schema |
| P0 | Replace `stats` constant on dashboard home with hook data | Frontend | Hook |
| P0 | Build React Query provider & error boundary for dashboard | Frontend | – |
| P1 | Extend telemetry endpoint with percentile calc & per-domain filters | Backend | Telemetry data |
| P1 | Create `customer_profile` view (join customers, orders, conversations) | DB | WooCommerce sync |
| P1 | Implement widget config persistence & embed snippet | Frontend/Backend | `/api/dashboard/config` |
| P1 | Add cron to populate `chat_telemetry_metrics` view daily | DevOps | Supabase cron |
| P2 | Build dashboards for missing products, content freshness | Frontend | Endpoint data |
| P2 | Automate alerts via webhook (error rate, cost spikes) | Backend | Telemetry |
| P2 | Implement GDPR request UI & logs | Frontend/Backend | Existing endpoints |
| P3 | Add streaming transcripts & agent handoff controls | Backend | Conversation patch API |

## 16. Testing & Validation Strategy
- **Unit**: Validate hooks (`hooks/__tests__`), API schemas (Zod), encryption routines.
- **Integration**: Use Playwright/MSW to simulate widget → chat pipeline ending in dashboard views.
- **Data QA**: Scheduled Supabase tests to verify foreign keys, RLS, data completeness (e.g., messages with missing conversation).
- **Performance**: Load test `/api/chat`, `/api/dashboard/*` with realistic concurrency; ensure indexes support queries.
- **Security**: Access control tests for authenticated vs unauthenticated; secrets never leaked in responses.

## 17. Risks & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Placeholder data persists due to missing schema fields | Misleading dashboards | Complete API contracts, feature flag to hide cards until live data available |
| Supabase query performance under load | Slow UI, timeouts | Add indexes (already in migrations), paginate endpoints, cache results |
| Cost overruns from GPT usage | Budget issues | Telemetry-based cost monitoring, usage caps, downgrade model fallback |
| WooCommerce API rate limits | Data freshness | Implement caching, incremental sync, backoff |
| Compliance breaches | Legal risk | Enforce retention, RLS, audit logging, security reviews |

## 18. Success Criteria
- 100% of dashboard widgets source data from live APIs (no static arrays).
- Conversation inbox reflects new chats within <5s latency.
- Analytics charts display response time, search success, CSAT for selectable ranges, matching queries against `chat_telemetry`.
- Customize page saves config and generated embed snippet works for new tenants.
- Knowledge gap detection loops into training workflow, reducing failed search rate by target percentage.
- Cost telemetry page shows live running total, projected burn, model usage.
- GDPR console lists export/delete requests with timestamps and status updates.

## 19. Next Actions
1. Configure GitHub secrets and trigger a manual run of `.github/workflows/nightly-telemetry-gdpr.yml` to verify the nightly seed/monitor/smoke pipeline.
2. Provision `MONITOR_ALERT_WEBHOOK_URL` (Slack webhook) so the built-in telemetry/GDPR monitor alerts fire when failures occur.
3. Add audit entry detail modal with raw payload + download per row to support deep-dive investigations.
4. Monitor the new `prune-gdpr-audit-log` cron job in Supabase (ensure weekly runs succeed after deployment).

---

### Implementation Log – 2025-09-19
- Added shared analytics helper (`lib/dashboard/analytics.ts`) powering `/api/dashboard/analytics` and new `/api/dashboard/overview`.
- Delivered `/api/dashboard/overview` endpoint assembling conversation, telemetry, and satisfaction metrics for dashboard consumption.
- Rewired `app/dashboard/page.tsx` to consume live overview data via `hooks/use-dashboard-overview`, replacing all placeholder widgets with Supabase-backed insights.
- Introduced client hook with abortable fetch + refresh controls; added dynamic insights, trend visualisation, recent conversation list, bot status, and quick stats driven by real data.
- Added `hooks/use-dashboard-analytics.ts` and refactored `app/dashboard/analytics/page.tsx` to consume `/api/dashboard/analytics`, surfacing live sentiment trends, top queries, language mix, and failed search detection with loading/error states.
- Hardened unit test scaffolding: scrape route suite now mocks Supabase/Next/OpenAI, ecommerce extractor loads collaborators at runtime, and Redis client bypasses network in Jest. Outstanding work: legacy suites (enhanced context, domain cache, etc.) still assume production Supabase/Redis; address them in a focused follow-up before enforcing full `npx jest --runInBand`.

### Implementation Log – 2025-09-20
- Delivered `/dashboard/telemetry` experience with range filters, domain drilldowns, hourly trends, model usage, live session summaries, and cost projections wired to `/api/dashboard/telemetry`.
- Added `useDashboardTelemetry` hook with abortable fetch logic and shared telemetry typings for reuse across UI surfaces.
- Updated dashboard layout navigation so telemetry insights sit alongside Overview, Analytics, and Conversations.
- Centralized dashboard-facing TypeScript contracts in `types/dashboard.ts` and refactored dashboard hooks to consume the shared definitions.
- Created `chat_telemetry_rollups` table, refresh routine, and pg_cron jobs so Supabase maintains 15-minute and daily aggregates for the telemetry dashboard.
- Refactored `/api/dashboard/telemetry` to source historical metrics and sparkline data from `chat_telemetry_rollups`, falling back to raw telemetry only when granularity filtering is required.
- Added `supabase/seeds/20251020_dashboard_sample_data.sql` so staging dashboards surface realistic conversation and telemetry stats immediately.
- Extended rollup coverage with `chat_telemetry_domain_rollups` and `chat_telemetry_model_rollups`, and updated the telemetry API to use aggregated breakdowns instead of scanning `chat_telemetry`.
- Exposed rollup freshness metadata in `/api/dashboard/telemetry` and surfaced a dashboard badge that flags stale aggregates to operators.
- Added `scripts/apply-dashboard-seed.sh` and `npm run seed:dashboard` helper so staging can rehydrate telemetry/conversation fixtures on demand.
- Introduced `scripts/monitor-telemetry-rollups.ts` with `npm run monitor:telemetry` to check rollup freshness via Supabase service credentials (fails fast when aggregates go stale).
- Added Jest regression coverage for `/api/dashboard/telemetry`, `useDashboardTelemetry`, and the dashboard telemetry page so rollup aggregation, hook refresh, and UI health badge stay validated.
- Added Playwright telemetry smoke test (`npm run test:telemetry-smoke`) intercepting `/api/dashboard/telemetry` to confirm UI wiring and rollup health badge rendering.
- Authored `docs/TELEMETRY_NIGHTLY_RUNBOOK.md` outlining the nightly seed → monitor → smoke workflow for staging automation.
- Added Jest coverage for GDPR export/delete endpoints to lock in compliance behaviour before wiring the dashboard UI.
- Wired `/dashboard/privacy` GDPR forms to the live export/delete endpoints with reusable hooks, inline validation, and success/error messaging.
- Added Playwright GDPR smoke (`__tests__/playwright/gdpr-privacy.spec.ts`) to verify export/download and deletion flows from the privacy dashboard.
- Added `/api/gdpr/audit`, Supabase `gdpr_audit_log` migration, GDPR monitoring script, and dashboard audit filters backed by live Supabase data.

### Implementation Log – 2025-09-21
- Added `lib/alerts/notify.ts` helper and wired Slack alert dispatch into `monitor:telemetry` and `monitor:gdpr` scripts so failures ping Ops automatically.
- Created `scripts/notify-monitor-failure.ts` and updated `.github/workflows/nightly-telemetry-gdpr.yml` to post alerts when the nightly workflow fails.
- Documented the `MONITOR_ALERT_WEBHOOK_URL` requirement plus alert behaviour in `docs/TELEMETRY_NIGHTLY_RUNBOOK.md` and `docs/GDPR_AUDIT_RUNBOOK.md`.
- Added Supabase migration `20251021_gdpr_audit_retention.sql` to prune audit log rows older than two years via weekly cron.
- Built `/api/gdpr/audit/options` and rewired the privacy dashboard audit filters to use live domain/actor lists with dropdown selectors and a sync button.
- Added `/api/gdpr/audit` CSV export mode plus privacy dashboard controls for date range filtering and one-click CSV downloads.
- Expanded `docs/TELEMETRY_NIGHTLY_RUNBOOK.md` with GitHub secret configuration steps and manual run validation checklist for the nightly workflow.
