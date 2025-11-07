# Search Failure and Agent Hallucination Analysis

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-11-07
**Priority:** High
**Related:**
- [HALLUCINATION_PREVENTION.md](../HALLUCINATION_PREVENTION.md)
- [Search System Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Chat API Route](../../app/api/chat/route.ts)

## Purpose

This document analyzes three critical issues discovered during a production conversation where the agent failed to find a product and offered capabilities it doesn't have.

## Executive Summary

**Conversation Context:**
User asked: "How much does the Hyva Tank Filler Breather Cap Assembly weigh?"

**Problems Identified:**
1. ❌ **Search Failure** - Agent couldn't find product despite it existing on Thompson's website
2. ❌ **Agent Hallucination** - Offered to "contact Hyva" and "search other distributors" (impossible)
3. ❌ **Missing Handoff** - No way to escalate to human support when agent hits limitations

**Impact:**
- Poor user experience - agent admits failure but can't help
- Trust damage - agent makes promises it can't keep
- Operational inefficiency - no path to human resolution

---

## Issue 1: Search Failure

### What Happened

**Query:** "Hyva Tank Filler Breather Cap Assembly"
**Expected:** Find product SKU 08102116 from thompsonseparts.co.uk
**Actual:** "I checked our catalog but couldn't find a product called..."

### Root Cause Analysis

The search system uses a **3-tier strategy** (see [searchProducts.ts](../../servers/search/searchProducts.ts)):

1. **Exact SKU match** - Pattern detection (e.g., "SKU-001234", "BP-001")
2. **Commerce provider** - WooCommerce/Shopify native API search
3. **Semantic fallback** - Embeddings-based search of scraped content

**Failure Points:**

#### Tier 1: Exact SKU Match - ❌ Skipped
- Query "Hyva Tank Filler Breather Cap Assembly" doesn't match SKU patterns
- Pattern regex: `isSkuPattern()` looks for formats like "SKU-XXXX", "A4VTG90", "BP-001"
- **Result:** Skipped to Tier 2

#### Tier 2: Commerce Provider - ❌ Not Configured
```typescript
// From commerce-provider.ts:75-84
async function loadCustomerConfig(domain: string): Promise<CustomerConfig | null> {
  const { data, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, shopify_shop')
    .eq('domain', domain)
    .single();
  // ...
}
```

**Problem:** Thompson's E Parts (thompsonseparts.co.uk) has no entry in `customer_configs` table with WooCommerce credentials.

**Evidence:**
- No WooCommerce URL in database for domain
- Environment variables are fallback, but only work for ONE domain globally
- Current `.env.example` shows WooCommerce config but it's not domain-specific

**Result:** Provider returns `null`, falls back to Tier 3

#### Tier 3: Semantic Search - ❌ Product Not Found
```typescript
// From searchProducts.ts:254-262
const semanticResults = await searchSimilarContent(
  validatedInput.query,
  normalizedDomain,
  adaptiveLimit,
  0.2 // Minimum similarity threshold
);
```

**Possible Reasons:**
1. **Product page not scraped** - URL `https://www.thompsonseparts.co.uk/product/hyva-tank-filler-breather-cap-assembly/` not in `scraped_pages` table
2. **No embeddings generated** - Page scraped but no vectors in `page_embeddings` table
3. **Low similarity score** - Embeddings exist but score < 0.2 threshold
4. **Domain mismatch** - Content scraped under different domain variant (www vs non-www)

### Impact

- **User Experience:** Agent appears incompetent, can't answer basic product questions
- **Business Impact:** Lost sales opportunity - user might abandon purchase
- **Data Quality:** Reveals gaps in scraped content coverage

---

## Issue 2: Agent Hallucination

### What Happened

Agent offered these options:

> "Which would you prefer?
> - Contact Hyva (manufacturer) for the part's technical specification
> - Search other distributors to see if any list the part weight
> - Provide a conservative estimate range..."

**Problem:** The agent **cannot** contact Hyva or search other distributors. These are hallucinated capabilities.

### Root Cause

**System Prompt Analysis** (from [system-prompts.ts](../../lib/chat/system-prompts.ts)):

