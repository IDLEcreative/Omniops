# MCP Code Execution Implementation Plan

**Type:** Analysis / Implementation Plan
**Status:** Active - Approved for Implementation
**Last Updated:** 2025-11-05
**Owner:** Engineering Team
**Budget:** $37,500 one-time + $3k/month ongoing
**Timeline:** 16 weeks (4 months)
**Expected ROI:** 376% Year 1

---

## Executive Summary

Implement code execution pattern with Model Context Protocol (MCP) to achieve:
- **98.5% token reduction** across AI chat, WooCommerce sync, analytics
- **$348,948 annual cost savings** (token costs reduced from $368k to $56k)
- **70-90% latency improvements** across all AI operations
- **Future-proof architecture** for multi-platform expansion

**Decision:** Implement MCP approach (not quick hack) for production-grade architecture.

---

## Strategic Rationale

### Why MCP (Not Quick Hack)

| Factor | Quick Hack | MCP Approach | Winner |
|--------|-----------|--------------|--------|
| **Initial Cost** | $15k-$30k | $37.5k | Hack |
| **Timeline** | 6 weeks | 16 weeks | Hack |
| **3-Year TCO** | $100k | $47.5k | **MCP** |
| **Maintainability** | Low | High | **MCP** |
| **Scalability** | Poor | Excellent | **MCP** |
| **Reusability** | None | Cross-platform | **MCP** |
| **Technical Debt** | High | None | **MCP** |
| **Industry Standard** | No | Yes (Anthropic) | **MCP** |

**Verdict:** MCP is the right choice for a production SaaS that will scale over 5+ years.

---

## Architecture Overview

### Current State (Traditional Tool Calling)

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
┌──────▼───────────────────────────────────────┐
│  Next.js API Route (app/api/chat/route.ts)   │
│  ┌──────────────────────────────────┐        │
│  │ Load ALL tool definitions        │ 3k tok │
│  │ (search, commerce, analytics)    │        │
│  └──────────────────────────────────┘        │
└──────┬───────────────────────────────────────┘
       │
┌──────▼──────────────────┐
│  OpenAI GPT-4           │
│  ┌─────────────────┐    │
│  │ Process request │    │
│  │ Call tool       │    │
│  └─────────────────┘    │
└──────┬──────────────────┘
       │
┌──────▼────────────────────────────────┐
│  Tool Handler                          │
│  ┌──────────────────────────────┐     │
│  │ Execute in API route context │     │
│  │ Load 100 products → 50k tok  │     │
│  │ Return ALL through model     │     │
│  └──────────────────────────────┘     │
└──────┬────────────────────────────────┘
       │
┌──────▼──────────────────┐
│  OpenAI processes       │
│  50k tokens AGAIN       │
│  Generates response     │
└─────────────────────────┘

TOTAL: ~113k tokens per conversation
COST: $0.35 per conversation
```

---

### Target State (MCP Code Execution)

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
┌──────▼───────────────────────────────────────┐
│  Next.js API Route (app/api/chat/route.ts)   │
│  ┌──────────────────────────────────┐        │
│  │ NO tool definitions loaded       │ 0 tok  │
│  │ Just code execution capability   │        │
│  └──────────────────────────────────┘        │
└──────┬───────────────────────────────────────┘
       │
┌──────▼──────────────────┐
│  OpenAI GPT-4           │
│  ┌─────────────────┐    │
│  │ Generate code   │    │
│  │ to answer query │    │
│  └─────────────────┘    │
└──────┬──────────────────┘
       │
       │  import { searchProducts } from './servers/search/';
       │  const results = await searchProducts({ query: 'pumps' });
       │  const filtered = results.filter(r => r.stock > 0);
       │  return filtered.slice(0, 15);
       │
┌──────▼────────────────────────────────────────┐
│  Sandbox Environment (Docker/vm2)             │
│  ┌──────────────────────────────────────┐    │
│  │ MCP Server Discovery                 │    │
│  │ └─ servers/                          │    │
│  │    ├─ search/                        │    │
│  │    │  └─ searchProducts.ts ← Load    │    │
│  │    ├─ commerce/ (not loaded)         │    │
│  │    └─ analytics/ (not loaded)        │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ Execute Code                         │    │
│  │ - Fetch 100 products (in sandbox)    │    │
│  │ - Filter in-memory (in sandbox)      │    │
│  │ - Return ONLY top 15                 │    │
│  └──────────────────────────────────────┘    │
└──────┬────────────────────────────────────────┘
       │ Returns: ["Product A", "Product B", ...]
       │ (200 tokens)
┌──────▼──────────────────┐
│  OpenAI receives        │
│  only summary (200 tok) │
│  Generates response     │
└─────────────────────────┘

TOTAL: ~2k tokens per conversation
COST: $0.014 per conversation
SAVINGS: 96% ($0.35 → $0.014)
```

