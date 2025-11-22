# Industry Best Practices Guide

**Type:** Guide  
**Status:** Active  
**Last Updated:** 2025-11-22  
**Purpose:** SaaS patterns and best practices from industry leaders (Stripe, Intercom, Vercel)

---

## Overview

This is a SaaS product. Follow established patterns from successful companies (Stripe, Intercom, Segment, Vercel). Don't reinvent the wheel - learn from companies that have solved these problems at scale.

---

## Core Principles

### 1. Minimal Integration Code

**Goal:** Embed scripts should be 5-10 lines maximum

✅ **Good: Minimal, dynamic configuration**
```html
<script>
window.ChatWidgetConfig = { serverUrl: "https://omniops.co.uk" };
</script>
<script src="https://omniops.co.uk/embed.js" async></script>
```

❌ **Bad: Hardcoded configuration**
```html
<script>
window.ChatWidgetConfig = {
  serverUrl: "...",
  appearance: { /* 20 lines */ },
  features: { /* 20 lines */ },
  // Customer must update HTML to change anything
};
</script>
```

**Principles:**
- Configuration loads dynamically from server
- Customers never need to update integration code
- Changes apply instantly via dashboard

### 2. Configuration Management

- ✅ Store configuration in database
- ✅ Provide dashboard/UI for updates
- ✅ Apply changes instantly without code changes
- ✅ Version configuration for rollback capability
- ❌ Don't require customers to edit code to change settings

### 3. API Design

- ✅ RESTful endpoints with clear naming
- ✅ Consistent error responses with proper HTTP codes
- ✅ Rate limiting on all public endpoints
- ✅ Pagination for list endpoints (cursor-based preferred)
- ✅ API versioning strategy (URL or header-based)
- ❌ Don't return unbounded lists
- ❌ Don't expose internal implementation details in responses

### 4. Developer Experience (DX)

- ✅ Clear, concise documentation with examples
- ✅ Copy-paste ready code snippets
- ✅ Multiple framework examples (HTML, React, Next.js, etc.)
- ✅ Interactive testing/preview capabilities
- ✅ Helpful error messages with actionable solutions
- ❌ Don't assume technical knowledge
- ❌ Don't use jargon without explanation

### 5. Security & Privacy

- ✅ Environment variables for sensitive configuration
- ✅ Never expose API keys in client-side code
- ✅ Use service role keys server-side only
- ✅ Implement proper CORS policies
- ✅ Follow GDPR/CCPA compliance requirements
- ❌ Don't hardcode credentials anywhere
- ❌ Don't log sensitive information

### 6. Scalability Defaults

- ✅ Design for 10x current usage from day one
- ✅ Use caching strategically (Redis, CDN)
- ✅ Implement background job processing for heavy operations
- ✅ Database indexes on commonly queried fields
- ✅ Connection pooling for database access
- ❌ Don't make synchronous external API calls in request path
- ❌ Don't perform heavy computation in API routes

---

## Decision Framework

Before implementing any customer-facing feature, ask:

1. **How do industry leaders solve this?**
   - Research Stripe, Intercom, Vercel, Segment approaches
   - Look for common patterns across multiple products
   - Understand why they made those choices

2. **Is this the simplest solution?**
   - Can it be done with less code?
   - Can it be done with less customer effort?
   - What's the minimum viable implementation?

3. **Will this scale?**
   - Works for 1,000 customers?
   - Works for 10,000 customers?
   - What breaks first at scale?

4. **Is this maintainable?**
   - Can changes be made without customer action?
   - Is configuration centralized?
   - Are there sharp edges or gotchas?

5. **Is the DX excellent?**
   - Would I enjoy using this?
   - Is it self-explanatory?
   - Are errors helpful?

---

## Real-World Examples from This Codebase

**Widget Embed Code (Commit 43467ab)**
- ❌ Before: 50+ lines of hardcoded configuration
- ✅ After: 7 lines with dynamic config loading from `/api/widget/config`
- Why: Matches Intercom, Drift pattern - customers install once, update via dashboard

**Environment-Based URLs (Commit c875074)**
- ❌ Before: Widget auto-detected URLs, used Vercel preview URLs in production
- ✅ After: Uses `NEXT_PUBLIC_APP_URL` environment variable
- Why: Matches Vercel, Netlify pattern - different configs per environment

---

## When to Deviate

Sometimes you need to deviate - but document WHY:

```typescript
// DEVIATION: Using synchronous API call here because...
// 1. This endpoint is internal-only (not customer-facing)
// 2. Response time is <50ms (measured)
// 3. Alternative would require job queue setup (over-engineering)
const result = await fetchSyncData();
```

---

## Learning Resources

**For SaaS Patterns:**
- Stripe API Documentation (gold standard)
- Intercom Developer Hub (excellent DX)
- Segment Documentation (clear integration guides)
- Vercel Documentation (deployment best practices)

**For Architecture:**
- 12-Factor App methodology
- Microsoft Azure Architecture Center
- AWS Well-Architected Framework

**The Golden Rule:** If a successful SaaS company does it a certain way, there's probably a good reason. Learn from their mistakes and successes.
