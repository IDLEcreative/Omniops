# Documentation Code Example Validation Report

Generated: 2025-10-24T21:30:13.392Z

## Summary

- **Total Documentation Files**: 1605
- **Total Code Blocks**: 10486
- **Critical Issues**: 345
- **Warnings**: 161
- **Info**: 520

## Code Blocks by Language

| Language | Count |
|----------|-------|
| js | 3302 |
| typescript | 1751 |
| bash | 1446 |
| text | 1101 |
| javascript | 843 |
| sql | 382 |
| json | 357 |
| sh | 351 |
| ts | 271 |
| html | 136 |
| shell | 89 |
| tsx | 59 |
| console | 56 |
| jsx | 51 |
| yaml | 44 |
| http | 41 |
| jsonc | 30 |
| env | 27 |
| cmd | 16 |
| css | 15 |
| diff | 15 |
| mermaid | 14 |
| markdown | 9 |
| dockerfile | 8 |
| TypeScript | 8 |
| mjs | 7 |
| php | 6 |
| bnf | 6 |
| plantuml | 5 |
| json5 | 5 |
| Shell | 4 |
| dosini | 4 |
| python | 3 |
| ini | 3 |
| nginx | 2 |
| redis | 2 |
| coffee | 2 |
| cjs | 2 |
| Text | 2 |
| webidl | 2 |
| cron | 1 |
| conf | 1 |
| dockerignore | 1 |
| apache | 1 |
| InflatedDataHandler | 1 |
| ruby | 1 |
| scss | 1 |
| plaintext | 1 |
| j | 1 |

## Issues by File

### docs/ALL_NPX_TOOLS_REFERENCE.md