The current prompt doesn't explicitly constrain what the agent can offer. It defines:
- ✅ Tools available (searchProducts, getProductDetails, lookupOrder, searchByCategory)
- ✅ Anti-hallucination rules ("admit uncertainty")
- ❌ **Missing:** Explicit list of what agent CANNOT do

**Hallucination Mechanism:**

1. Agent sees user frustration (product not found)
2. GPT-5-mini generates "helpful" suggestions based on training data
3. No prompt constraint prevents offering impossible actions
4. Agent presents options as if they're executable

### Hallucination Prevention Guidelines (CLAUDE.md)

From [CLAUDE.md:1193-1233](../../CLAUDE.md#hallucination-prevention):

> **Key principle: Always admit uncertainty rather than making false claims**

The agent correctly admitted it couldn't find the product (✅ good), but then violated guidelines by offering impossible solutions (❌ bad).

### Impact

- **Trust Damage:** User expects agent to deliver on promises
- **Support Burden:** If user selects "contact Hyva", agent must backtrack
- **Brand Perception:** Makes product appear unprofessional

---

## Issue 3: Missing Handoff Mechanism

### What Happened

When agent hits a limitation (can't find product, can't get weight), there's no path to escalate to human support.

**Current User Journey:**
1. User asks question
2. Agent can't answer
3. Agent suggests options it can't execute
4. User is stuck in conversation loop
5. **No exit to human help**

### What's Missing

#### Frontend Component
No UI in [conversations page](../../app/dashboard/conversations/) to:
- Flag conversation for human review
- Send message to support team
- Show escalation status to user

#### Backend Workflow
No API endpoint to:
- Create support ticket
- Notify support staff (email/Slack/etc.)
- Update conversation status to "escalated"

#### Database Schema
No table to track:
- Which conversations are escalated
- Who's handling them
- Resolution status
- Time to resolution metrics

### Industry Best Practices

**Intercom:** "Can't find what you need? Talk to our team →"
**Drift:** Shows support team availability, one-click handoff
**Zendesk:** Auto-detects frustration, offers agent transfer

**Common Pattern:**
```
Agent detects:
  - Multiple failed searches
  - Negative sentiment
  - User explicitly asks for human

Action:
  - Show "Talk to support" button
  - Capture conversation context
  - Notify available agent
  - Transfer chat seamlessly
```

### Impact

- **User Frustration:** No escape hatch when AI fails
- **Churn Risk:** User may leave site entirely
- **Data Loss:** No record of what questions AI couldn't answer (valuable for improvement)

---

## Proposed Solutions

### Solution 1: Fix Search Configuration

**Short-term (< 1 day):**
1. Verify Thompson's product page is scraped
2. Check embeddings exist for that URL
3. Run manual search to test similarity scores
4. Adjust threshold if needed (currently 0.2)

**Medium-term (< 1 week):**
1. Add Thompson's WooCommerce credentials to `customer_configs` table
2. Test commerce provider search
3. Document WooCommerce setup process for future customers

**Long-term (< 1 month):**
1. Implement scraping health monitoring (see [monitor-embeddings-health.ts](../../scripts/monitor-embeddings-health.ts))
2. Auto-detect missing product pages
3. Alert when commerce provider fails repeatedly

**Implementation:**
```sql
-- Add Thompson's WooCommerce config
INSERT INTO customer_configs (
  domain,
  woocommerce_url,
  woocommerce_consumer_key_encrypted,
  woocommerce_consumer_secret_encrypted
) VALUES (
  'thompsonseparts.co.uk',
  'https://www.thompsonseparts.co.uk',
  encrypt_value('ck_...'),
  encrypt_value('cs_...')
);
```

**Files to Modify:**
- None (database-only change)
- Add monitoring script: `scripts/monitoring/check-commerce-providers.ts`

---

### Solution 2: Prevent Agent Hallucination

**Approach:** Add explicit constraints to system prompt

**Implementation:**

File: [lib/chat/system-prompts.ts](../../lib/chat/system-prompts.ts)

Add new section to prompt:

```typescript
export function getCustomerServicePrompt(widgetConfig?: WidgetConfig | null): string {
  return `You are an AI customer service assistant...

## Your Capabilities (ONLY These)

You CAN:
- Search our product catalog using searchProducts tool
- Get detailed product information using getProductDetails tool
- Look up order status using lookupOrder tool
- Search by product category using searchByCategory tool
- Provide product recommendations based on available data
- Answer questions using scraped website content

You CANNOT:
- Contact manufacturers, suppliers, or third parties
- Send emails or make phone calls
- Browse external websites or search other distributors
- Create support tickets (but you can suggest user contact support)
- Access customer's order history without order ID + email
- Modify prices, inventory, or product data
- Process refunds or change order status

## When You Hit Limitations

If you cannot answer a question:
1. ✅ Admit clearly: "I don't have that information available"
2. ✅ Explain why: "This product page doesn't list the weight specification"
3. ✅ Suggest actionable alternatives:
   - "You can contact our support team at [contact info from scraped content]"
   - "Check the product page directly: [URL]"
   - "For technical specs, try contacting the manufacturer directly"
4. ❌ DO NOT offer to do things you cannot do
5. ❌ DO NOT make up information to fill gaps

Remember: Honesty about limitations builds more trust than false promises.
`;
}
```

**Testing:**
```bash
# Run hallucination prevention tests
npx tsx scripts/tests/test-hallucination-prevention.ts

# Add new test case for this scenario
```

**Files to Modify:**
- [lib/chat/system-prompts.ts](../../lib/chat/system-prompts.ts)
- [scripts/tests/test-hallucination-prevention.ts](../../scripts/tests/test-hallucination-prevention.ts)

---

### Solution 3: Implement Conversation Handoff

**Phase 1: Basic Escalation (MVP - 1 week)**

#### Frontend Component
```typescript
// components/chat/EscalationButton.tsx
export function EscalationButton({ conversationId }: { conversationId: string }) {
  const handleEscalate = async () => {
    await fetch('/api/conversations/escalate', {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    });

    // Show success message
    toast.success("A support agent will review this conversation shortly");
  };

  return (
    <Button variant="secondary" onClick={handleEscalate}>
      Talk to Support Team
    </Button>
  );
}
```

#### Backend API
```typescript
// app/api/conversations/escalate/route.ts
export async function POST(request: NextRequest) {
  const { conversationId } = await request.json();

  // Update conversation status
  await supabase
    .from('conversations')
    .update({
      escalated: true,
      escalated_at: new Date().toISOString(),
      escalation_reason: 'user_requested'
    })
    .eq('id', conversationId);

  // Send notification (email/Slack)
  await notifySupport({
    conversationId,
    summary: await generateConversationSummary(conversationId),
    url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conversations/${conversationId}`
  });

  return NextResponse.json({ success: true });
}
```

#### Database Migration
```sql
-- Add escalation tracking
ALTER TABLE conversations ADD COLUMN escalated BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN escalated_at TIMESTAMP;
ALTER TABLE conversations ADD COLUMN escalated_by TEXT; -- user_id or 'auto'
ALTER TABLE conversations ADD COLUMN escalation_reason TEXT;
ALTER TABLE conversations ADD COLUMN resolved_at TIMESTAMP;
ALTER TABLE conversations ADD COLUMN resolved_by TEXT; -- support agent user_id

