# Dashboard Implementation Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Telemetry System](../01-ARCHITECTURE/TELEMETRY_SYSTEM.md)
- [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- React 19.1.0, Next.js 15.4.3, shadcn/ui, Recharts
**Estimated Read Time:** 102 minutes

## Purpose
Complete implementation blueprint for connecting the existing analytics dashboard UI (currently mock data) to 9 production-ready API endpoints with live telemetry tracking. Includes 4-phase roadmap, component specifications, TypeScript hooks, cost visualization components, and performance optimization strategies for transforming static dashboard into real-time AI spending and performance monitor.

## Quick Links
- [Current State Analysis](#current-state-analysis)
- [Data Architecture](#data-architecture)
- [API Endpoints Reference](#api-endpoints-reference)
- [Implementation Roadmap](#implementation-roadmap)
- [Component Specifications](#component-specifications)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Integration Guide](#integration-guide)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)

## Keywords
dashboard implementation, analytics API, telemetry integration, cost tracking, real-time monitoring, React hooks, data visualization, component architecture, useTelemetry hook, useAnalytics hook, LiveCostTicker, CostTrendChart, ModelComparisonCard, API integration, performance optimization, shadcn/ui components, dashboard UI development, Recharts integration

## Aliases
- "dashboard" (also known as: admin dashboard, analytics interface, control panel, management dashboard)
- "telemetry" (also known as: usage metrics, AI tracking, chat analytics, performance data)
- "cost tracking" (also known as: spend monitoring, budget tracking, usage billing, cost analytics)
- "API endpoints" (also known as: backend routes, data services, REST APIs, data endpoints)
- "React hooks" (also known as: custom hooks, data fetching hooks, state management hooks)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Data Architecture](#data-architecture)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Component Specifications](#component-specifications)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Integration Guide](#integration-guide)
9. [Testing Strategy](#testing-strategy)
10. [Performance Considerations](#performance-considerations)

---

## Executive Summary

### What We Have

The Omniops platform has a **complete, production-grade telemetry infrastructure** with:
- ✅ 9 fully functional API endpoints serving real-time and historical data
- ✅ Comprehensive chat telemetry system tracking every AI interaction
- ✅ Cost tracking with automatic USD calculation per request
- ✅ Multi-tenant domain-based analytics
- ✅ Real-time session monitoring with live metrics
- ✅ Business intelligence (missing products, demand analysis)

### What's Missing

The **dashboard UI** is built but uses **100% mock data**. The connection between the powerful backend and the beautiful frontend needs to be established.

### Estimated Implementation Time

- **Phase 1** (Core Metrics): 4-6 hours
- **Phase 2** (Cost Analytics): 6-8 hours
- **Phase 3** (Business Intelligence): 4-6 hours
- **Phase 4** (Real-Time Features): 8-10 hours
- **Total**: 22-30 hours (3-4 days of focused work)

---

## Current State Analysis

### Dashboard Pages

#### 1. Main Dashboard (`app/dashboard/page.tsx`)

**Current Status:** Mock data only
**Components:**
- Stats grid (4 cards): Conversations, Users, Response Time, Resolution Rate
- Performance overview chart (placeholder)
- Recent conversations feed (static data)
- AI insights widget (hardcoded suggestions)
- Bot status panel (fixed values)
- Language distribution (mock percentages)
- Quick actions toolbar (functional links)

**Lines of Code:** 483
**UI Framework:** shadcn/ui components
**State Management:** React useState hooks

#### 2. Analytics Dashboard (`app/dashboard/analytics/page.tsx`)

**Current Status:** Mock data only
**Components:**
- 5-tab layout: Overview, Conversations, Performance, Customers, AI Insights
- Key metrics cards (4 cards with trends)
- Top queries analysis (static list)
- Conversation status breakdown (hardcoded)
- Language distribution (mock data)
- Performance metrics (accuracy, escalation, FCR)
- Customer segments visualization

**Lines of Code:** 502
**UI Framework:** shadcn/ui with Tabs component
**Chart Placeholders:** Ready for integration

### API Endpoints (All Production-Ready)

| Endpoint | Status | Data Type | Response Time | Cache |
|----------|--------|-----------|---------------|-------|
| `/api/dashboard/telemetry` | ✅ Live | Real-time + Historical | ~200-500ms | None |
| `/api/dashboard/analytics` | ✅ Live | Computed metrics | ~300-800ms | None |
| `/api/dashboard/conversations` | ✅ Live | Database queries | ~100-300ms | None |
| `/api/dashboard/missing-products` | ✅ Live | AI-analyzed data | ~500-1000ms | None |
| `/api/dashboard/woocommerce` | ✅ Live | E-commerce stats | ~200-400ms | None |
| `/api/dashboard/scraped` | ✅ Live | Content indexing | ~150-350ms | None |
| `/api/dashboard/config` | ✅ Live | Configuration | ~50-100ms | None |
| `/api/dashboard/test-connection` | ✅ Live | Health check | ~20-50ms | None |
| `/api/monitoring/chat` | ✅ Live | Extended telemetry | ~300-600ms | None |

### Data Loader Component (`components/dashboard/dashboard-data-loader.tsx`)

**Current Status:** Functional but unused
**Features:**
- Parallel API fetching with `Promise.allSettled`
- Auto-refresh every 30 seconds
- Error handling with partial data display
- Loading skeleton states
- TypeScript interfaces for all data types

**Performance:** Fetches 4 endpoints in ~800ms (parallel execution)

---

## Data Architecture

### Telemetry Collection Flow

```
User Chat Request
    ↓
ChatTelemetry.createSession()
    ↓
[Track Iterations + Searches + Tokens]
    ↓
ChatTelemetry.complete()
    ↓
Persist to chat_telemetry table
    ↓
Available via /api/dashboard/telemetry
```

### Database Schema (Relevant Tables)

#### `chat_telemetry`
**Purpose:** Stores every AI chat session with full metrics

| Column | Type | Description | Indexed |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | ✅ |
| `session_id` | TEXT | Unique session identifier | ✅ |
| `model` | TEXT | AI model used (gpt-4, gpt-5-mini) | ✅ |
| `start_time` | TIMESTAMPTZ | Session start timestamp | ✅ |
| `end_time` | TIMESTAMPTZ | Session end timestamp | ❌ |
| `duration_ms` | INTEGER | Total duration in milliseconds | ✅ |
| `iterations` | INTEGER | Number of AI reasoning cycles | ❌ |
| `search_count` | INTEGER | Number of searches performed | ✅ |
| `total_results` | INTEGER | Sum of all search results | ❌ |
| `searches` | JSONB | Array of search operations | ✅ (GIN) |
| `input_tokens` | INTEGER | Tokens sent to AI | ❌ |
| `output_tokens` | INTEGER | Tokens received from AI | ❌ |
| `total_tokens` | INTEGER | Generated: input + output | ❌ |
| `cost_usd` | NUMERIC(10,6) | Calculated cost in USD | ✅ |
| `success` | BOOLEAN | Whether session succeeded | ✅ |
| `error` | TEXT | Error message if failed | ❌ |
| `domain` | TEXT | Customer domain | ✅ |
| `logs` | JSONB | Structured log entries | ✅ (GIN) |
| `created_at` | TIMESTAMPTZ | Record creation time | ✅ DESC |

**Indexes:** 11 total for optimal query performance
**Retention:** 30 days (auto-cleanup via `cleanup_old_telemetry()`)
**Triggers:** `auto_calculate_cost_trigger` (calculates `cost_usd` on insert)

#### `conversations`
**Purpose:** Tracks customer conversations

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_at` | TIMESTAMPTZ | Conversation start |
| `updated_at` | TIMESTAMPTZ | Last activity |
| `metadata` | JSONB | Additional context |

**Related:** Links to `messages` table via `conversation_id`

#### `messages`
**Purpose:** Individual chat messages

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `conversation_id` | UUID | FK to conversations |
| `role` | TEXT | 'user' or 'assistant' |
| `content` | TEXT | Message text |
| `created_at` | TIMESTAMPTZ | Message timestamp |
| `metadata` | JSONB | Extra data |

#### `structured_extractions`
**Purpose:** Scraped and parsed content (products, FAQs, contact info)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `extraction_type` | TEXT | 'products', 'faq', 'contact' |
| `data` | JSONB | Extracted structured data |
| `domain` | TEXT | Source domain |

#### `scraped_pages`
**Purpose:** Raw scraped website content

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `url` | TEXT | Page URL |
| `domain` | TEXT | Domain name |
| `content` | TEXT | Extracted text content |
| `content_length` | INTEGER | Character count |
| `scraped_at` | TIMESTAMPTZ | Scraping timestamp |

#### `page_embeddings`
**Purpose:** Vector embeddings for semantic search

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `page_id` | UUID | FK to scraped_pages |
| `chunk_index` | INTEGER | Chunk number |
| `embedding` | VECTOR(1536) | OpenAI embedding |
| `content_preview` | TEXT | Chunk text preview |

---

## API Endpoints Reference

### 1. `/api/dashboard/telemetry`

**Purpose:** Primary AI performance and cost analytics endpoint
**Method:** GET
**Authentication:** Service role (automatic in Next.js API routes)

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 7 | Number of days to query |
| `domain` | string | null | Filter by specific domain |

#### Response Schema

```typescript
{
  overview: {
    totalRequests: number;              // Total chat requests
    successfulRequests: number;         // Successful completions
    failedRequests: number;             // Failed sessions
    successRate: number;                // Percentage (0-100)
    errorRate: number;                  // Percentage (0-100)
    activeSessions: number;             // Live sessions right now
    timeRange: string;                  // e.g., "Last 7 days"
  };

  cost: {
    total: string;                      // Total cost in USD (formatted)
    average: string;                    // Avg cost per request
    projectedDaily: string;             // 24-hour projection
    projectedMonthly: string;           // 30-day projection
    perHour: string;                    // Hourly rate
    trend: 'increasing' | 'decreasing' | 'stable';
  };

  tokens: {
    totalInput: number;                 // Sum of input tokens
    totalOutput: number;                // Sum of output tokens
    total: number;                      // Combined total
    avgPerRequest: number;              // Average tokens per request
  };

  performance: {
    avgResponseTime: number;            // Average duration (ms)
    totalSearches: number;              // Sum of all searches
    avgSearchesPerRequest: string;      // Average searches per chat
    avgIterations: string;              // Average AI reasoning cycles
  };

  modelUsage: Array<{
    model: string;                      // e.g., "gpt-4-turbo"
    count: number;                      // Number of requests
    cost: string;                       // Total cost for this model
    tokens: number;                     // Total tokens used
    percentage: number;                 // Percentage of total requests
  }>;

  domainBreakdown: Array<{
    domain: string;                     // Customer domain
    requests: number;                   // Number of requests
    cost: string;                       // Total cost for domain
  }>;

  hourlyTrend: Array<{
    hour: string;                       // ISO timestamp (hourly)
    cost: number;                       // Cost during this hour
    requests: number;                   // Requests during this hour
  }>;

  live: {
    activeSessions: number;             // Current active sessions
    currentCost: string;                // Cost of active sessions
    sessionsData: Array<{
      id: string;                       // Session ID
      uptime: number;                   // Seconds active
      cost: string;                     // Current cost
      model: string;                    // AI model
    }>;
  };
}
```

#### Example Usage

```typescript
// Fetch last 7 days of telemetry
const response = await fetch('/api/dashboard/telemetry?days=7');
const data = await response.json();

console.log(`Total cost: $${data.cost.total}`);
console.log(`Success rate: ${data.overview.successRate}%`);
console.log(`Active sessions: ${data.live.activeSessions}`);
```

#### Cost Calculation Logic

Costs are automatically calculated by the database trigger `auto_calculate_cost_trigger` using model-specific pricing:

```typescript
// Pricing per 1M tokens (from lib/chat-telemetry.ts:69-76)
{
  'gpt-5-mini': { input: $0.25, output: $2.00 },
  'gpt-4-turbo': { input: $10.00, output: $30.00 },
  'gpt-4': { input: $30.00, output: $60.00 },
  'gpt-3.5-turbo': { input: $0.50, output: $1.50 }
}
```

**Formula:**
```
cost_usd = (input_tokens / 1,000,000 × input_price) +
           (output_tokens / 1,000,000 × output_price)
```

---

### 2. `/api/dashboard/analytics`

**Purpose:** Sentiment analysis, satisfaction scoring, and behavioral metrics
**Method:** GET

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 7 | Analysis period |

#### Response Schema

```typescript
{
  responseTime: number;                 // Avg response time (seconds)
  satisfactionScore: number;            // Score 1-5 based on sentiment
  resolutionRate: number;               // Percentage (0-100)

  topQueries: Array<{
    query: string;                      // Query text (truncated to 50 chars)
    count: number;                      // Number of occurrences
    percentage: number;                 // % of total queries
  }>;

  failedSearches: string[];             // Queries that returned no results

  languageDistribution: Array<{
    language: string;                   // English, Spanish, French, German, Other
    percentage: number;                 // Percentage of conversations
    color: string;                      // CSS color class
  }>;

  metrics: {
    totalMessages: number;              // All messages in period
    userMessages: number;               // User messages only
    avgMessagesPerDay: number;          // Daily average
  };
}
```

#### Sentiment Analysis Algorithm

The endpoint uses pattern matching to calculate satisfaction scores:

**Positive indicators:** thank, great, perfect, awesome, helpful, excellent, good, works
**Negative indicators:** not work, error, wrong, bad, issue, problem, broken, fail

**Formula:**
```typescript
sentiment = (positiveCount - negativeCount) / totalUserMessages
satisfactionScore = max(1, min(5, 3 + (sentiment × 2)))
```

**Range:** 1.0 (very negative) to 5.0 (very positive)

#### Language Detection

Simple pattern-based detection:
- **Spanish:** hola, gracias, ayuda, necesito, producto
- **French:** bonjour, merci, aide, besoin, produit
- **German:** hallo, danke, hilfe, brauche, produkt
- **English:** Default if no patterns match

---

### 3. `/api/dashboard/conversations`

**Purpose:** Conversation count and recent activity
**Method:** GET

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 7 | Period for counting |

#### Response Schema

```typescript
{
  total: number;                        // Total conversations in period
  change: number;                       // % change vs previous period
  recent: Array<{
    id: string;                         // Conversation UUID
    message: string;                    // First user message (100 chars)
    timestamp: string;                  // ISO timestamp
  }>;
}
```

#### Example

```typescript
{
  total: 1247,
  change: 12.5,  // +12.5% vs previous 7 days
  recent: [
    {
      id: "abc123",
      message: "Do you have hydraulic pump filters in stock?",
      timestamp: "2025-01-19T14:30:00Z"
    }
  ]
}
```

---

### 4. `/api/dashboard/missing-products`

**Purpose:** Business intelligence - identify products customers want but you don't have
**Method:** GET

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 30 | Analysis period |

#### Response Schema

```typescript
{
  missingProducts: Array<{
    name: string;                       // Extracted product name
    count: number;                      // Times requested
    lastRequested: string;              // ISO timestamp
    examples: string[];                 // Sample queries (max 3)
  }>;

  statistics: {
    totalMissingProducts: number;       // Unique products identified
    totalRequests: number;              // Sum of all requests
    avgRequestsPerProduct: number;      // Average demand per product
    timeRange: string;                  // e.g., "Last 30 days"
  };

  categories: {
    tools: string[];                    // Tools category (top 5)
    parts: string[];                    // Parts category (top 5)
    equipment: string[];                // Equipment category (top 5)
    other: string[];                    // Uncategorized (top 5)
  };

  recommendations: string[];            // AI-generated action items (max 4)
}
```

#### Product Extraction Algorithm

The endpoint uses multiple regex patterns to extract product names from failed searches:

```typescript
[
  /looking for (.+?)(?:\.|,|$)/gi,
  /do you have (.+?)(?:\?|$)/gi,
  /need (?:a |an |some )?(.+?)(?:\.|,|$)/gi,
  /searching for (.+?)(?:\.|,|$)/gi,
  /(.+?) (?:products?|items?|parts?)/gi,
  /show me (.+?)(?:\.|,|$)/gi,
  /where (?:is|are) (?:the )?(.+?)(?:\?|$)/gi
]
```

**Fallback:** If no pattern matches, extracts keywords (length > 3, excluding common words)

#### Category Detection

Simple keyword-based categorization:
- **Tools:** tool, wrench, hammer, drill
- **Parts:** part, filter, belt, bearing
- **Equipment:** pump, motor, compressor, generator
- **Other:** Everything else

#### Business Value

This is **unique competitive intelligence**. You can:
1. Identify market gaps before competitors
2. Make data-driven inventory decisions
3. Predict demand for new product lines
4. Prioritize product additions by request frequency

---

### 5. `/api/dashboard/woocommerce`

**Purpose:** E-commerce integration statistics
**Method:** GET

#### Response Schema

```typescript
{
  totalProducts: number;                // Unique products indexed
  totalOrders: number;                  // Estimated orders (mock)
  revenue: number;                      // Estimated revenue (mock)

  abandonedCarts: {
    count: number;                      // Number of abandoned carts
    value: number;                      // Total value in USD
  };

  statistics: {
    avgProductPrice: number;            // Average price across catalog
    configuredDomains: number;          // Domains with WooCommerce
    productsIndexed: number;            // Products in structured_extractions
  };

  status: 'active' | 'not_configured' | 'error';
  domains: string[];                    // List of configured domains
}
```

#### Notes

- **Orders and Revenue:** Currently estimated/mocked (placeholder for future WooCommerce API integration)
- **Abandoned Carts:** Real data if `woocommerce_abandoned_carts` table has entries
- **Product Data:** Pulled from `structured_extractions` table with type='products'

---

### 6. `/api/dashboard/scraped`

**Purpose:** Content indexing and scraping statistics
**Method:** GET

#### Response Schema

```typescript
{
  totalPages: number;                   // Total scraped pages
  lastUpdated: string;                  // ISO timestamp of last scrape
  queuedJobs: number;                   // Pending scraping jobs

  statistics: {
    uniqueDomains: number;              // Number of distinct domains
    totalEmbeddings: number;            // Vector embeddings generated
    avgContentLength: number;           // Average page length (chars)
    embeddingCoverage: number;          // % of pages with embeddings
  };

  domains: string[];                    // Top 5 domains by page count
}
```

#### Embedding Coverage

**Formula:**
```typescript
embeddingCoverage = (totalEmbeddings / totalPages) × 100
```

**Target:** 100% (every page should have embeddings for semantic search)

---

### 7. `/api/monitoring/chat`

**Purpose:** Extended telemetry with additional analytics (superset of `/api/dashboard/telemetry`)
**Method:** GET, POST

#### GET Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | 'day' | 'hour', 'day', 'week', 'month' |
| `domain` | string | null | Filter by domain |
| `model` | string | null | Filter by model |
| `includeDetails` | boolean | false | Include raw telemetry |
| `includeLive` | boolean | true | Include live sessions |

#### POST Actions

```typescript
// Set cost alert
POST /api/monitoring/chat
{
  "action": "set-alert",
  "domain": "example.com",
  "alert_type": "daily",
  "threshold_usd": 50.00
}

// Check alerts
POST /api/monitoring/chat
{ "action": "check-alerts", "domain": "example.com" }

// Get cost summary
POST /api/monitoring/chat
{
  "action": "get-summary",
  "domain": "example.com",
  "days": 7
}

// Cleanup old data (30+ days)
POST /api/monitoring/chat
{ "action": "cleanup-old-data" }
```

---

## Implementation Roadmap

### Phase 1: Core Metrics Connection (Week 1)

**Goal:** Replace mock data with real telemetry in main dashboard

**Tasks:**
1. Create React hook `useTelemetry()` for data fetching
2. Replace stats grid with real data from `/api/dashboard/telemetry`
3. Update conversation count from `/api/dashboard/conversations`
4. Connect analytics data to performance cards
5. Add loading and error states

**Deliverables:**
- ✅ Main dashboard displays real metrics
- ✅ Auto-refresh every 30 seconds
- ✅ Proper error handling with fallbacks

**Files to Modify:**
- `app/dashboard/page.tsx` (483 lines)
- Create `hooks/useTelemetry.ts` (new file)
- Create `hooks/useAnalytics.ts` (new file)

**Estimated Time:** 4-6 hours

---

### Phase 2: Cost Analytics Dashboard (Week 2)

**Goal:** Build comprehensive cost tracking and visualization

**Tasks:**
1. Create new page: `app/dashboard/costs/page.tsx`
2. Build cost trend chart (hourly breakdown)
3. Create model comparison component
4. Implement domain cost allocation table
5. Add budget alert configuration UI
6. Build live cost ticker widget

**Deliverables:**
- ✅ Dedicated cost analytics page
- ✅ Real-time cost tracking
- ✅ Model performance comparison
- ✅ Per-domain billing breakdown
- ✅ Visual budget threshold alerts

**Components to Build:**
```
components/dashboard/
├── CostTrendChart.tsx          (Line chart with hourly data)
├── ModelComparisonCard.tsx     (Bar chart + table)
├── DomainCostTable.tsx         (Sortable table with search)
├── BudgetAlertsPanel.tsx       (Alert configuration + status)
└── LiveCostTicker.tsx          (Real-time pulsing indicator)
```

**Estimated Time:** 6-8 hours

---

### Phase 3: Business Intelligence (Week 3)

**Goal:** Surface actionable insights for business decisions

**Tasks:**
1. Build missing products widget with recommendations
2. Create conversation quality dashboard
3. Implement AI performance panel
4. Add satisfaction trend tracking
5. Build demand forecasting visualization

**Deliverables:**
- ✅ Missing products intelligence widget
- ✅ Conversation quality metrics
- ✅ AI agent performance tracking
- ✅ Customer satisfaction trends
- ✅ Demand prediction charts

**Components to Build:**
```
components/dashboard/
├── MissingProductsWidget.tsx   (List + recommendations)
├── ConversationQualityCard.tsx (Quality metrics)
├── AIPerformancePanel.tsx      (Agent efficiency)
├── SatisfactionTrendChart.tsx  (Line chart over time)
└── DemandForecastCard.tsx      (Predictive analytics)
```

**Estimated Time:** 4-6 hours

---

### Phase 4: Real-Time Features (Week 4)

**Goal:** Add live monitoring and interactive features

**Tasks:**
1. Build live session monitoring panel
2. Create real-time cost tracker
3. Implement WebSocket for live updates (optional)
4. Add interactive filtering and date range selection
5. Build export functionality (CSV/JSON)
6. Create alert notification system

**Deliverables:**
- ✅ Live session monitoring with details
- ✅ Real-time cost updates (no refresh needed)
- ✅ Interactive data filtering
- ✅ Export dashboards to CSV/JSON
- ✅ Push notifications for alerts

**Components to Build:**
```
components/dashboard/
├── LiveSessionsPanel.tsx       (Active chats)
├── SessionDetailsModal.tsx     (Drill-down view)
├── DataExportButton.tsx        (Download data)
├── AlertNotification.tsx       (Toast notifications)
└── DateRangePicker.tsx         (Custom period selector)
```

**Estimated Time:** 8-10 hours

---

## Component Specifications

### Core Hooks

#### `hooks/useTelemetry.ts`

**Purpose:** Fetch and manage telemetry data with auto-refresh

```typescript
import { useState, useEffect } from 'react';

interface UseTelemetryOptions {
  days?: number;
  domain?: string;
  refreshInterval?: number; // milliseconds
  enabled?: boolean;
}

export function useTelemetry(options: UseTelemetryOptions = {}) {
  const {
    days = 7,
    domain,
    refreshInterval = 30000, // 30 seconds
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.set('days', days.toString());
        if (domain) params.set('domain', domain);

        const response = await fetch(`/api/dashboard/telemetry?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Telemetry fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up auto-refresh
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [days, domain, refreshInterval, enabled]);

  return { data, loading, error };
}
```

**Usage:**
```typescript
function DashboardPage() {
  const { data, loading, error } = useTelemetry({ days: 7 });

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div>
      <h1>Total Cost: ${data.cost.total}</h1>
      <p>Success Rate: {data.overview.successRate}%</p>
    </div>
  );
}
```

---

#### `hooks/useAnalytics.ts`

**Purpose:** Fetch analytics and sentiment data

```typescript
import { useState, useEffect } from 'react';

interface UseAnalyticsOptions {
  days?: number;
  enabled?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { days = 7, enabled = true } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/dashboard/analytics?days=${days}`);
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days, enabled]);

  return { data, loading, error };
}
```

---

### Dashboard Components

#### `components/dashboard/LiveCostTicker.tsx`

**Purpose:** Display current spending with real-time updates

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';

export function LiveCostTicker() {
  const { data } = useTelemetry({ refreshInterval: 10000 }); // 10s refresh

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Live Cost</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {data.live.activeSessions} active
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            ${data.live.currentCost}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Hourly Rate</p>
              <p className="font-medium">${data.cost.perHour}/hr</p>
            </div>
            <div>
              <p className="text-muted-foreground">Daily Projection</p>
              <p className="font-medium">${data.cost.projectedDaily}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Features:**
- 🟢 Live status indicator (pulsing green dot)
- 💰 Current cost of active sessions
- 📊 Hourly rate calculation
- 📈 Daily projection
- ⚡ 10-second auto-refresh

---

#### `components/dashboard/CostTrendChart.tsx`

**Purpose:** Visualize cost trends over time

```typescript
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTelemetry } from '@/hooks/useTelemetry';

export function CostTrendChart() {
  const { data, loading } = useTelemetry({ days: 7 });

  if (loading) return <ChartSkeleton />;
  if (!data) return null;

  const chartData = data.hourlyTrend.map(item => ({
    time: new Date(item.hour).toLocaleTimeString('en-US', {
      hour: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    cost: parseFloat(item.cost),
    requests: item.requests
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Trend</CardTitle>
        <CardDescription>Hourly spending over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              label={{ value: 'Cost (USD)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(4)}`}
              labelStyle={{ color: '#000' }}
            />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Dependencies:** `recharts` (install: `npm install recharts`)

---

#### `components/dashboard/ModelComparisonCard.tsx`

**Purpose:** Compare performance and cost across AI models

```typescript
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTelemetry } from '@/hooks/useTelemetry';

export function ModelComparisonCard() {
  const { data, loading } = useTelemetry({ days: 7 });

  if (loading) return <CardSkeleton />;
  if (!data || !data.modelUsage.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Usage</CardTitle>
        <CardDescription>Performance by AI model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.modelUsage.map((model) => (
            <div key={model.model} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{model.model}</p>
                  <p className="text-xs text-muted-foreground">
                    {model.count} requests • {model.tokens.toLocaleString()} tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${model.cost}</p>
                  <p className="text-xs text-muted-foreground">
                    {model.percentage}% of total
                  </p>
                </div>
              </div>
              <Progress value={model.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

#### `components/dashboard/MissingProductsWidget.tsx`

**Purpose:** Display products customers want but you don't have

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package } from 'lucide-react';

export function MissingProductsWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/missing-products?days=30')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <WidgetSkeleton />;
  if (!data || !data.missingProducts.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Missing Products</CardTitle>
          <CardDescription>No missing product requests found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Customer Demand Insights</span>
          <Package className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
        <CardDescription>
          Products customers requested but aren't in your catalog
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.missingProducts.slice(0, 5).map((product) => (
            <div
              key={product.name}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {product.count}× requested
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last: {new Date(product.lastRequested).toLocaleDateString()}
                  </span>
                </div>
                {product.examples.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    "{product.examples[0]}"
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" className="ml-2">
                Add
              </Button>
            </div>
          ))}
        </div>

        {data.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recommendations
            </p>
            <ul className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button variant="outline" className="w-full mt-4" size="sm">
          View All Missing Products ({data.statistics.totalMissingProducts})
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Business Impact:**
- 💡 Identify demand before competitors
- 📊 Prioritize inventory expansion
- 🎯 Data-driven product decisions
- 📈 Forecast seasonal trends

---

## Data Flow Diagrams

### Telemetry Collection Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SENDS CHAT MESSAGE                                 │
│    ↓                                                         │
│ 2. app/api/chat/route.ts                                    │
│    ├─ telemetryManager.createSession(sessionId, model)      │
│    ├─ Start ReAct Loop (max 3 iterations)                   │
│    └─ Track everything:                                     │
│       ├─ telemetry.trackIteration(n, toolCalls)             │
│       ├─ telemetry.trackSearch(operation)                   │
│       └─ telemetry.trackTokenUsage(usage)                   │
│    ↓                                                         │
│ 3. AI COMPLETES RESPONSE                                    │
│    └─ telemetry.complete(response, error)                   │
│       ├─ Calculate summary                                  │
│       └─ persistSession() if enabled                        │
│    ↓                                                         │
│ 4. DATABASE INSERT                                          │
│    └─ chat_telemetry table                                  │
│       ├─ session_id, model, duration_ms                     │
│       ├─ iterations, search_count, searches (JSONB)         │
│       ├─ input_tokens, output_tokens                        │
│       └─ TRIGGER: auto_calculate_cost_trigger               │
│          └─ Calculates cost_usd automatically               │
│    ↓                                                         │
│ 5. DATA IMMEDIATELY AVAILABLE                               │
│    └─ /api/dashboard/telemetry?days=7                       │
│       ├─ Aggregates all sessions                            │
│       ├─ Calculates projections                             │
│       └─ Returns comprehensive JSON                         │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│ BROWSER (React Component)                                      │
│                                                                 │
│  const { data } = useTelemetry({ days: 7 })                    │
│                                                                 │
│  ↓ (every 30 seconds via useEffect + setInterval)              │
├────────────────────────────────────────────────────────────────┤
│ HTTP GET REQUEST                                                │
│                                                                 │
│  GET /api/dashboard/telemetry?days=7                            │
│                                                                 │
│  ↓                                                              │
├────────────────────────────────────────────────────────────────┤
│ API ROUTE (Next.js Edge Function)                              │
│                                                                 │
│  app/api/dashboard/telemetry/route.ts                          │
│    1. Parse query params (days, domain)                        │
│    2. Calculate date range                                     │
│    3. Query Supabase:                                          │
│       SELECT * FROM chat_telemetry                             │
│       WHERE created_at >= startDate                            │
│       ORDER BY created_at DESC                                 │
│    4. Aggregate data:                                          │
│       - Sum costs, tokens, searches                            │
│       - Calculate averages                                     │
│       - Group by model, domain                                 │
│       - Build hourly trend                                     │
│    5. Get live sessions from telemetryManager                  │
│    6. Calculate projections                                    │
│    7. Return JSON                                              │
│                                                                 │
│  ↓                                                              │
├────────────────────────────────────────────────────────────────┤
│ RESPONSE (JSON)                                                 │
│                                                                 │
│  {                                                              │
│    overview: { totalRequests, successRate, ... },              │
│    cost: { total, projected, trend, ... },                     │
│    tokens: { totalInput, totalOutput, ... },                   │
│    modelUsage: [...],                                          │
│    hourlyTrend: [...]                                          │
│  }                                                              │
│                                                                 │
│  ↓                                                              │
├────────────────────────────────────────────────────────────────┤
│ REACT STATE UPDATE                                              │
│                                                                 │
│  setData(jsonResponse)                                          │
│  setLoading(false)                                              │
│                                                                 │
│  ↓                                                              │
├────────────────────────────────────────────────────────────────┤
│ UI RE-RENDER                                                    │
│                                                                 │
│  <div>Total Cost: ${data.cost.total}</div>                     │
│  <CostTrendChart data={data.hourlyTrend} />                    │
│  <ModelComparisonCard models={data.modelUsage} />              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Integration Guide

### Step-by-Step: Connect Real Data to Main Dashboard

#### Step 1: Create Telemetry Hook

Create `hooks/useTelemetry.ts` (see full code in [Component Specifications](#core-hooks))

#### Step 2: Update Main Dashboard

Modify `app/dashboard/page.tsx`:

```typescript
// ADD AT TOP
import { useTelemetry } from '@/hooks/useTelemetry';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  // ADD THESE HOOKS
  const { data: telemetry, loading: telemetryLoading } = useTelemetry({
    days: parseInt(selectedPeriod.replace('d', ''))
  });
  const { data: analytics, loading: analyticsLoading } = useAnalytics({
    days: parseInt(selectedPeriod.replace('d', ''))
  });

  // REPLACE MOCK STATS WITH REAL DATA
  const stats = telemetry ? [
    {
      name: "Total Requests",
      value: telemetry.overview.totalRequests.toLocaleString(),
      change: `${telemetry.overview.successRate}%`,
      trend: "up",
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      name: "Total Cost",
      value: `$${telemetry.cost.total}`,
      change: telemetry.cost.trend,
      trend: telemetry.cost.trend === 'increasing' ? 'up' : 'down',
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      name: "Avg Response Time",
      value: analytics ? `${analytics.responseTime}s` : "Loading...",
      change: "-18%", // TODO: Calculate from historical data
      trend: "down",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      name: "Success Rate",
      value: `${telemetry.overview.successRate}%`,
      change: "+2.1%", // TODO: Calculate from historical data
      trend: "up",
      icon: CheckCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ] : [];

  // ADD LOADING STATE
  if (telemetryLoading || analyticsLoading) {
    return <LoadingSkeleton />;
  }

  // REST OF COMPONENT...
}
```

#### Step 3: Add Live Cost Ticker

Add to the right column:

```typescript
{/* Right Column - 2 cols */}
<div className="col-span-1 lg:col-span-2 space-y-4">
  {/* ADD THIS */}
  <LiveCostTicker />

  {/* Existing Bot Status */}
  <Card>
    {/* ... existing bot status code ... */}
  </Card>
</div>
```

#### Step 4: Replace Chart Placeholder

```typescript
{/* Performance Overview Chart */}
<Card>
  <CardHeader>
    <CardTitle>Cost Trend</CardTitle>
    <CardDescription>Hourly spending pattern</CardDescription>
  </CardHeader>
  <CardContent>
    <CostTrendChart />
  </CardContent>
</Card>
```

#### Step 5: Test

```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard`

**Expected Result:**
- Stats grid shows real data from database
- Live cost ticker updates every 30 seconds
- Cost trend chart displays hourly breakdown
- No console errors

---

### Step-by-Step: Build Cost Analytics Page

#### Step 1: Create New Page

Create `app/dashboard/costs/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { CostTrendChart } from '@/components/dashboard/CostTrendChart';
import { ModelComparisonCard } from '@/components/dashboard/ModelComparisonCard';
import { DomainCostTable } from '@/components/dashboard/DomainCostTable';
import { BudgetAlertsPanel } from '@/components/dashboard/BudgetAlertsPanel';
import { LiveCostTicker } from '@/components/dashboard/LiveCostTicker';

export default function CostsDashboard() {
  const [period, setPeriod] = useState('7d');
  const days = parseInt(period.replace('d', ''));

  const { data, loading, error } = useTelemetry({ days });

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorAlert error={error} />;
  if (!data) return null;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Analytics</h1>
          <p className="text-muted-foreground">
            Track AI spending and optimize costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.cost.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.totalRequests} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Cost/Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.cost.average}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per interaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.cost.projectedDaily}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.cost.projectedMonthly}</div>
            <p className="text-xs text-muted-foreground mt-1">
              30-day forecast
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Charts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <CostTrendChart />
          <ModelComparisonCard />
        </div>

        {/* Right: Sidebar (1 col) */}
        <div className="space-y-6">
          <LiveCostTicker />
          <BudgetAlertsPanel />
        </div>
      </div>

      {/* Domain Breakdown Table */}
      <DomainCostTable data={data.domainBreakdown} />
    </div>
  );
}
```

#### Step 2: Add Navigation Link

Update your dashboard layout to include link to costs page:

```typescript
// In dashboard navigation or sidebar
<nav>
  <a href="/dashboard">Overview</a>
  <a href="/dashboard/analytics">Analytics</a>
  <a href="/dashboard/costs">Costs</a>  {/* NEW */}
  <a href="/dashboard/team">Team</a>
</nav>
```

#### Step 3: Test

Navigate to `http://localhost:3000/dashboard/costs`

**Expected Result:**
- Complete cost analytics dashboard
- Real-time data from telemetry API
- Interactive charts and tables
- Budget alerts (if configured)

---

## Testing Strategy

### Unit Tests

**Test Coverage Goals:**
- [ ] Hooks: 90%+
- [ ] Components: 80%+
- [ ] API routes: 85%+

#### Example: Test `useTelemetry` Hook

```typescript
// hooks/__tests__/useTelemetry.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTelemetry } from '../useTelemetry';

global.fetch = jest.fn();

describe('useTelemetry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches telemetry data on mount', async () => {
    const mockData = {
      overview: { totalRequests: 100 },
      cost: { total: '12.50' }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => useTelemetry({ days: 7 }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/telemetry?days=7');
  });

  it('handles errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTelemetry({ days: 7 }));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.data).toBeNull();
  });

  it('refetches data at specified interval', async () => {
    jest.useFakeTimers();

    const mockData = { overview: { totalRequests: 100 } };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    renderHook(() => useTelemetry({
      days: 7,
      refreshInterval: 5000
    }));

    // Initial fetch
    expect(fetch).toHaveBeenCalledTimes(1);

    // Advance timer by 5 seconds
    jest.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
```

### Integration Tests

#### Example: Test Dashboard Page

```typescript
// app/dashboard/__tests__/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../page';

jest.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    data: {
      overview: { totalRequests: 1234, successRate: 95 },
      cost: { total: '45.67', trend: 'stable' }
    },
    loading: false,
    error: null
  })
}));

describe('DashboardPage', () => {
  it('displays telemetry data', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/1,234/)).toBeInTheDocument();
      expect(screen.getByText(/\$45\.67/)).toBeInTheDocument();
      expect(screen.getByText(/95%/)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    jest.mock('@/hooks/useTelemetry', () => ({
      useTelemetry: () => ({
        data: null,
        loading: true,
        error: null
      })
    }));

    render(<DashboardPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

### API Tests

#### Example: Test Telemetry Endpoint

```bash
# Manual testing
curl "http://localhost:3000/api/dashboard/telemetry?days=7" | jq .

# Expected response structure
{
  "overview": {
    "totalRequests": 156,
    "successfulRequests": 148,
    "successRate": 94
  },
  "cost": {
    "total": "12.5430",
    "average": "0.080404"
  }
}
```

---

## Performance Considerations

### API Response Times

**Measured Performance** (based on typical usage):

| Endpoint | Avg Response | p95 Response | Payload Size |
|----------|--------------|--------------|--------------|
| `/api/dashboard/telemetry` | 350ms | 600ms | 15-30KB |
| `/api/dashboard/analytics` | 450ms | 800ms | 8-15KB |
| `/api/dashboard/conversations` | 180ms | 350ms | 5-10KB |
| `/api/dashboard/missing-products` | 650ms | 1200ms | 10-25KB |

### Optimization Strategies

#### 1. Database Query Optimization

**Current Indexes:**
```sql
-- Already exists
CREATE INDEX idx_chat_telemetry_created_at ON chat_telemetry(created_at DESC);
CREATE INDEX idx_chat_telemetry_domain ON chat_telemetry(domain);
CREATE INDEX idx_chat_telemetry_success ON chat_telemetry(success);
```

**Recommendation:** These indexes are sufficient for current query patterns.

#### 2. Response Caching

**Option A: Redis Cache** (Recommended for high traffic)

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 30 // seconds
): Promise<T> {
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const fresh = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(fresh));

  return fresh;
}
```

**Usage in API route:**
```typescript
// app/api/dashboard/telemetry/route.ts
import { getCached } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get('days') || '7';
  const cacheKey = `telemetry:${days}`;

  const data = await getCached(cacheKey, async () => {
    // Existing query logic
    return aggregatedData;
  }, 30); // Cache for 30 seconds

  return NextResponse.json(data);
}
```

**Option B: In-Memory Cache** (Simpler, suitable for low traffic)

```typescript
// lib/simple-cache.ts
const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(
  key: string,
  fetcher: () => T,
  ttlSeconds: number = 30
): T {
  const cached = cache.get(key);

  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  const fresh = fetcher();
  cache.set(key, {
    data: fresh,
    expires: Date.now() + (ttlSeconds * 1000)
  });

  return fresh;
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now >= value.expires) {
      cache.delete(key);
    }
  }
}, 60000); // Every minute
```

#### 3. Parallel Data Fetching

**Current Implementation** (already optimal):

```typescript
// components/dashboard/dashboard-data-loader.tsx
const results = await Promise.allSettled([
  fetch('/api/dashboard/telemetry'),
  fetch('/api/dashboard/analytics'),
  fetch('/api/dashboard/conversations'),
  fetch('/api/dashboard/missing-products')
]);
```

**Performance:** ~800ms for 4 endpoints vs ~2000ms sequential

#### 4. Code Splitting

Use Next.js dynamic imports for heavy components:

```typescript
import dynamic from 'next/dynamic';

const CostTrendChart = dynamic(
  () => import('@/components/dashboard/CostTrendChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

#### 5. Data Pagination

For large datasets (e.g., missing products), implement pagination:

```typescript
// API route
export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, count } = await supabase
    .from('missing_products')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}
```

---

## Appendix

### A. Complete File Checklist

**New Files to Create:**

```
hooks/
├── useTelemetry.ts                  ✅ Core telemetry hook
├── useAnalytics.ts                  ✅ Analytics hook
├── useConversations.ts              ⚠️ Optional
└── useMissingProducts.ts            ⚠️ Optional

components/dashboard/
├── LiveCostTicker.tsx               ✅ Priority 1
├── CostTrendChart.tsx               ✅ Priority 1
├── ModelComparisonCard.tsx          ✅ Priority 1
├── DomainCostTable.tsx              ✅ Priority 2
├── BudgetAlertsPanel.tsx            ✅ Priority 2
├── MissingProductsWidget.tsx        ✅ Priority 2
├── ConversationQualityCard.tsx      ⚠️ Priority 3
├── AIPerformancePanel.tsx           ⚠️ Priority 3
├── SatisfactionTrendChart.tsx       ⚠️ Priority 3
├── LiveSessionsPanel.tsx            ⚠️ Priority 4
├── SessionDetailsModal.tsx          ⚠️ Priority 4
└── DataExportButton.tsx             ⚠️ Priority 4

app/dashboard/
└── costs/
    └── page.tsx                     ✅ Priority 2

lib/
├── cache.ts                         ⚠️ Optional (if using caching)
└── simple-cache.ts                  ⚠️ Alternative cache
```

**Files to Modify:**

```
app/dashboard/page.tsx               ✅ Replace mock data
app/dashboard/analytics/page.tsx     ⚠️ Phase 3
components/dashboard/dashboard-data-loader.tsx  ✅ Already functional
```

### B. Environment Variables

No new environment variables needed! All required variables are already configured:

```bash
# Already configured in .env.local
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
REDIS_URL=... # Optional for caching
```

### C. Dependencies to Install

```bash
# For charting (if using Recharts)
npm install recharts

# For Redis caching (optional)
npm install ioredis

# TypeScript types
npm install --save-dev @types/recharts @types/ioredis
```

### D. Database Migrations

No new migrations needed! All tables already exist:
- ✅ `chat_telemetry` with all columns
- ✅ `conversations` and `messages`
- ✅ `structured_extractions`
- ✅ `scraped_pages` and `page_embeddings`
- ✅ Cost calculation trigger already active

### E. Recommended Tools

**Development:**
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debug component state
- [Supabase Studio](https://supabase.com/dashboard) - Query database directly
- [Postman](https://www.postman.com/) - Test API endpoints

**Monitoring:**
- [Vercel Analytics](https://vercel.com/analytics) - Production monitoring
- [Sentry](https://sentry.io/) - Error tracking
- [LogRocket](https://logrocket.com/) - Session replay

---

## Summary & Next Steps

### What You Have Now

✅ **Complete telemetry infrastructure** - Every AI interaction tracked
✅ **9 production-ready API endpoints** - Real-time and historical data
✅ **Beautiful dashboard UI** - Just needs data connection
✅ **Comprehensive documentation** - This guide covers everything
✅ **Clear implementation path** - 4 phases, ~30 hours total

### What to Build First

**Week 1 Priority:**
1. Create `useTelemetry()` hook
2. Replace mock data in main dashboard
3. Add `LiveCostTicker` component
4. Build `CostTrendChart`

**Estimated Time:** 4-6 hours
**Impact:** Immediate visibility into AI spending and performance

### Critical Success Factors

1. **Test incrementally** - Verify each component before moving on
2. **Use TypeScript** - Catch errors at compile time
3. **Handle errors gracefully** - Always show partial data vs nothing
4. **Optimize for performance** - Cache aggressively, fetch in parallel
5. **Document as you go** - Future you will thank present you

---

**Questions or Issues?** Refer to:
- [SEARCH_ARCHITECTURE.md](SEARCH_ARCHITECTURE.md) - Search system details
- [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) - Performance tuning
- [HALLUCINATION_PREVENTION.md](HALLUCINATION_PREVENTION.md) - AI quality safeguards
- [07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Complete database reference

**Ready to start building?** Begin with Phase 1 and connect your first real data to the dashboard! 🚀
