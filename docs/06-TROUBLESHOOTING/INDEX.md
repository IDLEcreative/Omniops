# Troubleshooting Documentation Index

**Type:** Troubleshooting
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 12 minutes

## Purpose
npx tsx monitor-embeddings-health.ts check

## Quick Links
- [Quick Navigation](#quick-navigation)
- [Files in This Directory](#files-in-this-directory)
- [Common Issues & Solutions](#common-issues--solutions)
- [Debug Endpoints](#debug-endpoints)
- [Diagnostic Commands](#diagnostic-commands)

## Keywords
commands, common, contacts, debug, diagnostic, directory, documentation, emergency, endpoints, files

---


**Last Updated:** 2025-10-29
**Total Files:** 5+
**Purpose:** Common problems, debug procedures, and solutions for known issues

## Quick Navigation
- [← Integrations](../06-INTEGRATIONS/)
- [Next Category: Reference →](../07-REFERENCE/)
- [Documentation Home](../README.md)

---

## Files in This Directory

### Debug Tools
- **[TROUBLESHOOTING_DEBUG_ENDPOINTS.md](TROUBLESHOOTING_DEBUG_ENDPOINTS.md)** - Debug API endpoints for diagnostics
- **[README.md](README.md)** - Troubleshooting overview and common patterns

### Issue-Specific Guides
- **[TROUBLESHOOTING_CODE_ISSUES_FROM_TESTS.md](TROUBLESHOOTING_CODE_ISSUES_FROM_TESTS.md)** - Common test failures and fixes
- **[TROUBLESHOOTING_SEARCH_ISSUES.md](TROUBLESHOOTING_SEARCH_ISSUES.md)** - Search problems and solutions
- **[TROUBLESHOOTING_AUTH_ISSUES.md](TROUBLESHOOTING_AUTH_ISSUES.md)** - Authentication debugging

---

## Common Issues & Solutions

### Search Not Returning Results

**Symptoms**: Empty search results, "No content found" errors

**Diagnosis**:
```bash
# Check embeddings health
npx tsx monitor-embeddings-health.ts check

# Verify scraped pages exist
npx tsx test-database-cleanup.ts stats
```

**Solutions**:
1. Re-scrape website content
2. Regenerate embeddings for affected domain
3. Check search architecture limits (100-200 results, not 20)

**Reference**: [TROUBLESHOOTING_SEARCH_ISSUES.md](TROUBLESHOOTING_SEARCH_ISSUES.md)

---

### WooCommerce Integration Failing

**Symptoms**: "WooCommerce API error", authentication failures

**Diagnosis**:
```bash
# Test direct connection
npx tsx test-woocommerce-direct.ts

# Check credentials
npx tsx check-woocommerce-config.ts
```

**Solutions**:
1. Verify API credentials are correct
2. Check WooCommerce REST API is enabled
3. Ensure proper webhook configuration
4. Test with health monitor

**Reference**: [WooCommerce Customization Guide](../02-GUIDES/GUIDE_WOOCOMMERCE_CUSTOMIZATION.md)

---

### Database Connection Issues

**Symptoms**: "Connection refused", "Could not connect to database"

**Diagnosis**:
```bash
# Check Supabase connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/
```

**Solutions**:
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`
2. Check database is not paused (free tier)
3. Verify RLS policies are not blocking access
4. Test with service role key for admin operations

**Reference**: [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

### Chat Hallucination Issues

**Symptoms**: AI making false claims, inventing information

**Diagnosis**:
```bash
# Run hallucination tests
npx tsx test-hallucination-prevention.ts
```

**Solutions**:
1. Review conversation accuracy metrics
2. Check search results are relevant
3. Verify sufficient context being provided
4. Review agent prompts for explicit instructions

**Reference**: [Hallucination Prevention Guide](../02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md)

---

### RLS Policy Violations

**Symptoms**: "Row-level security policy violated", access denied errors

**Diagnosis**:
```bash
# Check RLS policies
npx tsx check-rls-policies.ts
```

**Solutions**:
1. Verify user has proper organization_id
2. Check JWT token includes correct claims
3. Test with service role key to bypass RLS temporarily
4. Review policy definitions in database

**Reference**: [RLS Security Testing](../04-DEVELOPMENT/testing/GUIDE_RLS_SECURITY_TESTING.md)

---

### Rate Limiting Errors

**Symptoms**: "Too many requests", 429 status codes

**Diagnosis**:
- Check `X-RateLimit-Remaining` header in response
- Review rate limit configuration per domain

**Solutions**:
1. Implement exponential backoff
2. Request rate limit increase for domain
3. Cache frequently accessed data
4. Batch requests where possible

**Reference**: [Rate Limiting Architecture](../01-ARCHITECTURE/ARCHITECTURE_RATE_LIMITING.md)

---

## Debug Endpoints

### Available Debug Routes
```bash
# Check system health
GET /api/debug/health

# View embeddings status
GET /api/debug/embeddings?domain=example.com

# Test WooCommerce connection
POST /api/debug/woocommerce-test

# Verify authentication
GET /api/debug/auth-status
```

**Reference**: [TROUBLESHOOTING_DEBUG_ENDPOINTS.md](TROUBLESHOOTING_DEBUG_ENDPOINTS.md)

---

## Diagnostic Commands

### Database Health
```bash
# Statistics
npx tsx test-database-cleanup.ts stats

# Check specific domain
npx tsx test-database-cleanup.ts stats --domain=example.com
```

### Embeddings Health
```bash
# Run health check
npx tsx monitor-embeddings-health.ts check

# Auto-maintenance
npx tsx monitor-embeddings-health.ts auto
```

### Integration Testing
```bash
# WooCommerce
npx tsx test-woocommerce-direct.ts
npx tsx monitor-woocommerce.ts

# Shopify
npx tsx test-shopify-integration.ts

# Stripe
./scripts/stripe/test-integration.sh
```

---

## Recommended Reading Order

1. **[README.md](README.md)** - Troubleshooting overview
2. **[TROUBLESHOOTING_DEBUG_ENDPOINTS.md](TROUBLESHOOTING_DEBUG_ENDPOINTS.md)** - Debug tools
3. **[TROUBLESHOOTING_CODE_ISSUES_FROM_TESTS.md](TROUBLESHOOTING_CODE_ISSUES_FROM_TESTS.md)** - Test failures

---

## Emergency Contacts

- **Production Issues**: Check runbooks in [05-DEPLOYMENT](../05-DEPLOYMENT/runbooks.md)
- **Security Issues**: Follow security incident response procedures
- **Data Issues**: Review database backup and recovery procedures

---

## Related Documentation
- [Monitoring Setup](../05-DEPLOYMENT/GUIDE_MONITORING_SETUP.md) - Observability
- [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Data model
- [NPX Scripts Reference](../07-REFERENCE/REFERENCE_NPX_SCRIPTS.md) - Maintenance tools
- [Technical Debt Tracker](../04-ANALYSIS/ANALYSIS_TECHNICAL_DEBT_TRACKER.md) - Known issues
