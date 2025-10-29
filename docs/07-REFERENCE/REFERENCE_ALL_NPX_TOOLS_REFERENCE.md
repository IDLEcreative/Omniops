# Complete NPX Tools Reference Guide

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 51 minutes

## Purpose
This document provides a comprehensive reference for ALL NPX tools available in the Omniops project. These tools are organized by category for easy navigation.

## Quick Links
- [Overview](#overview)
- [Table of Contents](#table-of-contents)
- [Database Management Tools](#database-management-tools)
- [Performance Monitoring & Optimization](#performance-monitoring--optimization)
- [Testing & Validation Tools](#testing--validation-tools)

## Keywords
all, cache, card, categories, chaos, chat, cleanup, contents, contributing, data

---


## Overview

This document provides a comprehensive reference for ALL NPX tools available in the Omniops project. These tools are organized by category for easy navigation.

**Total Tools Count**: 100+ standalone TypeScript utilities

---

## Table of Contents

1. [Database Management Tools](#database-management-tools)
2. [Performance Monitoring & Optimization](#performance-monitoring--optimization)
3. [Testing & Validation Tools](#testing--validation-tools)
4. [Search & Embeddings Tools](#search--embeddings-tools)
5. [WooCommerce Integration Tools](#woocommerce-integration-tools)
6. [Security & Chaos Testing](#security--chaos-testing)
7. [Cache Management](#cache-management)
8. [Data Cleanup & Migration](#data-cleanup--migration)
9. [Debugging & Investigation Tools](#debugging--investigation-tools)
10. [AI & Chat Testing](#ai--chat-testing)

---

## Database Management Tools

### test-database-cleanup.ts
**Purpose**: Clean and manage scraped data in the database
```bash
npx tsx test-database-cleanup.ts stats              # View scraping statistics
npx tsx test-database-cleanup.ts clean              # Clean all scraped data
npx tsx test-database-cleanup.ts clean --domain=X   # Clean specific domain
npx tsx test-database-cleanup.ts clean --dry-run    # Preview cleanup
```

### optimize-database.ts
**Purpose**: Optimize database performance and indexes
```bash
npx tsx optimize-database.ts
```

### check-table-structure.ts
**Purpose**: Verify database table structures and schemas
```bash
npx tsx check-table-structure.ts
```

### check-embeddings-table.ts
**Purpose**: Specifically check the page_embeddings table structure
```bash
npx tsx check-embeddings-table.ts
```

### apply-telemetry-migration.ts
**Purpose**: Apply telemetry tracking migrations to database
```bash
npx tsx apply-telemetry-migration.ts
```

---

## Performance Monitoring & Optimization

### monitor-embeddings-health.ts
**Purpose**: Monitor health and performance of the embeddings system
```bash
npx tsx monitor-embeddings-health.ts check   # Run health check
npx tsx monitor-embeddings-health.ts auto    # Run auto-maintenance
npx tsx monitor-embeddings-health.ts watch   # Continuous monitoring
```

### optimize-chunk-sizes.ts
**Purpose**: Analyze and optimize text chunk sizes
```bash
npx tsx optimize-chunk-sizes.ts analyze              # Analyze current chunks
npx tsx optimize-chunk-sizes.ts optimize             # Optimize chunks (live)
npx tsx optimize-chunk-sizes.ts optimize --dry-run   # Preview changes
npx tsx optimize-chunk-sizes.ts validate             # Validate chunk sizes
npx tsx optimize-chunk-sizes.ts constraints          # Show SQL constraints
```

### batch-rechunk-embeddings.ts
**Purpose**: Batch process oversized chunks for production
```bash
npx tsx batch-rechunk-embeddings.ts --force  # Run batch rechunking
```

### simple-rechunk.ts
**Purpose**: Simple sequential rechunking for small batches
```bash
npx tsx simple-rechunk.ts
```

### performance-bottleneck-analyzer.ts
**Purpose**: Analyze and identify performance bottlenecks
```bash
npx tsx performance-bottleneck-analyzer.ts
```

### test-database-performance.ts
**Purpose**: Test database query performance
```bash
npx tsx test-database-performance.ts
```

### test-database-performance-diagnosis.ts
**Purpose**: Detailed diagnosis of database performance issues
```bash
npx tsx test-database-performance-diagnosis.ts
```

### benchmark-pipeline-performance.ts
**Purpose**: Benchmark the entire data processing pipeline
```bash
npx tsx benchmark-pipeline-performance.ts
```

### benchmark-search-performance.ts
**Purpose**: Benchmark search query performance
```bash
npx tsx benchmark-search-performance.ts
```

### benchmark-quick-search.ts
**Purpose**: Quick benchmark of search functionality
```bash
npx tsx benchmark-quick-search.ts
```

### benchmark-search-improvements.ts
**Purpose**: Compare search performance before/after improvements
```bash
npx tsx benchmark-search-improvements.ts
```

### profile-search-performance.ts
**Purpose**: Detailed profiling of search operations
```bash
npx tsx profile-search-performance.ts
```

### test-performance-analysis.ts
**Purpose**: Comprehensive performance analysis
```bash
npx tsx test-performance-analysis.ts
```

### test-performance-comparison.ts
**Purpose**: Compare performance between different implementations
```bash
npx tsx test-performance-comparison.ts
```

### test-performance-direct.ts
**Purpose**: Direct performance testing without abstractions
```bash
npx tsx test-performance-direct.ts
```

### test-performance-fixes.ts
**Purpose**: Validate performance optimizations
```bash
npx tsx test-performance-fixes.ts
```

### test-api-performance.ts
**Purpose**: Test API endpoint performance
```bash
npx tsx test-api-performance.ts
```

### test-api-optimizations.ts
**Purpose**: Test API optimization implementations
```bash
npx tsx test-api-optimizations.ts
```

---

## Testing & Validation Tools

### test-system-health-check.ts
**Purpose**: Comprehensive system health check
```bash
npx tsx test-system-health-check.ts
```

### test-final-verification.ts
**Purpose**: Final verification of all system components
```bash
npx tsx test-final-verification.ts
```

### test-customer-satisfaction-journey.ts
**Purpose**: End-to-end customer journey testing
```bash
npx tsx test-customer-satisfaction-journey.ts
```

### test-customer-satisfaction-journey-quick.ts
**Purpose**: Quick version of customer journey test
```bash
npx tsx test-customer-satisfaction-journey-quick.ts
```

### validate-all-optimizations.ts
**Purpose**: Validate all applied optimizations
```bash
npx tsx validate-all-optimizations.ts
```

### validate-fixes.ts
**Purpose**: Validate bug fixes and patches
```bash
npx tsx validate-fixes.ts
```

### validate-optimizations.ts
**Purpose**: Validate specific optimizations
```bash
npx tsx validate-optimizations.ts
```

### validate-search-improvements.ts
**Purpose**: Validate search functionality improvements
```bash
npx tsx validate-search-improvements.ts
```

### validate-intelligent-search-api.ts
**Purpose**: Validate intelligent search API endpoints
```bash
npx tsx validate-intelligent-search-api.ts
```

### comprehensive-phase1-validation.ts
**Purpose**: Comprehensive validation for phase 1 features
```bash
npx tsx comprehensive-phase1-validation.ts
```

### phase1-validation-final.ts
**Purpose**: Final validation for phase 1 deployment
```bash
npx tsx phase1-validation-final.ts
```

### edge-case-test-suite.ts
**Purpose**: Test edge cases and boundary conditions
```bash
npx tsx edge-case-test-suite.ts
```

---

## Search & Embeddings Tools

### audit-embeddings-comprehensive.ts
**Purpose**: Comprehensive audit of embeddings data
```bash
npx tsx audit-embeddings-comprehensive.ts
```

### analyze-dc66-embeddings.ts
**Purpose**: Analyze embeddings for specific domain
```bash
npx tsx analyze-dc66-embeddings.ts
```

### investigate-missing-embeddings.ts
**Purpose**: Investigate and report missing embeddings
```bash
npx tsx investigate-missing-embeddings.ts
```

### clean-contaminated-embeddings.ts
**Purpose**: Clean corrupted or contaminated embeddings
```bash
npx tsx clean-contaminated-embeddings.ts
```

### clean-remaining-contamination.ts
**Purpose**: Clean remaining contaminated data
```bash
npx tsx clean-remaining-contamination.ts
```

### identify-contaminated-domains.ts
**Purpose**: Identify domains with contaminated data
```bash
npx tsx identify-contaminated-domains.ts
```

### test-search-accuracy.ts
**Purpose**: Test search result accuracy
```bash
npx tsx test-search-accuracy.ts
```

### test-search-consistency.ts
**Purpose**: Test search result consistency
```bash
npx tsx test-search-consistency.ts
```

### test-search-fresh.ts
**Purpose**: Test search with fresh data
```bash
npx tsx test-search-fresh.ts
```

### test-search-performance.ts
**Purpose**: Test search performance metrics
```bash
npx tsx test-search-performance.ts
```

### test-quick-search.ts
**Purpose**: Quick search functionality test
```bash
npx tsx test-quick-search.ts
```

### test-simple-query.ts
**Purpose**: Test simple search queries
```bash
npx tsx test-simple-query.ts
```

### test-specific-search.ts
**Purpose**: Test specific search scenarios
```bash
npx tsx test-specific-search.ts
```

### test-comprehensive-search-coverage.ts
**Purpose**: Test comprehensive search coverage
```bash
npx tsx test-comprehensive-search-coverage.ts
```

### test-focused-search-verification.ts
**Purpose**: Focused verification of search functionality
```bash
npx tsx test-focused-search-verification.ts
```

### verify-chunk-retrieval-any-domain.ts
**Purpose**: Verify chunk retrieval across domains
```bash
npx tsx verify-chunk-retrieval-any-domain.ts
```

### verify-full-chunk-retrieval.ts
**Purpose**: Verify complete chunk retrieval
```bash
npx tsx verify-full-chunk-retrieval.ts
```

---

## WooCommerce Integration Tools

### test-woocommerce-all-endpoints.ts
**Purpose**: Test all WooCommerce API endpoints
```bash
npx tsx test-woocommerce-all-endpoints.ts
```

### test-woocommerce-agent-complete.ts
**Purpose**: Test complete WooCommerce agent functionality
```bash
npx tsx test-woocommerce-agent-complete.ts
```

### test-woocommerce-cache-performance.ts
**Purpose**: Test WooCommerce cache performance
```bash
npx tsx test-woocommerce-cache-performance.ts
```

### test-woocommerce-e2e-chat.ts
**Purpose**: End-to-end WooCommerce chat integration test
```bash
npx tsx test-woocommerce-e2e-chat.ts
```

### test-wc-cache-direct.ts
**Purpose**: Direct WooCommerce cache testing
```bash
npx tsx test-wc-cache-direct.ts
```

### manual-woocommerce-evaluation.ts
**Purpose**: Manual evaluation of WooCommerce integration
```bash
npx tsx manual-woocommerce-evaluation.ts
```

### run-product-extraction.ts
**Purpose**: Extract products from WooCommerce
```bash
npx tsx run-product-extraction.ts
```

### test-complete-product-discovery.ts
**Purpose**: Test complete product discovery workflow
```bash
npx tsx test-complete-product-discovery.ts
```

### verify-ai-product-accuracy.ts
**Purpose**: Verify AI product recognition accuracy
```bash
npx tsx verify-ai-product-accuracy.ts
```

---

## Security & Chaos Testing

### security-chaos-test.ts
**Purpose**: Comprehensive security chaos testing
```bash
npx tsx security-chaos-test.ts
```

### security-chaos-test-fast.ts
**Purpose**: Quick security chaos testing
```bash
npx tsx security-chaos-test-fast.ts
```

### security-chaos-targeted.ts
**Purpose**: Targeted security chaos testing
```bash
npx tsx security-chaos-targeted.ts
```

### chaos-test-search-pipeline.ts
**Purpose**: Chaos testing for search pipeline
```bash
npx tsx chaos-test-search-pipeline.ts
```

### chaos-test-dc66-focused.ts
**Purpose**: Focused chaos testing for specific domain
```bash
npx tsx chaos-test-dc66-focused.ts
```

---

## Cache Management

### clear-cache.ts
**Purpose**: Clear all cache data
```bash
npx tsx clear-cache.ts
```

### clear-cifa-cache.ts
**Purpose**: Clear CIFA-specific cache
```bash
npx tsx clear-cifa-cache.ts
```

### clear-stale-cache.ts
**Purpose**: Clear stale cache entries
```bash
npx tsx clear-stale-cache.ts
```

### test-clear-cache.ts
**Purpose**: Test cache clearing functionality
```bash
npx tsx test-clear-cache.ts
```

### test-cache-consistency.ts
**Purpose**: Test cache consistency
```bash
npx tsx test-cache-consistency.ts
```

---

## Data Cleanup & Migration

### clean-thompson-data.ts
**Purpose**: Clean Thompson-specific data
```bash
npx tsx clean-thompson-data.ts
```

### apply_fix_directly.ts
**Purpose**: Apply fixes directly to database
```bash
npx tsx apply_fix_directly.ts
```

### execute_fix.ts
**Purpose**: Execute specific fixes
```bash
npx tsx execute_fix.ts
```

---

## Debugging & Investigation Tools

### debug-test.ts
**Purpose**: General debugging utility
```bash
npx tsx debug-test.ts
```

### investigate-indexes.ts
**Purpose**: Investigate database indexes
```bash
npx tsx investigate-indexes.ts
```

### investigate-indexes-direct.ts
**Purpose**: Direct investigation of indexes
```bash
npx tsx investigate-indexes-direct.ts
```

### investigate-data-architecture.ts
**Purpose**: Investigate overall data architecture
```bash
npx tsx investigate-data-architecture.ts
```

### investigate_column_type.ts
**Purpose**: Investigate column types in database
```bash
npx tsx investigate_column_type.ts
```

### investigate_embedding_format.ts
**Purpose**: Investigate embedding data format
```bash
npx tsx investigate_embedding_format.ts
```

### verify_db_state.ts
**Purpose**: Verify current database state
```bash
npx tsx verify_db_state.ts
```

### analyze-index-problems.ts
**Purpose**: Analyze index-related problems
```bash
npx tsx analyze-index-problems.ts
```

### analyze-intelligent-search-performance.ts
**Purpose**: Analyze intelligent search performance
```bash
npx tsx analyze-intelligent-search-performance.ts
```

### diagnose-dc66-pipeline.ts
**Purpose**: Diagnose pipeline for specific domain
```bash
npx tsx diagnose-dc66-pipeline.ts
```

### forensic-dc66-investigation.ts
**Purpose**: Forensic investigation for specific domain
```bash
npx tsx forensic-dc66-investigation.ts
```

### investigate-cifa-embeddings.ts
**Purpose**: Investigate CIFA embeddings
```bash
npx tsx investigate-cifa-embeddings.ts
```

### investigate-cifa-limit.ts
**Purpose**: Investigate CIFA limits
```bash
npx tsx investigate-cifa-limit.ts
```

### investigate-dc66-products.ts
**Purpose**: Investigate DC66 products
```bash
npx tsx investigate-dc66-products.ts
```

### verify-dc66-products.ts
**Purpose**: Verify DC66 products data
```bash
npx tsx verify-dc66-products.ts
```

### verify-cifa-fixes.ts
**Purpose**: Verify CIFA-related fixes
```bash
npx tsx verify-cifa-fixes.ts
```

### verify-exact-cifa-count.ts
**Purpose**: Verify exact CIFA count
```bash
npx tsx verify-exact-cifa-count.ts
```

### log-analyzer-example.ts
**Purpose**: Example log analysis tool
```bash
npx tsx log-analyzer-example.ts
```

### check-all-domains.ts
**Purpose**: Check all domains in database
```bash
npx tsx check-all-domains.ts
```

### check-bulk-functions.ts
**Purpose**: Check bulk function implementations
```bash
npx tsx check-bulk-functions.ts
```

### check-domain-id.ts
**Purpose**: Check domain ID configurations
```bash
npx tsx check-domain-id.ts
```

### check_bulk_function.ts
**Purpose**: Check specific bulk function
```bash
npx tsx check_bulk_function.ts
```

### get-null-text-urls.ts
**Purpose**: Get URLs with null text content
```bash
npx tsx get-null-text-urls.ts
```

### test-direct-supabase-query.ts
**Purpose**: Test direct Supabase queries
```bash
npx tsx test-direct-supabase-query.ts
```

### test-raw-response.ts
**Purpose**: Test raw API responses
```bash
npx tsx test-raw-response.ts
```

---

## AI & Chat Testing

### test-hallucination-prevention.ts
**Purpose**: Test anti-hallucination measures
```bash
npx tsx test-hallucination-prevention.ts
```

### test-anti-hallucination.ts
**Purpose**: Test anti-hallucination system
```bash
npx tsx test-anti-hallucination.ts
```

### test-ai-context-analysis.ts
**Purpose**: Test AI context analysis
```bash
npx tsx test-ai-context-analysis.ts
```

### test-ai-to-woocommerce-agent.ts
**Purpose**: Test AI to WooCommerce agent
```bash
npx tsx test-ai-to-woocommerce-agent.ts
```

### test-chat-intelligent-cifa.ts
**Purpose**: Test intelligent chat for CIFA
```bash
npx tsx test-chat-intelligent-cifa.ts
```

### test-chat-route-cifa.ts
**Purpose**: Test chat route for CIFA
```bash
npx tsx test-chat-route-cifa.ts
```

### test-cifa-conversation.ts
**Purpose**: Test CIFA conversation flow
```bash
npx tsx test-cifa-conversation.ts
```

### test-cifa-direct-search.ts
**Purpose**: Test CIFA direct search
```bash
npx tsx test-cifa-direct-search.ts
```

### test-cifa-fix-verification.ts
**Purpose**: Test CIFA fix verification
```bash
npx tsx test-cifa-fix-verification.ts
```

### test-cifa-forensic-analysis.ts
**Purpose**: Test CIFA forensic analysis
```bash
npx tsx test-cifa-forensic-analysis.ts
```

### test-cifa-pump-comparison.ts
**Purpose**: Test CIFA pump comparison
```bash
npx tsx test-cifa-pump-comparison.ts
```

### test-cifa-reasoning-trace.ts
**Purpose**: Test CIFA reasoning trace
```bash
npx tsx test-cifa-reasoning-trace.ts
```

### test-cifa-search-direct.ts
**Purpose**: Test CIFA search directly
```bash
npx tsx test-cifa-search-direct.ts
```

### test-all-cifa-pumps.ts
**Purpose**: Test all CIFA pumps
```bash
npx tsx test-all-cifa-pumps.ts
```

### test-generic-intelligence.ts
**Purpose**: Test generic AI intelligence
```bash
npx tsx test-generic-intelligence.ts
```

### test-intelligent-chat-final.ts
**Purpose**: Test final intelligent chat implementation
```bash
npx tsx test-intelligent-chat-final.ts
```

### test-intelligent-cifa-analysis.ts
**Purpose**: Test intelligent CIFA analysis
```bash
npx tsx test-intelligent-cifa-analysis.ts
```

### test-intelligent-product-workflow.ts
**Purpose**: Test intelligent product workflow
```bash
npx tsx test-intelligent-product-workflow.ts
```

### test-intelligent-search-direct.ts
**Purpose**: Test intelligent search directly
```bash
npx tsx test-intelligent-search-direct.ts
```

### test-widget-intelligent-route.ts
**Purpose**: Test widget intelligent routing
```bash
npx tsx test-widget-intelligent-route.ts
```

---

## Telemetry & Monitoring

### test-telemetry-system.ts
**Purpose**: Test telemetry system
```bash
npx tsx test-telemetry-system.ts
```

### test-telemetry-live.ts
**Purpose**: Test live telemetry
```bash
npx tsx test-telemetry-live.ts
```

### test-telemetry-persistence.ts
**Purpose**: Test telemetry persistence
```bash
npx tsx test-telemetry-persistence.ts
```

### test-token-cost-logging.ts
**Purpose**: Test token cost logging
```bash
npx tsx test-token-cost-logging.ts
```

### test-direct-token-logging.ts
**Purpose**: Test direct token logging
```bash
npx tsx test-direct-token-logging.ts
```

---

## Parallel Processing & Tools

### test-parallel-context-gathering.ts
**Purpose**: Test parallel context gathering
```bash
npx tsx test-parallel-context-gathering.ts
```

### test-parallel-quick.ts
**Purpose**: Quick parallel processing test
```bash
npx tsx test-parallel-quick.ts
```

### test-parallel-tools-execution.ts
**Purpose**: Test parallel tools execution
```bash
npx tsx test-parallel-tools-execution.ts
```

### test-comprehensive-tool-analysis.ts
**Purpose**: Comprehensive tool analysis
```bash
npx tsx test-comprehensive-tool-analysis.ts
```

### test-tool-report.ts
**Purpose**: Generate tool usage report
```bash
npx tsx test-tool-report.ts
```

---

## Optimization Testing

### test-optimizations.ts
**Purpose**: General optimization testing
```bash
npx tsx test-optimizations.ts
```

### test-navigation-fix.ts
**Purpose**: Test navigation fixes
```bash
npx tsx test-navigation-fix.ts
```

### test-minimal-api-verification.ts
**Purpose**: Minimal API verification
```bash
npx tsx test-minimal-api-verification.ts
```

### performance-test.ts
**Purpose**: General performance testing
```bash
npx tsx performance-test.ts
```

### performance-test-quick.ts
**Purpose**: Quick performance testing
```bash
npx tsx performance-test-quick.ts
```

---

## Usage Guidelines

### Running Tools

All tools can be executed using:
```bash
npx tsx <tool-name>.ts [arguments]
```

### Common Patterns

1. **Health Checks**: Run regularly to monitor system health
   ```bash
   npx tsx test-system-health-check.ts
   npx tsx monitor-embeddings-health.ts check
   ```

2. **Performance Testing**: Before and after optimizations
   ```bash
   npx tsx test-performance-comparison.ts
   npx tsx benchmark-search-performance.ts
   ```

3. **Data Cleanup**: When refreshing or maintaining data
   ```bash
   npx tsx test-database-cleanup.ts clean --dry-run
   npx tsx clear-stale-cache.ts
   ```

4. **Debugging Issues**: When investigating problems
   ```bash
   npx tsx debug-test.ts
   npx tsx investigate-missing-embeddings.ts
   ```

### Best Practices

1. **Always run dry-run first** for destructive operations
2. **Check system health** before major operations
3. **Use quick tests** for rapid feedback during development
4. **Run comprehensive tests** before deployments
5. **Monitor telemetry** to track performance over time

---

## Tool Categories Summary

| Category | Tool Count | Primary Use |
|----------|------------|-------------|
| Database Management | 5 | Schema, structure, migrations |
| Performance Monitoring | 18 | Benchmarking, profiling, optimization |
| Testing & Validation | 11 | System verification, end-to-end tests |
| Search & Embeddings | 16 | Search quality, embeddings management |
| WooCommerce Integration | 9 | E-commerce integration testing |
| Security & Chaos | 5 | Resilience and security testing |
| Cache Management | 5 | Cache operations and consistency |
| Data Cleanup | 3 | Data maintenance and fixes |
| Debugging & Investigation | 30+ | Troubleshooting and analysis |
| AI & Chat | 20+ | AI behavior and chat testing |
| Telemetry | 5 | Monitoring and logging |
| Parallel Processing | 5 | Concurrent operations testing |
| Optimization | 6 | Performance improvements |

---

## Maintenance Notes

- **Regular Updates**: This document should be updated when new tools are added
- **Deprecation**: Mark tools as deprecated rather than removing them
- **Documentation**: Each tool should have inline documentation
- **Testing**: Test tools should be run before major releases

---

## Contributing

When adding new NPX tools:

1. Place in root directory if it's a standalone utility
2. Use clear, descriptive names
3. Add header comments explaining purpose
4. Update this documentation
5. Follow naming conventions:
   - `test-*.ts` for testing tools
   - `validate-*.ts` for validation tools
   - `check-*.ts` for checking tools
   - `investigate-*.ts` for investigation tools
   - `benchmark-*.ts` for performance tools

---

## Quick Reference Card

### Most Used Tools

```bash
# Daily Operations
npx tsx monitor-embeddings-health.ts check
npx tsx test-system-health-check.ts
npx tsx clear-stale-cache.ts

# Performance
npx tsx benchmark-search-performance.ts
npx tsx test-performance-comparison.ts

# Debugging
npx tsx debug-test.ts
npx tsx investigate-missing-embeddings.ts

# Data Management
npx tsx test-database-cleanup.ts stats
npx tsx optimize-chunk-sizes.ts analyze

# Testing
npx tsx test-customer-satisfaction-journey-quick.ts
npx tsx test-hallucination-prevention.ts
```

---

Last Updated: September 2025
Total Tools: 100+