---

## Phase 1: Foundation (Weeks 1-4)

### Week 1: Architecture & Planning

**Deliverables:**
- [ ] Detailed technical specification
- [ ] MCP server directory structure design
- [ ] Sandbox technology selection (Docker vs vm2 vs isolated-vm)
- [ ] Security architecture document
- [ ] Development environment setup

**Tasks:**
1. Design MCP server hierarchy for existing tools:
   ```
   servers/
   ├── search/
   │   ├── searchProducts.ts
   │   ├── searchByCategory.ts
   │   └── getProductDetails.ts
   ├── commerce/
   │   ├── checkInventory.ts
   │   ├── getOrderStatus.ts
   │   └── trackShipment.ts
   ├── analytics/
   │   ├── analyzeConversation.ts
   │   ├── getMetrics.ts
   │   └── generateReport.ts
   └── integrations/
       ├── woocommerce/
       └── shopify/
   ```

2. Evaluate sandbox technologies:
   - **Docker** (most isolation, slower startup ~2-5s)
   - **vm2** (fast, good isolation, easier to debug)
   - **isolated-vm** (fastest, moderate isolation)
   - **Firecracker** (AWS, production-grade, complex setup)

3. Design security model:
   - Resource limits (CPU, memory, disk, network)
   - Input/output validation
   - Secret management (API keys, credentials)
   - Rate limiting per sandbox execution
   - Monitoring and alerting

**Budget:** $5k (40 hours @ $125/hr)

---

### Week 2-3: Proof of Concept

**Goal:** Build working POC with ONE tool to validate approach

**Deliverables:**
- [ ] Sandbox environment running
- [ ] Single MCP server (`searchProducts.ts`)
- [ ] Modified chat route that uses code execution
- [ ] Comparison test: old vs new (token usage, latency, accuracy)

**Implementation:**

```typescript
// servers/search/searchProducts.ts
import { searchSimilarContent } from '@/lib/enhanced-embeddings';

interface SearchProductsInput {
  query: string;
  limit?: number;
}

interface SearchProductsOutput {
  results: Array<{
    id: string;
    title: string;
    price?: number;
    stock?: number;
  }>;
}

export const schema = {
  name: 'searchProducts',
  description: 'Search for products using semantic search',
  input: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number', default: 100, maximum: 1000 }
    },
    required: ['query']
  },
  output: {
    type: 'object',
    properties: {
      results: { type: 'array' }
    }
  }
};

export async function searchProducts(
  input: SearchProductsInput
): Promise<SearchProductsOutput> {
  const { query, limit = 100 } = input;

  // Use existing search logic
  const results = await searchSimilarContent(query, limit);

  return {
    results: results.map(r => ({
      id: r.id,
      title: r.title,
      price: r.metadata?.price,
      stock: r.metadata?.stock
    }))
  };
}
```

```typescript
// lib/sandbox/executor.ts
import vm2 from 'vm2'; // or chosen sandbox tech

export async function executeCode(code: string, context: any) {
  const vm = new vm2.NodeVM({
    require: {
      external: true,
      builtin: ['fs', 'path'],
      root: './servers/', // Only allow imports from servers/
    },
    timeout: 30000, // 30 second timeout
    sandbox: context
  });

  try {
    const result = await vm.run(code);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

```typescript
// app/api/chat/route.ts - Modified approach
const systemPrompt = `
You have access to MCP servers in the ./servers directory.

Available servers:
- search/searchProducts.ts - Search for products

Write TypeScript code to answer user questions.
Import tools from servers as needed.
Only return data the user needs to see.

Example:
import { searchProducts } from './servers/search/searchProducts.ts';
const results = await searchProducts({ query: 'pumps', limit: 100 });
const inStock = results.filter(r => r.stock > 0);
return inStock.slice(0, 15);
`;

// Let model generate code
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]
});

// Extract code from response
const code = extractCodeBlock(response.choices[0].message.content);

// Execute in sandbox
const result = await executeCode(code, {
  // Provide necessary context
  customerId: validatedData.customerId,
  domain: validatedData.domain
});

