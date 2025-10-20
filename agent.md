# OmniOps Conversational Agent Playbook

## 1. Role & Outcomes
- Deliver Intercom-grade support across the embedded widget, dashboard inbox, and workflow automations by orchestrating conversations through `app/api/chat/route.ts`.
- Ground every reply in live Supabase data so the agent can reference customer profiles, telemetry, orders, and knowledge content without hallucination.
- Expose actionable analytics (cost, satisfaction, intent trends) that feed `/dashboard/overview`, `/dashboard/analytics`, and `/dashboard/telemetry`.
- Core success metrics: <5s perceived latency, 100% conversations persisted, telemetry coverage for every model invocation, and zero unverified PII disclosure.

## 2. System Architecture
- **Entry Points**: Widget + dashboard send requests to `/api/chat` (primary) and `/api/chat-intelligent` (parallel-search variant) for streaming responses and persistence.
- **Agent Layer**: `lib/agents/router.ts` selects between `CustomerServiceAgent`, `CustomerServiceAgentIntelligent`, `WooCommerceAgent`, or domain-agnostic agents based on feature flags and query intent (`docs/AGENTS.md`).
- **Context Providers**: Knowledge retrieval (embeddings, structured extractions, scraped pages), customer verification (`lib/customer-verification.ts`), and order history enrichment.
- **External Tools**: WooCommerce dynamic client (`lib/woocommerce-dynamic.ts`), scraping workers, telemetry manager, and queued cron jobs that maintain embeddings and rollups.
- **Data Platform**: Supabase Postgres tables spanning conversations, telemetry, knowledge, and commerce data (`docs/CUSTOMER_SERVICE_SAAS_INTEGRATION_BLUEPRINT.md`, `docs/SUPABASE_SCHEMA.md`).
- **Dashboards & Hooks**: Dashboard pages consume unified hooks (`hooks/use-dashboard-*.ts`) backed by `/api/dashboard/*` routes for real-time operational visibility.

## 3. Conversation Lifecycle
1. **Ingress & Validation**: Request enters `app/api/chat/route.ts`, applies domain throttles, resolves tenant config, and issues/validates `conversation_id`.
2. **Persistence Setup**: Conversation and message rows are created in Supabase with async writes for low latency while guaranteeing replayable history.
3. **Agent Selection**: Router analyses message intent + feature toggles to choose the right agent prompt package (generic vs WooCommerce vs intelligent multi-search).
4. **Context Assembly**: Agent builds enhanced system prompt combining verification state, customer context, embeddings search hits, product data, and policy reminders.
5. **Tool Execution**: ReAct-style loop (in intelligent route) runs parallel searches, WooCommerce lookups, and enrichment utilities until confidence thresholds met.
6. **Response Streaming**: Assistant reply streams back to client while persistence jobs finish storing assistant messages and search traces.
7. **Telemetry & Feedback**: `lib/chat-telemetry.ts` records session metrics (tokens, iterations, cost, errors) which feed the telemetry dashboard and cost alerts.

## 4. Prompting & Behavioral Guardrails
- **Verification States**: Agents adapt prompts for `none`, `basic`, and `full` verification to gate access to order/payment data and enforce GDPR policies.
- **Response Contract**: Markdown with scannable bullets, product lists before clarification questions, compact links, and empathetic tone (`lib/agents/customer-service-agent.ts`).
- **Anti-Hallucination**: Agents refuse to fabricate stock, prices, or third-party recommendations; they defer to WooCommerce stock endpoints for exact inventory.
- **Escalation Paths**: Built-in messaging guides users to human handoff, knowledge-base articles, or follow-up workflows when confidence drops below thresholds.

## 5. Data Contracts & Background Jobs
- **Core Tables**: `conversations`, `messages`, `customers`, `customer_configs`, `chat_telemetry`, `woocommerce_*`, `scraped_pages`, `page_embeddings`, `training_data`.
- **Rollups & Views**: `chat_telemetry_rollups`, `chat_telemetry_metrics`, and embedding health views power dashboards and anomaly detection.
- **Pipelines**: Scraper and WooCommerce sync workers refresh knowledge and commerce data; cron jobs maintain embeddings, telemetry aggregates, and stale content checks.
- **Compliance Tracking**: GDPR and privacy log tables (planned) align with roadmap commitments for export/delete workflows.

