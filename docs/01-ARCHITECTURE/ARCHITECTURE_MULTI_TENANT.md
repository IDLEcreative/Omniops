# Multi-Tenant Chat Widget Setup Guide

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 7 minutes

## Purpose
The chat widget currently works for single-tenant testing with Thompson's E Parts. For production multi-tenant deployment, several changes are needed.

## Quick Links
- [Current State](#current-state)
- [How Multi-Tenancy Should Work](#how-multi-tenancy-should-work)
- [Required Changes for Production](#required-changes-for-production)
- [Testing Strategy for Multiple Customers](#testing-strategy-for-multiple-customers)
- [Security Requirements](#security-requirements)

## Keywords
architecture, changes, checklist, current, customers, deployment, example, files, flow, implementation

---


## Current State
The chat widget currently works for single-tenant testing with Thompson's E Parts. For production multi-tenant deployment, several changes are needed.

## How Multi-Tenancy Should Work

### Automatic Domain Detection
1. Widget loads on customer's website (e.g., `thompsonseparts.co.uk`)
2. Widget automatically detects the domain using `window.location.hostname`
3. Chat API receives the domain and loads only that customer's content
4. RAG searches only within that customer's scraped pages and embeddings

### Database Architecture (Already Implemented)
```
domains table → scraped_pages → page_embeddings
     ↓
customer_configs (settings per domain)
```

## Required Changes for Production

### 1. Remove Hardcoded Domains
Currently hardcoded for testing in:
- `/components/ChatWidget.tsx` (lines 149-151, 284-286)
- `/app/api/chat/route.ts` (line 143)

### 2. Add Domain Verification
```typescript
// Verify domain is registered and active
const domainExists = await checkDomainRegistration(domain);
if (!domainExists) {
  return errorResponse('Domain not registered');
}
```

### 3. Customer Onboarding Process
1. Customer signs up
2. Add domain to `domains` table
3. Scrape customer's website
4. Generate embeddings
5. Customer adds widget script to their site
6. Widget auto-detects domain and loads their content

## Testing Strategy for Multiple Customers

### Option 1: URL Parameter Testing
```
http://localhost:3001/embed?domain=customer1.com
http://localhost:3001/embed?domain=customer2.com
```

### Option 2: Environment Variable
```bash
# .env.local
TEST_DOMAIN=thompsonseparts.co.uk
```

### Option 3: Local Domain Aliases
Add to `/etc/hosts`:
```
127.0.0.1 local.customer1.com
127.0.0.1 local.customer2.com
```

## Security Requirements

### Domain Whitelisting
- Only registered domains can access the API
- Implement CORS validation
- Rate limiting per domain (already implemented)

### Content Isolation
- Each domain can only access its own scraped content
- Embeddings search restricted to domain_id
- No cross-domain data leakage

## Deployment Checklist

- [ ] Remove all hardcoded domain references
- [ ] Implement domain verification in chat API
- [ ] Add domain whitelist check
- [ ] Set up CORS properly for each customer domain
- [ ] Create admin interface for adding new domains
- [ ] Test with multiple domains
- [ ] Document customer onboarding process
- [ ] Create monitoring for per-domain usage

## Example Implementation Flow

### For Thompson's E Parts:
1. Domain: `thompsonseparts.co.uk` added to database
2. Content scraped: 12 pages
3. Embeddings generated
4. Widget script added to their site
5. Chat automatically uses their content

### For New Customer (e.g., BobsTools):
1. Domain: `bobstools.com` added to database
2. Content scraped from bobstools.com
3. Embeddings generated for Bob's products
4. Same widget script works automatically
5. Chat uses Bob's content when on bobstools.com

## Key Files to Modify

1. `/components/ChatWidget.tsx` - Remove localhost override
2. `/app/api/chat/route.ts` - Remove hardcoded mapping
3. `/lib/embeddings.ts` - Already supports domain isolation
4. `/app/api/scrape/route.ts` - Ensure proper domain association

## Notes

- Database structure already supports multi-tenancy
- RAG system already filters by domain_id
- Main changes needed are removing test hardcoding and adding verification
- Consider adding customer dashboard for monitoring their widget usage

## Next Steps

1. Review and remove hardcoded domains
2. Implement domain verification middleware
3. Create admin tools for customer onboarding
4. Test with multiple test domains
5. Deploy to production with proper domain routing