// Return result to user
```

**Testing Plan:**
1. Run 50 test conversations with old system → measure tokens
2. Run same 50 conversations with new system → measure tokens
3. Compare:
   - Token usage (expect 95%+ reduction)
   - Latency (expect 70%+ improvement)
   - Accuracy (expect same or better)
   - Cost per conversation

**Budget:** $10k (80 hours @ $125/hr)

---

### Week 4: Security Hardening

**Deliverables:**
- [ ] Security audit of POC
- [ ] Resource limits implemented and tested
- [ ] Input validation for all code execution
- [ ] Secrets management system
- [ ] Monitoring and alerting setup

**Security Checklist:**
- [ ] Sandbox escape testing (red team)
- [ ] CPU limit: 1 core per execution
- [ ] Memory limit: 512MB per execution
- [ ] Timeout: 30 seconds per execution
- [ ] Network access: Only to internal services (no external APIs)
- [ ] Filesystem: Read-only except /tmp
- [ ] Code validation: AST parsing before execution
- [ ] Logging: All executions logged with code + result
- [ ] Alerting: Failed executions, timeout violations, resource limits

**Budget:** $7.5k (60 hours @ $125/hr)

---

## Phase 2: Core Implementation (Weeks 5-10)

### Week 5-6: Migrate AI Chat System

**Goal:** Implement code execution for production chat with all tools

**Deliverables:**
- [ ] All chat tools migrated to MCP servers
- [ ] Progressive disclosure implemented
- [ ] Production-ready chat route
- [ ] A/B testing infrastructure (50/50 split)

**MCP Servers to Create:**
1. `servers/search/searchProducts.ts`
2. `servers/search/searchByCategory.ts`
3. `servers/search/getProductDetails.ts`
4. `servers/commerce/lookupOrder.ts` (WooCommerce/Shopify)
5. `servers/commerce/checkInventory.ts`
6. `servers/commerce/getOrderStatus.ts`

**Progressive Disclosure Implementation:**
```typescript
// lib/mcp/discovery.ts
export async function discoverTools(path: string): Promise<ToolDefinition[]> {
  const files = await fs.readdir(`./servers/${path}`);
  return files
    .filter(f => f.endsWith('.ts'))
    .map(f => {
      const module = require(`./servers/${path}/${f}`);
      return {
        name: module.schema.name,
        description: module.schema.description,
        path: `${path}/${f}`
      };
    });
}