## 6. Configuration & Deployment Checklist
- Required environment: Supabase service keys, OpenAI API key, WooCommerce credentials (URL + consumer key/secret), telemetry retention settings, and domain-specific feature flags.
- Enable WooCommerce agent via tenant config (`customer_configs.features.woocommerce`) or environment detection fallback.
- Confirm `MODEL_PRICING` map in telemetry config reflects deployed models to avoid cost blind spots.
- Run Supabase migrations (`npm run migrate:encrypt-credentials`, `supabase db push` if applicable) before deploying intelligence or telemetry upgrades.
- For dashboard parity, ensure Next.js incremental static regeneration is disabled on chat-critical pages so fresh metrics pull via SWR.

## 7. Observability & Operations
- **Telemetry Dashboard**: `/dashboard/telemetry` visualizes spend, model mix, response times, and domain-level usage using `/api/dashboard/telemetry` aggregates.
- **Operational Hooks**: `use-dashboard-overview`, `use-dashboard-analytics`, and `use-dashboard-telemetry` surface live insights for support leads.
- **Alerting**: Configure thresholds for cost spikes, elevated error rates, or high iteration counts using telemetry trend fields and Supabase triggers.
- **Logging**: Detailed traces stored in `chat_telemetry.logs` and server logs; leverage monitoring API at `/api/monitoring/chat` for real-time debugging.
- **Troubleshooting Playbook**: Validate conversation history persistence, check WooCommerce credential health, confirm embeddings freshness, and inspect rate-limiting policies (`docs/CHAT_SYSTEM_DOCUMENTATION.md`).

## 8. Testing & Quality Gates
- **Automated Suites**: Jest-based validation covering conversation flow, telemetry, knowledge retrieval, and WooCommerce scenarios (`test-agent-conversation-suite.ts`, `test-complete-provider-pattern.ts`, `test-parallel-context-gathering.ts`, telemetry tests).
- **Manual Verification**: Run `npm run test:all`, `npm run monitor:telemetry`, `npm run monitor:gdpr`, `npm run test:telemetry-smoke`, and `npm run test:gdpr-smoke` to validate widget-to-dashboard pipelines (`docs/TESTING.md`, `docs/CHAT_TEST_RESULTS.md`, `docs/TELEMETRY_NIGHTLY_RUNBOOK.md`, `docs/GDPR_AUDIT_RUNBOOK.md`).
- **Data QA**: Scheduled Supabase checks ensure referential integrity between messages and conversations; monitor embedding drift with `npm run embeddings:health`.
- **Performance**: Load testing endpoints `/api/chat` and `/api/dashboard/*` maintains latency and throughput metrics (`docs/PERFORMANCE_OPTIMIZATION_REPORT.md`).

## 9. Roadmap & Risk Watchlist
- Priority enhancements: search intelligence layer, natural language query parser, smart fallback strategies, telemetry enrichment for satisfaction/failed-search clustering (`docs/AGENT_SYSTEM_ENHANCEMENTS.md`).
- Compliance backlog: GDPR request UI + audit logs, privacy dashboards, retention automation (`docs/CUSTOMER_SERVICE_SAAS_INTEGRATION_BLUEPRINT.md`).
- Emerging risks: WooCommerce rate limits, GPT cost spikes, cron drift, and legacy test suites that still hit production Supabase/Redis; track mitigations before enforcing full CI gating.

## 10. Reference Index
- Integration Blueprint – `docs/CUSTOMER_SERVICE_SAAS_INTEGRATION_BLUEPRINT.md`
- Chat System Deep Dive – `docs/CHAT_SYSTEM_DOCUMENTATION.md`
- Agent Architecture – `docs/AGENTS.md`
- Intelligent Chat Summary – `INTELLIGENT_CHAT_SYSTEM_SUMMARY.md`
- Telemetry System – `docs/TELEMETRY_SYSTEM.md`
- WooCommerce Agent Integration – `WOOCOMMERCE_AGENT_INTEGRATION_COMPLETE.md`
- Observability Guide – `OBSERVABILITY_GUIDE.md`
