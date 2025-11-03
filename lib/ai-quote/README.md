# AI Quote System Module

**Purpose:** Intelligent quote generation system that analyzes businesses and recommends pricing tiers automatically using GPT-4o-mini.

**Status:** Complete - MVP ready for testing

**Created:** 2025-11-03

**Key Features:**
- ✅ Business intelligence collection (parallel data gathering)
- ✅ GPT-4o-mini powered analysis (cost ~£0.02 per quote)
- ✅ Rate limiting (3 quotes per IP per hour)
- ✅ Multi-source data collection (website, company, traffic, domain)
- ✅ Confidence scoring for recommendations
- ✅ Detailed reasoning for tier selection

## Directory Structure

```
lib/ai-quote/
├── types.ts                          # Type definitions
├── data-collector.ts                 # Orchestrates data collection
├── ai-analyzer.ts                    # GPT-4o-mini analysis
├── index.ts                          # Public exports
└── collectors/
    ├── website-collector.ts          # Scrapes and analyzes website
    ├── company-collector.ts          # Companies House API integration
    ├── traffic-collector.ts          # Estimates monthly traffic
    └── domain-collector.ts           # WHOIS domain information
```

## Usage

### Basic Usage

```typescript
import { collectBusinessIntelligence, analyzeBusiness } from '@/lib/ai-quote';

// Collect business data
const intel = await collectBusinessIntelligence('github.com');

// Analyze and get pricing recommendation
const recommendation = await analyzeBusiness(intel);

console.log(`Recommended tier: ${recommendation.tier}`);
console.log(`Price: £${recommendation.monthlyPrice}/month`);
console.log(`Confidence: ${recommendation.confidence}%`);
```

### API Endpoint Usage

```bash
curl -X POST http://localhost:3000/api/ai-quote/analyze \
  -H "Content-Type: application/json" \
  -d '{"domain": "github.com"}'

# Response:
{
  "success": true,
  "quote": {
    "tier": "sme",
    "tierDisplayName": "SME",
    "monthlyPrice": 1000,
    "confidence": 85,
    "estimatedCompletions": 2250,
    "reasoning": [...],
    "signals": {...},
    "features": {...},
    "savings": {...}
  },
  "intelligence": {...},
  "analysisTime": 28.4
}
```

## Data Collection Pipeline

### Phase 1: Website Data (FREE - Own Infrastructure)

Detects:
- Total pages (heuristic estimation or actual scrape)
- Product count
- Blog posts
- E-commerce platform (WooCommerce, Shopify, etc.)
- CMS detection
- Technology stack

**File:** `collectors/website-collector.ts`

### Phase 2: Company Data (FREE - Companies House API)

Requires: `COMPANIES_HOUSE_API_KEY` environment variable

Detects:
- Company name
- Employee count
- Annual revenue
- Industry (SIC code)
- Company status (active/dissolved)
- Location

**File:** `collectors/company-collector.ts`

**Getting API Key:**
1. Register at https://developer.company-information.service.gov.uk/
2. Create application
3. Copy API key to `.env.local`: `COMPANIES_HOUSE_API_KEY=your_key`

### Phase 3: Traffic Data (Algorithm-based)

Estimates monthly visitors using heuristic based on:
- Website size (page count)
- E-commerce products
- Blog presence

**File:** `collectors/traffic-collector.ts`

**Future integrations (optional):**
- Cloudflare Radar API (free but limited)
- SimilarWeb (paid - £200/month for accurate data)

### Phase 4: Domain Information (FREE)

Detects:
- Domain age
- Registrar
- Nameservers
- Creation/expiration dates

**File:** `collectors/domain-collector.ts`

## AI Analysis

### Model: GPT-4o-mini

**Reason for choice:**
- 80% cheaper than GPT-4o (~£0.002 vs £0.02 per quote)
- Sufficient intelligence for pricing logic
- Fast responses (<5 seconds typically)
- JSON-formatted output support

**Cost:** ~£0.02 per quote (1000 token limit)

### Analysis Process

1. **Collects business intelligence** from all sources (parallel)
2. **Builds comprehensive prompt** with all available data
3. **Sends to GPT-4o-mini** with JSON format requirement
4. **Parses response** to extract:
   - Recommended tier (small_business, sme, mid_market, enterprise)
   - Confidence score (0-100)
   - Estimated monthly completions
   - Reasoning for recommendation
   - Signal breakdown (traffic, employee, revenue, content, domain age)

**File:** `ai-analyzer.ts`

## Pricing Tiers

| Tier | Price | Conversations/Month | Target Traffic | Target Employees | Target Revenue |
|------|-------|-------------------|-----------------|------------------|-----------------|
| Small Business | £500 | 2,500 | 20k-100k | 5-15 | £500k-£2M |
| SME | £1,000 | 5,000 | 100k-500k | 15-50 | £2M-£10M |
| Mid-Market | £5,000 | 25,000 | 500k-2M | 50-250 | £10M-£50M |
| Enterprise | £10,000 | 100,000 | 2M+ | 250+ | £50M+ |

