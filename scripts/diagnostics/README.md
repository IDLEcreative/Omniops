**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Diagnostic Scripts

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [WooCommerce Integration](/home/user/Omniops/docs/06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md), [Main Scripts README](/home/user/Omniops/scripts/README.md)
**Estimated Read Time:** 4 minutes

## Purpose

Service-specific diagnostic tools for troubleshooting WooCommerce and external service integrations with comprehensive connectivity testing and configuration validation.

## Quick Links

- [Main Scripts README](/home/user/Omniops/scripts/README.md)
- [WooCommerce Integration](/home/user/Omniops/docs/06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md)
- [Monitoring Tools](/home/user/Omniops/scripts/monitoring/README.md)
- [Database Tools](/home/user/Omniops/scripts/database/README.md)

## Keywords

diagnostics, troubleshooting, WooCommerce, API, connectivity, configuration, widget, integration testing

## Overview

This directory contains diagnostic tools for troubleshooting WooCommerce and external service integrations.

## Available Tools

### check-woocommerce-config.ts
**Purpose:** Verify WooCommerce configuration and credentials

**Usage:**
```bash
npx tsx scripts/diagnostics/check-woocommerce-config.ts
```

**What it checks:**
- Customer config exists
- WooCommerce credentials are present
- Credentials are properly encrypted
- Store URL is valid and accessible
- API version compatibility

**Output:**
```
WooCommerce Configuration Check

Customer: example.com
✓ Configuration exists
✓ WooCommerce credentials present
✓ Credentials encrypted: AES-256
✓ Store URL: https://store.example.com
✓ API version: v3

Status: HEALTHY
```

---

### diagnose-woocommerce-api.ts
**Purpose:** Comprehensive WooCommerce API diagnostic and connectivity test

**Usage:**
```bash
npx tsx scripts/diagnostics/diagnose-woocommerce-api.ts
```

**What it tests:**
1. **Connectivity:**
   - Can reach WooCommerce REST API
   - Authentication works
   - SSL/TLS validation

2. **API Endpoints:**
   - Products endpoint accessible
   - Orders endpoint accessible
   - Customers endpoint accessible
   - System status endpoint

3. **Permissions:**
   - Read permissions
   - Write permissions (if configured)
   - Webhook permissions

4. **Performance:**
   - API response times
   - Rate limit status
   - Pagination support

**Output:**
```
WooCommerce API Diagnostic

Store: https://store.example.com
API Version: v3

Connectivity:
  ✓ SSL certificate valid
  ✓ API endpoint reachable (127ms)
  ✓ Authentication successful

Endpoints:
  ✓ /products - Accessible (45ms)
  ✓ /orders - Accessible (52ms)
  ✓ /customers - Accessible (48ms)
  ✗ /system_status - Not accessible (403 Forbidden)

Permissions:
  ✓ Read products
  ✓ Read orders
  ✓ Write webhooks
  ⚠ Limited admin access

Performance:
  p50 response time: 47ms
  p95 response time: 125ms
  Rate limit: 45/100 requests (45% used)

Overall Status: HEALTHY (minor permission limitations)

Recommendations:
  - Grant system_status permission for better diagnostics
  - Monitor rate limit usage
```

---

### diagnose-widget-issue.html
**Purpose:** HTML diagnostic tool for troubleshooting chat widget embedding

**Usage:**
```bash
# Open in browser
open scripts/diagnostics/diagnose-widget-issue.html

# Or serve with local server
npx serve scripts/diagnostics
# Then navigate to http://localhost:3000/diagnose-widget-issue.html
```

**What it tests:**
- Widget loading and initialization
- JavaScript errors in console
- Network requests to API
- CORS configuration
- Embed code validation
- Visual rendering issues

**Features:**
- Interactive troubleshooting steps
- Real-time console output
- Network request monitoring
- Common issue checklist

**Common issues detected:**
- CORS errors
- Missing or incorrect embed code
- API endpoint unreachable
- JavaScript conflicts with parent page
- CSS conflicts
- Browser compatibility issues

---

## Common Diagnostic Workflows

### WooCommerce Integration Not Working

```bash
# 1. Check configuration
npx tsx scripts/diagnostics/check-woocommerce-config.ts

# 2. If config OK, test API
npx tsx scripts/diagnostics/diagnose-woocommerce-api.ts

# 3. If API failing, check credentials
npx tsx scripts/database/update-woocommerce-credentials.ts

# 4. Verify fix
npx tsx scripts/diagnostics/diagnose-woocommerce-api.ts
```

### Chat Widget Not Loading

```bash
# 1. Open diagnostic page
open scripts/diagnostics/diagnose-widget-issue.html

# 2. Check browser console for errors

# 3. Verify embed code is correct

# 4. Test API endpoints directly
curl https://your-app.vercel.app/api/chat
```

### API Returning Errors

```bash
# 1. Check WooCommerce API health
npx tsx scripts/diagnostics/diagnose-woocommerce-api.ts

# 2. Review API logs
vercel logs --follow

# 3. Check database connectivity
npx tsx scripts/tests/test-complete-system.ts

# 4. Verify credentials
npx tsx scripts/database/check-thompson-config.ts
```

## Prerequisites

```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# For WooCommerce diagnostics
# Customer must have WooCommerce credentials configured
```

## Troubleshooting

### "Cannot find customer configuration"
```bash
# List all customers
npx tsx scripts/analysis/investigate_all_customers.js

# Create configuration if missing
# Use Supabase dashboard or API
```

### "WooCommerce API connection timeout"
```bash
# Check if store URL is accessible
curl -I https://store.example.com

# Verify firewall rules allow outbound connections

# Test from different network
```

### "Widget diagnostic page not loading"
```bash
# Ensure serving from HTTP server (not file://)
npx serve scripts/diagnostics

# Check browser console for errors

# Verify embed.js is accessible
curl https://your-app.vercel.app/embed.js
```

## Related Scripts

- **Database:** `scripts/database/check-woocommerce-config.ts`
- **Database:** `scripts/database/update-woocommerce-credentials.ts`
- **Monitoring:** `scripts/monitoring/monitor-woocommerce.ts`
- **Tests:** `scripts/tests/test-complete-system.ts`

## Related Documentation

- [WooCommerce Integration](/home/user/Omniops/docs/06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md)
- [Widget Embedding](/home/user/Omniops/docs/widget-embedding.md)
- [Main Scripts README](/home/user/Omniops/scripts/README.md)