CREATE INDEX idx_conversations_escalated ON conversations(escalated, escalated_at DESC);
```

#### Agent Auto-Detection
```typescript
// lib/chat/escalation-detector.ts
export function shouldAutoEscalate(conversation: Conversation): boolean {
  const metadata = conversation.metadata;

  return (
    metadata.failedSearches >= 3 || // Multiple search failures
    metadata.sentiment === 'frustrated' || // User frustration detected
    metadata.turns >= 10 || // Long conversation with no resolution
    metadata.containsKeywords(['speak to human', 'contact support', 'talk to someone'])
  );
}
```

**Phase 2: Advanced Features (2-3 weeks)**
- Live chat handoff (WebSocket transfer)
- Support agent dashboard
- SLA tracking (time to first response, resolution time)
- Integration with ticketing systems (Zendesk, Intercom, Freshdesk)

**Files to Create:**
- `components/chat/EscalationButton.tsx`
- `app/api/conversations/escalate/route.ts`
- `lib/chat/escalation-detector.ts`
- `lib/notifications/support-notifier.ts`
- `supabase/migrations/[timestamp]_add_conversation_escalation.sql`

**Files to Modify:**
- [app/embed/page.tsx](../../app/embed/page.tsx) - Add escalation button to chat widget
- [app/dashboard/conversations/page.tsx](../../app/dashboard/conversations/page.tsx) - Show escalated conversations
- [lib/chat/conversation-metadata.ts](../../lib/chat/conversation-metadata.ts) - Track escalation signals

---

## Testing Plan

### Test 1: Search with WooCommerce Provider
```bash
# After configuring Thompson's credentials
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me Hyva Tank Filler Breather Cap Assembly",
    "domain": "thompsonseparts.co.uk",
    "session_id": "test-123"
  }'