## Environment Variables

**Required:**
```bash
OPENAI_API_KEY=sk-...  # Your OpenAI API key
```

**Optional but recommended:**
```bash
COMPANIES_HOUSE_API_KEY=...  # Free API for UK company lookups
CLOUDFLARE_API_TOKEN=...     # For traffic estimation (optional)
SIMILARWEB_API_KEY=...        # For accurate traffic (£200/month)
WHOIS_API_KEY=...             # For domain info (optional)
```

## API Endpoint

**Route:** `POST /api/ai-quote/analyze`

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "quote": {
    "tier": "sme",
    "tierDisplayName": "SME",
    "monthlyPrice": 1000,
    "monthlyConversations": 5000,
    "confidence": 85,
    "estimatedCompletions": 2250,
    "reasoning": ["...", "..."],
    "signals": {
      "trafficSignal": "high",
      "employeeSignal": "medium",
      "revenueSignal": "medium",
      "contentSignal": "extensive",
      "domainAgeSignal": "established"
    },
    "features": {
      "unlimitedSeats": true,
      "unlimitedScraping": true,
      "woocommerce": true,
      "shopify": true,
      "prioritySupport": true,
      "advancedAnalytics": false,
      "slaUptime": "99.5%",
      "monthlyConversations": 5000
    },
    "savings": {
      "vsCSTeam": 5000,
      "percentageSavings": 85
    }
  },
  "intelligence": {
    "traffic": { "monthlyVisitors": 50000, "confidence": 60, "source": "estimated" },
    "company": { "name": "Example Ltd", "employeeCount": 15, "revenue": 3000000, "industry": "Retail" },
    "website": { "totalPages": 450, "productCount": 320, "hasBlog": true, "hasEcommerce": true }
  },
  "analysisTime": 28.4
}
```

**Error Responses:**
- `400`: Invalid or missing domain
- `429`: Rate limit exceeded (3 per hour per IP)
- `500`: Analysis failed

## Rate Limiting

**Limit:** 3 quotes per IP per hour

**Implementation:** In-memory rate limiting (development)

**Production:** Should migrate to Redis-backed rate limiting

**Files:** `app/api/ai-quote/analyze/route.ts`

## Testing

### Run Tests

```bash
# Unit tests
npm test -- ai-quote

# With API key (requires OPENAI_API_KEY)
OPENAI_API_KEY=sk-... npm test -- ai-quote

# Skip tests if API key not available
npm test -- ai-quote --skipIfNoApiKey
```

### Test Script

```bash
npx tsx scripts/ai-quote/test-quote-api.ts
```

Tests real domains like `github.com`, `wordpress.com`

**Files:**
- `__tests__/ai-quote/ai-quote-system.test.ts`
- `scripts/ai-quote/test-quote-api.ts`

## Cost Analysis

### Per Quote Cost

**Free tier (current):**
- Website scraping: £0 (own infrastructure)
- Companies House API: £0 (free)
- Traffic estimation: £0 (algorithm)
- Domain info: £0 (free WHOIS)
- GPT-4o-mini: £0.02 (1000 tokens)

**Total: £0.02 per quote**

### Volume Economics

- 100 quotes/day: £60/month
- 1,000 quotes/month: £20/month
- 10,000 quotes/month: £200/month

### ROI vs Traditional Sales

**Sales rep cost:** £3,000/month
**AI Quote cost:** £0.02 per quote
**Quote → Customer conversion:** 20%

**Cost per customer acquired:**
- Traditional: £375/customer
- AI Quote: £0.10/customer (at 20% conversion)

**Savings: 99%+ 🚀**

## Known Limitations

1. **Traffic estimation** is heuristic-based (60% confidence)
   - Solutions: Cloudflare Radar (free, limited) or SimilarWeb (paid)

2. **Company data** only works for UK companies
   - Solution: Integrate other company APIs for international

3. **Domain data** requires WHOIS which may timeout
   - Solution: Cache WHOIS results or use paid WHOIS service

4. **Rate limiting** is in-memory (loses on restart)
   - Solution: Migrate to Redis for production

## Future Improvements

- [ ] Cache quote results by domain (1-hour TTL)
- [ ] Add Redis-backed rate limiting
- [ ] Integrate SimilarWeb for accurate traffic
- [ ] Support for non-UK companies
- [ ] Confidence score breakdown by source
- [ ] A/B testing for tier recommendations
- [ ] Conversion tracking integration
- [ ] Multi-currency support

## Related Files

- Type definitions: `lib/ai-quote/types.ts`
- API endpoint: `app/api/ai-quote/analyze/route.ts`
- Architecture: `docs/01-ARCHITECTURE/ARCHITECTURE_AI_QUOTE_SYSTEM.md`
- Tests: `__tests__/ai-quote/ai-quote-system.test.ts`
