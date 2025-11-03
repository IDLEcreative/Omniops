# AI-Powered Quote System Architecture

**Type:** Architecture
**Status:** Active - Design Phase
**Last Updated:** 2025-11-03
**Verified For:** v0.2.0 (Not yet implemented)

## Purpose
Defines the architecture for the AI-powered instant quote system that analyzes businesses and recommends pricing tiers automatically. This system eliminates sales friction by providing instant, intelligent pricing recommendations based on business intelligence data.

## Quick Links
- [Pricing Model](ARCHITECTURE_PRICING_MODEL.md)
- [Pricing Page Content](../09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md)
- [OpenAI Integration](../06-INTEGRATIONS/INTEGRATION_OPENAI.md)

---

## Table of Contents
- [System Overview](#system-overview)
- [Data Collection Pipeline](#data-collection-pipeline)
- [AI Decision Engine](#ai-decision-engine)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [User Experience Flow](#user-experience-flow)
- [Cost Analysis](#cost-analysis)
- [Implementation Phases](#implementation-phases)

---

## System Overview

### Vision

**Input:** Domain name (e.g., "thompsonseparts.co.uk")
**Process:** 30-second AI analysis
**Output:** Recommended tier + justification + instant quote

### Key Benefits

**For Customers:**
- ✅ Instant quotes (no waiting for sales)
- ✅ No forms or lengthy calls
- ✅ Transparent, data-driven pricing
- ✅ Self-service onboarding

**For Business:**
- ✅ Infinite scalability (no sales team needed)
- ✅ Higher conversion (instant gratification)
- ✅ Lower CAC (£0.02 per quote vs £375 per sale)
- ✅ Consistent pricing (AI doesn't negotiate)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
│                                                                  │
│  1. Enter domain    2. Live analysis    3. Instant quote        │
│     ↓                   ↓                   ↓                    │
│  yoursite.com      [Progress bars]      Recommended:            │
│  [Get Quote]       Scanning...           SME - £1,000/month     │
│                    Analyzing...          [Accept] [Talk to Sales]│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND PIPELINE                              │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Collector  │────→│  AI Analyzer │────→│ Quote Engine │   │
│  │   Layer      │     │  (GPT-4)     │     │              │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                     │                     │           │
│         ↓                     ↓                     ↓           │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Data APIs   │     │  Prompt Eng  │     │  Confidence  │   │
│  │  - Scraping  │     │  - Context   │     │  - Score     │   │
│  │  - Companies │     │  - Analysis  │     │  - Reasoning │   │
│  │  - Traffic   │     │  - JSON Out  │     │  - Price     │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Collection Pipeline

### Phase 1: Website Data (FREE - Own Infrastructure)

**Data Points Collected:**
```typescript
interface WebsiteData {
  totalPages: number;          // How many pages found
  productCount: number;        // E-commerce products detected
  blogPostCount: number;       // Content marketing signal
  categories: string[];        // Product/service categories
  languages: string[];         // Multi-language = bigger business
  hasBlog: boolean;            // Content strategy signal
  hasEcommerce: boolean;       // Transactional vs informational
  technologies: {
    ecommercePlatform?: 'woocommerce' | 'shopify' | 'magento' | 'custom';
    cms?: string;
    frameworks: string[];
  };
}
```

**Implementation:**
```typescript
// lib/ai-quote/collectors/website-collector.ts

export async function collectWebsiteData(
  domain: string
): Promise<WebsiteData> {
  // Use existing scraper with limits
  const scrapeResult = await quickScrape(domain, {
    maxPages: 100,        // Don't scrape everything, just sample
    timeout: 15000,       // 15 seconds max
    includeProducts: true,
    includeBlog: true
  });

  const html = await fetchHomepage(domain);
  const headers = await fetchHeaders(domain);

  return {
    totalPages: scrapeResult.pagesFound,
    productCount: scrapeResult.products?.length || 0,
    blogPostCount: countBlogPosts(scrapeResult.pages),
    categories: extractCategories(scrapeResult),
    languages: detectLanguages(scrapeResult.pages),
    hasBlog: scrapeResult.pages.some(p => p.url.includes('/blog')),
    hasEcommerce: scrapeResult.products.length > 0,
    technologies: {
      ecommercePlatform: detectEcommerce(html),
      cms: detectCMS(html, headers),
      frameworks: detectFrameworks(html)
    }
  };
}

function detectEcommerce(html: string): string | undefined {
  if (html.includes('woocommerce')) return 'woocommerce';
  if (html.includes('Shopify.shop')) return 'shopify';
  if (html.includes('Magento')) return 'magento';
  if (html.includes('class="product"') || html.includes('add-to-cart')) return 'custom';
  return undefined;
}
```

---

### Phase 2: Company Data (FREE - Companies House API)

**Data Points Collected:**
```typescript
interface CompanyData {
  name: string;
  registrationNumber?: string;
  employeeCount?: number;       // From filing
  revenue?: number;              // Annual turnover
  industry?: string;             // SIC code
  foundedYear?: number;
  location?: string;
  companyStatus: 'active' | 'dissolved' | 'unknown';
}
```

**Implementation:**
```typescript
// lib/ai-quote/collectors/company-collector.ts

export async function collectCompanyData(
  domain: string
): Promise<CompanyData> {
  // Extract company name from domain or homepage
  const companyName = await extractCompanyName(domain);

  // Search UK Companies House (FREE API)
  try {
    const ukCompany = await searchCompaniesHouse(companyName);

    if (ukCompany) {
      return {
        name: ukCompany.company_name,
        registrationNumber: ukCompany.company_number,
        revenue: ukCompany.accounts?.last_accounts?.turnover,
        employeeCount: ukCompany.accounts?.last_accounts?.average_number_employees,
        industry: getSICDescription(ukCompany.sic_codes?.[0]),
        foundedYear: new Date(ukCompany.date_of_creation).getFullYear(),
        location: ukCompany.registered_office_address?.locality,
        companyStatus: ukCompany.company_status === 'active' ? 'active' : 'dissolved'
      };
    }
  } catch (error) {
    console.error('Companies House lookup failed:', error);
  }

  // Fallback: Extract from website
  return extractCompanyFromWebsite(domain);
}

async function searchCompaniesHouse(companyName: string) {
  const response = await fetch(
    `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(companyName)}`,
    {
      headers: {
        'Authorization': process.env.COMPANIES_HOUSE_API_KEY!
      }
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.items?.[0]; // Return best match
}
```

**Getting Companies House API Key:**
1. Register at https://developer.company-information.service.gov.uk/
2. Create application
3. Get free API key (unlimited requests!)
4. Add to `.env`: `COMPANIES_HOUSE_API_KEY=your_key_here`

---

### Phase 3: Traffic Data (FREE/CHEAP)

**Data Points Collected:**
```typescript
interface TrafficData {
  monthlyVisitors: number;
  source: 'cloudflare' | 'similarweb' | 'estimated';
  confidence: number;           // 0-100
  trend?: 'growing' | 'stable' | 'declining';
}
```

**Implementation Strategy:**

**Option A: Cloudflare Radar (FREE)**
```typescript
async function getCloudflareTraffic(domain: string) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/radar/http/timeseries_groups/browser/domain/${domain}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  // Returns relative traffic data (not absolute numbers)
  // Good for ranking but not precise visitor counts
}
```

**Option B: SimilarWeb (PAID - £200/month)**
```typescript
async function getSimilarWebTraffic(domain: string) {
  const response = await fetch(
    `https://api.similarweb.com/v1/website/${domain}/total-traffic`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.SIMILARWEB_API_KEY}`
      }
    }
  );

  const data = await response.json();
  return {
    monthlyVisitors: data.visits,
    confidence: 80
  };
}
```

**Option C: Estimate from Website Size (FREE)**
```typescript
function estimateTrafficFromSize(websiteData: WebsiteData): number {
  // Heuristic: Larger sites generally have more traffic
  const { totalPages, productCount, hasBlog } = websiteData;

  let estimate = 0;

  // Base estimate from page count
  if (totalPages < 50) estimate = 5000;
  else if (totalPages < 200) estimate = 20000;
  else if (totalPages < 1000) estimate = 100000;
  else if (totalPages < 5000) estimate = 500000;
  else estimate = 2000000;

  // Adjust for e-commerce (higher traffic)
  if (productCount > 100) estimate *= 1.5;
  if (productCount > 1000) estimate *= 2;

  // Adjust for blog (content marketing = SEO traffic)
  if (hasBlog) estimate *= 1.3;

  return Math.round(estimate);
}
```

**Recommendation:** Start with Option C (free estimates), upgrade to SimilarWeb when revenue justifies £200/month cost.

---

### Phase 4: Domain Information (FREE)

**Data Points Collected:**
```typescript
interface DomainData {
  domainAge: number;            // Years since registration
  registrar?: string;
  createdDate?: Date;
  expiresDate?: Date;
  nameservers?: string[];       // Cloudflare, AWS = professional
}
```

**Implementation:**
```typescript
// lib/ai-quote/collectors/domain-collector.ts

export async function collectDomainData(
  domain: string
): Promise<DomainData> {
  // Use WHOIS lookup
  const whois = await whoisLookup(domain);

  const domainAge = whois.createdDate
    ? (Date.now() - whois.createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    : 0;

  return {
    domainAge: Math.floor(domainAge),
    registrar: whois.registrar,
    createdDate: whois.createdDate,
    expiresDate: whois.expiresDate,
    nameservers: whois.nameServers
  };
}

// Use existing npm package
import whois from 'whois-json';

async function whoisLookup(domain: string) {
  try {
    return await whois(domain);
  } catch (error) {
    return { domainAge: 0 }; // Fallback
  }
}
```

---

### Consolidated Intelligence Object

```typescript
// lib/ai-quote/types.ts

export interface BusinessIntelligence {
  domain: string;
  collectedAt: Date;
  traffic: TrafficData;
  website: WebsiteData;
  company: CompanyData;
  domainInfo: DomainData;
}
```

---

## AI Decision Engine

### GPT-4 Analysis Prompt

```typescript
// lib/ai-quote/ai-analyzer.ts

export async function analyzeBusiness(
  intel: BusinessIntelligence
): Promise<PricingRecommendation> {

  const prompt = `You are a B2B SaaS pricing expert for an AI customer service platform. Analyze this business and recommend the optimal pricing tier.

## Business Intelligence

**Domain:** ${intel.domain}
**Monthly Traffic:** ${intel.traffic.monthlyVisitors.toLocaleString()} visitors (${intel.traffic.confidence}% confidence, source: ${intel.traffic.source})

**Website Analysis:**
- Total Pages: ${intel.website.totalPages}
- Products: ${intel.website.productCount}
- Blog Posts: ${intel.website.blogPostCount}
- E-commerce Platform: ${intel.website.technologies.ecommercePlatform || 'None'}
- Has Blog: ${intel.website.hasBlog ? 'Yes' : 'No'}

**Company Information:**
- Name: ${intel.company.name}
- Employees: ${intel.company.employeeCount || 'Unknown'}
- Annual Revenue: £${intel.company.revenue?.toLocaleString() || 'Unknown'}
- Industry: ${intel.company.industry || 'Unknown'}
- Founded: ${intel.company.foundedYear || 'Unknown'}
- Status: ${intel.company.companyStatus}

**Domain Age:** ${intel.domainInfo.domainAge} years

## Available Pricing Tiers

1. **Small Business** - £500/month
   - Includes: 2,500 completed conversations/month
   - Target: 20k-100k visitors/month, 5-15 employees, £500k-£2M revenue
   - Replaces: 1 part-time CS rep (£1,677/month cost)
   - Typical: Growing online shops, local businesses

2. **SME** - £1,000/month
   - Includes: 5,000 completed conversations/month
   - Target: 100k-500k visitors/month, 15-50 employees, £2M-£10M revenue
   - Replaces: 1.5-2 full-time CS reps (£6,708/month cost)
   - Typical: Established e-commerce, B2B businesses

3. **Mid-Market** - £5,000/month
   - Includes: 25,000 completed conversations/month
   - Target: 500k-2M visitors/month, 50-250 employees, £10M-£50M revenue
   - Replaces: 5-10 full-time CS reps (£16,770/month cost)
   - Typical: Large e-commerce, multi-brand retailers

4. **Enterprise** - £10,000/month
   - Includes: 100,000 completed conversations/month
   - Target: 2M+ visitors/month, 250+ employees, £50M+ revenue
   - Replaces: 15-30 full-time CS reps (£33,540/month cost)
   - Typical: Enterprise e-commerce, multi-nationals

## Analysis Guidelines

**Conversation Estimation:**
- Assume 5% of website visitors engage with chat widget
- Assume 90% of chats result in completed conversations
- Formula: monthlyVisitors × 0.05 × 0.90 = estimatedCompletions

**Tier Selection Logic:**
- Prioritize traffic data (most reliable signal)
- Consider employee count (indicates CS team size)
- Consider revenue (ability to pay)
- Consider website complexity (support needs)
- If data is missing, estimate conservatively

**Confidence Score:**
- High confidence (80-100): Strong signals across multiple dimensions
- Medium confidence (60-79): Some missing data but clear indicators
- Low confidence (40-59): Limited data, recommend starting tier

## Required Output

Respond with ONLY valid JSON in this exact format:

{
  "tier": "sme",
  "confidence": 85,
  "estimatedCompletions": 2250,
  "reasoning": [
    "50k monthly visitors suggests ~2,250 conversations/month (5% engagement × 90% completion)",
    "15 employees indicates small CS team that could be replaced",
    "WooCommerce store = active customer inquiries",
    "£3M revenue shows ability to invest in automation"
  ],
  "signals": {
    "trafficSignal": "high",
    "employeeSignal": "medium",
    "revenueSignal": "medium",
    "contentSignal": "extensive"
  }
}

Provide your analysis now:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3, // Lower temperature = more consistent
    max_tokens: 1000
  });

  const analysis = JSON.parse(response.choices[0].message.content!);

  // Map to full recommendation
  return {
    tier: analysis.tier,
    monthlyPrice: getTierPrice(analysis.tier),
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
    estimatedCompletions: analysis.estimatedCompletions,
    signals: analysis.signals,
    analyzedAt: new Date()
  };
}

function getTierPrice(tier: string): number {
  const prices = {
    small_business: 500,
    sme: 1000,
    mid_market: 5000,
    enterprise: 10000
  };
  return prices[tier] || 1000; // Default to SME
}
```

---

## API Endpoints

### POST /api/ai-quote/analyze

**Purpose:** Analyze a domain and return pricing recommendation

**Request:**
```typescript
{
  "domain": "thompsonseparts.co.uk"
}
```

**Response:**
```typescript
{
  "success": true,
  "quote": {
    "tier": "sme",
    "tierDisplayName": "SME",
    "monthlyPrice": 1000,
    "confidence": 85,
    "estimatedCompletions": 2250,
    "reasoning": [
      "50k monthly visitors suggests ~2,250 conversations/month",
      "15 employees indicates small CS team",
      "WooCommerce store = active customer inquiries"
    ],
    "signals": {
      "trafficSignal": "high",
      "employeeSignal": "medium",
      "revenueSignal": "medium",
      "contentSignal": "extensive"
    },
    "features": {
      "unlimitedSeats": true,
      "unlimitedScraping": true,
      "woocommerce": true,
      "shopify": true,
      "prioritySupport": true,
      "advancedAnalytics": true
    },
    "savings": {
      "vsCSTeam": 5708,
      "percentageSavings": 85
    }
  },
  "intelligence": {
    "traffic": { monthlyVisitors: 50000, confidence: 70 },
    "company": { employees: 15, revenue: 3000000 },
    "website": { totalPages: 450, productCount: 320 }
  },
  "analysisTime": 28.4 // seconds
}
```

**Implementation:**
```typescript
// app/api/ai-quote/analyze/route.ts

import { collectBusinessIntelligence } from '@/lib/ai-quote/data-collector';
import { analyzeBusiness } from '@/lib/ai-quote/ai-analyzer';

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Step 1: Collect intelligence (parallel)
    const intel = await collectBusinessIntelligence(domain);

    // Step 2: AI analysis
    const quote = await analyzeBusiness(intel);

    // Step 3: Save quote to database
    await saveQuote({
      domain,
      intelligence: intel,
      recommendation: quote
    });

    const analysisTime = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        tierDisplayName: getTierDisplayName(quote.tier),
        features: getTierFeatures(quote.tier),
        savings: calculateSavings(quote.monthlyPrice)
      },
      intelligence: {
        traffic: intel.traffic,
        company: intel.company,
        website: intel.website
      },
      analysisTime
    });

  } catch (error) {
    console.error('Quote analysis failed:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## Database Schema

### Quote History Table

```sql
CREATE TABLE ai_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,

  -- Intelligence collected
  intelligence JSONB NOT NULL, -- Full BusinessIntelligence object

  -- AI recommendation
  recommended_tier TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  confidence INTEGER NOT NULL,
  estimated_completions INTEGER NOT NULL,
  reasoning JSONB NOT NULL, -- Array of reasons

  -- Metadata
  analysis_duration_ms INTEGER,
  gpt_tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Conversion tracking
  accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  converted_to_customer_id UUID REFERENCES organizations(id),

  -- IP tracking (prevent abuse)
  requester_ip INET,
  user_agent TEXT
);

CREATE INDEX idx_quotes_domain ON ai_quotes(domain);
CREATE INDEX idx_quotes_created ON ai_quotes(created_at DESC);
CREATE INDEX idx_quotes_conversion ON ai_quotes(accepted) WHERE accepted = true;
CREATE INDEX idx_quotes_ip ON ai_quotes(requester_ip);
```

### Rate Limiting (Prevent Abuse)

```sql
-- Limit: 3 quotes per IP per hour
CREATE TABLE quote_rate_limits (
  ip INET PRIMARY KEY,
  quote_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_limit CHECK (quote_count <= 3)
);

-- Auto-reset after 1 hour
CREATE OR REPLACE FUNCTION reset_quote_limits()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM quote_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
$$;
```

---

## User Experience Flow

### Step 1: Landing Page

```tsx
// app/get-quote/page.tsx

export default function GetQuotePage() {
  const [domain, setDomain] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-quote/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setQuote(data.quote);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          Get Your AI-Powered Quote in 30 Seconds
        </h1>
        <p className="text-xl text-gray-600">
          No forms. No calls. No waiting. Just enter your domain and our AI
          analyzes your business to recommend the perfect plan.
        </p>
      </div>

      {/* Input */}
      {!quote && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="yourwebsite.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg text-lg"
              disabled={analyzing}
            />
            <button
              onClick={handleAnalyze}
              disabled={!domain || analyzing}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Get Instant Quote'}
            </button>
          </div>
          {error && (
            <p className="text-red-600 mt-4">❌ {error}</p>
          )}
        </div>
      )}

      {/* Live Analysis */}
      {analyzing && <LiveAnalysisAnimation />}

      {/* Quote Result */}
      {quote && <QuoteResultDisplay quote={quote} domain={domain} />}
    </div>
  );
}
```

### Step 2: Live Analysis Animation

```tsx
function LiveAnalysisAnimation() {
  const [step, setStep] = useState(0);

  const steps = [
    { icon: '🌐', label: 'Scanning website structure', duration: 5000 },
    { icon: '📊', label: 'Analyzing traffic patterns', duration: 5000 },
    { icon: '🏢', label: 'Looking up company information', duration: 5000 },
    { icon: '🔍', label: 'Detecting technology stack', duration: 5000 },
    { icon: '🤖', label: 'AI calculating optimal pricing', duration: 8000 }
  ];

  useEffect(() => {
    if (step < steps.length - 1) {
      const timer = setTimeout(() => {
        setStep(s => s + 1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="bg-gray-50 rounded-xl p-8 space-y-4">
      {steps.map((s, i) => (
        <div key={i} className={`flex items-center gap-4 transition-opacity ${i > step ? 'opacity-30' : 'opacity-100'}`}>
          <span className="text-3xl">{s.icon}</span>
          <span className={`text-lg ${i === step ? 'font-semibold animate-pulse' : ''}`}>
            {s.label}
          </span>
          {i < step && <CheckCircle className="text-green-600 ml-auto" />}
          {i === step && <Loader2 className="animate-spin ml-auto text-blue-600" />}
        </div>
      ))}
    </div>
  );
}
```

---

## Cost Analysis

### API Costs

**Free Tier (Start Here):**
```
✅ Website scraping: Own infrastructure (£0)
✅ Companies House API: Free unlimited (£0)
✅ WHOIS lookups: Free (£0)
✅ Traffic estimation: Algorithm (£0)
✅ GPT-4 analysis: ~£0.02 per quote

Total per quote: £0.02
100 quotes/day: £60/month
1,000 quotes/month: £20/month
```

**Paid Tier (Scale Later):**
```
+ SimilarWeb: £200/month (accurate traffic data)
+ Clearbit: £99/month (company enrichment)
+ LinkedIn API: £20/month (employee counts)

Total: £319/month + £0.02 per quote
Still 90% cheaper than one sales rep (£3,000/month)
```

### ROI Calculation

**Traditional Sales Model:**
- Sales rep salary: £3,000/month
- Handles: ~40 qualified leads/month
- Close rate: 20% = 8 customers
- **Cost per customer: £375**

**AI Quote Model:**
- API costs: £60-400/month
- Handles: Unlimited quotes
- Close rate: 25% (faster = better)
- **Cost per customer: £1-2**

**Savings: 99%+ 🚀**

---

## Implementation Phases

### Phase 1: MVP (Week 1) - FREE APIs Only

**Goal:** Working quote system with zero paid API costs

**Tasks:**
- [ ] Implement website scraper integration
- [ ] Companies House API integration
- [ ] Traffic estimation algorithm
- [ ] GPT-4 analysis prompt engineering
- [ ] Basic quote page UI
- [ ] Database schema for quotes
- [ ] Rate limiting (3 per IP/hour)

**Cost:** £0.02 per quote (GPT-4 only)

---

### Phase 2: Enhanced UX (Week 2)

**Goal:** Professional user experience

**Tasks:**
- [ ] Live analysis animation
- [ ] Signal visualizations
- [ ] Confidence score display
- [ ] Multi-domain quote calculator
- [ ] Email quote delivery
- [ ] Quote history for returning users

**Cost:** Same (£0.02 per quote)

---

### Phase 3: Paid APIs (Week 3+)

**Goal:** Higher accuracy when revenue justifies

**Tasks:**
- [ ] SimilarWeb integration (£200/month)
- [ ] Clearbit integration (£99/month)
- [ ] A/B test accuracy improvement
- [ ] ROI analysis on paid data

**Cost:** £319/month + £0.02 per quote

---

### Phase 4: Optimization (Ongoing)

**Goal:** Continuous improvement

**Tasks:**
- [ ] Track conversion rates by confidence score
- [ ] A/B test prompt variations
- [ ] Monitor quote acceptance rate
- [ ] Refine tier boundaries
- [ ] Add industry-specific logic

---

## Security & Abuse Prevention

### Rate Limiting
- 3 quotes per IP per hour
- Block known VPN/proxy IPs
- Require email for quote delivery (light verification)

### Data Privacy
- Don't store personal data from scraping
- GDPR compliant (business data only)
- Allow quote deletion on request

### Cost Protection
- Cap GPT-4 tokens at 1,000 per request
- Cache duplicate domain requests (1 hour TTL)
- Alert if daily GPT costs exceed £50

---

## Success Metrics

### Conversion Funnel
1. Visitors to quote page
2. Domains analyzed
3. Quotes generated
4. Quotes accepted
5. Converted to customers

**Target Metrics:**
- Analysis success rate: >95%
- Quote confidence: >70% average
- Acceptance rate: >15%
- Conversion rate: >20%

### Quality Metrics
- Confidence score distribution
- Tier recommendation accuracy
- Customer satisfaction with quote
- Support tickets about pricing

---

## Related Documentation

- [Pricing Model Architecture](ARCHITECTURE_PRICING_MODEL.md)
- [Pricing Page Content](../09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md)
- [OpenAI Integration](../06-INTEGRATIONS/INTEGRATION_OPENAI.md)
- [Stripe Billing Integration](../06-INTEGRATIONS/INTEGRATION_STRIPE_BILLING.md)