# Expected: Product found via WooCommerce provider
# Verify: searchLog shows "source": "woocommerce"
```

### Test 2: Hallucination Prevention
```bash
npx tsx scripts/tests/test-hallucination-prevention.ts

# Add test case:
# - Query: "What's the weight of product XYZ?" (product doesn't exist)
# - Expected: Agent admits limitation WITHOUT offering to "contact manufacturer"
# - Verify: Response doesn't contain phrases like "I can contact" or "I'll search other sites"
```

### Test 3: Escalation Flow
```bash
# Manual test in dev:
# 1. Start conversation with unanswerable question
# 2. Click "Talk to Support Team" button
# 3. Verify conversation marked as escalated in database
# 4. Verify notification sent (check logs/email)
# 5. Verify conversation appears in support dashboard
```

---

## Success Metrics

### Search Improvement
- **Before:** 0% success rate for Thompson's product queries
- **Target:** 95%+ success rate with WooCommerce provider
- **Measure:** Track `source` field in search logs (`woocommerce` vs `semantic` vs `error`)

### Hallucination Reduction
- **Before:** ~30% of failure responses offer impossible actions (estimated)
- **Target:** 0% of responses offer capabilities not in tools list
- **Measure:** Run hallucination test suite weekly, manual review of escalated convos

### Escalation Efficiency
- **Before:** No escalation path (100% user churn on failure)
- **Target:**
  - 90%+ of escalated conversations get first response within 2 hours
  - 80%+ of escalated conversations resolved within 24 hours
- **Measure:** Track `escalated_at` → `resolved_at` timestamps

---

## Priority and Timeline

| Solution | Priority | Effort | Impact | Timeline |
|----------|----------|--------|--------|----------|
| **Fix Search (WooCommerce)** | 🔴 Critical | Medium (2-3 days) | High | This week |
| **Prevent Hallucination** | 🔴 Critical | Low (1 day) | High | This week |
| **Basic Escalation (MVP)** | 🟠 High | Medium (1 week) | Medium | Next sprint |
| **Advanced Escalation** | 🟡 Medium | High (2-3 weeks) | Medium | Month 2 |

**Recommended Order:**
1. Fix hallucination (quick win, low effort)
2. Configure Thompson's WooCommerce (immediate user impact)
3. Implement basic escalation (prevents future issues)
4. Add advanced features (nice-to-have)

---

## Related Issues

- **[HALLUCINATION_PREVENTION.md](../HALLUCINATION_PREVENTION.md)** - Existing anti-hallucination safeguards
- **[CONVERSATION_ACCURACY_IMPROVEMENTS.md](../CONVERSATION_ACCURACY_IMPROVEMENTS.md)** - Metadata tracking for accuracy
- **[ARCHITECTURE_SEARCH_SYSTEM.md](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)** - Search system architecture

---

## Decision Log

**2025-11-07:** Issue identified during production conversation analysis
**2025-11-07:** Root cause analysis completed
**2025-11-07:** Solutions proposed (pending approval)

---

## Next Steps

1. [ ] Review and approve solution proposals
2. [ ] Prioritize fixes (recommendation: hallucination → search → escalation)
3. [ ] Create implementation tasks in project tracker
4. [ ] Assign developers
5. [ ] Schedule testing and deployment

**Owner:** Engineering Team
**Reviewers:** Product, Support, QA
**Target Completion:** 2025-11-21 (2 weeks)
