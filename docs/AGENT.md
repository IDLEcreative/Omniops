# Unified Agent Operations Guide

**Type:** Reference  
**Status:** Active  
**Last Updated:** 2025-11-02  
**Verified For:** v0.1.0  
**Estimated Read Time:** 4 minutes

## Purpose
The agent layer coordinates customer-facing conversations, enforces tenant policies, and orchestrates commerce or knowledge lookups through provider integrations. This guide summarizes the core responsibilities, control flow, and extension points required to operate or expand the system safely across any tenant vertical.

## Quick Links
- [Operating Model](#operating-model)
- [Conversation Lifecycle](#conversation-lifecycle)
- [Prompt & Policy Guardrails](#prompt--policy-guardrails)
- [Data & Integrations](#data--integrations)
- [Observability](#observability)
- [Extending the Agent Layer](#extending-the-agent-layer)
- [Testing Expectations](#testing-expectations)

## Operating Model

- **Entry Points:** Widget and dashboard clients call `app/api/chat/route.ts` (standard) or `app/api/chat-intelligent/route.ts` (parallel retrieval variant). Both paths normalize payloads, enforce rate limits, and enqueue persistence work.
- **Router:** `lib/agents/router.ts` selects the appropriate specialization (`CustomerServiceAgent`, `WooCommerceAgent`, intelligent search agent, etc.) using tenant feature flags and message intent signals.
- **Context Assembly:** Each agent composes a system prompt via `getEnhancedSystemPrompt`, merging tenant configuration, verification state, customer history, telemetry reminders, and knowledge search results.
- **Tooling Layer:** Agents invoke commerce providers (`lib/agents/providers/*`), retrieval utilities, and verification helpers. Tool execution follows a read-first contract to avoid cross-tenant leakage.
- **Policy Enforcement:** Guardrails in `lib/agents/customer-service-agent.ts` and related utilities ensure compliance with verification state, redaction rules, and refusal guidelines.

## Conversation Lifecycle

1. **Ingress & Validation:** Request metadata is validated, throttling is applied, and the tenant configuration is fetched.
2. **Persistence Setup:** Conversation and message rows are created asynchronously so the UI can stream responses without blocking.
3. **Agent Selection:** Router inspects intent, feature toggles, and environment to choose the correct specialization.
4. **Context Expansion:** Agent loads embeddings results, tenant knowledge, customer profile data, and any commerce artifacts required to answer the request.
5. **Tool Execution Loop:** For intelligent flows, ReAct-style iterations perform searches or commerce lookups until confidence thresholds are met.
6. **Response Streaming:** The final assistant message streams back to the client; persistence workers commit the transcript and tool traces.
7. **Telemetry:** `lib/chat-telemetry.ts` and related utilities record token usage, latency, and model costs for dashboards and alerting.

## Prompt & Policy Guardrails

- **Verification States:** Agents tailor prompts for `none`, `basic`, and `full` verification to control access to personally identifiable or order data.
- **Multi-Tenant Neutrality:** Prompts never hardcode tenant names, product categories, or industry assumptions. All brand-specific language must originate from tenant configuration or retrieved knowledge.
- **Response Contract:** Replies follow concise Markdown with actionable bullets, explicit data provenance, and empathetic tone. Escalation instructions and links are compact and tenant-neutral.
- **Hallucination Controls:** Agents refuse to fabricate inventory, pricing, or unsupported capabilities. Commerce answers rely on provider data; knowledge answers cite retrieved documents.
- **Fallbacks & Escalation:** Low-confidence scenarios trigger human handoff suggestions, request clarifications, or point to self-service knowledge depending on tenant policies.

## Data & Integrations

- **Primary Store:** Supabase Postgres hosts conversations, messages, telemetry, customer configuration, knowledge documents, embeddings, and commerce synchronization tables.
- **Commerce Providers:** Implementations live under `lib/agents/providers/` and adhere to the `CommerceProvider` interface. Each provider is isolated behind a factory to preserve tenant boundaries.
- **Knowledge Retrieval:** Embeddings search and structured extraction run through workers that populate `scraped_pages`, `page_embeddings`, and knowledge views. Agents consume retrieval via standardized helpers.
- **Telemetry:** Usage metrics flow into `chat_telemetry` tables and are surfaced by `/dashboard/telemetry` along with cost aggregation utilities.

## Observability

- **Dashboards:** `/dashboard/overview`, `/dashboard/analytics`, and `/dashboard/telemetry` visualize conversation outcomes, intents, and spend trends.
- **Monitoring APIs:** `/api/monitoring/chat` and related routes expose live traces for operational debugging.
- **Alerting Hooks:** Thresholds for error rates, model cost spikes, or excessive tool iterations are configurable per tenant. Alerts rely on telemetry rollups and Supabase triggers.
- **Logging:** Detailed run logs are persisted alongside telemetry records; use them to audit tool usage, refusals, and verification transitions.

## Extending the Agent Layer

1. **Define the Specialization:** Create a new agent file in `lib/agents/` that implements the shared agent contract (`getEnhancedSystemPrompt`, `getActionPrompt`, `buildCompleteContext`, etc.).
2. **Integrate Providers:** If the specialization requires a new commerce or data provider, implement it under `lib/agents/providers/` and register it with the provider factory.
3. **Update Routing:** Extend `lib/agents/router.ts` to reference the new specialization, guarded by a feature flag or intent rule. Avoid hardcoding tenant identifiers—make decisions based on configuration.
4. **Document Behavior:** Add a guide or reference entry under `docs/` describing capabilities, guardrails, and rollout expectations.
5. **Safeguard Telemetry:** Ensure the new agent reports token counts, latency, and tool executions so dashboards stay consistent.

## Testing Expectations

- **Unit & Integration:** Add focused tests in `__tests__/agents/` (or appropriate category) covering prompt assembly, routing, and provider interactions. Mock external APIs to preserve repeatability.
- **End-to-End:** Extend multi-turn conversation tests to validate conversation persistence, verification state transitions, and escalation logic when the new agent is selected.
- **Regression Suites:** Run `npm run test:all`, telemetry smoke tests, and any provider-specific validation scripts before deployment.
- **Manual Verification:** Validate responses through the embedded widget and dashboard inbox to confirm streaming, persistence, and telemetry all update correctly across tenants.

## Reference Index

- Agent Architecture: `docs/01-ARCHITECTURE/ARCHITECTURE_AGENT_SYSTEM.md`
- Agent Enhancements Overview: `docs/01-ARCHITECTURE/ARCHITECTURE_AGENT_ENHANCEMENTS.md`
- Adding Agents & Providers: `docs/04-DEVELOPMENT/code-patterns/adding-agents-providers.md`
- Agent-Aware Skills Framework: `docs/04-ANALYSIS/ANALYSIS_AGENT_AWARE_SKILLS_FRAMEWORK.md`
- Telemetry System: `docs/01-ARCHITECTURE/ARCHITECTURE_TELEMETRY_SYSTEM.md`