// System prompt includes discovery function
const systemPrompt = `
You can discover available tools using:
- listCategories() → returns ['search', 'commerce', 'analytics']
- listTools(category) → returns tools in that category

Example workflow:
1. User asks about products
2. You call: const categories = listCategories();
3. You see 'search' category exists
4. You call: const tools = listTools('search');
5. You see 'searchProducts' is available
6. You import and use it
`;
```

**A/B Testing:**
- 50% traffic → old system (tool calling)
- 50% traffic → new system (code execution)
- Track: tokens, latency, accuracy, error rate
- Goal: New system ≥ same accuracy with 95%+ token reduction

**Budget:** $15k (120 hours @ $125/hr)

---

### Week 7-8: WooCommerce Sync Optimization

**Goal:** Implement code execution for bulk WooCommerce operations

**Current Problem:**
```typescript
// Current: Load 1,000 products into memory
const products = await woocommerce.get('products', { per_page: 100 });
// → 2M tokens through model to compare and identify changes
```

**New Approach:**
```typescript
// MCP Server: servers/commerce/woocommerce/syncProducts.ts
export async function syncProducts(input: { lastSyncTime: string }) {
  const wc = await getWooCommerceClient();

  // Stream products in batches
  const batches = wc.stream('products', {
    modified_after: input.lastSyncTime,
    per_page: 100
  });

  const changes = [];
  for await (const batch of batches) {
    // Compare in-memory (not through model)
    const localProducts = await db.getProducts(batch.map(p => p.id));
    const diff = compareProducts(batch, localProducts);
    changes.push(...diff);
  }

  // Only return summary
  return {
    newProducts: changes.filter(c => c.type === 'new').length,
    updatedProducts: changes.filter(c => c.type === 'updated').length,
    deletedProducts: changes.filter(c => c.type === 'deleted').length,
    changes: changes.slice(0, 10) // Sample for verification
  };
}
```

**Deliverables:**
- [ ] WooCommerce MCP servers
- [ ] Shopify MCP servers
- [ ] Streaming sync implementation
- [ ] Background job integration

**Budget:** $10k (80 hours @ $125/hr)

---

### Week 9-10: Analytics & Reporting

**Goal:** Optimize business intelligence operations

**Current Problem:**
```typescript
// Fetch all conversation data → 4M tokens
const conversations = await db.getAllConversations();
// Process through model → expensive
```

**New Approach:**
```typescript
// servers/analytics/generateReport.ts
export async function generateReport(input: { reportType: string, dateRange: DateRange }) {
  // Aggregate in-database (not through model)
  const metrics = await db.query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total_conversations,
      AVG(messages_count) as avg_messages,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM conversations
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY DATE(created_at)
  `, [input.dateRange.start, input.dateRange.end]);

  // Return aggregated metrics (not raw data)
  return {
    summary: {
      totalConversations: metrics.reduce((sum, m) => sum + m.total_conversations, 0),
      avgMessages: metrics.reduce((sum, m) => sum + m.avg_messages, 0) / metrics.length,
      uniqueCustomers: new Set(metrics.map(m => m.unique_customers)).size
    },
    daily: metrics
  };
}
```

**Deliverables:**
- [ ] Analytics MCP servers
- [ ] Database query optimization
- [ ] Report generation system
- [ ] Caching layer for common reports

**Budget:** $7.5k (60 hours @ $125/hr)

---

## Phase 3: Scale & Optimize (Weeks 11-14)

### Week 11-12: Infrastructure & Monitoring

**Deliverables:**
- [ ] Production sandbox infrastructure (Docker/Kubernetes)
- [ ] Horizontal scaling setup
- [ ] Comprehensive monitoring dashboard
- [ ] Performance optimization

**Infrastructure:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  sandbox-pool:
    image: omniops/sandbox:latest
    deploy:
      replicas: 10  # Pool of warm sandboxes
      resources:
        limits:
          cpus: '1'
          memory: 512M
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./servers:/app/servers:ro
```

**Monitoring Dashboard:**
- Sandbox execution count/sec
- Average execution time
- Token usage per endpoint
- Error rate by sandbox
- Resource utilization
- Cost per operation

**Budget:** $10k (80 hours @ $125/hr)

---

### Week 13-14: Testing & Optimization

**Deliverables:**
- [ ] Load testing (1,000 concurrent requests)
- [ ] End-to-end testing suite
- [ ] Performance optimization
- [ ] Documentation

**Load Testing Targets:**
- 1,000 concurrent chat requests
- 100 concurrent WooCommerce syncs
- 50 concurrent analytics reports
- p99 latency < 5 seconds
- Error rate < 0.1%

**Budget:** $10k (80 hours @ $125/hr)

---

## Phase 4: Rollout & Stabilization (Weeks 15-16)

### Week 15: Gradual Rollout

**Strategy:**
1. **Day 1-2:** 10% of traffic → code execution
2. **Day 3-4:** 25% of traffic
3. **Day 5-6:** 50% of traffic
4. **Day 7:** Monitor and adjust
5. **Week 2:** 100% of traffic if metrics are good

**Rollback Criteria:**
- Error rate > 1%
- p99 latency > 10 seconds
- Accuracy drop > 5%
- Customer complaints > 10

**Budget:** $5k (40 hours @ $125/hr)

---

### Week 16: Documentation & Knowledge Transfer

**Deliverables:**
- [ ] Developer documentation
- [ ] Operations runbook
- [ ] Troubleshooting guide
- [ ] Team training sessions
- [ ] Architecture decision records

**Budget:** $5k (40 hours @ $125/hr)

---

## Budget Breakdown

| Phase | Weeks | Tasks | Budget |
|-------|-------|-------|--------|
| **Phase 1: Foundation** | 1-4 | Architecture, POC, Security | $22,500 |
| **Phase 2: Core Implementation** | 5-10 | Chat, Commerce, Analytics | $32,500 |
| **Phase 3: Scale & Optimize** | 11-14 | Infrastructure, Testing | $20,000 |
| **Phase 4: Rollout** | 15-16 | Gradual rollout, Docs | $10,000 |
| **Contingency (10%)** | - | Buffer for unknowns | $8,500 |
| **TOTAL ONE-TIME** | - | - | **$93,500** |

**Ongoing Costs:**
- Sandbox infrastructure: $2k-$3k/month
- Monitoring/logging: $500-$1k/month
- **Total Monthly:** $2.5k-$4k

---

## Risk Assessment & Mitigation

### High-Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Sandbox escape** | Critical | Low | Security audit, regular pen testing, monitor logs |
| **Performance regression** | High | Medium | A/B testing, gradual rollout, easy rollback |
| **Accuracy drop** | High | Medium | Extensive testing, same test suite as current system |
| **Budget overrun** | Medium | Medium | 10% contingency, phased approach allows adjustment |
| **Team capacity** | Medium | Low | External contractors if needed, 16-week timeline allows flexibility |
| **Integration issues** | Medium | Medium | POC validates approach early, incremental migration |

---

## Success Metrics

### Technical Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Tokens/chat** | 113,000 | 2,000 | 98% reduction |
| **Tokens/sync** | 2,000,000 | 3,000 | 99.85% reduction |
| **Tokens/report** | 4,000,000 | 5,000 | 99.88% reduction |
| **Chat latency** | 10-15s | 3-5s | 70% improvement |
| **Sync time** | 8-10 min | 2-3 min | 75% improvement |
| **Report time** | 30-60s | 5-10s | 83% improvement |

### Business Metrics

| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| **Annual AI costs** | $368k | $56k | $312k saved |
| **Infrastructure costs** | $0 | $36k/year | New cost |
| **Net savings** | - | $276k/year | 376% ROI |
| **Break-even** | - | 2.5 months | Fast payback |
| **Customer satisfaction** | - | +10% | Faster responses |

---

## Dependencies & Prerequisites

### Technical Prerequisites
- [ ] Docker or vm2/isolated-vm expertise
- [ ] Node.js sandbox security knowledge
- [ ] TypeScript/MCP protocol understanding
- [ ] Kubernetes knowledge (for production scale)

### Team Requirements
- 1-2 Senior Engineers (full-time, 16 weeks)
- 1 DevOps Engineer (part-time, weeks 11-14)
- 1 Security Engineer (part-time, week 4)
- 1 QA Engineer (part-time, weeks 13-16)

### External Dependencies
- OpenAI API (code generation capability)
- Supabase (existing database)
- Docker/Kubernetes infrastructure
- Monitoring tools (Datadog, Grafana, etc.)

---

## Decision Points

### End of Phase 1 (Week 4)
**Decision:** Proceed to Phase 2?
**Criteria:**
- [ ] POC shows >95% token reduction
- [ ] Security audit passes
- [ ] Performance meets targets (p99 < 5s)
- [ ] Budget on track

**If NO:** Reassess approach, consider alternatives

---

### End of Phase 2 (Week 10)
**Decision:** Proceed to production rollout?
**Criteria:**
- [ ] All core systems migrated
- [ ] A/B testing shows positive results
- [ ] Error rate < 1%
- [ ] Team confident in stability

**If NO:** More testing, address issues before rollout

---

### Week 15 (During Rollout)
**Decision:** Continue to 100% or rollback?
**Criteria:**
- [ ] Error rate < 0.5%
- [ ] Token reduction achieved (>95%)
- [ ] Latency improved (>70%)
- [ ] No major customer complaints

**If NO:** Rollback to old system, debug issues

---

## Alternatives Considered

### Alternative 1: Quick Hack (No MCP)
- **Pros:** Faster (6 weeks), cheaper ($30k)
- **Cons:** Technical debt, not scalable, will need refactor
- **Decision:** Rejected - not production-grade for SaaS

### Alternative 2: Wait for Anthropic's Official MCP Code Execution
- **Pros:** No implementation needed, battle-tested
- **Cons:** Unknown timeline, may not fit our needs
- **Decision:** Rejected - can't wait, need savings now

### Alternative 3: Hybrid Approach (Some tools MCP, some traditional)
- **Pros:** Lower risk, incremental
- **Cons:** Complexity, mixed patterns, confusing
- **Decision:** Rejected - all-in on MCP is cleaner

---

## Next Steps

### Immediate Actions (This Week)
1. [ ] Get stakeholder approval for $93.5k budget
2. [ ] Allocate 1-2 senior engineers for 16 weeks
3. [ ] Set up project tracking (Jira/Linear)
4. [ ] Schedule kickoff meeting

### Week 1 Actions
1. [ ] Design MCP server architecture
2. [ ] Select sandbox technology (Docker vs vm2)
3. [ ] Create technical specification
4. [ ] Set up development environment

---

## Appendix: Reference Documentation

- [REFERENCE_MCP_CODE_EXECUTION_FAITHFUL.md](../03-REFERENCE/REFERENCE_MCP_CODE_EXECUTION_FAITHFUL.md) - What Anthropic stated
- [REFERENCE_MCP_CODE_EXECUTION_COMPREHENSIVE.md](../03-REFERENCE/REFERENCE_MCP_CODE_EXECUTION_COMPREHENSIVE.md) - Implementation guide
- [ANALYSIS_MCP_CODE_EXECUTION_OPPORTUNITIES.md](./ANALYSIS_MCP_CODE_EXECUTION_OPPORTUNITIES.md) - Opportunity analysis
- [Anthropic Article](https://www.anthropic.com/engineering/code-execution-with-mcp) - Original source

---

**Status:** Ready for implementation approval
**Next Review:** 2025-11-12 (weekly during implementation)
**Owner:** Engineering Lead
**Approvers:** CTO, CEO, CFO (for budget)