🔴 **CRITICAL** (Line 30, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats              # View scraping statistics`

🔴 **CRITICAL** (Line 30, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean              # Clean all scraped data`

🔴 **CRITICAL** (Line 30, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --domain=X   # Clean specific domain`

🔴 **CRITICAL** (Line 30, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --dry-run    # Preview cleanup`

🔴 **CRITICAL** (Line 39, bash)
- Script does not exist: optimize-database.ts
- Code: `npx tsx optimize-database.ts`

🔴 **CRITICAL** (Line 51, bash)
- Script does not exist: check-embeddings-table.ts
- Code: `npx tsx check-embeddings-table.ts`

🔴 **CRITICAL** (Line 57, bash)
- Script does not exist: apply-telemetry-migration.ts
- Code: `npx tsx apply-telemetry-migration.ts`

🔴 **CRITICAL** (Line 67, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check   # Run health check`

🔴 **CRITICAL** (Line 67, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto    # Run auto-maintenance`

🔴 **CRITICAL** (Line 67, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts watch   # Continuous monitoring`

🔴 **CRITICAL** (Line 75, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze              # Analyze current chunks`

🔴 **CRITICAL** (Line 75, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts optimize             # Optimize chunks (live)`

🔴 **CRITICAL** (Line 75, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts optimize --dry-run   # Preview changes`

🔴 **CRITICAL** (Line 75, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts validate             # Validate chunk sizes`

🔴 **CRITICAL** (Line 75, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts constraints          # Show SQL constraints`

🔴 **CRITICAL** (Line 85, bash)
- Script does not exist: batch-rechunk-embeddings.ts
- Code: `npx tsx batch-rechunk-embeddings.ts --force  # Run batch rechunking`

🔴 **CRITICAL** (Line 91, bash)
- Script does not exist: simple-rechunk.ts
- Code: `npx tsx simple-rechunk.ts`

🔴 **CRITICAL** (Line 97, bash)
- Script does not exist: performance-bottleneck-analyzer.ts
- Code: `npx tsx performance-bottleneck-analyzer.ts`

🔴 **CRITICAL** (Line 103, bash)
- Script does not exist: test-database-performance.ts
- Code: `npx tsx test-database-performance.ts`

🔴 **CRITICAL** (Line 109, bash)
- Script does not exist: test-database-performance-diagnosis.ts
- Code: `npx tsx test-database-performance-diagnosis.ts`

🔴 **CRITICAL** (Line 115, bash)
- Script does not exist: benchmark-pipeline-performance.ts
- Code: `npx tsx benchmark-pipeline-performance.ts`

🔴 **CRITICAL** (Line 121, bash)
- Script does not exist: benchmark-search-performance.ts
- Code: `npx tsx benchmark-search-performance.ts`

🔴 **CRITICAL** (Line 127, bash)
- Script does not exist: benchmark-quick-search.ts
- Code: `npx tsx benchmark-quick-search.ts`

🔴 **CRITICAL** (Line 133, bash)
- Script does not exist: benchmark-search-improvements.ts
- Code: `npx tsx benchmark-search-improvements.ts`

🔴 **CRITICAL** (Line 139, bash)
- Script does not exist: profile-search-performance.ts
- Code: `npx tsx profile-search-performance.ts`

🔴 **CRITICAL** (Line 145, bash)
- Script does not exist: test-performance-analysis.ts
- Code: `npx tsx test-performance-analysis.ts`

🔴 **CRITICAL** (Line 151, bash)
- Script does not exist: test-performance-comparison.ts
- Code: `npx tsx test-performance-comparison.ts`

🔴 **CRITICAL** (Line 157, bash)
- Script does not exist: test-performance-direct.ts
- Code: `npx tsx test-performance-direct.ts`

🔴 **CRITICAL** (Line 163, bash)
- Script does not exist: test-performance-fixes.ts
- Code: `npx tsx test-performance-fixes.ts`

🔴 **CRITICAL** (Line 169, bash)
- Script does not exist: test-api-performance.ts
- Code: `npx tsx test-api-performance.ts`

🔴 **CRITICAL** (Line 175, bash)
- Script does not exist: test-api-optimizations.ts
- Code: `npx tsx test-api-optimizations.ts`

🔴 **CRITICAL** (Line 185, bash)
- Script does not exist: test-system-health-check.ts
- Code: `npx tsx test-system-health-check.ts`

🔴 **CRITICAL** (Line 197, bash)
- Script does not exist: test-customer-satisfaction-journey.ts
- Code: `npx tsx test-customer-satisfaction-journey.ts`

🔴 **CRITICAL** (Line 203, bash)
- Script does not exist: test-customer-satisfaction-journey-quick.ts
- Code: `npx tsx test-customer-satisfaction-journey-quick.ts`

🔴 **CRITICAL** (Line 209, bash)
- Script does not exist: validate-all-optimizations.ts
- Code: `npx tsx validate-all-optimizations.ts`

🔴 **CRITICAL** (Line 215, bash)
- Script does not exist: validate-fixes.ts
- Code: `npx tsx validate-fixes.ts`

🔴 **CRITICAL** (Line 221, bash)
- Script does not exist: validate-optimizations.ts
- Code: `npx tsx validate-optimizations.ts`

🔴 **CRITICAL** (Line 227, bash)
- Script does not exist: validate-search-improvements.ts
- Code: `npx tsx validate-search-improvements.ts`

🔴 **CRITICAL** (Line 233, bash)
- Script does not exist: validate-intelligent-search-api.ts
- Code: `npx tsx validate-intelligent-search-api.ts`

🔴 **CRITICAL** (Line 239, bash)
- Script does not exist: comprehensive-phase1-validation.ts
- Code: `npx tsx comprehensive-phase1-validation.ts`

🔴 **CRITICAL** (Line 245, bash)
- Script does not exist: phase1-validation-final.ts
- Code: `npx tsx phase1-validation-final.ts`

🔴 **CRITICAL** (Line 251, bash)
- Script does not exist: edge-case-test-suite.ts
- Code: `npx tsx edge-case-test-suite.ts`

🔴 **CRITICAL** (Line 261, bash)
- Script does not exist: audit-embeddings-comprehensive.ts
- Code: `npx tsx audit-embeddings-comprehensive.ts`

🔴 **CRITICAL** (Line 267, bash)
- Script does not exist: analyze-dc66-embeddings.ts
- Code: `npx tsx analyze-dc66-embeddings.ts`

🔴 **CRITICAL** (Line 273, bash)
- Script does not exist: investigate-missing-embeddings.ts
- Code: `npx tsx investigate-missing-embeddings.ts`

🔴 **CRITICAL** (Line 279, bash)
- Script does not exist: clean-contaminated-embeddings.ts
- Code: `npx tsx clean-contaminated-embeddings.ts`

🔴 **CRITICAL** (Line 285, bash)
- Script does not exist: clean-remaining-contamination.ts
- Code: `npx tsx clean-remaining-contamination.ts`

🔴 **CRITICAL** (Line 291, bash)
- Script does not exist: identify-contaminated-domains.ts
- Code: `npx tsx identify-contaminated-domains.ts`

🔴 **CRITICAL** (Line 297, bash)
- Script does not exist: test-search-accuracy.ts
- Code: `npx tsx test-search-accuracy.ts`

🔴 **CRITICAL** (Line 303, bash)
- Script does not exist: test-search-consistency.ts
- Code: `npx tsx test-search-consistency.ts`

🔴 **CRITICAL** (Line 309, bash)
- Script does not exist: test-search-fresh.ts
- Code: `npx tsx test-search-fresh.ts`

🔴 **CRITICAL** (Line 315, bash)
- Script does not exist: test-search-performance.ts
- Code: `npx tsx test-search-performance.ts`

🔴 **CRITICAL** (Line 321, bash)
- Script does not exist: test-quick-search.ts
- Code: `npx tsx test-quick-search.ts`

🔴 **CRITICAL** (Line 327, bash)
- Script does not exist: test-simple-query.ts
- Code: `npx tsx test-simple-query.ts`

🔴 **CRITICAL** (Line 333, bash)
- Script does not exist: test-specific-search.ts
- Code: `npx tsx test-specific-search.ts`

🔴 **CRITICAL** (Line 339, bash)
- Script does not exist: test-comprehensive-search-coverage.ts
- Code: `npx tsx test-comprehensive-search-coverage.ts`

🔴 **CRITICAL** (Line 345, bash)
- Script does not exist: test-focused-search-verification.ts
- Code: `npx tsx test-focused-search-verification.ts`

🔴 **CRITICAL** (Line 351, bash)
- Script does not exist: verify-chunk-retrieval-any-domain.ts
- Code: `npx tsx verify-chunk-retrieval-any-domain.ts`

🔴 **CRITICAL** (Line 357, bash)
- Script does not exist: verify-full-chunk-retrieval.ts
- Code: `npx tsx verify-full-chunk-retrieval.ts`

🔴 **CRITICAL** (Line 367, bash)
- Script does not exist: test-woocommerce-all-endpoints.ts
- Code: `npx tsx test-woocommerce-all-endpoints.ts`

🔴 **CRITICAL** (Line 373, bash)
- Script does not exist: test-woocommerce-agent-complete.ts
- Code: `npx tsx test-woocommerce-agent-complete.ts`

🔴 **CRITICAL** (Line 379, bash)
- Script does not exist: test-woocommerce-cache-performance.ts
- Code: `npx tsx test-woocommerce-cache-performance.ts`

🔴 **CRITICAL** (Line 385, bash)
- Script does not exist: test-woocommerce-e2e-chat.ts
- Code: `npx tsx test-woocommerce-e2e-chat.ts`

🔴 **CRITICAL** (Line 391, bash)
- Script does not exist: test-wc-cache-direct.ts
- Code: `npx tsx test-wc-cache-direct.ts`

🔴 **CRITICAL** (Line 397, bash)
- Script does not exist: manual-woocommerce-evaluation.ts
- Code: `npx tsx manual-woocommerce-evaluation.ts`

🔴 **CRITICAL** (Line 403, bash)
- Script does not exist: run-product-extraction.ts
- Code: `npx tsx run-product-extraction.ts`

🔴 **CRITICAL** (Line 409, bash)
- Script does not exist: test-complete-product-discovery.ts
- Code: `npx tsx test-complete-product-discovery.ts`

🔴 **CRITICAL** (Line 415, bash)
- Script does not exist: verify-ai-product-accuracy.ts
- Code: `npx tsx verify-ai-product-accuracy.ts`

🔴 **CRITICAL** (Line 425, bash)
- Script does not exist: security-chaos-test.ts
- Code: `npx tsx security-chaos-test.ts`

🔴 **CRITICAL** (Line 431, bash)
- Script does not exist: security-chaos-test-fast.ts
- Code: `npx tsx security-chaos-test-fast.ts`

🔴 **CRITICAL** (Line 437, bash)
- Script does not exist: security-chaos-targeted.ts
- Code: `npx tsx security-chaos-targeted.ts`

🔴 **CRITICAL** (Line 443, bash)
- Script does not exist: chaos-test-search-pipeline.ts
- Code: `npx tsx chaos-test-search-pipeline.ts`

🔴 **CRITICAL** (Line 449, bash)
- Script does not exist: chaos-test-dc66-focused.ts
- Code: `npx tsx chaos-test-dc66-focused.ts`

🔴 **CRITICAL** (Line 459, bash)
- Script does not exist: clear-cache.ts
- Code: `npx tsx clear-cache.ts`

🔴 **CRITICAL** (Line 465, bash)
- Script does not exist: clear-cifa-cache.ts
- Code: `npx tsx clear-cifa-cache.ts`

🔴 **CRITICAL** (Line 471, bash)
- Script does not exist: clear-stale-cache.ts
- Code: `npx tsx clear-stale-cache.ts`

🔴 **CRITICAL** (Line 477, bash)
- Script does not exist: test-clear-cache.ts
- Code: `npx tsx test-clear-cache.ts`

🔴 **CRITICAL** (Line 483, bash)
- Script does not exist: test-cache-consistency.ts
- Code: `npx tsx test-cache-consistency.ts`

🔴 **CRITICAL** (Line 493, bash)
- Script does not exist: clean-thompson-data.ts
- Code: `npx tsx clean-thompson-data.ts`

🔴 **CRITICAL** (Line 499, bash)
- Script does not exist: apply_fix_directly.ts
- Code: `npx tsx apply_fix_directly.ts`

🔴 **CRITICAL** (Line 505, bash)
- Script does not exist: execute_fix.ts
- Code: `npx tsx execute_fix.ts`

🔴 **CRITICAL** (Line 515, bash)
- Script does not exist: debug-test.ts
- Code: `npx tsx debug-test.ts`

🔴 **CRITICAL** (Line 521, bash)
- Script does not exist: investigate-indexes.ts
- Code: `npx tsx investigate-indexes.ts`

🔴 **CRITICAL** (Line 527, bash)
- Script does not exist: investigate-indexes-direct.ts
- Code: `npx tsx investigate-indexes-direct.ts`

🔴 **CRITICAL** (Line 533, bash)
- Script does not exist: investigate-data-architecture.ts
- Code: `npx tsx investigate-data-architecture.ts`

🔴 **CRITICAL** (Line 539, bash)
- Script does not exist: investigate_column_type.ts
- Code: `npx tsx investigate_column_type.ts`

🔴 **CRITICAL** (Line 545, bash)
- Script does not exist: investigate_embedding_format.ts
- Code: `npx tsx investigate_embedding_format.ts`

🔴 **CRITICAL** (Line 551, bash)
- Script does not exist: verify_db_state.ts
- Code: `npx tsx verify_db_state.ts`

🔴 **CRITICAL** (Line 557, bash)
- Script does not exist: analyze-index-problems.ts
- Code: `npx tsx analyze-index-problems.ts`

🔴 **CRITICAL** (Line 563, bash)
- Script does not exist: analyze-intelligent-search-performance.ts
- Code: `npx tsx analyze-intelligent-search-performance.ts`

🔴 **CRITICAL** (Line 569, bash)
- Script does not exist: diagnose-dc66-pipeline.ts
- Code: `npx tsx diagnose-dc66-pipeline.ts`

🔴 **CRITICAL** (Line 575, bash)
- Script does not exist: forensic-dc66-investigation.ts
- Code: `npx tsx forensic-dc66-investigation.ts`

🔴 **CRITICAL** (Line 581, bash)
- Script does not exist: investigate-cifa-embeddings.ts
- Code: `npx tsx investigate-cifa-embeddings.ts`

🔴 **CRITICAL** (Line 587, bash)
- Script does not exist: investigate-cifa-limit.ts
- Code: `npx tsx investigate-cifa-limit.ts`

🔴 **CRITICAL** (Line 593, bash)
- Script does not exist: investigate-dc66-products.ts
- Code: `npx tsx investigate-dc66-products.ts`

🔴 **CRITICAL** (Line 599, bash)
- Script does not exist: verify-dc66-products.ts
- Code: `npx tsx verify-dc66-products.ts`

🔴 **CRITICAL** (Line 605, bash)
- Script does not exist: verify-cifa-fixes.ts
- Code: `npx tsx verify-cifa-fixes.ts`

🔴 **CRITICAL** (Line 611, bash)
- Script does not exist: verify-exact-cifa-count.ts
- Code: `npx tsx verify-exact-cifa-count.ts`

🔴 **CRITICAL** (Line 617, bash)
- Script does not exist: log-analyzer-example.ts
- Code: `npx tsx log-analyzer-example.ts`

🔴 **CRITICAL** (Line 623, bash)
- Script does not exist: check-all-domains.ts
- Code: `npx tsx check-all-domains.ts`

🔴 **CRITICAL** (Line 629, bash)
- Script does not exist: check-bulk-functions.ts
- Code: `npx tsx check-bulk-functions.ts`

🔴 **CRITICAL** (Line 635, bash)
- Script does not exist: check-domain-id.ts
- Code: `npx tsx check-domain-id.ts`

🔴 **CRITICAL** (Line 641, bash)
- Script does not exist: check_bulk_function.ts
- Code: `npx tsx check_bulk_function.ts`

🔴 **CRITICAL** (Line 647, bash)
- Script does not exist: get-null-text-urls.ts
- Code: `npx tsx get-null-text-urls.ts`

🔴 **CRITICAL** (Line 653, bash)
- Script does not exist: test-direct-supabase-query.ts
- Code: `npx tsx test-direct-supabase-query.ts`

🔴 **CRITICAL** (Line 659, bash)
- Script does not exist: test-raw-response.ts
- Code: `npx tsx test-raw-response.ts`

🔴 **CRITICAL** (Line 669, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

🔴 **CRITICAL** (Line 675, bash)
- Script does not exist: test-anti-hallucination.ts
- Code: `npx tsx test-anti-hallucination.ts`

🔴 **CRITICAL** (Line 681, bash)
- Script does not exist: test-ai-context-analysis.ts
- Code: `npx tsx test-ai-context-analysis.ts`

🔴 **CRITICAL** (Line 687, bash)
- Script does not exist: test-ai-to-woocommerce-agent.ts
- Code: `npx tsx test-ai-to-woocommerce-agent.ts`

🔴 **CRITICAL** (Line 693, bash)
- Script does not exist: test-chat-intelligent-cifa.ts
- Code: `npx tsx test-chat-intelligent-cifa.ts`

🔴 **CRITICAL** (Line 699, bash)
- Script does not exist: test-chat-route-cifa.ts
- Code: `npx tsx test-chat-route-cifa.ts`

🔴 **CRITICAL** (Line 705, bash)
- Script does not exist: test-cifa-conversation.ts
- Code: `npx tsx test-cifa-conversation.ts`

🔴 **CRITICAL** (Line 711, bash)
- Script does not exist: test-cifa-direct-search.ts
- Code: `npx tsx test-cifa-direct-search.ts`

🔴 **CRITICAL** (Line 717, bash)
- Script does not exist: test-cifa-fix-verification.ts
- Code: `npx tsx test-cifa-fix-verification.ts`

🔴 **CRITICAL** (Line 723, bash)
- Script does not exist: test-cifa-forensic-analysis.ts
- Code: `npx tsx test-cifa-forensic-analysis.ts`

🔴 **CRITICAL** (Line 729, bash)
- Script does not exist: test-cifa-pump-comparison.ts
- Code: `npx tsx test-cifa-pump-comparison.ts`

🔴 **CRITICAL** (Line 735, bash)
- Script does not exist: test-cifa-reasoning-trace.ts
- Code: `npx tsx test-cifa-reasoning-trace.ts`

🔴 **CRITICAL** (Line 741, bash)
- Script does not exist: test-cifa-search-direct.ts
- Code: `npx tsx test-cifa-search-direct.ts`

🔴 **CRITICAL** (Line 747, bash)
- Script does not exist: test-all-cifa-pumps.ts
- Code: `npx tsx test-all-cifa-pumps.ts`

🔴 **CRITICAL** (Line 753, bash)
- Script does not exist: test-generic-intelligence.ts
- Code: `npx tsx test-generic-intelligence.ts`

🔴 **CRITICAL** (Line 759, bash)
- Script does not exist: test-intelligent-chat-final.ts
- Code: `npx tsx test-intelligent-chat-final.ts`

🔴 **CRITICAL** (Line 765, bash)
- Script does not exist: test-intelligent-cifa-analysis.ts
- Code: `npx tsx test-intelligent-cifa-analysis.ts`

🔴 **CRITICAL** (Line 771, bash)
- Script does not exist: test-intelligent-product-workflow.ts
- Code: `npx tsx test-intelligent-product-workflow.ts`

🔴 **CRITICAL** (Line 777, bash)
- Script does not exist: test-intelligent-search-direct.ts
- Code: `npx tsx test-intelligent-search-direct.ts`

🔴 **CRITICAL** (Line 783, bash)
- Script does not exist: test-widget-intelligent-route.ts
- Code: `npx tsx test-widget-intelligent-route.ts`

🔴 **CRITICAL** (Line 793, bash)
- Script does not exist: test-telemetry-system.ts
- Code: `npx tsx test-telemetry-system.ts`

🔴 **CRITICAL** (Line 799, bash)
- Script does not exist: test-telemetry-live.ts
- Code: `npx tsx test-telemetry-live.ts`

🔴 **CRITICAL** (Line 805, bash)
- Script does not exist: test-telemetry-persistence.ts
- Code: `npx tsx test-telemetry-persistence.ts`

🔴 **CRITICAL** (Line 811, bash)
- Script does not exist: test-token-cost-logging.ts
- Code: `npx tsx test-token-cost-logging.ts`

🔴 **CRITICAL** (Line 817, bash)
- Script does not exist: test-direct-token-logging.ts
- Code: `npx tsx test-direct-token-logging.ts`

🔴 **CRITICAL** (Line 827, bash)
- Script does not exist: test-parallel-context-gathering.ts
- Code: `npx tsx test-parallel-context-gathering.ts`

🔴 **CRITICAL** (Line 833, bash)
- Script does not exist: test-parallel-quick.ts
- Code: `npx tsx test-parallel-quick.ts`

🔴 **CRITICAL** (Line 839, bash)
- Script does not exist: test-parallel-tools-execution.ts
- Code: `npx tsx test-parallel-tools-execution.ts`

🔴 **CRITICAL** (Line 845, bash)
- Script does not exist: test-comprehensive-tool-analysis.ts
- Code: `npx tsx test-comprehensive-tool-analysis.ts`

🔴 **CRITICAL** (Line 851, bash)
- Script does not exist: test-tool-report.ts
- Code: `npx tsx test-tool-report.ts`

🔴 **CRITICAL** (Line 861, bash)
- Script does not exist: test-optimizations.ts
- Code: `npx tsx test-optimizations.ts`

🔴 **CRITICAL** (Line 867, bash)
- Script does not exist: test-navigation-fix.ts
- Code: `npx tsx test-navigation-fix.ts`

🔴 **CRITICAL** (Line 873, bash)
- Script does not exist: test-minimal-api-verification.ts
- Code: `npx tsx test-minimal-api-verification.ts`

🔴 **CRITICAL** (Line 879, bash)
- Script does not exist: performance-test.ts
- Code: `npx tsx performance-test.ts`

🔴 **CRITICAL** (Line 885, bash)
- Script does not exist: performance-test-quick.ts
- Code: `npx tsx performance-test-quick.ts`

🔴 **CRITICAL** (Line 896, bash)
- Script does not exist: <tool-name>.ts
- Code: `npx tsx <tool-name>.ts [arguments]`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: test-system-health-check.ts
- Code: `npx tsx test-system-health-check.ts`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: clear-stale-cache.ts
- Code: `npx tsx clear-stale-cache.ts`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: benchmark-search-performance.ts
- Code: `npx tsx benchmark-search-performance.ts`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: test-performance-comparison.ts
- Code: `npx tsx test-performance-comparison.ts`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: debug-test.ts
- Code: `npx tsx debug-test.ts`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: investigate-missing-embeddings.ts
- Code: `npx tsx investigate-missing-embeddings.ts`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: test-customer-satisfaction-journey-quick.ts
- Code: `npx tsx test-customer-satisfaction-journey-quick.ts`

🔴 **CRITICAL** (Line 986, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

### docs/06-TROUBLESHOOTING/README.md

🔵 **INFO** (Line 64, bash)
- Environment variable used: OPENAI_API_KEY - ensure it's documented
- Code: `echo $OPENAI_API_KEY | cut -c1-10`

🔴 **CRITICAL** (Line 212, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

🔴 **CRITICAL** (Line 212, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 212, bash)
- Environment variable used: r - ensure it's documented
- Code: `results.forEach(r => console.log(`${r.title} (${r.similarity})`));`

🔵 **INFO** (Line 212, bash)
- Environment variable used: r - ensure it's documented
- Code: `results.forEach(r => console.log(`${r.title} (${r.similarity})`));`

🔵 **INFO** (Line 281, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 367, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 523, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 589, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 589, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 589, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 679, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 679, bash)
- Environment variable used: r - ensure it's documented
- Code: `results.forEach(r => console.log(`${r.similarity.toFixed(2)} - ${r.title}`));`

🔵 **INFO** (Line 679, bash)
- Environment variable used: r - ensure it's documented
- Code: `results.forEach(r => console.log(`${r.similarity.toFixed(2)} - ${r.title}`));`

🔴 **CRITICAL** (Line 679, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔵 **INFO** (Line 679, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 750, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 750, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 835, bash)
- Environment variable used: OPENAI_API_KEY - ensure it's documented
- Code: `  -H "Authorization: Bearer $OPENAI_API_KEY" \`

🔵 **INFO** (Line 835, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 921, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "\d page_embeddings"`

🔵 **INFO** (Line 921, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 994, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 1055, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze`

🔵 **INFO** (Line 1055, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1131, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT 1;"`

🔵 **INFO** (Line 1131, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `echo $DATABASE_URL | sed 's/:[^:]*@/:****@/'`

🔴 **CRITICAL** (Line 1131, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 1131, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1214, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 1214, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 1292, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1292, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1292, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1384, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT * FROM supabase_migrations.schema_migrations;"`

🔵 **INFO** (Line 1384, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `pg_dump $DATABASE_URL --schema-only > production.sql`

🔵 **INFO** (Line 1384, bash)
- Environment variable used: DEV_DATABASE_URL - ensure it's documented
- Code: `pg_dump $DEV_DATABASE_URL --schema-only > dev.sql`

🔵 **INFO** (Line 1384, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "\d page_embeddings"`

🔵 **INFO** (Line 1449, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1449, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1532, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1532, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1615, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 1615, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 1703, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 1703, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 1852, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 1930, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 2001, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 2001, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 2072, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 2143, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 2224, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 2307, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 2307, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 2383, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 2383, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 2477, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 2477, bash)
- Environment variable used: REDIS_URL - ensure it's documented
- Code: `echo $REDIS_URL`

🔴 **CRITICAL** (Line 2556, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 2626, bash)
- Environment variable used: 6 - ensure it's documented
- Code: `ps aux | grep node | awk '{print $6}'`

🔴 **CRITICAL** (Line 2626, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 2626, bash)
- Environment variable used: key - ensure it's documented
- Code: `  console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);`

🔵 **INFO** (Line 2626, bash)
- Environment variable used: Math - ensure it's documented
- Code: `  console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);`

🔴 **CRITICAL** (Line 2710, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 2710, bash)
- Environment variable used: performance - ensure it's documented
- Code: `console.log(`Time: ${performance.now() - start}ms`);`

🔴 **CRITICAL** (Line 2789, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 2867, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 2867, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 2867, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT ..."`

🔴 **CRITICAL** (Line 2960, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 3033, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 3111, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT * FROM auth.users LIMIT 1;"`

🔴 **CRITICAL** (Line 3111, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 3191, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 3264, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 3264, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔴 **CRITICAL** (Line 3264, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 3426, bash)
- Environment variable used: OPENAI_API_KEY - ensure it's documented
- Code: `curl -H "Authorization: Bearer $OPENAI_API_KEY" \`

🔵 **INFO** (Line 3426, bash)
- Environment variable used: OPENAI_API_KEY - ensure it's documented
- Code: `echo $OPENAI_API_KEY | wc -c`

🔴 **CRITICAL** (Line 3426, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔴 **CRITICAL** (Line 3644, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 4089, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `echo $DATABASE_URL | sed 's/:[^:]*@/:****@/'`

🔵 **INFO** (Line 4314, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT 1;"`

🔴 **CRITICAL** (Line 4314, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔵 **INFO** (Line 4314, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"`

🔵 **INFO** (Line 4314, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"`

🔴 **CRITICAL** (Line 4314, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats`

### docs/NPX_TOOLS_GUIDE.md

🔴 **CRITICAL** (Line 18, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔴 **CRITICAL** (Line 41, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto`

🔴 **CRITICAL** (Line 59, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts watch`

🔴 **CRITICAL** (Line 136, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze`

🔴 **CRITICAL** (Line 154, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts optimize`

🔴 **CRITICAL** (Line 173, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts optimize --dry-run`

🔴 **CRITICAL** (Line 190, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts validate`

🔴 **CRITICAL** (Line 204, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts constraints`

🔴 **CRITICAL** (Line 231, bash)
- Script does not exist: batch-rechunk-embeddings.ts
- Code: `npx tsx batch-rechunk-embeddings.ts --force`

🔴 **CRITICAL** (Line 251, bash)
- Script does not exist: batch-rechunk-embeddings.ts
- Code: `npx tsx batch-rechunk-embeddings.ts`

🔴 **CRITICAL** (Line 298, bash)
- Script does not exist: simple-rechunk.ts
- Code: `npx tsx simple-rechunk.ts`

🔴 **CRITICAL** (Line 353, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔴 **CRITICAL** (Line 353, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto`

🔴 **CRITICAL** (Line 353, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts validate`

🔴 **CRITICAL** (Line 353, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔴 **CRITICAL** (Line 368, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze`

🔴 **CRITICAL** (Line 368, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts watch`

🔴 **CRITICAL** (Line 368, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts optimize`

🔴 **CRITICAL** (Line 380, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔴 **CRITICAL** (Line 380, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts validate`

🔴 **CRITICAL** (Line 380, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto`

🔴 **CRITICAL** (Line 380, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts watch`

🔴 **CRITICAL** (Line 395, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts optimize --dry-run`

🔴 **CRITICAL** (Line 395, bash)
- Script does not exist: batch-rechunk-embeddings.ts
- Code: `npx tsx batch-rechunk-embeddings.ts --force`

🔴 **CRITICAL** (Line 395, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts watch`

🔵 **INFO** (Line 428, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM page_embeddings;"`

🔴 **CRITICAL** (Line 435, bash)
- Script does not exist: simple-rechunk.ts
- Code: `npx tsx simple-rechunk.ts`

🔵 **INFO** (Line 442, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'validate_chunk_size_trigger';`

### docs/DATABASE_CLEANUP.md

🔴 **CRITICAL** (Line 17, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats`

🔴 **CRITICAL** (Line 23, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean`

🔴 **CRITICAL** (Line 29, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --domain=example.com`

🔴 **CRITICAL** (Line 84, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts help`

🔴 **CRITICAL** (Line 84, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats`

🔴 **CRITICAL** (Line 84, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats --domain=example.com`

🔴 **CRITICAL** (Line 84, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --dry-run`

🔴 **CRITICAL** (Line 84, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean                    # All domains`

🔴 **CRITICAL** (Line 84, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --domain=site.com  # Specific domain`

🔵 **INFO** (Line 187, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL < scripts/clean-scraped-data.sql`

🔴 **CRITICAL** (Line 270, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean`

🔴 **CRITICAL** (Line 278, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --domain=example.com`

🔴 **CRITICAL** (Line 292, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `0 2 * * 0 cd /path/to/project && npx tsx test-database-cleanup.ts clean --domain=old-site.com`

🔵 **INFO** (Line 292, bash)
- Using cd with && - consider using absolute paths instead
- Code: `0 2 * * 0 cd /path/to/project && npx tsx test-database-cleanup.ts clean --domain=old-site.com`

### docs/01-ARCHITECTURE/performance-optimization.md

🔵 **INFO** (Line 595, typescript)
- Use of "any" type - consider more specific type
- Code: `// Cache API responses in localStorage
const cacheResponse = (key: string, data: any, ttl: number = `

🔵 **INFO** (Line 687, typescript)
- Use of "any" type - consider more specific type
- Code: `export class SearchCacheManager {
  async getCachedResult(query: string, domain: string, limit: numb`

🔴 **CRITICAL** (Line 743, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check    # One-time health check`

🔴 **CRITICAL** (Line 743, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts watch    # Continuous monitoring`

🔴 **CRITICAL** (Line 743, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto     # Auto-maintenance`

🔴 **CRITICAL** (Line 743, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze       # Analyze current sizes`

🔴 **CRITICAL** (Line 743, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts optimize      # Optimize oversized chunks`

🔴 **CRITICAL** (Line 743, bash)
- Script does not exist: batch-rechunk-embeddings.ts
- Code: `npx tsx batch-rechunk-embeddings.ts --force   # Batch rechunk all`

🔴 **CRITICAL** (Line 743, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats        # View scraping stats`

🔴 **CRITICAL** (Line 901, bash)
- Script does not exist: test-performance-profile.ts
- Code: `npx tsx test-performance-profile.ts`

### docs/README.md

🔴 **CRITICAL** (Line 51, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check   # Health check`

🔴 **CRITICAL** (Line 73, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts  # AI quality check`

🔴 **CRITICAL** (Line 212, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check     # Health check`

🔴 **CRITICAL** (Line 212, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto      # Auto-maintenance`

🔴 **CRITICAL** (Line 212, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze        # Analyze chunk sizes`

🔴 **CRITICAL** (Line 230, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats                # View stats`

🔴 **CRITICAL** (Line 230, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --domain=X     # Clean domain`

🔴 **CRITICAL** (Line 230, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean                # Clean all`

### docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md

🔴 **CRITICAL** (Line 177, bash)
- Script does not exist: apply-telemetry-migration.ts
- Code: `npx tsx apply-telemetry-migration.ts`

🔴 **CRITICAL** (Line 264, bash)
- Script does not exist: test-chat-intelligent-cifa.ts
- Code: `npx tsx test-chat-intelligent-cifa.ts`

🔴 **CRITICAL** (Line 264, bash)
- Script does not exist: test-complete-product-discovery.ts
- Code: `npx tsx test-complete-product-discovery.ts`

🔴 **CRITICAL** (Line 264, bash)
- Script does not exist: test-telemetry-system.ts
- Code: `npx tsx test-telemetry-system.ts`

🔴 **CRITICAL** (Line 264, bash)
- Script does not exist: test-generic-intelligence.ts
- Code: `npx tsx test-generic-intelligence.ts`

🔴 **CRITICAL** (Line 281, bash)
- Script does not exist: benchmark-search-improvements.ts
- Code: `npx tsx benchmark-search-improvements.ts`

🔴 **CRITICAL** (Line 281, bash)
- Script does not exist: test-parallel-context-gathering.ts
- Code: `npx tsx test-parallel-context-gathering.ts`

### docs/CACHE_CONSISTENCY.md

🔴 **CRITICAL** (Line 54, bash)
- Script does not exist: clear-stale-cache.ts
- Code: `npx tsx clear-stale-cache.ts`

🔴 **CRITICAL** (Line 54, bash)
- Script does not exist: clear-stale-cache.ts
- Code: `npx tsx clear-stale-cache.ts --clear-all`

🔴 **CRITICAL** (Line 99, bash)
- Script does not exist: test-cache-consistency.ts
- Code: `npx tsx test-cache-consistency.ts`

🔴 **CRITICAL** (Line 104, bash)
- Script does not exist: clear-stale-cache.ts
- Code: `npx tsx clear-stale-cache.ts`

🔴 **CRITICAL** (Line 104, bash)
- Script does not exist: clear-stale-cache.ts
- Code: `npx tsx clear-stale-cache.ts --clear-all`

🔴 **CRITICAL** (Line 113, bash)
- Script does not exist: -e
- Code: `npx tsx -e "`

🔴 **CRITICAL** (Line 121, bash)
- Script does not exist: -e
- Code: `npx tsx -e "`

### docs/CUSTOMER_SERVICE_OPTIMIZATION.md

🔴 **CRITICAL** (Line 154, bash)
- Script does not exist: test-customer-service-quick.ts
- Code: `npx tsx test-customer-service-quick.ts`

🔴 **CRITICAL** (Line 160, bash)
- Script does not exist: test-customer-service-comprehensive.ts
- Code: `npx tsx test-customer-service-comprehensive.ts`

🔴 **CRITICAL** (Line 160, bash)
- Script does not exist: test-customer-service-comprehensive.ts
- Code: `npx tsx test-customer-service-comprehensive.ts --category "Emotional Intelligence"`

🔴 **CRITICAL** (Line 160, bash)
- Script does not exist: test-customer-service-comprehensive.ts
- Code: `npx tsx test-customer-service-comprehensive.ts --difficulty advanced`

🔴 **CRITICAL** (Line 172, bash)
- Script does not exist: test-performance-diagnostic.ts
- Code: `npx tsx test-performance-diagnostic.ts`

🔴 **CRITICAL** (Line 172, bash)
- Script does not exist: test-performance-comparison.ts
- Code: `npx tsx test-performance-comparison.ts`

🔴 **CRITICAL** (Line 172, bash)
- Script does not exist: test-cache-performance.ts
- Code: `npx tsx test-cache-performance.ts`

### docs/02-FEATURES/chat-system/README.md

🔴 **CRITICAL** (Line 366, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

🔴 **CRITICAL** (Line 581, bash)
- Script does not exist: test-chat-integration.ts
- Code: `npx tsx test-chat-integration.ts`

🔴 **CRITICAL** (Line 581, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

🔴 **CRITICAL** (Line 581, bash)
- Script does not exist: test-conversation-context.ts
- Code: `npx tsx test-conversation-context.ts`

🔵 **INFO** (Line 627, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `echo $NEXT_PUBLIC_SUPABASE_URL`

🔴 **CRITICAL** (Line 627, bash)
- Script does not exist: verify-supabase.js
- Code: `npx tsx verify-supabase.js`

🟡 **WARNING** (Line 653, typescript)
- Import path may not exist: @/constants
- Code: `from '@/constants'`

🔴 **CRITICAL** (Line 684, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats`

### docs/DATABASE_OPTIMIZATION.md

🔴 **CRITICAL** (Line 118, bash)
- Script does not exist: optimize-database-performance.ts
- Code: `npx tsx optimize-database-performance.ts analyze`

🔴 **CRITICAL** (Line 118, bash)
- Script does not exist: optimize-database-performance.ts
- Code: `npx tsx optimize-database-performance.ts optimize`

🔴 **CRITICAL** (Line 118, bash)
- Script does not exist: optimize-database-performance.ts
- Code: `npx tsx optimize-database-performance.ts monitor`

🔴 **CRITICAL** (Line 130, bash)
- Script does not exist: test-performance-improvements.ts
- Code: `npx tsx test-performance-improvements.ts`

🔴 **CRITICAL** (Line 130, bash)
- Script does not exist: validate-optimizations-real.ts
- Code: `npx tsx validate-optimizations-real.ts`

🔴 **CRITICAL** (Line 130, bash)
- Script does not exist: check-optimization-status.ts
- Code: `npx tsx check-optimization-status.ts`

### docs/00-GETTING-STARTED/for-developers.md

🔴 **CRITICAL** (Line 534, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats              # View stats`

🔴 **CRITICAL** (Line 534, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean              # Clean all`

🔴 **CRITICAL** (Line 534, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --domain=X   # Clean domain`

🔴 **CRITICAL** (Line 534, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check          # Health check`

🔴 **CRITICAL** (Line 534, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto           # Auto-fix issues`

🟡 **WARNING** (Line 787, typescript)
- Import path may not exist: @/app/api/hello/route
- Code: `from '@/app/api/hello/route'`

### docs/02-FEATURES/scraping/README.md

🔵 **INFO** (Line 560, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ScrapedPage {
  url: string;
  title: string;
  content: string;         // Markdown forma`

🔵 **INFO** (Line 1004, bash)
- Environment variable used: pages - ensure it's documented
- Code: `  console.log(\`Pages: \${pages}, Embeddings: \${embeddings}\`);`

🔵 **INFO** (Line 1004, bash)
- Environment variable used: embeddings - ensure it's documented
- Code: `  console.log(\`Pages: \${pages}, Embeddings: \${embeddings}\`);`

🔵 **INFO** (Line 1275, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `echo "VACUUM ANALYZE scraped_pages;" | psql $DATABASE_URL`

🔵 **INFO** (Line 1275, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `echo "VACUUM ANALYZE page_embeddings;" | psql $DATABASE_URL`

🔴 **CRITICAL** (Line 1327, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats`

🔴 **CRITICAL** (Line 1327, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --domain=example.com`

🔴 **CRITICAL** (Line 1327, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean`

🔴 **CRITICAL** (Line 1327, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean --dry-run`

🔵 **INFO** (Line 1372, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `pg_restore -d $DATABASE_URL backup.dump`

🔴 **CRITICAL** (Line 1394, bash)
- Script does not exist: turbo-force-rescrape-with-sitemap.js
- Code: `SCRAPER_FORCE_RESCRAPE_ALL=true npx tsx turbo-force-rescrape-with-sitemap.js`

### docs/ARCHIVE/analysis/OPTIMIZATION_SUMMARY.md

🔴 **CRITICAL** (Line 38, bash)
- Script does not exist: test-customer-service-quick.ts
- Code: `npx tsx test-customer-service-quick.ts`

🔴 **CRITICAL** (Line 38, bash)
- Script does not exist: test-customer-service-comprehensive.ts
- Code: `npx tsx test-customer-service-comprehensive.ts`

🔴 **CRITICAL** (Line 38, bash)
- Script does not exist: test-performance-comparison.ts
- Code: `npx tsx test-performance-comparison.ts`

🔴 **CRITICAL** (Line 109, bash)
- Script does not exist: test-customer-service-comprehensive.ts
- Code: `npx tsx test-customer-service-comprehensive.ts --quick`

🔴 **CRITICAL** (Line 109, bash)
- Script does not exist: test-performance-diagnostic.ts
- Code: `npx tsx test-performance-diagnostic.ts`

### docs/PERFORMANCE_OPTIMIZATIONS.md

🔴 **CRITICAL** (Line 110, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

🔴 **CRITICAL** (Line 110, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto`

🔴 **CRITICAL** (Line 110, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts watch`

🔴 **CRITICAL** (Line 197, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts auto`

🔴 **CRITICAL** (Line 259, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check`

### docs/02-FEATURES/chat-system/hallucination-prevention.md

🔴 **CRITICAL** (Line 216, bash)
- Script does not exist: test-chat-accuracy.ts
- Code: `npx tsx test-chat-accuracy.ts`

🔴 **CRITICAL** (Line 228, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

🔴 **CRITICAL** (Line 246, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

🔴 **CRITICAL** (Line 539, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

### docs/SEARCH_IMPROVEMENTS_MIGRATION.md

🔴 **CRITICAL** (Line 139, bash)
- Script does not exist: test-search-comparison.ts
- Code: `npx tsx test-search-comparison.ts`

🔴 **CRITICAL** (Line 155, bash)
- Script does not exist: test-search-accuracy.ts
- Code: `npx tsx test-search-accuracy.ts`

🔴 **CRITICAL** (Line 203, bash)
- Script does not exist: test-search-accuracy.ts
- Code: `npx tsx test-search-accuracy.ts`

🔴 **CRITICAL** (Line 203, bash)
- Script does not exist: test-search-comparison.ts
- Code: `npx tsx test-search-comparison.ts`

### README.md

🔴 **CRITICAL** (Line 191, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats  # View data stats`

🔴 **CRITICAL** (Line 191, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean  # Clean scraped data`

🔴 **CRITICAL** (Line 191, bash)
- Script does not exist: monitor-embeddings-health.ts
- Code: `npx tsx monitor-embeddings-health.ts check  # Health check`

🔴 **CRITICAL** (Line 191, bash)
- Script does not exist: optimize-chunk-sizes.ts
- Code: `npx tsx optimize-chunk-sizes.ts analyze     # Analyze chunks`

### docs/ARCHIVE/analysis/CUSTOMER_SATISFACTION_FINAL_REPORT.md

🔴 **CRITICAL** (Line 149, bash)
- Script does not exist: test-system-health-check.ts
- Code: `npx tsx test-system-health-check.ts`

🔴 **CRITICAL** (Line 149, bash)
- Script does not exist: test-customer-satisfaction-journey.ts
- Code: `npx tsx test-customer-satisfaction-journey.ts`

🔴 **CRITICAL** (Line 149, bash)
- Script does not exist: test-ai-context-analysis.ts
- Code: `npx tsx test-ai-context-analysis.ts`

### docs/EMBEDDING_SEARCH_GUIDE.md

🔴 **CRITICAL** (Line 113, bash)
- Script does not exist: comprehensive-embedding-check.ts
- Code: `npx tsx comprehensive-embedding-check.ts`

🔴 **CRITICAL** (Line 118, bash)
- Script does not exist: add-domain-to-embeddings.ts
- Code: `npx tsx add-domain-to-embeddings.ts`

🔴 **CRITICAL** (Line 123, bash)
- Script does not exist: test-real-similarity.ts
- Code: `npx tsx test-real-similarity.ts`

### docs/PERFORMANCE_IMPROVEMENTS.md

🔴 **CRITICAL** (Line 105, bash)
- Script does not exist: clear-stale-cache.ts
- Code: `npx tsx clear-stale-cache.ts`

🔴 **CRITICAL** (Line 105, bash)
- Script does not exist: test-cache-consistency.ts
- Code: `npx tsx test-cache-consistency.ts`

🔴 **CRITICAL** (Line 105, bash)
- Script does not exist: test-woocommerce-cache-performance.ts
- Code: `npx tsx test-woocommerce-cache-performance.ts`

### docs/ARCHIVE/analysis/AGENT_SEARCH_FIX_SUMMARY.md

🔴 **CRITICAL** (Line 70, bash)
- Script does not exist: test-agent-search-env.ts
- Code: `npx tsx test-agent-search-env.ts`

🔴 **CRITICAL** (Line 70, bash)
- Script does not exist: test-pure-async.ts
- Code: `npx tsx test-pure-async.ts`

### docs/ARCHIVE/analysis/CUSTOMER_SATISFACTION_TESTING.md

🔴 **CRITICAL** (Line 129, bash)
- Script does not exist: test-customer-satisfaction-journey.ts
- Code: `npx tsx test-customer-satisfaction-journey.ts`

🔴 **CRITICAL** (Line 134, bash)
- Script does not exist: test-customer-satisfaction-journey-quick.ts
- Code: `npx tsx test-customer-satisfaction-journey-quick.ts`

### docs/ARCHIVE/analysis/PERFORMANCE_OPTIMIZATION_REPORT.md

🔴 **CRITICAL** (Line 255, bash)
- Script does not exist: test-performance-analysis.ts
- Code: `npx tsx test-performance-analysis.ts`

🔴 **CRITICAL** (Line 255, bash)
- Script does not exist: profile-search-performance.ts
- Code: `npx tsx profile-search-performance.ts`

### docs/ARCHIVE/old-docs/scraping/SCRAPING_AND_EMBEDDING_SYSTEM.md

🔴 **CRITICAL** (Line 195, bash)
- Script does not exist: turbo-force-rescrape-with-sitemap.js
- Code: `SCRAPER_FORCE_RESCRAPE_ALL=true npx tsx turbo-force-rescrape-with-sitemap.js`

🔴 **CRITICAL** (Line 227, bash)
- Script does not exist: clean-thompson-data.ts
- Code: `npx tsx clean-thompson-data.ts`

### docs/DATABASE_IMPROVEMENTS_2025.md

🔴 **CRITICAL** (Line 163, bash)
- Script does not exist: run-product-extraction.ts
- Code: `npx tsx run-product-extraction.ts`

🔴 **CRITICAL** (Line 168, bash)
- Script does not exist: test-improved-chat-accuracy.ts
- Code: `npx tsx test-improved-chat-accuracy.ts`

### docs/IMPLEMENTATION_SUMMARY_TOKEN_TRACKING.md

🔴 **CRITICAL** (Line 258, bash)
- Script does not exist: test-telemetry-persistence.ts
- Code: `npx tsx test-telemetry-persistence.ts`

🔴 **CRITICAL** (Line 258, bash)
- Script does not exist: test-token-cost-logging.ts
- Code: `npx tsx test-token-cost-logging.ts`

### docs/OPTIMIZATION_IMPLEMENTATION.md

🔴 **CRITICAL** (Line 113, bash)
- Script does not exist: test-tool-report.ts
- Code: `npx tsx test-tool-report.ts`

🔴 **CRITICAL** (Line 120, bash)
- Script does not exist: test-parallel-quick.ts
- Code: `npx tsx test-parallel-quick.ts`

🔵 **INFO** (Line 127, bash)
- Environment variable used: i - ensure it's documented
- Code: `    -d '{"message":"find pumps and check shipping","session_id":"perf'$i'","domain":"thompsonseparts.co.uk"}' &`

### docs/reports/PERFORMANCE_ANALYSIS_REPORT.md

🔴 **CRITICAL** (Line 252, bash)
- Script does not exist: test-performance-analysis.ts
- Code: `npx tsx test-performance-analysis.ts`

🔴 **CRITICAL** (Line 252, bash)
- Script does not exist: test-performance-comparison.ts
- Code: `npx tsx test-performance-comparison.ts`

### docs/TOKEN_COST_TRACKING.md

🔴 **CRITICAL** (Line 114, bash)
- Script does not exist: test-token-cost-logging.ts
- Code: `npx tsx test-token-cost-logging.ts`

🔴 **CRITICAL** (Line 114, bash)
- Script does not exist: test-telemetry-persistence.ts
- Code: `npx tsx test-telemetry-persistence.ts`

### app/README.md

🔴 **CRITICAL** (Line 469, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts stats    # View data statistics`

🔴 **CRITICAL** (Line 469, bash)
- Script does not exist: test-database-cleanup.ts
- Code: `npx tsx test-database-cleanup.ts clean    # Clean scraped data`

### docs/01-ARCHITECTURE/search-architecture.md

🔴 **CRITICAL** (Line 752, bash)
- Script does not exist: <<
- Code: `npx tsx << 'EOF'`

🔵 **INFO** (Line 752, bash)
- Environment variable used: results - ensure it's documented
- Code: `console.log(`Returned ${results.length} results`);`

🔵 **INFO** (Line 752, bash)
- Environment variable used: i - ensure it's documented
- Code: `  console.log(`${i + 1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);`

🔵 **INFO** (Line 752, bash)
- Environment variable used: r - ensure it's documented
- Code: `  console.log(`${i + 1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);`

🔵 **INFO** (Line 752, bash)
- Environment variable used: r - ensure it's documented
- Code: `  console.log(`   ${r.url}`);`

### docs/02-FEATURES/chat-system/QUICK_REFERENCE.md

🔴 **CRITICAL** (Line 50, bash)
- Script does not exist: test-hallucination-prevention.ts
- Code: `npx tsx test-hallucination-prevention.ts`

### docs/ARCHIVE/analysis/AGENTIC_TEST_README.md

🔴 **CRITICAL** (Line 70, bash)
- Script does not exist: test-agentic-search-capabilities.ts
- Code: `npx tsx test-agentic-search-capabilities.ts`

### docs/ARCHIVE/analysis/COMPLETE_CONTEXT_GATHERING_SUCCESS.md

🔴 **CRITICAL** (Line 129, bash)
- Script does not exist: test-parallel-context-gathering.ts
- Code: `npx tsx test-parallel-context-gathering.ts`

### docs/ARCHIVE/analysis/DOCKER_IMPROVEMENTS_2025.md

🔴 **CRITICAL** (Line 87, bash)
- Script does not exist: profile-docker-quick.ts
- Code: `npx tsx profile-docker-quick.ts`

### docs/ARCHIVE/analysis/DOCKER_PERFORMANCE_ANALYSIS.md

🔴 **CRITICAL** (Line 302, bash)
- Script does not exist: profile-docker-quick.ts
- Code: `npx tsx profile-docker-quick.ts`

### docs/ARCHIVE/analysis/INTELLIGENT_SEARCH_IMPLEMENTATION.md

🔴 **CRITICAL** (Line 179, bash)
- Script does not exist: test-intelligent-search.ts
- Code: `npx tsx test-intelligent-search.ts`

### docs/ARCHIVE/forensics/FORENSIC_ANALYSIS_REPORT.md

🔴 **CRITICAL** (Line 206, bash)
- Script does not exist: [filename]
- Code: `npx tsx [filename]`

### docs/CRITICAL_ISSUES_ANALYSIS.md

🔴 **CRITICAL** (Line 173, bash)
- Script does not exist: scripts/analyze-customer-id-migration.ts
- Code: `npx tsx scripts/analyze-customer-id-migration.ts`

🔵 **INFO** (Line 511, typescript)
- Use of "any" type - consider more specific type
- Code: `// __tests__/lib/agents/domain-agnostic-agent.test.ts:286
it('should detect availability query inten`

🔵 **INFO** (Line 524, typescript)
- Use of "any" type - consider more specific type
- Code: `// BEFORE
const queries = [
  'Do you have any pumps?'  // ❌ Industry-specific
];

// AFTER
const qu`

### docs/CUSTOMER_SERVICE_ACCURACY_TESTING.md

🔴 **CRITICAL** (Line 85, bash)
- Script does not exist: test-chat-accuracy.ts
- Code: `npx tsx test-chat-accuracy.ts              # Core product accuracy tests`

### docs/EMBEDDING_REGENERATION.md

🔴 **CRITICAL** (Line 63, bash)
- Script does not exist: regenerate-embeddings-fixed.ts
- Code: `npx tsx regenerate-embeddings-fixed.ts --domain=thompsonseparts.co.uk`

### docs/PRICE_RETRIEVAL_FIX.md

🔴 **CRITICAL** (Line 157, bash)
- Script does not exist: test-comprehensive-price-sources.ts
- Code: `npx tsx test-comprehensive-price-sources.ts`

### docs/QUEUE_MONITORING_TEST_REPORT.md

🔴 **CRITICAL** (Line 126, bash)
- Script does not exist: -e
- Code: `npx tsx -e "import { getQueueManager } from './lib/queue/scrape-queue.js'; ..."`

### docs/woocommerce/WOOCOMMERCE_AUTH_FIX.md

🔴 **CRITICAL** (Line 78, bash)
- Script does not exist: test-chatbot-orders.js
- Code: `npx tsx test-chatbot-orders.js`

### docs/00-GETTING-STARTED/brand-agnostic-checklist.md

🔵 **INFO** (Line 372, typescript)
- Use of "any" type - consider more specific type
- Code: `interface CustomerConfig {
  // Identity (generic)
  id: string;
  business_name: string;
  domain: `

🔵 **INFO** (Line 453, typescript)
- Use of "any" type - consider more specific type
- Code: `interface Product {
  id: string;
  customer_id: string;
  name: string;
  description: string;
  me`

### docs/00-GETTING-STARTED/for-devops.md

🔵 **INFO** (Line 363, bash)
- Environment variable used: CRON_SECRET - ensure it's documented
- Code: `  -H "Authorization: Bearer ${CRON_SECRET}"`

🔵 **INFO** (Line 464, sql)
- Using SELECT * - consider specifying columns
- Code: `SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgvector');`

🔵 **INFO** (Line 621, bash)
- Environment variable used: STAGING_DB_URL - ensure it's documented
- Code: `supabase db push --db-url $STAGING_DB_URL`

🔵 **INFO** (Line 621, bash)
- Environment variable used: PRODUCTION_DB_URL - ensure it's documented
- Code: `supabase db push --db-url $PRODUCTION_DB_URL`

🔵 **INFO** (Line 638, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Vacuum analyze (performance)
VACUUM ANALYZE;

-- Check table sizes
SELECT
  schemaname,
  tablena`

🔵 **INFO** (Line 705, bash)
- Environment variable used: GIT_SHA - ensure it's documented
- Code: `docker tag omniops:latest omniops:${GIT_SHA}`

🔵 **INFO** (Line 705, bash)
- Environment variable used: DATE - ensure it's documented
- Code: `docker tag omniops:latest omniops:${DATE}`

🔵 **INFO** (Line 2107, bash)
- Environment variable used: BACKUP_DIR - ensure it's documented
- Code: `BACKUP_FILE="$BACKUP_DIR/omniops_$TIMESTAMP.sql.gz"`

🔵 **INFO** (Line 2107, bash)
- Environment variable used: TIMESTAMP - ensure it's documented
- Code: `BACKUP_FILE="$BACKUP_DIR/omniops_$TIMESTAMP.sql.gz"`

🔵 **INFO** (Line 2107, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `        | gzip > "$BACKUP_FILE"`

🔵 **INFO** (Line 2107, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/postgres/`

🔵 **INFO** (Line 2107, bash)
- Environment variable used: BACKUP_DIR - ensure it's documented
- Code: `find "$BACKUP_DIR" -name "omniops_*.sql.gz" -mtime +$RETENTION_DAYS -delete`

🔵 **INFO** (Line 2107, bash)
- Environment variable used: RETENTION_DAYS - ensure it's documented
- Code: `find "$BACKUP_DIR" -name "omniops_*.sql.gz" -mtime +$RETENTION_DAYS -delete`

🔵 **INFO** (Line 2107, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `echo "Backup completed: $BACKUP_FILE"`

🔵 **INFO** (Line 2600, bash)
- Environment variable used: NF - ensure it's documented
- Code: `vercel logs | grep "Duration:" | awk '{if ($NF > 5000) print}'`

🔵 **INFO** (Line 2600, bash)
- Environment variable used: NF - ensure it's documented
- Code: `  awk '{sum+=$NF; count++} END {print "Average:", sum/count, "ms"}'`

🔵 **INFO** (Line 2897, bash)
- Environment variable used: NF - ensure it's documented
- Code: `vercel logs | grep "Duration:" | awk '{sum+=$NF; count++} END {print "Avg:", sum/count/1000, "s"}'`

### docs/01-ARCHITECTURE/database-schema.md

🔵 **INFO** (Line 126, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Get config by domain
SELECT * FROM customer_configs WHERE domain = 'example.com' AND active = tru`

🔵 **INFO** (Line 1675, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Get customer config by domain
SELECT * FROM customer_configs
WHERE domain = 'example.com' AND act`

### docs/02-FEATURES/woocommerce/README.md

🔵 **INFO** (Line 437, typescript)
- Use of "any" type - consider more specific type
- Code: `// List products
await wc.getProducts({
  page?: number,
  per_page?: number,
  search?: string,
  s`

🔵 **INFO** (Line 556, typescript)
- Use of "any" type - consider more specific type
- Code: `// List order notes
await wc.getOrderNotes(orderId: number, {
  type?: 'any' | 'customer' | 'interna`

🔵 **INFO** (Line 691, typescript)
- Use of "any" type - consider more specific type
- Code: `// System status
await wc.getSystemStatus();
// Returns: environment, database, active_plugins, them`

🔵 **INFO** (Line 1214, typescript)
- Use of "any" type - consider more specific type
- Code: `// Detect abandoned cart in chat
if (context.cartData.hasItems && isCartAbandoned(context)) {
  retu`

🔵 **INFO** (Line 1926, typescript)
- Use of "any" type - consider more specific type
- Code: `// Get customer context
const userData = window.ChatWidgetConfig.userData;
const cartData = window.C`

### docs/04-DEVELOPMENT/code-patterns/adding-agents-providers.md

🔵 **INFO** (Line 66, typescript)
- Use of "any" type - consider more specific type
- Code: `// lib/agents/commerce-provider.ts

export interface CommerceProvider {
  // Platform identifier (e.`

🔵 **INFO** (Line 91, typescript)
- Use of "any" type - consider more specific type
- Code: `export interface OrderInfo {
  id: string | number;           // Platform-specific order ID
  number`

🟡 **WARNING** (Line 137, typescript)
- Import path may not exist: ../commerce-provider
- Code: `from '../commerce-provider'`

🟡 **WARNING** (Line 137, typescript)
- Import path may not exist: @/lib/magento-dynamic
- Code: `from '@/lib/magento-dynamic'`

🔵 **INFO** (Line 161, typescript)
- Use of "any" type - consider more specific type
- Code: `async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
  const magento = aw`

🔵 **INFO** (Line 238, typescript)
- Use of "any" type - consider more specific type
- Code: `async searchProducts(query: string, limit: number = 10): Promise<any[]> {
  const magento = await ge`

🔵 **INFO** (Line 271, typescript)
- Use of "any" type - consider more specific type
- Code: `async checkStock(productId: string): Promise<any> {
  const magento = await getDynamicMagentoClient(`

🔵 **INFO** (Line 306, typescript)
- Use of "any" type - consider more specific type
- Code: `async getProductDetails(productId: string): Promise<any> {
  const magento = await getDynamicMagento`

🔵 **INFO** (Line 328, typescript)
- Use of "any" type - consider more specific type
- Code: `/**
 * Magento REST API Client
 */

export interface MagentoConfig {
  url: string;          // Stor`

🟡 **WARNING** (Line 430, typescript)
- Import path may not exist: ./magento-api
- Code: `from './magento-api'`

🟡 **WARNING** (Line 583, typescript)
- Import path may not exist: @/lib/agents/providers/magento-provider
- Code: `from '@/lib/agents/providers/magento-provider'`

🟡 **WARNING** (Line 811, typescript)
- Import path may not exist: @/lib/magento-dynamic
- Code: `from '@/lib/magento-dynamic'`

🔵 **INFO** (Line 811, typescript)
- Use of "any" type - consider more specific type
- Code: `/**
 * Magento Integration Test Endpoint
 * Tests Magento API connection and credentials
 */

import`

🟡 **WARNING** (Line 947, typescript)
- Import path may not exist: ../commerce-provider
- Code: `from '../commerce-provider'`

🟡 **WARNING** (Line 947, typescript)
- Import path may not exist: @/lib/magento-dynamic
- Code: `from '@/lib/magento-dynamic'`

🔵 **INFO** (Line 947, typescript)
- Use of "any" type - consider more specific type
- Code: `/**
 * Magento Commerce Provider - Complete Implementation
 * Location: lib/agents/providers/magento`

🟡 **WARNING** (Line 1363, typescript)
- Import path may not exist: @/lib/agents/providers/magento-provider
- Code: `from '@/lib/agents/providers/magento-provider'`

🔵 **INFO** (Line 1539, typescript)
- Use of "any" type - consider more specific type
- Code: `async searchProducts(query: string, limit: number = 10): Promise<any[]> {
  // Internally map to pla`

🔵 **INFO** (Line 1555, typescript)
- Use of "any" type - consider more specific type
- Code: `try {
  return await client.getOrder(id);
} catch (error: any) {
  // Log the platform-specific erro`

🔵 **INFO** (Line 1609, typescript)
- Use of "any" type - consider more specific type
- Code: `export class PlatformProvider implements CommerceProvider {
  private productCache = new Map<string,`

### docs/04-DEVELOPMENT/code-patterns/adding-api-endpoints.md

🔵 **INFO** (Line 521, typescript)
- Use of "any" type - consider more specific type
- Code: `import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export con`

🔵 **INFO** (Line 820, typescript)
- Use of "any" type - consider more specific type
- Code: `const BatchSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    action: z.enum(['`

### docs/04-DEVELOPMENT/code-patterns/adding-database-tables.md

🔵 **INFO** (Line 457, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Set session to specific user (simulates auth.uid())
SET request.jwt.claim.sub = 'user-id-here';

`

🔵 **INFO** (Line 493, typescript)
- Use of "any" type - consider more specific type
- Code: `// types/database.ts
export interface UserPreference {
  id: string;
  user_id: string;
  organizati`

🟡 **WARNING** (Line 652, typescript)
- Import path may not exist: @/lib/services/user-preferences
- Code: `from '@/lib/services/user-preferences'`

🔵 **INFO** (Line 652, typescript)
- Use of "any" type - consider more specific type
- Code: `// __tests__/lib/services/user-preferences.test.ts
import { describe, it, expect, jest, beforeEach }`

🔵 **INFO** (Line 747, typescript)
- Use of "any" type - consider more specific type
- Code: `// __tests__/integration/user-preferences.integration.test.ts
import { createServiceRoleClient } fro`

🟡 **WARNING** (Line 1357, sql)
- DROP TABLE without IF EXISTS - could cause errors
- Code: `-- Migration: add_user_roles
-- Rollback: DROP TABLE user_roles CASCADE;

CREATE TABLE user_roles (.`

🔵 **INFO** (Line 1555, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'table_nam`

🔵 **INFO** (Line 1584, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Check if referenced row exists
SELECT * FROM parent_table WHERE id = 'parent-id';

-- Check const`

🔵 **INFO** (Line 1639, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM table_name WHERE column = 'value';

-- Look for "S`

🟡 **WARNING** (Line 1720, sql)
- DROP TABLE without IF EXISTS - could cause errors
- Code: `-- Drop with CASCADE (careful!)
DROP TABLE table_name CASCADE;

-- Or drop dependencies first
DROP V`

### docs/04-DEVELOPMENT/testing/README.md

🟡 **WARNING** (Line 364, typescript)
- Import path may not exist: ./handlers
- Code: `from './handlers'`

🟡 **WARNING** (Line 632, typescript)
- Import path may not exist: @/test-utils/rls-test-helpers
- Code: `from '@/test-utils/rls-test-helpers'`

### docs/05-DEPLOYMENT/production-checklist.md

🔵 **INFO** (Line 1538, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"`

### docs/05-DEPLOYMENT/runbooks.md

🔵 **INFO** (Line 95, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `test -n "$NEXT_PUBLIC_SUPABASE_URL" || echo "Missing SUPABASE_URL"`

🔵 **INFO** (Line 95, bash)
- Environment variable used: SUPABASE_SERVICE_ROLE_KEY - ensure it's documented
- Code: `test -n "$SUPABASE_SERVICE_ROLE_KEY" || echo "Missing SERVICE_ROLE_KEY"`

🔵 **INFO** (Line 95, bash)
- Environment variable used: OPENAI_API_KEY - ensure it's documented
- Code: `test -n "$OPENAI_API_KEY" || echo "Missing OPENAI_API_KEY"`

🔵 **INFO** (Line 95, bash)
- Environment variable used: ENCRYPTION_KEY - ensure it's documented
- Code: `test -n "$ENCRYPTION_KEY" || echo "Missing ENCRYPTION_KEY"`

🔵 **INFO** (Line 109, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `pg_dump $DATABASE_URL > $BACKUP_FILE`

🔵 **INFO** (Line 109, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `pg_dump $DATABASE_URL > $BACKUP_FILE`

🔵 **INFO** (Line 109, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `gzip $BACKUP_FILE`

🔵 **INFO** (Line 109, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `aws s3 cp ${BACKUP_FILE}.gz s3://omniops-backups/production/`

🔵 **INFO** (Line 109, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `gsutil cp ${BACKUP_FILE}.gz gs://omniops-backups/production/`

🔵 **INFO** (Line 109, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `echo "Backup: s3://omniops-backups/production/${BACKUP_FILE}.gz" >> deployment-log.txt`

🔵 **INFO** (Line 129, bash)
- Environment variable used: DEPLOY_COMMIT - ensure it's documented
- Code: `echo "Deploying commit: $DEPLOY_COMMIT"`

🔵 **INFO** (Line 156, bash)
- Environment variable used: SERVER_PID - ensure it's documented
- Code: `kill $SERVER_PID`

🔵 **INFO** (Line 204, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `supabase migration list --db-url $DATABASE_URL`

🔵 **INFO** (Line 204, bash)
- Environment variable used: STAGING_DATABASE_URL - ensure it's documented
- Code: `supabase db push --db-url $STAGING_DATABASE_URL`

🔵 **INFO** (Line 204, bash)
- Environment variable used: STAGING_DATABASE_URL - ensure it's documented
- Code: `psql $STAGING_DATABASE_URL -c "SELECT version FROM migrations ORDER BY created_at DESC LIMIT 5;"`

🔵 **INFO** (Line 204, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `supabase db push --db-url $PRODUCTION_DATABASE_URL`

🔵 **INFO** (Line 204, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 241, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL << 'EOF'`

🔵 **INFO** (Line 274, bash)
- Environment variable used: 1 - ensure it's documented
- Code: `DEPLOY_URL=$(vercel ls --prod | head -2 | tail -1 | awk '{print $1}')`

🔵 **INFO** (Line 274, bash)
- Environment variable used: DEPLOY_URL - ensure it's documented
- Code: `echo "Deployment URL: $DEPLOY_URL"`

🔵 **INFO** (Line 274, bash)
- Environment variable used: DEPLOY_URL - ensure it's documented
- Code: `curl -f "https://$DEPLOY_URL/api/health"`

🔵 **INFO** (Line 291, bash)
- Using cd with && - consider using absolute paths instead
- Code: `ssh production "cd /opt/omniops && docker-compose pull && docker-compose up -d --no-deps app"`

🔵 **INFO** (Line 377, bash)
- Environment variable used: 1 - ensure it's documented
- Code: `done | awk '{sum+=$1; count++} END {print "Average: " sum/count "s, Count: " count}'`

🔵 **INFO** (Line 377, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 416, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `RESPONSE=$(curl -s -X POST "$BASE_URL/api/chat" \`

🔵 **INFO** (Line 416, bash)
- Environment variable used: RESPONSE - ensure it's documented
- Code: `echo "$RESPONSE" | jq -e '.response' > /dev/null || exit 1`

🔵 **INFO** (Line 416, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `curl -f "$BASE_URL/embed.js" > /dev/null || exit 1`

🔵 **INFO** (Line 416, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `curl -f "$BASE_URL/embed?domain=yourdomain.com" > /dev/null || exit 1`

🔵 **INFO** (Line 416, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `curl -f "$BASE_URL/admin" > /dev/null || exit 1`

🔵 **INFO** (Line 416, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `curl -s -X POST "$BASE_URL/api/gdpr/export" \`

🔵 **INFO** (Line 470, bash)
- Environment variable used: DEPLOY_COMMIT - ensure it's documented
- Code: `Commit: $DEPLOY_COMMIT`

🔵 **INFO** (Line 470, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `Backup Location: s3://omniops-backups/production/$BACKUP_FILE.gz`

🔵 **INFO** (Line 539, bash)
- Using cd with && - consider using absolute paths instead
- Code: `ssh production "cd /opt/omniops && docker-compose down && docker tag omniops:v1.1.0 omniops:latest && docker-compose up -d"`

🔵 **INFO** (Line 539, bash)
- Using cd with && - consider using absolute paths instead
- Code: `ssh production "cd /opt/omniops && git checkout v1.1.0 && npm ci && npm run build && pm2 reload all"`

🔵 **INFO** (Line 612, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "SELECT 1"`

🔵 **INFO** (Line 634, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 768, bash)
- Using cd with && - consider using absolute paths instead
- Code: `ssh production "cd /opt/omniops && npm ci && npm run build && pm2 reload all"`

🔵 **INFO** (Line 943, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 943, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 943, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 999, bash)
- Environment variable used: BACKUP_TIME - ensure it's documented
- Code: `BACKUP_FILE="pre_migration_${BACKUP_TIME}.sql"`

🔵 **INFO** (Line 999, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `pg_dump $PRODUCTION_DATABASE_URL \`

🔵 **INFO** (Line 999, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `  --file=$BACKUP_FILE`

🔵 **INFO** (Line 999, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `pg_restore --list $BACKUP_FILE | head -20`

🔵 **INFO** (Line 999, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `aws s3 cp $BACKUP_FILE s3://omniops-backups/migrations/`

🔵 **INFO** (Line 999, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `aws s3 ls s3://omniops-backups/migrations/ | grep $BACKUP_FILE`

🔵 **INFO** (Line 999, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `echo "Migration backup: s3://omniops-backups/migrations/$BACKUP_FILE" >> migration-log.txt`

🔵 **INFO** (Line 999, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `echo "Backup size: $(du -h $BACKUP_FILE)" >> migration-log.txt`

🔵 **INFO** (Line 1023, bash)
- Environment variable used: ADMIN_TOKEN - ensure it's documented
- Code: `  -H "Authorization: Bearer $ADMIN_TOKEN" \`

🔵 **INFO** (Line 1038, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1038, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1038, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1063, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "SET statement_timeout = '30min';"`

🔵 **INFO** (Line 1063, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `time psql $PRODUCTION_DATABASE_URL << 'EOF'`

🔵 **INFO** (Line 1113, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1113, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1113, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1113, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1149, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `  --db-url $PRODUCTION_DATABASE_URL \`

🔵 **INFO** (Line 1184, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL << 'EOF'`

🔵 **INFO** (Line 1219, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1219, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1245, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1245, bash)
- Environment variable used: ADMIN_TOKEN - ensure it's documented
- Code: `  -H "Authorization: Bearer $ADMIN_TOKEN" \`

🔵 **INFO** (Line 1280, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL << 'EOF'`

🔵 **INFO** (Line 1280, bash)
- Environment variable used: CONFIRM - ensure it's documented
- Code: `if [ "$CONFIRM" = "yes" ]; then`

🔵 **INFO** (Line 1280, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `    --dbname=$PRODUCTION_DATABASE_URL \`

🔵 **INFO** (Line 1280, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `    $BACKUP_FILE`

🔵 **INFO** (Line 1280, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `  psql $PRODUCTION_DATABASE_URL -c "SELECT count(*) FROM messages;"`

🔵 **INFO** (Line 1354, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "SET statement_timeout = '60min';"`

🔵 **INFO** (Line 1454, bash)
- Environment variable used: PAGERDUTY_TOKEN - ensure it's documented
- Code: `  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \`

🔵 **INFO** (Line 1487, bash)
- Environment variable used: CURRENT_VERSION - ensure it's documented
- Code: `echo "Current version: $CURRENT_VERSION"`

🔵 **INFO** (Line 1487, bash)
- Environment variable used: CURRENT_VERSION - ensure it's documented
- Code: `PREVIOUS_VERSION=$(git tag --sort=-v:refname | grep -v $CURRENT_VERSION | head -1)`

🔵 **INFO** (Line 1487, bash)
- Environment variable used: PREVIOUS_VERSION - ensure it's documented
- Code: `echo "Rolling back to: $PREVIOUS_VERSION"`

🔵 **INFO** (Line 1487, bash)
- Environment variable used: PREVIOUS_VERSION - ensure it's documented
- Code: `git log --oneline $PREVIOUS_VERSION..$CURRENT_VERSION | wc -l`

🔵 **INFO** (Line 1487, bash)
- Environment variable used: CURRENT_VERSION - ensure it's documented
- Code: `git log --oneline $PREVIOUS_VERSION..$CURRENT_VERSION | wc -l`

🔵 **INFO** (Line 1506, bash)
- Environment variable used: PREVIOUS_VERSION - ensure it's documented
- Code: `PREV_DEPLOY=$(vercel ls --prod | grep $PREVIOUS_VERSION | awk '{print $1}' | head -1)`

🔵 **INFO** (Line 1506, bash)
- Environment variable used: 1 - ensure it's documented
- Code: `PREV_DEPLOY=$(vercel ls --prod | grep $PREVIOUS_VERSION | awk '{print $1}' | head -1)`

🔵 **INFO** (Line 1506, bash)
- Environment variable used: PREV_DEPLOY - ensure it's documented
- Code: `vercel promote $PREV_DEPLOY --prod`

🔵 **INFO** (Line 1523, bash)
- Environment variable used: PREVIOUS_TAG - ensure it's documented
- Code: `echo "Rolling back to: $PREVIOUS_TAG"`

🔵 **INFO** (Line 1523, bash)
- Environment variable used: PREVIOUS_TAG - ensure it's documented
- Code: `docker tag omniops:$PREVIOUS_TAG omniops:latest`

🔵 **INFO** (Line 1550, bash)
- Environment variable used: PREVIOUS_TAG - ensure it's documented
- Code: `echo "Rolling back to: $PREVIOUS_TAG"`

🔵 **INFO** (Line 1550, bash)
- Environment variable used: PREVIOUS_TAG - ensure it's documented
- Code: `git checkout $PREVIOUS_TAG`

🔵 **INFO** (Line 1585, bash)
- Environment variable used: i - ensure it's documented
- Code: `  echo "Attempt $i:"`

🔵 **INFO** (Line 1624, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1624, bash)
- Environment variable used: CONFIRM - ensure it's documented
- Code: `if [ "$CONFIRM" = "yes" ]; then`

🔵 **INFO** (Line 1624, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `  pg_restore --clean --if-exists --dbname=$PRODUCTION_DATABASE_URL $BACKUP_FILE`

🔵 **INFO** (Line 1624, bash)
- Environment variable used: BACKUP_FILE - ensure it's documented
- Code: `  pg_restore --clean --if-exists --dbname=$PRODUCTION_DATABASE_URL $BACKUP_FILE`

🔵 **INFO** (Line 1624, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `  psql $PRODUCTION_DATABASE_URL -c "SELECT version FROM supabase_migrations.schema_migrations ORDER BY applied_at DESC LIMIT 1;"`

🔵 **INFO** (Line 1718, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1767, bash)
- Environment variable used: PREVIOUS_VERSION - ensure it's documented
- Code: `git log --oneline $PREVIOUS_VERSION..$CURRENT_VERSION`

🔵 **INFO** (Line 1767, bash)
- Environment variable used: CURRENT_VERSION - ensure it's documented
- Code: `git log --oneline $PREVIOUS_VERSION..$CURRENT_VERSION`

🔵 **INFO** (Line 1767, bash)
- Environment variable used: PREVIOUS_VERSION - ensure it's documented
- Code: `git diff $PREVIOUS_VERSION $CURRENT_VERSION -- lib/`

🔵 **INFO** (Line 1767, bash)
- Environment variable used: CURRENT_VERSION - ensure it's documented
- Code: `git diff $PREVIOUS_VERSION $CURRENT_VERSION -- lib/`

🔵 **INFO** (Line 1767, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 1788, bash)
- Environment variable used: PREVIOUS_VERSION - ensure it's documented
- Code: `git checkout $PREVIOUS_VERSION`

🔵 **INFO** (Line 1833, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "SELECT 1"`

🔵 **INFO** (Line 1852, bash)
- Environment variable used: WORKING_VERSION - ensure it's documented
- Code: `git checkout $WORKING_VERSION`

🔵 **INFO** (Line 1982, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `psql $NEXT_PUBLIC_SUPABASE_URL/postgres << 'EOF'`

🔵 **INFO** (Line 2009, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `supabase db push --db-url $NEXT_PUBLIC_SUPABASE_URL/postgres`

🔵 **INFO** (Line 2009, bash)
- Environment variable used: migration - ensure it's documented
- Code: `  echo "Running $migration..."`

🔵 **INFO** (Line 2009, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `  psql $NEXT_PUBLIC_SUPABASE_URL/postgres < $migration`

🔵 **INFO** (Line 2009, bash)
- Environment variable used: migration - ensure it's documented
- Code: `  psql $NEXT_PUBLIC_SUPABASE_URL/postgres < $migration`

🔵 **INFO** (Line 2009, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `psql $NEXT_PUBLIC_SUPABASE_URL/postgres -c "`

🔵 **INFO** (Line 2037, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `psql $NEXT_PUBLIC_SUPABASE_URL/postgres << 'EOF'`

🔵 **INFO** (Line 2070, bash)
- Environment variable used: REDIS_URL - ensure it's documented
- Code: `redis-cli -u $REDIS_URL PING`

🔵 **INFO** (Line 2089, bash)
- Environment variable used: ZONE_ID - ensure it's documented
- Code: `curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \`

🔵 **INFO** (Line 2089, bash)
- Environment variable used: CF_EMAIL - ensure it's documented
- Code: `  -H "X-Auth-Email: $CF_EMAIL" \`

🔵 **INFO** (Line 2089, bash)
- Environment variable used: CF_API_KEY - ensure it's documented
- Code: `  -H "X-Auth-Key: $CF_API_KEY" \`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: binary_remote_addr - ensure it's documented
- Code: `limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: binary_remote_addr - ensure it's documented
- Code: `limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: server_name - ensure it's documented
- Code: `    return 301 https://$server_name$request_uri;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: request_uri - ensure it's documented
- Code: `    return 301 https://$server_name$request_uri;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: http_upgrade - ensure it's documented
- Code: `        proxy_set_header Upgrade $http_upgrade;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: host - ensure it's documented
- Code: `        proxy_set_header Host $host;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: remote_addr - ensure it's documented
- Code: `        proxy_set_header X-Real-IP $remote_addr;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: proxy_add_x_forwarded_for - ensure it's documented
- Code: `        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: scheme - ensure it's documented
- Code: `        proxy_set_header X-Forwarded-Proto $scheme;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: http_upgrade - ensure it's documented
- Code: `        proxy_cache_bypass $http_upgrade;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: host - ensure it's documented
- Code: `        proxy_set_header Host $host;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: remote_addr - ensure it's documented
- Code: `        proxy_set_header X-Real-IP $remote_addr;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: proxy_add_x_forwarded_for - ensure it's documented
- Code: `        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`

🔵 **INFO** (Line 2264, bash)
- Environment variable used: scheme - ensure it's documented
- Code: `        proxy_set_header X-Forwarded-Proto $scheme;`

🔵 **INFO** (Line 2354, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL << 'EOF'`

🔵 **INFO** (Line 2380, bash)
- Environment variable used: ADMIN_TOKEN - ensure it's documented
- Code: `  -H "Authorization: Bearer $ADMIN_TOKEN" \`

🔵 **INFO** (Line 2435, bash)
- Environment variable used: UPTIMEROBOT_API_KEY - ensure it's documented
- Code: `  -d "api_key=$UPTIMEROBOT_API_KEY" \`

🔵 **INFO** (Line 2435, bash)
- Environment variable used: ALERT_CONTACT_ID - ensure it's documented
- Code: `  -d "alert_contacts=$ALERT_CONTACT_ID"`

🔵 **INFO** (Line 2450, bash)
- Environment variable used: PAGERDUTY_TOKEN - ensure it's documented
- Code: `  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \`

🔵 **INFO** (Line 2450, bash)
- Environment variable used: ESCALATION_POLICY_ID - ensure it's documented
- Code: `      "escalation_policy": {"id": "$ESCALATION_POLICY_ID", "type": "escalation_policy_reference"},`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `if curl -f "$BASE_URL/api/health" > /dev/null 2>&1; then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `HEALTH=$(curl -s "$BASE_URL/api/health/comprehensive")`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: HEALTH - ensure it's documented
- Code: `DB_STATUS=$(echo $HEALTH | jq -r '.database')`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: DB_STATUS - ensure it's documented
- Code: `if [ "$DB_STATUS" = "connected" ]; then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/chat" \`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: CHAT_RESPONSE - ensure it's documented
- Code: `if echo $CHAT_RESPONSE | jq -e '.response' > /dev/null 2>&1; then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `if curl -f "$BASE_URL/embed.js" > /dev/null 2>&1; then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `if curl -f "$BASE_URL/admin" > /dev/null 2>&1; then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `EXPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gdpr/export" \`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: EXPORT_RESPONSE - ensure it's documented
- Code: `if echo $EXPORT_RESPONSE | jq -e '.data' > /dev/null 2>&1; then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: BASE_URL - ensure it's documented
- Code: `RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s "$BASE_URL/api/health")`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: RESPONSE_TIME - ensure it's documented
- Code: `if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: RESPONSE_TIME - ensure it's documented
- Code: `  echo "  ✓ Response time: ${RESPONSE_TIME}s"`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: RESPONSE_TIME - ensure it's documented
- Code: `  echo "  ⚠ Response time slow: ${RESPONSE_TIME}s"`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: FAILED - ensure it's documented
- Code: `if [ $FAILED -eq 0 ]; then`

🔵 **INFO** (Line 2472, bash)
- Environment variable used: FAILED - ensure it's documented
- Code: `  echo "❌ $FAILED TESTS FAILED"`

🔵 **INFO** (Line 2720, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "SELECT 1"`

🔵 **INFO** (Line 2720, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `echo $NEXT_PUBLIC_SUPABASE_URL`

🔵 **INFO** (Line 2720, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"`

🔵 **INFO** (Line 2734, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

🔵 **INFO** (Line 2734, bash)
- Environment variable used: PRODUCTION_DATABASE_URL - ensure it's documented
- Code: `psql $PRODUCTION_DATABASE_URL -c "`

### docs/AI-ENHANCED-SCRAPER-SYSTEM.md

🔵 **INFO** (Line 1100, typescript)
- Use of "any" type - consider more specific type
- Code: `class ScraperConfigManager {
  static getInstance(): ScraperConfigManager
  
  getConfig(): ScraperC`

### docs/API-REFERENCE-OWNED-DOMAINS.md

🔵 **INFO** (Line 227, typescript)
- Use of "any" type - consider more specific type
- Code: `try {
  const jobId = await crawlWebsite(url, {
    maxPages: 10000,
    ownSite: true
  });
} catch`

### docs/ARCHITECTURE.md

🔵 **INFO** (Line 242, typescript)
- Use of "any" type - consider more specific type
- Code: `// Centralized error handling
class AppError extends Error {
  constructor(
    public statusCode: n`

### docs/ARCHIVE/analysis/AGENTIC_SEARCH_ENHANCEMENT_PLAN.md

🔵 **INFO** (Line 143, typescript)
- Use of "any" type - consider more specific type
- Code: `// New file: lib/query-intelligence.ts
interface QueryIntent {
  type: 'specific_product' | 'categor`

🔵 **INFO** (Line 356, typescript)
- Use of "any" type - consider more specific type
- Code: `// New file: lib/search-session.ts
class SearchSession {
  private sessionId: string;
  private cont`

🔵 **INFO** (Line 529, typescript)
- Use of "any" type - consider more specific type
- Code: `// New file: lib/result-validator.ts
class ResultQualityValidator {
  async validateResults(
    que`

🟡 **WARNING** (Line 616, typescript)
- Import path may not exist: @/lib/search-confidence
- Code: `from '@/lib/search-confidence'`

🟡 **WARNING** (Line 616, typescript)
- Import path may not exist: @/lib/query-intelligence
- Code: `from '@/lib/query-intelligence'`

🟡 **WARNING** (Line 616, typescript)
- Import path may not exist: @/lib/query-refiner
- Code: `from '@/lib/query-refiner'`

🟡 **WARNING** (Line 616, typescript)
- Import path may not exist: @/lib/search-patterns
- Code: `from '@/lib/search-patterns'`

🟡 **WARNING** (Line 616, typescript)
- Import path may not exist: @/lib/search-session
- Code: `from '@/lib/search-session'`

🟡 **WARNING** (Line 616, typescript)
- Import path may not exist: @/lib/search-orchestrator
- Code: `from '@/lib/search-orchestrator'`

🟡 **WARNING** (Line 616, typescript)
- Import path may not exist: @/lib/result-validator
- Code: `from '@/lib/result-validator'`

### docs/ARCHIVE/analysis/AI_INTELLIGENCE_ANALYSIS.md

🔵 **INFO** (Line 113, typescript)
- Use of "any" type - consider more specific type
- Code: `// Line 46-66: Treats AI as unable to understand typos or context
prompt = `You are a smart customer`

🔵 **INFO** (Line 212, typescript)
- Use of "any" type - consider more specific type
- Code: `// Lines 40-83: Base prompt with extensive restrictions
`You are a helpful Customer Service Agent...`

🔵 **INFO** (Line 247, typescript)
- Use of "any" type - consider more specific type
- Code: `// Lines 209-237: Forces product injection
if (!hasProducts && needsInjection) {
  // Generate and a`

### docs/ARCHIVE/analysis/architectural-evaluation-full-visibility.md

🔵 **INFO** (Line 170, typescript)
- Use of "any" type - consider more specific type
- Code: `// 1. Cursor-based pagination with metadata
interface SearchCursor {
  id: string;
  query: string;
`

### docs/ARCHIVE/analysis/COMMERCE_PROVIDER_PATTERN.md

🔵 **INFO** (Line 107, typescript)
- Use of "any" type - consider more specific type
- Code: `interface OrderInfo {
  id: string | number;
  number: string | number;
  status: string;
  date: st`

### docs/ARCHIVE/analysis/CUSTOMER_SERVICE_AGENT_ASSESSMENT.md

🔵 **INFO** (Line 236, typescript)
- Use of "any" type - consider more specific type
- Code: `interface KnowledgeBase {
  // Product Information
  products: {
    catalog: ProductDatabase,
    i`

🔵 **INFO** (Line 364, typescript)
- Use of "any" type - consider more specific type
- Code: `const OPTIMIZED_CS_PROMPT = `
You are an expert customer service representative for ${companyName}.
`

### docs/ARCHIVE/analysis/DEPENDENCY_ANALYZER_IMPLEMENTATION_REPORT.md

🟡 **WARNING** (Line 165, typescript)
- Import path may not exist: ./lib/dev-tools
- Code: `from './lib/dev-tools'`

🟡 **WARNING** (Line 165, typescript)
- Import path may not exist: ./lib/dev-tools
- Code: `from './lib/dev-tools'`

### docs/ARCHIVE/analysis/DOCKER_FIX_SUMMARY.md

🟡 **WARNING** (Line 16, typescript)
- Import path may not exist: ./embeddings-functions
- Code: `from './embeddings-functions'`

🟡 **WARNING** (Line 26, typescript)
- Import path may not exist: ./embeddings
- Code: `from './embeddings'`

🟡 **WARNING** (Line 26, typescript)
- Import path may not exist: ./embeddings-functions
- Code: `from './embeddings-functions'`

### docs/ARCHIVE/analysis/FIXES_COMPLETED.md

🟡 **WARNING** (Line 90, typescript)
- Import path may not exist: @/test-utils/rls-test-helpers
- Code: `from '@/test-utils/rls-test-helpers'`

### docs/ARCHIVE/analysis/INTELLIGENT_AI_DESIGN.md

🔵 **INFO** (Line 152, typescript)
- Use of "any" type - consider more specific type
- Code: `interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
  `

🔵 **INFO** (Line 206, typescript)
- Use of "any" type - consider more specific type
- Code: `interface AIDecision {
  tools: Array<{
    name: string;
    params: any;
    purpose: string;
  }>`

### docs/ARCHIVE/analysis/LOAD_TESTER_IMPLEMENTATION_REPORT.md

🟡 **WARNING** (Line 121, typescript)
- Import path may not exist: ./lib/dev-tools
- Code: `from './lib/dev-tools'`

🟡 **WARNING** (Line 130, typescript)
- Import path may not exist: ./lib/dev-tools
- Code: `from './lib/dev-tools'`

### docs/ARCHIVE/analysis/MEMORY_MONITOR_IMPLEMENTATION_REPORT.md

🟡 **WARNING** (Line 231, typescript)
- Import path may not exist: ./lib/dev-tools
- Code: `from './lib/dev-tools'`

🟡 **WARNING** (Line 248, typescript)
- Import path may not exist: ./lib/dev-tools
- Code: `from './lib/dev-tools'`

🟡 **WARNING** (Line 261, typescript)
- Import path may not exist: ./lib/dev-tools
- Code: `from './lib/dev-tools'`

### docs/ARCHIVE/analysis/PERFORMANCE_REPORT_OPTION1.md

🔵 **INFO** (Line 102, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Add compound indexes
CREATE INDEX idx_scraped_pages_domain_title 
  ON scraped_pages(domain_id, t`

### docs/ARCHIVE/analysis/performance-report-full-visibility.md

🔵 **INFO** (Line 137, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Current query (fast but limited)
SELECT * FROM products 
WHERE name ILIKE '%query%' 
LIMIT 20;  
`

### docs/ARCHIVE/analysis/proposed-solution-full-visibility.md

🔵 **INFO** (Line 11, typescript)
- Use of "any" type - consider more specific type
- Code: `// Modified tool response structure
const toolResponse = {
  summary: {
    totalFound: 247,  // ACT`

### docs/ARCHIVE/analysis/RLS_TEST_IMPLEMENTATION_STATUS.md

🔵 **INFO** (Line 113, typescript)
- Use of "any" type - consider more specific type
- Code: `// In test-utils/rls-test-helpers.ts
export async function createTestUser(
  email: string,
  metada`

### docs/ARCHIVE/analysis/RLS_TESTING_FINAL_STATUS.md

🔵 **INFO** (Line 89, typescript)
- Use of "any" type - consider more specific type
- Code: `// Replace createTestUser() implementation
export async function createTestUser(
  email: string,
  `

### docs/ARCHIVE/analysis/SECURITY_VERIFICATION_COMPLETE.md

🔵 **INFO** (Line 65, typescript)
- Use of "any" type - consider more specific type
- Code: `function validateToolArguments(toolName: string, toolArgs: Record<string, any>): string | null`

### docs/ARCHIVE/analysis/SHOPIFY_VS_WOOCOMMERCE_COMPLEXITY_ANALYSIS.md

🔵 **INFO** (Line 202, typescript)
- Use of "any" type - consider more specific type
- Code: `// Must update 3 fields atomically
await updateCredentials({
  woocommerce_url: newUrl,           //`

### docs/ARCHIVE/analysis/SUPABASE_RLS_AND_INDEX_VERIFICATION.md

🔵 **INFO** (Line 292, sql)
- Using SELECT * - consider specifying columns
- Code: `-- User's query:
SELECT * FROM domains;

-- PostgreSQL actually executes:
SELECT * FROM domains
WHER`

🔵 **INFO** (Line 478, sql)
- Using SELECT * - consider specifying columns
- Code: `-- RLS Policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- RLS Enabled Status
SELECT`

### docs/ARCHIVE/analysis/TELEMETRY_IMPLEMENTATION_REPORT.md

🔵 **INFO** (Line 152, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Recent sessions with high search counts
SELECT session_id, duration_ms, search_count, success
FRO`

### docs/ARCHIVE/chat-system-old/CHAT_IMPROVEMENTS_ROADMAP.md

🔵 **INFO** (Line 62, typescript)
- Use of "any" type - consider more specific type
- Code: `// Adjust thresholds based on result quality
const dynamicThreshold = (query: string, initialResults`

### docs/ARCHIVE/forensics/CIFA_EMBEDDING_FORENSIC_REPORT.md

🔵 **INFO** (Line 40, typescript)
- Use of "any" type - consider more specific type
- Code: `// Add metadata matches with boost
metadataResults.forEach((r: any) => {
  if (allResults.has(r.url)`

### docs/ARCHIVE/forensics/DOCKER_BUILD_FORENSIC_REPORT.md

🟡 **WARNING** (Line 26, typescript)
- Import path may not exist: ./embeddings-functions
- Code: `from './embeddings-functions'`

### docs/ARCHIVE/forensics/NEXTJS_15_FORENSIC_ANALYSIS.md

🟡 **WARNING** (Line 59, typescript)
- Unclosed function body
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string `

🟡 **WARNING** (Line 59, typescript)
- Unclosed object
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string `

🟡 **WARNING** (Line 92, typescript)
- Unclosed function body
- Code: `export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = `

🟡 **WARNING** (Line 92, typescript)
- Unclosed object
- Code: `export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = `

🟡 **WARNING** (Line 108, typescript)
- Unclosed function body
- Code: `export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }`

🟡 **WARNING** (Line 108, typescript)
- Unclosed object
- Code: `export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }`

🟡 **WARNING** (Line 122, typescript)
- Unclosed function body
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] `

🟡 **WARNING** (Line 122, typescript)
- Unclosed object
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] `

🟡 **WARNING** (Line 140, typescript)
- Unclosed function body
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ Mi`

🟡 **WARNING** (Line 140, typescript)
- Unclosed object
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ Mi`

🟡 **WARNING** (Line 148, typescript)
- Unclosed function body
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }`

🟡 **WARNING** (Line 148, typescript)
- Unclosed object
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }`

🟡 **WARNING** (Line 162, typescript)
- Unclosed function body
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ Mi`

🟡 **WARNING** (Line 162, typescript)
- Unclosed object
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ Mi`

🟡 **WARNING** (Line 175, typescript)
- Unclosed function body
- Code: `export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: s`

🟡 **WARNING** (Line 175, typescript)
- Unclosed object
- Code: `export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: s`

🟡 **WARNING** (Line 189, typescript)
- Unclosed function body
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ Mi`

🟡 **WARNING** (Line 189, typescript)
- Unclosed object
- Code: `export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // ❌ Mi`

🟡 **WARNING** (Line 202, typescript)
- Unclosed function body
- Code: `export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; invitati`

🟡 **WARNING** (Line 202, typescript)
- Unclosed object
- Code: `export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; invitati`

### docs/ARCHIVE/old-docs/scraping/SCRAPER-ARCHITECTURE.md

🔵 **INFO** (Line 195, typescript)
- Use of "any" type - consider more specific type
- Code: `import { scrapePage } from '@/lib/scraper-api';

const result = await scrapePage('https://shop.examp`

### docs/ARCHIVE/old-docs/scraping/SCRAPING_API.md

🔵 **INFO** (Line 54, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ErrorResponse {
  error: string;
  details?: any;
}`

🔵 **INFO** (Line 103, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ScrapedPage {
  url: string;
  title: string;
  content: string;         // Markdown forma`

### docs/ARCHIVE/old-docs/scraping/SCRAPING_OPERATIONS.md

🔵 **INFO** (Line 97, bash)
- Environment variable used: pages - ensure it's documented
- Code: `  console.log(\`Pages: \${pages}, Embeddings: \${embeddings}\`);`

🔵 **INFO** (Line 97, bash)
- Environment variable used: embeddings - ensure it's documented
- Code: `  console.log(\`Pages: \${pages}, Embeddings: \${embeddings}\`);`

🔵 **INFO** (Line 302, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `echo "VACUUM ANALYZE;" | psql $DATABASE_URL`

🔵 **INFO** (Line 376, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `pg_restore -d $DATABASE_URL backup.dump`

🔵 **INFO** (Line 441, bash)
- Environment variable used: 4 - ensure it's documented
- Code: `MEM=$(ps aux | grep scraper-worker | awk '{print $4}')`

🔵 **INFO** (Line 441, bash)
- Environment variable used: MEM - ensure it's documented
- Code: `if (( $(echo "$MEM > 75" | bc -l) )); then`

🔵 **INFO** (Line 441, bash)
- Environment variable used: MEM - ensure it's documented
- Code: `  echo "ALERT: High memory usage: ${MEM}%"`

🔵 **INFO** (Line 441, bash)
- Environment variable used: ERRORS - ensure it's documented
- Code: `if [ $ERRORS -gt 10 ]; then`

🔵 **INFO** (Line 441, bash)
- Environment variable used: ERRORS - ensure it's documented
- Code: `  echo "ALERT: High error rate: $ERRORS errors"`

### docs/ARCHIVE/old-docs/scraping/SCRAPING_SYSTEM_COMPLETE.md

🔵 **INFO** (Line 187, bash)
- Environment variable used: JOB_ID - ensure it's documented
- Code: `node lib/scraper-worker.js "$JOB_ID" "https://site.com" "-1" "true"`

### docs/CHAT_ROUTES_COMPARISON.md

🟡 **WARNING** (Line 171, typescript)
- Unclosed object
- Code: `// Change from:
const response = await fetch('/api/chat', {

// To:
const response = await fetch('/a`

### docs/CODE_ISSUES_FROM_TESTING.md

🔵 **INFO** (Line 169, typescript)
- Use of "any" type - consider more specific type
- Code: `formatOrdersForAI(orders: any[]): string {
  return orders.map((order, index) => `
    Order ${index`

🔵 **INFO** (Line 311, typescript)
- Use of "any" type - consider more specific type
- Code: `// lib/api-errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: num`

### docs/CODE_ORGANIZATION.md

🟡 **WARNING** (Line 107, typescript)
- Import path may not exist: @/lib/services/chat.service
- Code: `from '@/lib/services/chat.service'`

🟡 **WARNING** (Line 107, typescript)
- Import path may not exist: @/constants
- Code: `from '@/constants'`

🟡 **WARNING** (Line 107, typescript)
- Import path may not exist: ./utils
- Code: `from './utils'`

🟡 **WARNING** (Line 198, typescript)
- Import path may not exist: ./chat.service
- Code: `from './chat.service'`

🟡 **WARNING** (Line 198, typescript)
- Import path may not exist: ./scraping.service
- Code: `from './scraping.service'`

🟡 **WARNING** (Line 198, typescript)
- Import path may not exist: ./woocommerce.service
- Code: `from './woocommerce.service'`

🟡 **WARNING** (Line 277, typescript)
- Import path may not exist: @/lib/services/chat.service
- Code: `from '@/lib/services/chat.service'`

### docs/COMMERCE_PROVIDER_TEST_ANALYSIS.md

🟡 **WARNING** (Line 9, typescript)
- Import path may not exist: ./providers/woocommerce-provider
- Code: `from './providers/woocommerce-provider'`

🔵 **INFO** (Line 85, typescript)
- Use of "any" type - consider more specific type
- Code: `export interface CommerceProvider {
  readonly platform: string;
  lookupOrder(orderId: string, emai`

### docs/CUSTOMER_ID_MIGRATION_PLAN.md

🔵 **INFO** (Line 445, typescript)
- Use of "any" type - consider more specific type
- Code: `interface CustomerConfig {
  id: string
  customer_id: string | null  // ❌ Legacy
  domain: string
 `

🔵 **INFO** (Line 465, typescript)
- Use of "any" type - consider more specific type
- Code: `interface CustomerConfig {
  id: string
  customer_id: string | null  // ⚠️ Keep for backward compat`

### docs/CUSTOMER_ID_MIGRATION_SUMMARY.md

🔵 **INFO** (Line 217, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT COUNT(*), COUNT(organization_id) FROM conversations"`

🔵 **INFO** (Line 217, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT COUNT(*), COUNT(organization_id) FROM customer_configs"`

### docs/DASHBOARD.md

🟡 **WARNING** (Line 907, typescript)
- Import path may not exist: @/hooks/useTelemetry
- Code: `from '@/hooks/useTelemetry'`

🟡 **WARNING** (Line 968, typescript)
- Import path may not exist: @/hooks/useTelemetry
- Code: `from '@/hooks/useTelemetry'`

🟡 **WARNING** (Line 1037, typescript)
- Import path may not exist: @/hooks/useTelemetry
- Code: `from '@/hooks/useTelemetry'`

🟡 **WARNING** (Line 1311, typescript)
- Import path may not exist: @/hooks/useTelemetry
- Code: `from '@/hooks/useTelemetry'`

🟡 **WARNING** (Line 1311, typescript)
- Import path may not exist: @/hooks/useAnalytics
- Code: `from '@/hooks/useAnalytics'`

🟡 **WARNING** (Line 1430, typescript)
- Import path may not exist: @/hooks/useTelemetry
- Code: `from '@/hooks/useTelemetry'`

🟡 **WARNING** (Line 1430, typescript)
- Import path may not exist: @/components/dashboard/CostTrendChart
- Code: `from '@/components/dashboard/CostTrendChart'`

🟡 **WARNING** (Line 1430, typescript)
- Import path may not exist: @/components/dashboard/ModelComparisonCard
- Code: `from '@/components/dashboard/ModelComparisonCard'`

🟡 **WARNING** (Line 1430, typescript)
- Import path may not exist: @/components/dashboard/DomainCostTable
- Code: `from '@/components/dashboard/DomainCostTable'`

🟡 **WARNING** (Line 1430, typescript)
- Import path may not exist: @/components/dashboard/BudgetAlertsPanel
- Code: `from '@/components/dashboard/BudgetAlertsPanel'`

🟡 **WARNING** (Line 1430, typescript)
- Import path may not exist: @/components/dashboard/LiveCostTicker
- Code: `from '@/components/dashboard/LiveCostTicker'`

🟡 **WARNING** (Line 1608, typescript)
- Import path may not exist: ../useTelemetry
- Code: `from '../useTelemetry'`

🟡 **WARNING** (Line 1687, typescript)
- Import path may not exist: ../page
- Code: `from '../page'`

🟡 **WARNING** (Line 1809, typescript)
- Import path may not exist: @/lib/cache
- Code: `from '@/lib/cache'`

🔵 **INFO** (Line 1828, typescript)
- Use of "any" type - consider more specific type
- Code: `// lib/simple-cache.ts
const cache = new Map<string, { data: any; expires: number }>();

export func`

### docs/DEPENDENCY_INJECTION.md

🟡 **WARNING** (Line 169, typescript)
- Import path may not exist: @/app/api/your-route/route
- Code: `from '@/app/api/your-route/route'`

🔵 **INFO** (Line 169, typescript)
- Use of "any" type - consider more specific type
- Code: `import { POST } from '@/app/api/your-route/route';
import { NextRequest } from 'next/server';

descr`

🔵 **INFO** (Line 212, typescript)
- Use of "any" type - consider more specific type
- Code: `import OpenAI from 'openai';

describe('/api/chat', () => {
  let mockOpenAIInstance: jest.Mocked<Op`

🔵 **INFO** (Line 271, typescript)
- Use of "any" type - consider more specific type
- Code: `// __tests__/setup/test-helpers.ts
export function createMockRateLimit(allowed: boolean = true) {
  `

🟡 **WARNING** (Line 302, typescript)
- Import path may not exist: @/__tests__/setup/test-helpers
- Code: `from '@/__tests__/setup/test-helpers'`

🟡 **WARNING** (Line 322, typescript)
- Import path may not exist: @/lib/utilities
- Code: `from '@/lib/utilities'`

🟡 **WARNING** (Line 339, typescript)
- Import path may not exist: @/lib/utilities
- Code: `from '@/lib/utilities'`

### docs/ERROR_HANDLING.md

🔵 **INFO** (Line 162, typescript)
- Use of "any" type - consider more specific type
- Code: `import { withDatabaseErrorHandling, safeQuery } from '@/lib/safe-database';

// Wrap any database op`

### docs/implementation/ADVANCED_SEARCH_IMPROVEMENTS.md

🔵 **INFO** (Line 250, typescript)
- Use of "any" type - consider more specific type
- Code: `interface VisualMetadata {
  images: Array<{
    url: string;
    alt_text: string;
    
    // Extr`

### docs/implementation/ENHANCED_METADATA_IMPLEMENTATION.md

🔵 **INFO** (Line 296, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Verify functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('search_embeddings_enhanced`

### docs/implementation/IMPLEMENTATION_SUMMARY.md

🟡 **WARNING** (Line 35, typescript)
- Import path may not exist: ./query-enhancer-optimized
- Code: `from './query-enhancer-optimized'`

### docs/implementation/RAG_FIX_DOCUMENTATION.md

🔵 **INFO** (Line 205, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Check if the function exists with correct signature
SELECT proname, pg_get_function_identity_argu`

### docs/ISSUE_MSW_TEST_PERFORMANCE.md

🔵 **INFO** (Line 133, typescript)
- Use of "any" type - consider more specific type
- Code: `// File: test-utils/jest.setup.msw.js
// Add at the top before any imports

// Disable MSW internal `

### docs/MIGRATION_TO_ORGANIZATIONS.md

🟡 **WARNING** (Line 85, typescript)
- Import path may not exist: @/lib/contexts/organization-context
- Code: `from '@/lib/contexts/organization-context'`

### docs/MOCK_REFERENCE.md

🟡 **WARNING** (Line 47, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 147, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 214, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 270, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 298, typescript)
- Import path may not exist: @/test-utils/my-helpers
- Code: `from '@/test-utils/my-helpers'`

🟡 **WARNING** (Line 462, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 481, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

### docs/MULTI_SEAT_ORGANIZATIONS.md

🟡 **WARNING** (Line 226, typescript)
- Import path may not exist: @/lib/contexts/organization-context
- Code: `from '@/lib/contexts/organization-context'`

### docs/NAVIGATION_FIX_SUMMARY.md

🟡 **WARNING** (Line 33, typescript)
- Unclosed object
- Code: `// Before: Using HTML content
if (pageData.content && pageData.content.length > 0)

// After: Using `

### docs/OWN-SITE-SCRAPING.md

🔵 **INFO** (Line 16, typescript)
- Use of "any" type - consider more specific type
- Code: `import { configureOwnedDomains } from './lib/scraper-api';

// Add your domains at startup
configure`

🔵 **INFO** (Line 68, typescript)
- Use of "any" type - consider more specific type
- Code: `// If yourcompany.com is in OWNED_DOMAINS env var
const jobId = await crawlWebsite('https://yourcomp`

🔵 **INFO** (Line 85, typescript)
- Use of "any" type - consider more specific type
- Code: `import { isOwnedSite } from './lib/scraper-api';

const isOwn = await isOwnedSite('https://yourcompa`

### docs/OWNED-DOMAINS-FEATURE.md

🔵 **INFO** (Line 192, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL < supabase/migrations/004_add_owned_domains.sql`

### docs/PERFORMANCE_OPTIMIZATION_PLAN.md

🔵 **INFO** (Line 196, typescript)
- Use of "any" type - consider more specific type
- Code: `// Stream partial results to user while others complete
export async function* streamResults(toolExe`

🔵 **INFO** (Line 286, bash)
- Environment variable used: i - ensure it's documented
- Code: `    -d '{"message":"find pumps","session_id":"test'$i'"}' &`

🔵 **INFO** (Line 303, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM scraped_pages 
WHERE title ILIKE '%pump%';`

### docs/PRODUCT_SEARCH_FIX.md

🔵 **INFO** (Line 31, typescript)
- Use of "any" type - consider more specific type
- Code: `// Include lower relevance items - but give FULL content for product pages
if (contextualRelevance.l`

### docs/QUICK_REFERENCE.md

🔵 **INFO** (Line 110, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "SELECT 1"`

### docs/QUICK_START_CUSTOMER_VERIFICATION.md

🔵 **INFO** (Line 239, sql)
- Using SELECT * - consider specifying columns
- Code: `-- In Supabase SQL editor
SELECT * FROM customer_access_logs 
ORDER BY accessed_at DESC 
LIMIT 50;

`

### docs/RAG_TROUBLESHOOTING.md

🔵 **INFO** (Line 16, bash)
- Environment variable used: NEXT_PUBLIC_SUPABASE_URL - ensure it's documented
- Code: `echo $NEXT_PUBLIC_SUPABASE_URL`

### docs/reports/CATEGORY_MATCHING_ALGORITHM_TEST_RESULTS.md

🔵 **INFO** (Line 17, typescript)
- Use of "any" type - consider more specific type
- Code: `const msg = message.toLowerCase();
const tokens = new Set<string>(msg.split(/[^a-z0-9]+/i).filter(Bo`

### docs/reports/EMBEDDINGS_METADATA_ANALYSIS.md

🔵 **INFO** (Line 123, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Stage 1: Metadata pre-filtering
WITH filtered_embeddings AS (
  SELECT * FROM page_embeddings
  W`

### docs/reports/METADATA_VALIDATION_SUMMARY.md

🔵 **INFO** (Line 157, sql)
- Using SELECT * - consider specifying columns
- Code: `-- Check metadata coverage
SELECT * FROM get_metadata_stats(NULL);

-- Sample metadata quality
SELEC`

### docs/SCRAPER_ENHANCEMENTS_COMPLETE_GUIDE.md

🔵 **INFO** (Line 411, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

🔵 **INFO** (Line 411, bash)
- Environment variable used: DATABASE_URL - ensure it's documented
- Code: `psql $DATABASE_URL -c "`

### docs/SEARCH_PIPELINE_RECOVERY.md

🔵 **INFO** (Line 82, typescript)
- Use of "any" type - consider more specific type
- Code: `// lib/search-cache.ts
export class SearchCacheManager {
  private readonly CACHE_TTL = 3600; // 1 h`

### docs/SECURITY_HARDENING_SUMMARY.md

🔵 **INFO** (Line 15, typescript)
- Use of "any" type - consider more specific type
- Code: `function validateToolArguments(toolName: string, toolArgs: Record<string, any>): string | null {
  c`

### docs/setup/MIGRATION_INSTRUCTIONS.md

🔵 **INFO** (Line 108, sql)
- Using SELECT * - consider specifying columns
- Code: `SELECT * FROM search_embeddings_enhanced(
  ARRAY[0.1, 0.2]::vector(1536),  -- Replace with actual e`

🔵 **INFO** (Line 116, sql)
- Using SELECT * - consider specifying columns
- Code: `SELECT * FROM search_by_metadata(
  content_types => ARRAY['product', 'faq'],
  limit_count => 10
);`

🔵 **INFO** (Line 124, sql)
- Using SELECT * - consider specifying columns
- Code: `SELECT * FROM get_metadata_stats();`

### docs/SMART_PERIODIC_SCRAPER_API_EXAMPLES.md

🔵 **INFO** (Line 491, typescript)
- Use of "any" type - consider more specific type
- Code: `// Response (429 Too Many Requests)
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEE`

### docs/STREAMING_FUTURE_FEATURE.md

🔵 **INFO** (Line 79, typescript)
- Use of "any" type - consider more specific type
- Code: `type StreamEvent =
  | { type: 'status', message: string, icon: string }           // "Thinking...",`

### docs/TEST_ANALYSIS_SUMMARY.md

🟡 **WARNING** (Line 349, typescript)
- Import path may not exist: @/test-utils/rls-test-helpers
- Code: `from '@/test-utils/rls-test-helpers'`

### docs/TEST_COMPLETION_REPORT.md

🟡 **WARNING** (Line 229, typescript)
- Import path may not exist: @/test-utils/api-test-helpers
- Code: `from '@/test-utils/api-test-helpers'`

### docs/TEST_COVERAGE_REPORT.md

🟡 **WARNING** (Line 221, typescript)
- Code block ends with comma - may be incomplete
- Code: `crawler.test.ts',
  '**/__tests__/**/pattern-learner.test.ts',
  '**/__tests__/api/**/*.test.ts',
],`

### docs/TEST_DOCUMENTATION.md

🟡 **WARNING** (Line 132, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 154, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 181, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🔵 **INFO** (Line 181, typescript)
- Use of "any" type - consider more specific type
- Code: `// __tests__/lib/chat-service.test.ts
import { ChatService } from '@/lib/chat-service';
import { moc`

### docs/TEST_FIX_STATUS.md

🟡 **WARNING** (Line 70, typescript)
- Unclosed class body
- Code: `// Before
class PerformanceTracker {

// After
export class PerformanceTracker {`

🟡 **WARNING** (Line 70, typescript)
- Unclosed object
- Code: `// Before
class PerformanceTracker {

// After
export class PerformanceTracker {`

### docs/TESTING_QUICKSTART.md

🟡 **WARNING** (Line 43, typescript)
- Import path may not exist: @/app/api/my-endpoint/route
- Code: `from '@/app/api/my-endpoint/route'`

🟡 **WARNING** (Line 43, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

🟡 **WARNING** (Line 60, typescript)
- Import path may not exist: @/test-utils/mock-helpers
- Code: `from '@/test-utils/mock-helpers'`

### docs/TESTING_SUPABASE_ROUTES.md

🟡 **WARNING** (Line 102, typescript)
- Import path may not exist: @/app/api/route
- Code: `from '@/app/api/route'`

🟡 **WARNING** (Line 264, typescript)
- Import path may not exist: @/test-utils/msw-handlers
- Code: `from '@/test-utils/msw-handlers'`

### docs/TESTING.md

🟡 **WARNING** (Line 149, typescript)
- Import path may not exist: ./ComponentName
- Code: `from './ComponentName'`

🟡 **WARNING** (Line 172, typescript)
- Import path may not exist: ../__mocks__/server
- Code: `from '../__mocks__/server'`

### docs/woocommerce/WOOCOMMERCE_IMPLEMENTATION_COMPLETE.md

🔵 **INFO** (Line 46, typescript)
- Use of "any" type - consider more specific type
- Code: `if (customerConfig?.woocommerce_url) {
  // Import and use dynamic WooCommerce client
  const { getD`

🔵 **INFO** (Line 98, typescript)
- Use of "any" type - consider more specific type
- Code: `// Process WooCommerce product search results
if (wooCommerceSearchPromise) {
  const wooResult = co`

🔵 **INFO** (Line 115, typescript)
- Use of "any" type - consider more specific type
- Code: `// Process WooCommerce results (orders or products)
if (wooCommerceSearchPromise) {
  const wooResul`

### __tests__/api/README.md

🔵 **INFO** (Line 312, typescript)
- Use of "any" type - consider more specific type
- Code: `describe('Memory Management', () => {
  it('should not leak memory during multiple requests', async `

🔵 **INFO** (Line 372, typescript)
- Use of "any" type - consider more specific type
- Code: `describe('Rate Limiting', () => {
  it('should enforce rate limits per domain', async () => {
    //`

### __tests__/integration/README.md

🔵 **INFO** (Line 340, typescript)
- Use of "any" type - consider more specific type
- Code: `class PerformanceHelpers {
  private static timers = new Map<string, number>()
  private static metr`

### __tests__/lib/README.md

🔵 **INFO** (Line 194, typescript)
- Use of "any" type - consider more specific type
- Code: `describe('PaginationCrawler', () => {
  it('should detect pagination patterns', async () => {
    co`

### app/api/auth/README.md

🔵 **INFO** (Line 190, typescript)
- Use of "any" type - consider more specific type
- Code: `interface Customer {
  id: string                    // Unique customer identifier
  auth_user_id: s`

### app/api/customer/README.md

🔵 **INFO** (Line 211, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ConfigurationMetadata {
  originalUrl?: string             // Original URL before normaliz`

### app/api/jobs/[jobId]/README.md

🔵 **INFO** (Line 181, typescript)
- Use of "any" type - consider more specific type
- Code: `interface JobResponse extends JobStatus {
  logs?: string[];        // Optional job logs
  metrics?:`

### app/api/privacy/README.md

🔵 **INFO** (Line 155, bash)
- Environment variable used: user - ensure it's documented
- Code: `    -d "{\"userId\": \"$user\"}"`

### app/api/scrape-jobs/[id]/README.md

🔵 **INFO** (Line 299, typescript)
- Use of "any" type - consider more specific type
- Code: `interface UpdateScrapeJobOptions {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'canc`

### app/api/scrape-jobs/[id]/retry/README.md

🔵 **INFO** (Line 408, typescript)
- Use of "any" type - consider more specific type
- Code: `import React, { useState } from 'react';

interface RetryJobButtonProps {
  jobId: string;
  current`

🔵 **INFO** (Line 518, typescript)
- Use of "any" type - consider more specific type
- Code: `class RetryAnalytics {
  async analyzeRetryPatterns() {
    const retryData = await this.getRetryDat`

### app/api/scrape-jobs/next/README.md

🔵 **INFO** (Line 115, sql)
- Using SELECT * - consider specifying columns
- Code: `SELECT * FROM scrape_jobs 
WHERE status = 'pending'
ORDER BY 
  priority DESC,
  retry_count ASC,
  `

🔵 **INFO** (Line 216, typescript)
- Use of "any" type - consider more specific type
- Code: `import { scrapeJobManager } from '@/lib/scrape-job-manager';

class ScrapeWorker {
  private workerI`

🔵 **INFO** (Line 436, typescript)
- Use of "any" type - consider more specific type
- Code: `class LoadBalancedQueue {
  async getNextJobForWorker(workerCapabilities: string[]) {
    // Get job`

### app/api/scrape-jobs/README.md

🔵 **INFO** (Line 215, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ScrapeJob {
  id: string;                    // UUID
  domain_id?: string;            // F`

### app/api/scrape-jobs/stats/README.md

🔵 **INFO** (Line 447, typescript)
- Use of "any" type - consider more specific type
- Code: `class JobStatsReporter {
  async generateDailyReport() {
    const stats = await this.getStats();
  `

### app/api/webhooks/customer/README.md

🔵 **INFO** (Line 332, typescript)
- Use of "any" type - consider more specific type
- Code: `class WebhookProcessor {
  async processWebhook(payload: any) {
    // Determine webhook type
    if`

### components/dashboard/README.md

🔵 **INFO** (Line 288, typescript)
- Use of "any" type - consider more specific type
- Code: `// Centralized data management
export const dashboardStore = {
  data: new Map<string, any>(),
  sub`

🔵 **INFO** (Line 420, typescript)
- Use of "any" type - consider more specific type
- Code: `// Implement caching for dashboard data
const dashboardCache = new Map<string, {
  data: any;
  time`

### hooks/README.md

🔵 **INFO** (Line 230, typescript)
- Use of "any" type - consider more specific type
- Code: `import { useState, useEffect, useCallback } from 'react';

export function useCustomHook(initialValu`

🟡 **WARNING** (Line 265, typescript)
- Import path may not exist: ./useCounter
- Code: `from './useCounter'`

### lib/agents/README.md

🔵 **INFO** (Line 31, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ECommerceAgent {
  getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boo`

### lib/auth/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `// Session management
export function validateSession(token: string): Promise<SessionData | null>;
e`

🔵 **INFO** (Line 190, typescript)
- Use of "any" type - consider more specific type
- Code: `interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[`

🔵 **INFO** (Line 294, typescript)
- Use of "any" type - consider more specific type
- Code: `// Middleware for API routes
export function withAuth(handler: Function, requiredRole?: string) {
  `

🔵 **INFO** (Line 469, typescript)
- Use of "any" type - consider more specific type
- Code: `import { checkRateLimit } from '@/lib/rate-limit';

async function rateLimit(identifier: string, act`

### lib/integrations/README.md

🔵 **INFO** (Line 274, typescript)
- Use of "any" type - consider more specific type
- Code: `interface IntegrationError {
  code: string;
  message: string;
  service: string;
  context: Record`

🔵 **INFO** (Line 369, typescript)
- Use of "any" type - consider more specific type
- Code: `function sanitizeCustomerData(data: any): any {
  const sanitized = { ...data };
  
  // Remove sens`

### lib/monitoring/README.md

🔵 **INFO** (Line 361, typescript)
- Use of "any" type - consider more specific type
- Code: `import { getSearchCacheManager } from '@/lib/search-cache';

class MetricsCache {
  private cache = `

### lib/queue/README.md

🔵 **INFO** (Line 487, typescript)
- Use of "any" type - consider more specific type
- Code: `import { WebSocket } from 'ws';

class QueueWebSocketServer {
  private clients = new Set<WebSocket>`

🔵 **INFO** (Line 584, typescript)
- Use of "any" type - consider more specific type
- Code: `describe('Queue Integration', () => {
  it('should handle scraping workflow end-to-end', async () =>`

🔵 **INFO** (Line 632, typescript)
- Use of "any" type - consider more specific type
- Code: `class MemoryOptimizedProcessor extends JobProcessor {
  async processJob(job: Job): Promise<any> {
 `

### lib/supabase/README.md

🔵 **INFO** (Line 265, typescript)
- Use of "any" type - consider more specific type
- Code: `import { createClient } from '@/lib/supabase/server'

export async function safeQuery<T>(
  queryFn:`

### lib/woocommerce-api/README.md

🔵 **INFO** (Line 316, typescript)
- Use of "any" type - consider more specific type
- Code: `class WooCommerceError extends Error {
  constructor(
    message: string,
    public code: string,
`

🔵 **INFO** (Line 421, typescript)
- Use of "any" type - consider more specific type
- Code: `import { checkRateLimit } from '@/lib/rate-limit';

async function makeWooCommerceRequest(endpoint: `

### lib/workers/README.md

🔵 **INFO** (Line 138, typescript)
- Use of "any" type - consider more specific type
- Code: `// Job data structure for single page scraping
interface SinglePageJobData {
  type: 'single-page'
 `

🔵 **INFO** (Line 155, typescript)
- Use of "any" type - consider more specific type
- Code: `// Job data structure for multi-page crawling
interface CrawlJobData {
  type: 'full-crawl'
  url: s`

🔵 **INFO** (Line 175, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ScrapeJobResult {
  jobId: string
  status: 'completed' | 'failed'
  pagesScraped: number
`

🔵 **INFO** (Line 640, typescript)
- Use of "any" type - consider more specific type
- Code: `// integration.test.ts
import { ScraperWorkerService } from '@/lib/workers/scraper-worker-service'
i`

### node_modules/@ampproject/remapping/README.md

🔵 **INFO** (Line 179, typescript)
- Use of "any" type - consider more specific type
- Code: `const remapped = remapping(
  minifiedTransformedMap,
  (file, ctx) => {

    if (file === 'transfor`

### node_modules/@crawlee/cheerio/node_modules/cheerio/node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/@crawlee/cheerio/node_modules/cheerio/README.md

🟡 **WARNING** (Line 196, typescript)
- Unclosed array
- Code: `$('[xml\\:id="main"');`

### node_modules/@crawlee/cheerio/node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/@crawlee/http/node_modules/cheerio/README.md

🟡 **WARNING** (Line 196, typescript)
- Unclosed array
- Code: `$('[xml\\:id="main"');`

### node_modules/@crawlee/http/node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/@crawlee/jsdom/node_modules/cheerio/README.md

🟡 **WARNING** (Line 196, typescript)
- Unclosed array
- Code: `$('[xml\\:id="main"');`

### node_modules/@crawlee/jsdom/node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/@crawlee/playwright/node_modules/cheerio/README.md

🟡 **WARNING** (Line 196, typescript)
- Unclosed array
- Code: `$('[xml\\:id="main"');`

### node_modules/@crawlee/playwright/node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/@crawlee/puppeteer/node_modules/cheerio/README.md

🟡 **WARNING** (Line 196, typescript)
- Unclosed array
- Code: `$('[xml\\:id="main"');`

### node_modules/@crawlee/puppeteer/node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/@crawlee/utils/node_modules/cheerio/README.md

🟡 **WARNING** (Line 196, typescript)
- Unclosed array
- Code: `$('[xml\\:id="main"');`

### node_modules/@crawlee/utils/node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/@humanwhocodes/module-importer/README.md

🔵 **INFO** (Line 55, typescript)
- Use of "any" type - consider more specific type
- Code: `// cwd can be omitted to use process.cwd()
const importer = new ModuleImporter(cwd);

// you can res`

### node_modules/@humanwhocodes/object-schema/README.md

🔵 **INFO** (Line 29, typescript)
- Use of "any" type - consider more specific type
- Code: `const { ObjectSchema } = require("@humanwhocodes/object-schema");

const schema = new ObjectSchema({`

### node_modules/@inquirer/core/README.md

🟡 **WARNING** (Line 77, typescript)
- Unclosed object
- Code: `import { createPrompt, useState } from '@inquirer/core';

const input = createPrompt((config, done) `

🟡 **WARNING** (Line 120, typescript)
- Unclosed object
- Code: `const input = createPrompt((config, done) => {
  const timeout = useRef(null);

  // ...`

🟡 **WARNING** (Line 150, typescript)
- Unclosed object
- Code: `const todoSelect = createPrompt((config, done) => {
  const visibleTodos = useMemo(() => filterTodos`

### node_modules/@isaacs/cliui/node_modules/string-width/README.md

🟡 **WARNING** (Line 17, typescript)
- Unclosed array
- Code: `import stringWidth from 'string-width';

stringWidth('a');
//=> 1

stringWidth('古');
//=> 2

stringW`

### node_modules/@mixmark-io/domino/README.md

🔵 **INFO** (Line 104, typescript)
- Use of "any" type - consider more specific type
- Code: `global.__domino_frozen__ = true; // Must precede any `require('domino')`
var domino = require('domi`

### node_modules/@mswjs/interceptors/README.md

🔵 **INFO** (Line 47, typescript)
- Use of "any" type - consider more specific type
- Code: `class XMLHttpRequestProxy extends XMLHttpRequest {
  async send() {
    // Call the request listener`

🔵 **INFO** (Line 138, typescript)
- Use of "any" type - consider more specific type
- Code: `import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest'

const interceptor = ne`

🔵 **INFO** (Line 371, typescript)
- Use of "any" type - consider more specific type
- Code: `interceptor.on('unhandledException', ({ error }) => {
  // Now, any unhandled exception will NOT be `

🔵 **INFO** (Line 543, typescript)
- Use of "any" type - consider more specific type
- Code: `class Interceptor {
  // Applies the interceptor, enabling the interception of requests
  // in the `

### node_modules/@open-draft/deferred-promise/README.md

🔵 **INFO** (Line 153, typescript)
- Use of "any" type - consider more specific type
- Code: `function getPort() {
  // Notice that you don't provide any executor function
  // when constructing`

### node_modules/@open-draft/until/README.md

🔵 **INFO** (Line 94, typescript)
- Use of "any" type - consider more specific type
- Code: `// Notice how a single "until" invocation can handle
// a rather complex piece of logic. This way an`

### node_modules/@rushstack/eslint-patch/README.md

🔵 **INFO** (Line 231, typescript)
- Use of "any" type - consider more specific type
- Code: `require("@rushstack/eslint-patch/modern-module-resolution");
require("@rushstack/eslint-patch/custom`

### node_modules/@sapphire/shapeshift/README.md

🔵 **INFO** (Line 132, typescript)
- Use of "any" type - consider more specific type
- Code: `import { s } from '@sapphire/shapeshift';

// Primitives
s.string;
s.number;
s.bigint;
s.boolean;
s.`

### node_modules/@sinclair/typebox/README.md

🔵 **INFO** (Line 202, typescript)
- Use of "any" type - consider more specific type
- Code: `┌────────────────────────────────┬─────────────────────────────┬────────────────────────────────┐
│`

🔵 **INFO** (Line 688, typescript)
- Use of "any" type - consider more specific type
- Code: `const Nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()])

const T = Nu`

### node_modules/@sindresorhus/is/README.md

🔵 **INFO** (Line 560, typescript)
- Use of "any" type - consider more specific type
- Code: `is.any(is.string, {}, true, '🦄');
//=> true

is.any(is.boolean, 'unicorns', [], new Map());
//=> fa`

🔵 **INFO** (Line 570, typescript)
- Use of "any" type - consider more specific type
- Code: `is.any([is.string, is.number], {}, true, '🦄');
//=> true

is.any([is.boolean, is.number], 'unicorns`

### node_modules/@supabase/node-fetch/README.md

🔵 **INFO** (Line 513, typescript)
- Use of "any" type - consider more specific type
- Code: `// Example adapted from https://fetch.spec.whatwg.org/#example-headers-class

const meta = {
  'Cont`

### node_modules/@supabase/supabase-js/README.md

🔵 **INFO** (Line 22, typescript)
- Use of "any" type - consider more specific type
- Code: `import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interac`

🔵 **INFO** (Line 81, typescript)
- Use of "any" type - consider more specific type
- Code: `import { createClient } from '@supabase/supabase-js'

// Provide a custom `fetch` implementation as `

### node_modules/@szmarczak/http-timer/README.md

🔵 **INFO** (Line 25, typescript)
- Use of "any" type - consider more specific type
- Code: `import https from 'https';
import timer from '@szmarczak/http-timer';

const request = https.get('ht`

### node_modules/@testing-library/jest-dom/README.md

🔵 **INFO** (Line 130, typescript)
- Use of "any" type - consider more specific type
- Code: `// In your own jest-setup.js (or any other name)
import '@testing-library/jest-dom'

// In jest.conf`

🔵 **INFO** (Line 144, typescript)
- Use of "any" type - consider more specific type
- Code: `// In your own jest-setup.js (or any other name)
import '@testing-library/jest-dom/jest-globals'`

🔵 **INFO** (Line 160, typescript)
- Use of "any" type - consider more specific type
- Code: `// In your own vitest-setup.js (or any other name)
import '@testing-library/jest-dom/vitest'

// In `

🔵 **INFO** (Line 624, typescript)
- Use of "any" type - consider more specific type
- Code: `expect(getByTestId('link')).toHaveAccessibleDescription()
expect(getByTestId('link')).toHaveAccessib`

🔵 **INFO** (Line 740, typescript)
- Use of "any" type - consider more specific type
- Code: `toHaveAttribute(attr: string, value?: any)`

🔵 **INFO** (Line 839, typescript)
- Use of "any" type - consider more specific type
- Code: `toHaveFormValues(expectedValues: {
  [name: string]: any
})`

🔵 **INFO** (Line 1491, typescript)
- Use of "any" type - consider more specific type
- Code: `const closeButton = getByRole('button', {name: 'Close'})

expect(closeButton).toHaveDescription('Clo`

### node_modules/@testing-library/react/README.md

🟡 **WARNING** (Line 194, typescript)
- Import path may not exist: ../hidden-message
- Code: `from '../hidden-message'`

🟡 **WARNING** (Line 286, typescript)
- Import path may not exist: ../login
- Code: `from '../login'`

### node_modules/@tootallnate/once/README.md

🔵 **INFO** (Line 60, typescript)
- Use of "any" type - consider more specific type
- Code: `const child = fork('file.js');

// With `await`
const [message, _]: [WorkerPayload, unknown] = await`

### node_modules/@ungap/structured-clone/README.md

🔵 **INFO** (Line 21, typescript)
- Use of "any" type - consider more specific type
- Code: `// as default export
import structuredClone from '@ungap/structured-clone';
const cloned = structure`

🔵 **INFO** (Line 91, typescript)
- Use of "any" type - consider more specific type
- Code: `import {stringify, parse} from '@ungap/structured-clone/json';

parse(stringify({any: 'serializable'`

### node_modules/agentkeepalive/README.md

🔵 **INFO** (Line 163, typescript)
- Use of "any" type - consider more specific type
- Code: `const http = require('http');
const HttpAgent = require('agentkeepalive').HttpAgent;
const agent = n`

### node_modules/ansi-escapes/README.md

🟡 **WARNING** (Line 13, typescript)
- Unclosed array
- Code: `const ansiEscapes = require('ansi-escapes');

// Moves the cursor two rows up and to the left
proces`

### node_modules/any-promise/README.md

🔵 **INFO** (Line 20, typescript)
- Use of "any" type - consider more specific type
- Code: `// in library
var Promise = require('any-promise')  // the global Promise

function promiseReturning`

🔵 **INFO** (Line 44, typescript)
- Use of "any" type - consider more specific type
- Code: `// top of application index.js or other entry point
require('any-promise/register/bluebird')

// -or`

🔵 **INFO** (Line 55, typescript)
- Use of "any" type - consider more specific type
- Code: `var fsp = require('mz/fs') // mz/fs will use registered bluebird promises
var Promise = require('any`

🔵 **INFO** (Line 76, typescript)
- Use of "any" type - consider more specific type
- Code: `require('any-promise/register/bluebird')
// -or-
import 'any-promise/register/q';`

🔵 **INFO** (Line 95, typescript)
- Use of "any" type - consider more specific type
- Code: `require('any-promise/register')('when')
// -or- require('any-promise/register')('any other ES6 compa`

🔵 **INFO** (Line 107, typescript)
- Use of "any" type - consider more specific type
- Code: `require('any-promise/register')('bluebird', {Promise: require('bluebird')})`

🔵 **INFO** (Line 124, typescript)
- Use of "any" type - consider more specific type
- Code: `var Promise = require('any-promise');

return Promise
  .all([xf, f, init, coll])
  .then(fn);


ret`

### node_modules/anymatch/README.md

🔵 **INFO** (Line 31, typescript)
- Use of "any" type - consider more specific type
- Code: `const anymatch = require('anymatch');

const matchers = [ 'path/to/file.js', 'path/anyjs/**/*.js', /`

🔵 **INFO** (Line 66, typescript)
- Use of "any" type - consider more specific type
- Code: `var matcher = anymatch(matchers);

matcher('path/to/file.js'); // true
matcher('path/anyjs/baz.js', `

### node_modules/axios/README.md

🔵 **INFO** (Line 379, typescript)
- Use of "any" type - consider more specific type
- Code: `{
  // `url` is the server URL that will be used for the request
  url: '/user',

  // `method` is t`

🔵 **INFO** (Line 1288, typescript)
- Use of "any" type - consider more specific type
- Code: `await axios.post(url, data, {
  onUploadProgress: function (axiosProgressEvent) {
    /*{
      load`

### node_modules/axobject-query/README.md

🟡 **WARNING** (Line 175, typescript)
- Unclosed object
- Code: `[
  [ 'AbbrRole', [ { name: 'abbr' } ] ],
  [ 'ArticleRole', [ { name: 'article' } ] ],
  [ 'AudioRo`

### node_modules/babel-plugin-istanbul/README.md

🟡 **WARNING** (Line 62, typescript)
- Code block ends with comma - may be incomplete
- Code: `  "nyc": {
    "sourceMap": false,
    "instrument": false
  },`

### node_modules/bs-logger/README.md

🔵 **INFO** (Line 101, typescript)
- Use of "any" type - consider more specific type
- Code: `logMethod(message: string, ...args: any[]): void
  // or
logMethod(context: LogContext, message: str`

🟡 **WARNING** (Line 248, typescript)
- Import path may not exist: ./logger
- Code: `from './logger'`

🟡 **WARNING** (Line 248, typescript)
- Import path may not exist: ./http
- Code: `from './http'`

### node_modules/cacheable-request/README.md

🔵 **INFO** (Line 33, typescript)
- Use of "any" type - consider more specific type
- Code: `import http from 'http';
import CacheableRequest from 'cacheable-request';

// Then instead of
const`

🔵 **INFO** (Line 53, typescript)
- Use of "any" type - consider more specific type
- Code: `
import CacheableRequest from 'cacheable-request';

// Now You can do
const cacheableRequest = new C`

🔵 **INFO** (Line 100, typescript)
- Use of "any" type - consider more specific type
- Code: `import http from 'http';
import CacheableRequest from 'cacheable-request';

// Then instead of
const`

🔵 **INFO** (Line 274, typescript)
- Use of "any" type - consider more specific type
- Code: `import http from 'http';
import CacheableRequest from 'cacheable-request';

const cacheableRequest =`

🔵 **INFO** (Line 290, typescript)
- Use of "any" type - consider more specific type
- Code: `import CacheableRequest, {CacheValue} from 'cacheable-request';

const cacheableRequest = new Cachea`

### node_modules/cluster-key-slot/README.md

🔵 **INFO** (Line 24, typescript)
- Use of "any" type - consider more specific type
- Code: `const calculateSlot = require('cluster-key-slot');
const calculateMultipleSlots = require('cluster-k`

### node_modules/co/README.md

🔵 **INFO** (Line 74, typescript)
- Use of "any" type - consider more specific type
- Code: `var co = require('co');

co(function *(){
  // yield any promise
  var result = yield Promise.resolv`

### node_modules/debug/README.md

🟡 **WARNING** (Line 106, typescript)
- Code block ends with comma - may be incomplete
- Code: `  "windowsDebug": "@powershell -Command $env:DEBUG='*';node app.js",`

### node_modules/decimal.js/README.md

🟡 **WARNING** (Line 240, typescript)
- Import path may not exist: ./decimal.min.mjs
- Code: `from './decimal.min.mjs'`

### node_modules/diff-sequences/README.md

🔵 **INFO** (Line 150, typescript)
- Use of "any" type - consider more specific type
- Code: `// Diff index intervals that are half open [start, end) like array slice method.
const diffIndexInte`

🟡 **WARNING** (Line 330, typescript)
- Unclosed object
- Code: `// Return diff items for strings (compatible with diff-match-patch package).
const findDiffItems = (`

### node_modules/dotenv/README.md

🟡 **WARNING** (Line 587, typescript)
- Import path may not exist: ./errorReporter.mjs
- Code: `from './errorReporter.mjs'`

🟡 **WARNING** (Line 599, typescript)
- Import path may not exist: ./errorReporter.mjs
- Code: `from './errorReporter.mjs'`

### node_modules/emittery/README.md

🔵 **INFO** (Line 418, typescript)
- Use of "any" type - consider more specific type
- Code: `const Emittery = require('emittery');

const emitter = new Emittery();
const iterator = emitter.anyE`

### node_modules/escalade/README.md

🔵 **INFO** (Line 63, typescript)
- Use of "any" type - consider more specific type
- Code: `//~> demo.js
import { join } from 'path';
import escalade from 'escalade';

const input = join(__dir`

### node_modules/eslint-import-resolver-node/node_modules/debug/README.md

🟡 **WARNING** (Line 106, typescript)
- Code block ends with comma - may be incomplete
- Code: `  "windowsDebug": "@powershell -Command $env:DEBUG='*';node app.js",`

### node_modules/eslint-import-resolver-typescript/README.md

🔵 **INFO** (Line 86, typescript)
- Use of "any" type - consider more specific type
- Code: `// eslint.config.js, CommonJS is also supported
import { createTypeScriptImportResolver } from 'esli`

🔵 **INFO** (Line 130, typescript)
- Use of "any" type - consider more specific type
- Code: `// eslint.config.js, CommonJS is also supported
export default [
  {
    settings: {
      'import/r`

### node_modules/eslint-module-utils/node_modules/debug/README.md

🟡 **WARNING** (Line 106, typescript)
- Code block ends with comma - may be incomplete
- Code: `  "windowsDebug": "@powershell -Command $env:DEBUG='*';node app.js",`

### node_modules/eslint-plugin-import/node_modules/debug/README.md

🟡 **WARNING** (Line 106, typescript)
- Code block ends with comma - may be incomplete
- Code: `  "windowsDebug": "@powershell -Command $env:DEBUG='*';node app.js",`

### node_modules/eslint-plugin-jsx-a11y/README.md

🔵 **INFO** (Line 120, typescript)
- Use of "any" type - consider more specific type
- Code: `const jsxA11y = require('eslint-plugin-jsx-a11y');

module.exports = [
  …
  {
    files: ['**/*.{js`

### node_modules/eslint-plugin-react/README.md

🔵 **INFO** (Line 169, typescript)
- Use of "any" type - consider more specific type
- Code: `const react = require('eslint-plugin-react');
const globals = require('globals');

module.exports = `

### node_modules/fast-equals/README.md

🔵 **INFO** (Line 275, typescript)
- Use of "any" type - consider more specific type
- Code: `interface Cache<Key extends object, Value> {
  delete(key: Key): boolean;
  get(key: Key): Value | u`

### node_modules/fflate/README.md

🔵 **INFO** (Line 237, typescript)
- Use of "any" type - consider more specific type
- Code: `// Note that the asynchronous version (see below) runs in parallel and
// is *much* (up to 3x) faste`

🔵 **INFO** (Line 382, typescript)
- Use of "any" type - consider more specific type
- Code: `import {
  gzip, zlib, AsyncGzip, zip, unzip, strFromU8,
  Zip, AsyncZipDeflate, Unzip, AsyncUnzipIn`

### node_modules/flatted/README.md

🔵 **INFO** (Line 53, typescript)
- Use of "any" type - consider more specific type
- Code: `import {toJSON, fromJSON} from 'flatted';

class RecursiveMap extends Map {
  static fromJSON(any) {`

### node_modules/foreground-child/README.md

🔵 **INFO** (Line 118, typescript)
- Use of "any" type - consider more specific type
- Code: `import { watchdog } from 'foreground-child/watchdog'

const childProcess = spawn('command', ['some',`

### node_modules/form-data-encoder/README.md

🔵 **INFO** (Line 290, typescript)
- Use of "any" type - consider more specific type
- Code: `import {FormData} from "formdata-node" // Or any other spec-compatible implementation

import fetch `

### node_modules/got-scraping/node_modules/@sindresorhus/is/README.md

🔵 **INFO** (Line 527, typescript)
- Use of "any" type - consider more specific type
- Code: `is.any(is.string, {}, true, '🦄');
//=> true

is.any(is.boolean, 'unicorns', [], new Map());
//=> fa`

🔵 **INFO** (Line 537, typescript)
- Use of "any" type - consider more specific type
- Code: `is.any([is.string, is.number], {}, true, '🦄');
//=> true

is.any([is.boolean, is.number], 'unicorns`

### node_modules/got-scraping/node_modules/ow/README.md

🔵 **INFO** (Line 126, typescript)
- Use of "any" type - consider more specific type
- Code: `ow('foo', ow.any(ow.string.maxLength(3), ow.number));`

### node_modules/got/README.md

🔵 **INFO** (Line 71, typescript)
- Use of "any" type - consider more specific type
- Code: `import got from 'got';

const {data} = await got.post('https://httpbin.org/anything', {
	json: {
		h`

### node_modules/has-ansi/README.md

🟡 **WARNING** (Line 15, typescript)
- Unclosed array
- Code: `var hasAnsi = require('has-ansi');

hasAnsi('\u001b[4mcake\u001b[0m');
//=> true

hasAnsi('cake');
/`

### node_modules/htmlparser2/README.md

🔵 **INFO** (Line 34, typescript)
- Use of "any" type - consider more specific type
- Code: `import * as htmlparser2 from "htmlparser2";

const parser = new htmlparser2.Parser({
    onopentag(n`

### node_modules/http2-wrapper/README.md

🔵 **INFO** (Line 382, typescript)
- Use of "any" type - consider more specific type
- Code: `const resolveAlpnProxy = new URL('https://username:password@localhost:8000');
const connect = async `

### node_modules/inflight/README.md

🔵 **INFO** (Line 7, typescript)
- Use of "any" type - consider more specific type
- Code: `var inflight = require('inflight')

// some request that does some stuff
function req(key, callback)`

### node_modules/ioredis/README.md

🔵 **INFO** (Line 477, typescript)
- Use of "any" type - consider more specific type
- Code: `const redis = new Redis();

// This will define a command myecho:
redis.defineCommand("myecho", {
  `

### node_modules/is-any-array/README.md

🔵 **INFO** (Line 15, typescript)
- Use of "any" type - consider more specific type
- Code: `const {isAnyArray} = require('is-any-array');

isAnyArray(1); // false
isAnyArray('ab'); // false
is`

### node_modules/is-node-process/README.md

🔵 **INFO** (Line 31, typescript)
- Use of "any" type - consider more specific type
- Code: `// any/code.js
const { isNodeProcess } = require('is-node-process')
isNodeProcess() // true/false`

### node_modules/jackspeak/README.md

🔵 **INFO** (Line 254, typescript)
- Use of "any" type - consider more specific type
- Code: `import { jack } from 'jackspeak'

const j = jack({
  // Optional
  // This will be auto-generated fr`

### node_modules/keyv/README.md

🔵 **INFO** (Line 210, typescript)
- Use of "any" type - consider more specific type
- Code: `interface CompressionAdapter {
	async compress(value: any, options?: any);
	async decompress(value: `

### node_modules/lilconfig/README.md

🔵 **INFO** (Line 16, typescript)
- Use of "any" type - consider more specific type
- Code: `import {lilconfig, lilconfigSync} from 'lilconfig';

// all keys are optional
const options = {
    `

### node_modules/linkedom/README.md

🔵 **INFO** (Line 72, typescript)
- Use of "any" type - consider more specific type
- Code: `// any node can be serialized
const array = toJSON(document);

// somewhere else ...
import {parseJS`

### node_modules/micromatch/README.md

🔵 **INFO** (Line 846, bash)
- Using cd with && - consider using absolute paths instead
- Code: `$ cd bench && npm install`

### node_modules/minipass/README.md

🔵 **INFO** (Line 76, typescript)
- Use of "any" type - consider more specific type
- Code: `import { Minipass } from 'minipass'

// a NDJSON stream that emits 'jsonError' when it can't stringi`

### node_modules/ml-matrix/README.md

🔵 **INFO** (Line 197, typescript)
- Use of "any" type - consider more specific type
- Code: `// If A is non singular :
var A = new Matrix([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]);

var B = M`

### node_modules/next-themes/README.md

🔵 **INFO** (Line 522, typescript)
- Use of "any" type - consider more specific type
- Code: `// tailwind.config.js
module.exports = {
  // data-mode is used as an example, next-themes supports `

### node_modules/node-fetch/README.md

🔵 **INFO** (Line 514, typescript)
- Use of "any" type - consider more specific type
- Code: `// Example adapted from https://fetch.spec.whatwg.org/#example-headers-class

const meta = {
  'Cont`

### node_modules/normalize-range/README.md

🟡 **WARNING** (Line 92, typescript)
- Unclosed array
- Code: `var angle = require('normalize-range').curry(-180, 180, false, true);

angle.wrap(270)
//=> -90

ang`

### node_modules/openai/node_modules/form-data-encoder/README.md

🔵 **INFO** (Line 287, typescript)
- Use of "any" type - consider more specific type
- Code: `import {FormData} from "formdata-node" // Or any other spec-compatible implementation

import fetch `

### node_modules/openai/README.md

🔵 **INFO** (Line 390, typescript)
- Use of "any" type - consider more specific type
- Code: `// Tell TypeScript and the package to use the global web fetch instead of node-fetch.
// Note, despi`

### node_modules/ow/node_modules/@sindresorhus/is/README.md

🔵 **INFO** (Line 498, typescript)
- Use of "any" type - consider more specific type
- Code: `is.any(is.string, {}, true, '🦄');
//=> true

is.any(is.boolean, 'unicorns', [], new Map());
//=> fa`

🔵 **INFO** (Line 508, typescript)
- Use of "any" type - consider more specific type
- Code: `is.any([is.string, is.number], {}, true, '🦄');
//=> true

is.any([is.boolean, is.number], 'unicorns`

### node_modules/ow/README.md

🔵 **INFO** (Line 128, typescript)
- Use of "any" type - consider more specific type
- Code: `ow('foo', ow.any(ow.string.maxLength(3), ow.number));`

### node_modules/path-is-absolute/README.md

🔵 **INFO** (Line 15, typescript)
- Use of "any" type - consider more specific type
- Code: `const pathIsAbsolute = require('path-is-absolute');

// Running on Linux
pathIsAbsolute('/home/foo')`

### node_modules/path-scurry/README.md

🔵 **INFO** (Line 145, typescript)
- Use of "any" type - consider more specific type
- Code: `// hybrid module, load with either method
import { PathScurry, Path } from 'path-scurry'
// or:
cons`

### node_modules/postcss-value-parser/README.md

🔵 **INFO** (Line 43, typescript)
- Use of "any" type - consider more specific type
- Code: `var valueParser = require('postcss-value-parser');

var parsed = valueParser(sourceCSS);

// walk() `

### node_modules/prompts/README.md

🔵 **INFO** (Line 347, typescript)
- Use of "any" type - consider more specific type
- Code: `{
  type: null,
  name: 'forgetme',
  message: `I'll never be shown anyway`,
}`

### node_modules/prop-types/README.md

🔵 **INFO** (Line 56, typescript)
- Use of "any" type - consider more specific type
- Code: `import React from 'react';
import PropTypes from 'prop-types';

class MyComponent extends React.Comp`

### node_modules/proxy-chain/README.md

🔵 **INFO** (Line 35, typescript)
- Use of "any" type - consider more specific type
- Code: `const ProxyChain = require('proxy-chain');

const server = new ProxyChain.Server({
    // Port where`

### node_modules/reusify/README.md

🔵 **INFO** (Line 32, typescript)
- Use of "any" type - consider more specific type
- Code: `var reusify = require('reusify')
var fib = require('reusify/benchmarks/fib')
var instance = reusify(`

### node_modules/safe-buffer/README.md

🔵 **INFO** (Line 32, typescript)
- Use of "any" type - consider more specific type
- Code: `var Buffer = require('safe-buffer').Buffer

// Existing buffer code will continue to work without is`

### node_modules/safe-push-apply/README.md

🔵 **INFO** (Line 20, typescript)
- Use of "any" type - consider more specific type
- Code: `var safePushApply = require('safe-push-apply');
var assert = require('assert');

var arr = [1, 2, 3]`

### node_modules/socks/README.md

🔵 **INFO** (Line 255, typescript)
- Use of "any" type - consider more specific type
- Code: `const options = {
  proxy: {
    host: '159.203.75.235', // ipv4, ipv6, or hostname
    port: 1081,
`

### node_modules/stable-hash/README.md

🔵 **INFO** (Line 16, typescript)
- Use of "any" type - consider more specific type
- Code: `import hash from 'stable-hash'

hash(anyJavaScriptValueHere) // returns a string`

🔵 **INFO** (Line 131, typescript)
- Use of "any" type - consider more specific type
- Code: `import crypto from 'crypto'
import hash from 'stable-hash'

const weakHash = hash(anyJavaScriptValue`

### node_modules/string-length/README.md

🟡 **WARNING** (Line 15, typescript)
- Unclosed array
- Code: `const stringLength = require('string-length');

'🐴'.length;
//=> 2

stringLength('🐴');
//=> 1

str`

### node_modules/string-width-cjs/README.md

🟡 **WARNING** (Line 19, typescript)
- Unclosed array
- Code: `const stringWidth = require('string-width');

stringWidth('a');
//=> 1

stringWidth('古');
//=> 2

st`

### node_modules/string-width/README.md

🟡 **WARNING** (Line 19, typescript)
- Unclosed array
- Code: `const stringWidth = require('string-width');

stringWidth('a');
//=> 1

stringWidth('古');
//=> 2

st`

### node_modules/styled-jsx/README.md

🟡 **WARNING** (Line 322, typescript)
- Import path may not exist: ../theme
- Code: `from '../theme'`

🟡 **WARNING** (Line 322, typescript)
- Import path may not exist: ../theme/utils
- Code: `from '../theme/utils'`

🟡 **WARNING** (Line 351, typescript)
- Import path may not exist: ./app
- Code: `from './app'`

🟡 **WARNING** (Line 460, typescript)
- Import path may not exist: ./styles
- Code: `from './styles'`

🟡 **WARNING** (Line 610, typescript)
- Import path may not exist: ../components/button/styles.css
- Code: `from '../components/button/styles.css'`

🟡 **WARNING** (Line 978, typescript)
- Import path may not exist: ../theme
- Code: `from '../theme'`

🟡 **WARNING** (Line 978, typescript)
- Import path may not exist: ../theme/utils
- Code: `from '../theme/utils'`

### node_modules/ts-interface-checker/README.md

🟡 **WARNING** (Line 51, typescript)
- Import path may not exist: ./foo-ti
- Code: `from "./foo-ti"`

🟡 **WARNING** (Line 78, typescript)
- Import path may not exist: ./greet-ti
- Code: `from "./greet-ti"`

🟡 **WARNING** (Line 103, typescript)
- Import path may not exist: ./color
- Code: `from "./color"`

🟡 **WARNING** (Line 114, typescript)
- Import path may not exist: ./color-ti
- Code: `from "./color-ti"`

🟡 **WARNING** (Line 114, typescript)
- Import path may not exist: ./shape-ti
- Code: `from "./shape-ti"`

🟡 **WARNING** (Line 149, typescript)
- Import path may not exist: ./foo-ti
- Code: `from "./foo-ti"`

🟡 **WARNING** (Line 167, typescript)
- Import path may not exist: ./foo
- Code: `from "./foo"`

🟡 **WARNING** (Line 167, typescript)
- Import path may not exist: ./foo-ti
- Code: `from "./foo-ti"`

### node_modules/tsconfig-paths/README.md

🟡 **WARNING** (Line 187, typescript)
- Unclosed object
- Code: `/**
 * Function that can match a path
 */
export interface MatchPath {
  (
    requestedModule: stri`

🟡 **WARNING** (Line 220, typescript)
- Unclosed object
- Code: `/**
 * Finds a path from tsconfig that matches a module load request.
 * @param absolutePathMappings`

### node_modules/type-fest/README.md

🔵 **INFO** (Line 221, typescript)
- Use of "any" type - consider more specific type
- Code: `import type {IsAny, IfAny} from 'type-fest';

type ShouldBeTrue = IsAny<any> extends true ? true : f`

### node_modules/unbox-primitive/README.md

🔵 **INFO** (Line 16, typescript)
- Use of "any" type - consider more specific type
- Code: `var unboxPrimitive = require('unbox-primitive');
var assert = require('assert');

assert.equal(unbox`

### node_modules/use-sidecar/README.md

🟡 **WARNING** (Line 110, typescript)
- Import path may not exist: ./medium
- Code: `from './medium'`

🟡 **WARNING** (Line 110, typescript)
- Import path may not exist: ./Effect
- Code: `from './Effect'`

🟡 **WARNING** (Line 244, typescript)
- Import path may not exist: ./utils
- Code: `from './utils'`

### node_modules/yargonaut/node_modules/chalk/README.md

🟡 **WARNING** (Line 122, typescript)
- Unclosed array
- Code: `var chalk = require('chalk');

console.log(chalk.styles.red);
//=> {open: '\u001b[31m', close: '\u00`

### node_modules/yargonaut/node_modules/strip-ansi/README.md

🟡 **WARNING** (Line 15, typescript)
- Unclosed array
- Code: `var stripAnsi = require('strip-ansi');

stripAnsi('\u001b[4mcake\u001b[0m');
//=> 'cake'`

### node_modules/yargs/README.md

🔵 **INFO** (Line 127, typescript)
- Use of "any" type - consider more specific type
- Code: `import yargs from 'https://deno.land/x/yargs/deno.ts'
import { Arguments } from 'https://deno.land/x`

### scripts/README.md

🔵 **INFO** (Line 188, bash)
- Using cd with && - consider using absolute paths instead
- Code: `0 2 * * * cd /path/to/project && npm run script:cleanup`

🔵 **INFO** (Line 188, bash)
- Using cd with && - consider using absolute paths instead
- Code: `0 * * * * cd /path/to/project && npm run script:sync`

### supabase/migrations/README.md

🔵 **INFO** (Line 241, bash)
- Environment variable used: MIGRATIONS - ensure it's documented
- Code: `for migration in "${MIGRATIONS[@]}"; do`

🔵 **INFO** (Line 241, bash)
- Environment variable used: migration - ensure it's documented
- Code: `  echo "Running migration: $migration"`

🔵 **INFO** (Line 241, bash)
- Environment variable used: migration - ensure it's documented
- Code: `  psql -U postgres -d your_database < "supabase/migrations/$migration"`

🔵 **INFO** (Line 241, bash)
- Environment variable used: migration - ensure it's documented
- Code: `    echo "ERROR: Migration $migration failed!"`

🔵 **INFO** (Line 241, bash)
- Environment variable used: migration - ensure it's documented
- Code: `  echo "✓ Migration $migration completed successfully"`

🔵 **INFO** (Line 508, sql)
- Using SELECT * - consider specifying columns
- Code: `-- List all tables
\dt

-- Check specific table structure
\d+ customer_configs

-- Verify indexes
\d`

### supabase/README.md

🔵 **INFO** (Line 40, bash)
- Environment variable used: file - ensure it's documented
- Code: `  echo "Running migration: $file"`

🔵 **INFO** (Line 40, bash)
- Environment variable used: file - ensure it's documented
- Code: `  psql -U postgres -d your_database < "$file"`

### test-utils/README.md

🟡 **WARNING** (Line 69, typescript)
- Import path may not exist: @/test-utils/render-with-providers
- Code: `from '@/test-utils/render-with-providers'`

### types/README.md

🔵 **INFO** (Line 266, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ChatWidgetProps {
  demoId?: string;
  demoConfig?: any;
  initialOpen?: boolean;
  forceC`

🔵 **INFO** (Line 405, typescript)
- Use of "any" type - consider more specific type
- Code: `interface ListParams {
  context?: 'view' | 'edit';
  page?: number;
  per_page?: number;
  search?:`

🔵 **INFO** (Line 443, typescript)
- Use of "any" type - consider more specific type
- Code: `type WooCommerceClient = {
  get: <T = any>(path: string, params?: any) => Promise<{ data: T }>;
  p`

🔵 **INFO** (Line 497, typescript)
- Use of "any" type - consider more specific type
- Code: `// Runtime type checking with Zod
function validateChatRequest(data: unknown): ChatRequest {
  retur`

## Recommendations

### Critical Issues
These issues should be fixed immediately as they would prevent users from successfully using the code:

- **docs/00-GETTING-STARTED/for-developers.md** (Line 534): Script does not exist: test-database-cleanup.ts
- **docs/00-GETTING-STARTED/for-developers.md** (Line 534): Script does not exist: test-database-cleanup.ts
- **docs/00-GETTING-STARTED/for-developers.md** (Line 534): Script does not exist: test-database-cleanup.ts
- **docs/00-GETTING-STARTED/for-developers.md** (Line 534): Script does not exist: monitor-embeddings-health.ts
- **docs/00-GETTING-STARTED/for-developers.md** (Line 534): Script does not exist: monitor-embeddings-health.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 743): Script does not exist: monitor-embeddings-health.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 743): Script does not exist: monitor-embeddings-health.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 743): Script does not exist: monitor-embeddings-health.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 743): Script does not exist: optimize-chunk-sizes.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 743): Script does not exist: optimize-chunk-sizes.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 743): Script does not exist: batch-rechunk-embeddings.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 743): Script does not exist: test-database-cleanup.ts
- **docs/01-ARCHITECTURE/performance-optimization.md** (Line 901): Script does not exist: test-performance-profile.ts
- **docs/01-ARCHITECTURE/search-architecture.md** (Line 752): Script does not exist: <<
- **docs/02-FEATURES/chat-system/hallucination-prevention.md** (Line 216): Script does not exist: test-chat-accuracy.ts
- **docs/02-FEATURES/chat-system/hallucination-prevention.md** (Line 228): Script does not exist: test-hallucination-prevention.ts
- **docs/02-FEATURES/chat-system/hallucination-prevention.md** (Line 246): Script does not exist: test-hallucination-prevention.ts
- **docs/02-FEATURES/chat-system/hallucination-prevention.md** (Line 539): Script does not exist: test-hallucination-prevention.ts
- **docs/02-FEATURES/chat-system/QUICK_REFERENCE.md** (Line 50): Script does not exist: test-hallucination-prevention.ts
- **docs/02-FEATURES/chat-system/README.md** (Line 366): Script does not exist: test-hallucination-prevention.ts
- **docs/02-FEATURES/chat-system/README.md** (Line 581): Script does not exist: test-chat-integration.ts
- **docs/02-FEATURES/chat-system/README.md** (Line 581): Script does not exist: test-hallucination-prevention.ts
- **docs/02-FEATURES/chat-system/README.md** (Line 581): Script does not exist: test-conversation-context.ts
- **docs/02-FEATURES/chat-system/README.md** (Line 627): Script does not exist: verify-supabase.js
- **docs/02-FEATURES/chat-system/README.md** (Line 684): Script does not exist: test-database-cleanup.ts
- **docs/02-FEATURES/scraping/README.md** (Line 1327): Script does not exist: test-database-cleanup.ts
- **docs/02-FEATURES/scraping/README.md** (Line 1327): Script does not exist: test-database-cleanup.ts
- **docs/02-FEATURES/scraping/README.md** (Line 1327): Script does not exist: test-database-cleanup.ts
- **docs/02-FEATURES/scraping/README.md** (Line 1327): Script does not exist: test-database-cleanup.ts
- **docs/02-FEATURES/scraping/README.md** (Line 1394): Script does not exist: turbo-force-rescrape-with-sitemap.js
- **docs/06-TROUBLESHOOTING/README.md** (Line 212): Script does not exist: test-hallucination-prevention.ts
- **docs/06-TROUBLESHOOTING/README.md** (Line 212): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 367): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 523): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 589): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 679): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 679): Script does not exist: monitor-embeddings-health.ts
- **docs/06-TROUBLESHOOTING/README.md** (Line 994): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 1055): Script does not exist: optimize-chunk-sizes.ts
- **docs/06-TROUBLESHOOTING/README.md** (Line 1131): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 1214): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 1703): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 1852): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 1930): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2001): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2143): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2383): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2477): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2556): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2626): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2710): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2789): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 2960): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 3111): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 3191): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 3264): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 3426): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 3644): Script does not exist: <<
- **docs/06-TROUBLESHOOTING/README.md** (Line 4314): Script does not exist: monitor-embeddings-health.ts
- **docs/06-TROUBLESHOOTING/README.md** (Line 4314): Script does not exist: test-database-cleanup.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 30): Script does not exist: test-database-cleanup.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 30): Script does not exist: test-database-cleanup.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 30): Script does not exist: test-database-cleanup.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 30): Script does not exist: test-database-cleanup.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 39): Script does not exist: optimize-database.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 51): Script does not exist: check-embeddings-table.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 57): Script does not exist: apply-telemetry-migration.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 67): Script does not exist: monitor-embeddings-health.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 67): Script does not exist: monitor-embeddings-health.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 67): Script does not exist: monitor-embeddings-health.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 75): Script does not exist: optimize-chunk-sizes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 75): Script does not exist: optimize-chunk-sizes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 75): Script does not exist: optimize-chunk-sizes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 75): Script does not exist: optimize-chunk-sizes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 75): Script does not exist: optimize-chunk-sizes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 85): Script does not exist: batch-rechunk-embeddings.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 91): Script does not exist: simple-rechunk.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 97): Script does not exist: performance-bottleneck-analyzer.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 103): Script does not exist: test-database-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 109): Script does not exist: test-database-performance-diagnosis.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 115): Script does not exist: benchmark-pipeline-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 121): Script does not exist: benchmark-search-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 127): Script does not exist: benchmark-quick-search.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 133): Script does not exist: benchmark-search-improvements.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 139): Script does not exist: profile-search-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 145): Script does not exist: test-performance-analysis.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 151): Script does not exist: test-performance-comparison.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 157): Script does not exist: test-performance-direct.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 163): Script does not exist: test-performance-fixes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 169): Script does not exist: test-api-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 175): Script does not exist: test-api-optimizations.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 185): Script does not exist: test-system-health-check.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 197): Script does not exist: test-customer-satisfaction-journey.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 203): Script does not exist: test-customer-satisfaction-journey-quick.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 209): Script does not exist: validate-all-optimizations.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 215): Script does not exist: validate-fixes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 221): Script does not exist: validate-optimizations.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 227): Script does not exist: validate-search-improvements.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 233): Script does not exist: validate-intelligent-search-api.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 239): Script does not exist: comprehensive-phase1-validation.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 245): Script does not exist: phase1-validation-final.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 251): Script does not exist: edge-case-test-suite.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 261): Script does not exist: audit-embeddings-comprehensive.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 267): Script does not exist: analyze-dc66-embeddings.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 273): Script does not exist: investigate-missing-embeddings.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 279): Script does not exist: clean-contaminated-embeddings.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 285): Script does not exist: clean-remaining-contamination.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 291): Script does not exist: identify-contaminated-domains.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 297): Script does not exist: test-search-accuracy.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 303): Script does not exist: test-search-consistency.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 309): Script does not exist: test-search-fresh.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 315): Script does not exist: test-search-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 321): Script does not exist: test-quick-search.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 327): Script does not exist: test-simple-query.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 333): Script does not exist: test-specific-search.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 339): Script does not exist: test-comprehensive-search-coverage.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 345): Script does not exist: test-focused-search-verification.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 351): Script does not exist: verify-chunk-retrieval-any-domain.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 357): Script does not exist: verify-full-chunk-retrieval.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 367): Script does not exist: test-woocommerce-all-endpoints.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 373): Script does not exist: test-woocommerce-agent-complete.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 379): Script does not exist: test-woocommerce-cache-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 385): Script does not exist: test-woocommerce-e2e-chat.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 391): Script does not exist: test-wc-cache-direct.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 397): Script does not exist: manual-woocommerce-evaluation.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 403): Script does not exist: run-product-extraction.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 409): Script does not exist: test-complete-product-discovery.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 415): Script does not exist: verify-ai-product-accuracy.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 425): Script does not exist: security-chaos-test.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 431): Script does not exist: security-chaos-test-fast.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 437): Script does not exist: security-chaos-targeted.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 443): Script does not exist: chaos-test-search-pipeline.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 449): Script does not exist: chaos-test-dc66-focused.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 459): Script does not exist: clear-cache.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 465): Script does not exist: clear-cifa-cache.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 471): Script does not exist: clear-stale-cache.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 477): Script does not exist: test-clear-cache.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 483): Script does not exist: test-cache-consistency.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 493): Script does not exist: clean-thompson-data.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 499): Script does not exist: apply_fix_directly.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 505): Script does not exist: execute_fix.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 515): Script does not exist: debug-test.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 521): Script does not exist: investigate-indexes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 527): Script does not exist: investigate-indexes-direct.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 533): Script does not exist: investigate-data-architecture.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 539): Script does not exist: investigate_column_type.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 545): Script does not exist: investigate_embedding_format.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 551): Script does not exist: verify_db_state.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 557): Script does not exist: analyze-index-problems.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 563): Script does not exist: analyze-intelligent-search-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 569): Script does not exist: diagnose-dc66-pipeline.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 575): Script does not exist: forensic-dc66-investigation.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 581): Script does not exist: investigate-cifa-embeddings.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 587): Script does not exist: investigate-cifa-limit.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 593): Script does not exist: investigate-dc66-products.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 599): Script does not exist: verify-dc66-products.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 605): Script does not exist: verify-cifa-fixes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 611): Script does not exist: verify-exact-cifa-count.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 617): Script does not exist: log-analyzer-example.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 623): Script does not exist: check-all-domains.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 629): Script does not exist: check-bulk-functions.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 635): Script does not exist: check-domain-id.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 641): Script does not exist: check_bulk_function.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 647): Script does not exist: get-null-text-urls.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 653): Script does not exist: test-direct-supabase-query.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 659): Script does not exist: test-raw-response.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 669): Script does not exist: test-hallucination-prevention.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 675): Script does not exist: test-anti-hallucination.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 681): Script does not exist: test-ai-context-analysis.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 687): Script does not exist: test-ai-to-woocommerce-agent.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 693): Script does not exist: test-chat-intelligent-cifa.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 699): Script does not exist: test-chat-route-cifa.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 705): Script does not exist: test-cifa-conversation.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 711): Script does not exist: test-cifa-direct-search.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 717): Script does not exist: test-cifa-fix-verification.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 723): Script does not exist: test-cifa-forensic-analysis.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 729): Script does not exist: test-cifa-pump-comparison.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 735): Script does not exist: test-cifa-reasoning-trace.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 741): Script does not exist: test-cifa-search-direct.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 747): Script does not exist: test-all-cifa-pumps.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 753): Script does not exist: test-generic-intelligence.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 759): Script does not exist: test-intelligent-chat-final.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 765): Script does not exist: test-intelligent-cifa-analysis.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 771): Script does not exist: test-intelligent-product-workflow.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 777): Script does not exist: test-intelligent-search-direct.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 783): Script does not exist: test-widget-intelligent-route.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 793): Script does not exist: test-telemetry-system.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 799): Script does not exist: test-telemetry-live.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 805): Script does not exist: test-telemetry-persistence.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 811): Script does not exist: test-token-cost-logging.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 817): Script does not exist: test-direct-token-logging.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 827): Script does not exist: test-parallel-context-gathering.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 833): Script does not exist: test-parallel-quick.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 839): Script does not exist: test-parallel-tools-execution.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 845): Script does not exist: test-comprehensive-tool-analysis.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 851): Script does not exist: test-tool-report.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 861): Script does not exist: test-optimizations.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 867): Script does not exist: test-navigation-fix.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 873): Script does not exist: test-minimal-api-verification.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 879): Script does not exist: performance-test.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 885): Script does not exist: performance-test-quick.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 896): Script does not exist: <tool-name>.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: monitor-embeddings-health.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: test-system-health-check.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: clear-stale-cache.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: benchmark-search-performance.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: test-performance-comparison.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: debug-test.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: investigate-missing-embeddings.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: test-database-cleanup.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: optimize-chunk-sizes.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: test-customer-satisfaction-journey-quick.ts
- **docs/ALL_NPX_TOOLS_REFERENCE.md** (Line 986): Script does not exist: test-hallucination-prevention.ts
- **docs/ARCHIVE/analysis/AGENT_SEARCH_FIX_SUMMARY.md** (Line 70): Script does not exist: test-agent-search-env.ts
- **docs/ARCHIVE/analysis/AGENT_SEARCH_FIX_SUMMARY.md** (Line 70): Script does not exist: test-pure-async.ts
- **docs/ARCHIVE/analysis/AGENTIC_TEST_README.md** (Line 70): Script does not exist: test-agentic-search-capabilities.ts
- **docs/ARCHIVE/analysis/COMPLETE_CONTEXT_GATHERING_SUCCESS.md** (Line 129): Script does not exist: test-parallel-context-gathering.ts
- **docs/ARCHIVE/analysis/CUSTOMER_SATISFACTION_FINAL_REPORT.md** (Line 149): Script does not exist: test-system-health-check.ts
- **docs/ARCHIVE/analysis/CUSTOMER_SATISFACTION_FINAL_REPORT.md** (Line 149): Script does not exist: test-customer-satisfaction-journey.ts
- **docs/ARCHIVE/analysis/CUSTOMER_SATISFACTION_FINAL_REPORT.md** (Line 149): Script does not exist: test-ai-context-analysis.ts
- **docs/ARCHIVE/analysis/CUSTOMER_SATISFACTION_TESTING.md** (Line 129): Script does not exist: test-customer-satisfaction-journey.ts
- **docs/ARCHIVE/analysis/CUSTOMER_SATISFACTION_TESTING.md** (Line 134): Script does not exist: test-customer-satisfaction-journey-quick.ts
- **docs/ARCHIVE/analysis/DOCKER_IMPROVEMENTS_2025.md** (Line 87): Script does not exist: profile-docker-quick.ts
- **docs/ARCHIVE/analysis/DOCKER_PERFORMANCE_ANALYSIS.md** (Line 302): Script does not exist: profile-docker-quick.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md** (Line 177): Script does not exist: apply-telemetry-migration.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md** (Line 264): Script does not exist: test-chat-intelligent-cifa.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md** (Line 264): Script does not exist: test-complete-product-discovery.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md** (Line 264): Script does not exist: test-telemetry-system.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md** (Line 264): Script does not exist: test-generic-intelligence.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md** (Line 281): Script does not exist: benchmark-search-improvements.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_CHAT_DOCUMENTATION.md** (Line 281): Script does not exist: test-parallel-context-gathering.ts
- **docs/ARCHIVE/analysis/INTELLIGENT_SEARCH_IMPLEMENTATION.md** (Line 179): Script does not exist: test-intelligent-search.ts
- **docs/ARCHIVE/analysis/OPTIMIZATION_SUMMARY.md** (Line 38): Script does not exist: test-customer-service-quick.ts
- **docs/ARCHIVE/analysis/OPTIMIZATION_SUMMARY.md** (Line 38): Script does not exist: test-customer-service-comprehensive.ts
- **docs/ARCHIVE/analysis/OPTIMIZATION_SUMMARY.md** (Line 38): Script does not exist: test-performance-comparison.ts
- **docs/ARCHIVE/analysis/OPTIMIZATION_SUMMARY.md** (Line 109): Script does not exist: test-customer-service-comprehensive.ts
- **docs/ARCHIVE/analysis/OPTIMIZATION_SUMMARY.md** (Line 109): Script does not exist: test-performance-diagnostic.ts
- **docs/ARCHIVE/analysis/PERFORMANCE_OPTIMIZATION_REPORT.md** (Line 255): Script does not exist: test-performance-analysis.ts
- **docs/ARCHIVE/analysis/PERFORMANCE_OPTIMIZATION_REPORT.md** (Line 255): Script does not exist: profile-search-performance.ts
- **docs/ARCHIVE/forensics/FORENSIC_ANALYSIS_REPORT.md** (Line 206): Script does not exist: [filename]
- **docs/ARCHIVE/old-docs/scraping/SCRAPING_AND_EMBEDDING_SYSTEM.md** (Line 195): Script does not exist: turbo-force-rescrape-with-sitemap.js
- **docs/ARCHIVE/old-docs/scraping/SCRAPING_AND_EMBEDDING_SYSTEM.md** (Line 227): Script does not exist: clean-thompson-data.ts
- **docs/CACHE_CONSISTENCY.md** (Line 54): Script does not exist: clear-stale-cache.ts
- **docs/CACHE_CONSISTENCY.md** (Line 54): Script does not exist: clear-stale-cache.ts
- **docs/CACHE_CONSISTENCY.md** (Line 99): Script does not exist: test-cache-consistency.ts
- **docs/CACHE_CONSISTENCY.md** (Line 104): Script does not exist: clear-stale-cache.ts
- **docs/CACHE_CONSISTENCY.md** (Line 104): Script does not exist: clear-stale-cache.ts
- **docs/CACHE_CONSISTENCY.md** (Line 113): Script does not exist: -e
- **docs/CACHE_CONSISTENCY.md** (Line 121): Script does not exist: -e
- **docs/CRITICAL_ISSUES_ANALYSIS.md** (Line 173): Script does not exist: scripts/analyze-customer-id-migration.ts
- **docs/CUSTOMER_SERVICE_ACCURACY_TESTING.md** (Line 85): Script does not exist: test-chat-accuracy.ts
- **docs/CUSTOMER_SERVICE_OPTIMIZATION.md** (Line 154): Script does not exist: test-customer-service-quick.ts
- **docs/CUSTOMER_SERVICE_OPTIMIZATION.md** (Line 160): Script does not exist: test-customer-service-comprehensive.ts
- **docs/CUSTOMER_SERVICE_OPTIMIZATION.md** (Line 160): Script does not exist: test-customer-service-comprehensive.ts
- **docs/CUSTOMER_SERVICE_OPTIMIZATION.md** (Line 160): Script does not exist: test-customer-service-comprehensive.ts
- **docs/CUSTOMER_SERVICE_OPTIMIZATION.md** (Line 172): Script does not exist: test-performance-diagnostic.ts
- **docs/CUSTOMER_SERVICE_OPTIMIZATION.md** (Line 172): Script does not exist: test-performance-comparison.ts
- **docs/CUSTOMER_SERVICE_OPTIMIZATION.md** (Line 172): Script does not exist: test-cache-performance.ts
- **docs/DATABASE_CLEANUP.md** (Line 17): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 23): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 29): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 84): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 84): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 84): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 84): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 84): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 84): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 270): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 278): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_CLEANUP.md** (Line 292): Script does not exist: test-database-cleanup.ts
- **docs/DATABASE_IMPROVEMENTS_2025.md** (Line 163): Script does not exist: run-product-extraction.ts
- **docs/DATABASE_IMPROVEMENTS_2025.md** (Line 168): Script does not exist: test-improved-chat-accuracy.ts
- **docs/DATABASE_OPTIMIZATION.md** (Line 118): Script does not exist: optimize-database-performance.ts
- **docs/DATABASE_OPTIMIZATION.md** (Line 118): Script does not exist: optimize-database-performance.ts
- **docs/DATABASE_OPTIMIZATION.md** (Line 118): Script does not exist: optimize-database-performance.ts
- **docs/DATABASE_OPTIMIZATION.md** (Line 130): Script does not exist: test-performance-improvements.ts
- **docs/DATABASE_OPTIMIZATION.md** (Line 130): Script does not exist: validate-optimizations-real.ts
- **docs/DATABASE_OPTIMIZATION.md** (Line 130): Script does not exist: check-optimization-status.ts
- **docs/EMBEDDING_REGENERATION.md** (Line 63): Script does not exist: regenerate-embeddings-fixed.ts
- **docs/EMBEDDING_SEARCH_GUIDE.md** (Line 113): Script does not exist: comprehensive-embedding-check.ts
- **docs/EMBEDDING_SEARCH_GUIDE.md** (Line 118): Script does not exist: add-domain-to-embeddings.ts
- **docs/EMBEDDING_SEARCH_GUIDE.md** (Line 123): Script does not exist: test-real-similarity.ts
- **docs/IMPLEMENTATION_SUMMARY_TOKEN_TRACKING.md** (Line 258): Script does not exist: test-telemetry-persistence.ts
- **docs/IMPLEMENTATION_SUMMARY_TOKEN_TRACKING.md** (Line 258): Script does not exist: test-token-cost-logging.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 18): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 41): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 59): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 136): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 154): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 173): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 190): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 204): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 231): Script does not exist: batch-rechunk-embeddings.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 251): Script does not exist: batch-rechunk-embeddings.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 298): Script does not exist: simple-rechunk.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 353): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 353): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 353): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 353): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 368): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 368): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 368): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 380): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 380): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 380): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 380): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 395): Script does not exist: optimize-chunk-sizes.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 395): Script does not exist: batch-rechunk-embeddings.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 395): Script does not exist: monitor-embeddings-health.ts
- **docs/NPX_TOOLS_GUIDE.md** (Line 435): Script does not exist: simple-rechunk.ts
- **docs/OPTIMIZATION_IMPLEMENTATION.md** (Line 113): Script does not exist: test-tool-report.ts
- **docs/OPTIMIZATION_IMPLEMENTATION.md** (Line 120): Script does not exist: test-parallel-quick.ts
- **docs/PERFORMANCE_IMPROVEMENTS.md** (Line 105): Script does not exist: clear-stale-cache.ts
- **docs/PERFORMANCE_IMPROVEMENTS.md** (Line 105): Script does not exist: test-cache-consistency.ts
- **docs/PERFORMANCE_IMPROVEMENTS.md** (Line 105): Script does not exist: test-woocommerce-cache-performance.ts
- **docs/PERFORMANCE_OPTIMIZATIONS.md** (Line 110): Script does not exist: monitor-embeddings-health.ts
- **docs/PERFORMANCE_OPTIMIZATIONS.md** (Line 110): Script does not exist: monitor-embeddings-health.ts
- **docs/PERFORMANCE_OPTIMIZATIONS.md** (Line 110): Script does not exist: monitor-embeddings-health.ts
- **docs/PERFORMANCE_OPTIMIZATIONS.md** (Line 197): Script does not exist: monitor-embeddings-health.ts
- **docs/PERFORMANCE_OPTIMIZATIONS.md** (Line 259): Script does not exist: monitor-embeddings-health.ts
- **docs/PRICE_RETRIEVAL_FIX.md** (Line 157): Script does not exist: test-comprehensive-price-sources.ts
- **docs/QUEUE_MONITORING_TEST_REPORT.md** (Line 126): Script does not exist: -e
- **docs/README.md** (Line 51): Script does not exist: monitor-embeddings-health.ts
- **docs/README.md** (Line 73): Script does not exist: test-hallucination-prevention.ts
- **docs/README.md** (Line 212): Script does not exist: monitor-embeddings-health.ts
- **docs/README.md** (Line 212): Script does not exist: monitor-embeddings-health.ts
- **docs/README.md** (Line 212): Script does not exist: optimize-chunk-sizes.ts
- **docs/README.md** (Line 230): Script does not exist: test-database-cleanup.ts
- **docs/README.md** (Line 230): Script does not exist: test-database-cleanup.ts
- **docs/README.md** (Line 230): Script does not exist: test-database-cleanup.ts
- **docs/reports/PERFORMANCE_ANALYSIS_REPORT.md** (Line 252): Script does not exist: test-performance-analysis.ts
- **docs/reports/PERFORMANCE_ANALYSIS_REPORT.md** (Line 252): Script does not exist: test-performance-comparison.ts
- **docs/SEARCH_IMPROVEMENTS_MIGRATION.md** (Line 139): Script does not exist: test-search-comparison.ts
- **docs/SEARCH_IMPROVEMENTS_MIGRATION.md** (Line 155): Script does not exist: test-search-accuracy.ts
- **docs/SEARCH_IMPROVEMENTS_MIGRATION.md** (Line 203): Script does not exist: test-search-accuracy.ts
- **docs/SEARCH_IMPROVEMENTS_MIGRATION.md** (Line 203): Script does not exist: test-search-comparison.ts
- **docs/TOKEN_COST_TRACKING.md** (Line 114): Script does not exist: test-token-cost-logging.ts
- **docs/TOKEN_COST_TRACKING.md** (Line 114): Script does not exist: test-telemetry-persistence.ts
- **docs/woocommerce/WOOCOMMERCE_AUTH_FIX.md** (Line 78): Script does not exist: test-chatbot-orders.js
- **app/README.md** (Line 469): Script does not exist: test-database-cleanup.ts
- **app/README.md** (Line 469): Script does not exist: test-database-cleanup.ts
- **README.md** (Line 191): Script does not exist: test-database-cleanup.ts
- **README.md** (Line 191): Script does not exist: test-database-cleanup.ts
- **README.md** (Line 191): Script does not exist: monitor-embeddings-health.ts
- **README.md** (Line 191): Script does not exist: optimize-chunk-sizes.ts

### Warnings
These issues should be reviewed and potentially fixed:

- 161 warnings found across 265 files
- Review incomplete code examples
- Verify all import paths are correct
- Check SQL queries for safety

### General Recommendations

1. **Complete Examples**: Ensure all code examples are complete and copy-paste ready
2. **Import Accuracy**: Verify all imports reference actual files in the codebase
3. **Type Safety**: Avoid using `any` type; use specific types
4. **Error Handling**: Include error handling in examples where appropriate
5. **Context**: Provide sufficient context for each code example
6. **Testing**: Consider adding automated tests for critical code examples
