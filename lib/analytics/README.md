**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Business Intelligence Analytics

**Purpose:** Advanced business intelligence system for customer journey analysis, content gap detection, usage pattern prediction, and conversion funnel optimization.

**Integration Type:** Service
**Last Updated:** 2025-10-30
**Status:** Active

## Overview

This directory contains a comprehensive business intelligence analytics system that provides deep insights into:
- Customer journey mapping and drop-off analysis
- Content gap identification and recommendations
- Peak usage pattern prediction
- Conversion funnel tracking and bottleneck detection

The system is built with a modular architecture separating queries, calculations, reporting, and helper utilities.

## Architecture

```
analytics/
├── business-intelligence.ts            # Main orchestrator class
├── business-intelligence-types.ts      # TypeScript type definitions
├── business-intelligence-queries.ts    # Database query functions
├── business-intelligence-calculators.ts # Metric calculation logic
├── business-intelligence-helpers.ts    # Utility helper functions
├── business-intelligence-reports.ts    # Report generation
└── README.md                           # This file
```

## Key Files

### Main Orchestrator

**File:** [business-intelligence.ts](business-intelligence.ts)

**Purpose:** Central class that coordinates all business intelligence operations.

**Key Methods:**
```typescript
class BusinessIntelligence {
  // Customer journey analysis
  analyzeCustomerJourney(customerId: string, timeRange: TimeRange): Promise<CustomerJourneyMetrics>

  // Content gap analysis
  identifyContentGaps(customerId: string, timeRange: TimeRange): Promise<ContentGapAnalysis>

  // Usage pattern prediction
  predictPeakUsage(customerId: string, historicalDays: number): Promise<PeakUsagePattern>

  // Conversion funnel tracking
  trackConversionFunnel(customerId: string, timeRange: TimeRange): Promise<ConversionFunnel>
}
```

### Type Definitions

**File:** [business-intelligence-types.ts](business-intelligence-types.ts)

**Purpose:** TypeScript interfaces for all BI data structures.

**Key Types:**
- `TimeRange` - Date range specifications
- `CustomerJourneyMetrics` - Journey analysis results
- `ContentGapAnalysis` - Content gap findings
- `PeakUsagePattern` - Usage prediction data
- `ConversionFunnel` - Funnel metrics

### Database Queries

**File:** [business-intelligence-queries.ts](business-intelligence-queries.ts)

**Purpose:** Optimized database queries for BI analytics.

**Functions:**
- `fetchConversationsWithMessages()` - Get conversation history
- `fetchUserMessages()` - Retrieve user message data
- `fetchMessagesForUsageAnalysis()` - Get usage pattern data

### Calculation Engine

**File:** [business-intelligence-calculators.ts](business-intelligence-calculators.ts)

**Purpose:** Core business logic for metric calculations.

**Functions:**
- `calculateJourneyMetrics()` - Journey analysis calculations
- `analyzeContentGaps()` - Content gap detection algorithms
- `calculateUsageDistributions()` - Usage pattern analysis
- `predictNextPeak()` - Peak usage prediction

### Reporting

**File:** [business-intelligence-reports.ts](business-intelligence-reports.ts)

**Purpose:** Generate formatted reports and visualizations.

**Functions:**
- `trackFunnelProgression()` - Funnel stage tracking
- `buildFunnelStages()` - Funnel visualization data
- `identifyBottlenecks()` - Bottleneck detection

### Helpers

**File:** [business-intelligence-helpers.ts](business-intelligence-helpers.ts)

**Purpose:** Utility functions for data processing.

**Functions:**
- `generateContentSuggestions()` - AI-powered content recommendations
- Data normalization utilities
- Formatting helpers

## Usage Examples

### Customer Journey Analysis

```typescript
import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';

const bi = new BusinessIntelligence();

// Analyze customer journey over last 30 days
const journeyMetrics = await bi.analyzeCustomerJourney('customer-123', {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: new Date()
});

console.log('Journey Metrics:', {
  totalSessions: journeyMetrics.totalSessions,
  averageSessionLength: journeyMetrics.averageSessionLength,
  dropOffPoints: journeyMetrics.dropOffPoints,
  commonPaths: journeyMetrics.commonPaths
});
```

### Content Gap Identification

```typescript
// Identify content gaps based on unanswered questions
const contentGaps = await bi.identifyContentGaps('customer-123', {
  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  end: new Date()
});

console.log('Content Gaps:', {
  unansweredQueries: contentGaps.unansweredQueries,
  topMissingTopics: contentGaps.topMissingTopics,
  suggestions: contentGaps.contentSuggestions
});
```

### Peak Usage Prediction

```typescript
// Predict next peak usage based on historical patterns
const peakPrediction = await bi.predictPeakUsage('customer-123', 90);

console.log('Peak Prediction:', {
  predictedPeakTime: peakPrediction.predictedPeakTime,
  expectedLoad: peakPrediction.expectedLoad,
  confidence: peakPrediction.confidenceLevel,
  recommendations: peakPrediction.resourceRecommendations
});
```

### Conversion Funnel Analysis

```typescript
// Track conversion funnel for sales process
const funnel = await bi.trackConversionFunnel('customer-123', {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: new Date()
});

console.log('Conversion Funnel:', {
  stages: funnel.stages,
  conversionRate: funnel.overallConversionRate,
  bottlenecks: funnel.bottlenecks,
  dropOffReasons: funnel.dropOffReasons
});
```

## Integration with Dashboard

The analytics system integrates with the monitoring dashboard:

```typescript
import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { getUsageStatistics } from '@/lib/monitoring/dashboard-data';

async function getDashboardAnalytics(customerId: string) {
  const bi = new BusinessIntelligence();

  const [journey, gaps, usage, funnel] = await Promise.all([
    bi.analyzeCustomerJourney(customerId, { period: '30d' }),
    bi.identifyContentGaps(customerId, { period: '7d' }),
    getUsageStatistics({ period: '24h' }),
    bi.trackConversionFunnel(customerId, { period: '30d' })
  ]);

  return {
    customerJourney: journey,
    contentGaps: gaps,
    realtimeUsage: usage,
    conversionMetrics: funnel
  };
}
```

## Data Processing Pipeline

1. **Data Collection**: Queries aggregate conversation and message data
2. **Metric Calculation**: Calculators process raw data into insights
3. **Analysis**: Helpers apply business logic and AI-powered analysis
4. **Reporting**: Reports format data for visualization
5. **Caching**: Results cached for performance

## Performance Optimization

### Database Query Optimization

```typescript
// Use database-level aggregation
const metrics = await supabase
  .from('conversations')
  .select(`
    id,
    created_at,
    messages!inner(content, created_at)
  `)
  .gte('created_at', startDate)
  .lte('created_at', endDate);
```

### Caching Strategy

```typescript
import { getSearchCacheManager } from '@/lib/search-cache';

const cache = getSearchCacheManager();

// Cache BI results for 1 hour
const cacheKey = `bi:journey:${customerId}:${timeRangeHash}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

const result = await calculateJourneyMetrics(data);
await cache.set(cacheKey, result, 3600);
```

## Configuration

### Environment Variables

```bash
# Supabase for analytics data
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI for content suggestions (optional)
OPENAI_API_KEY=sk_...

# Analytics Configuration
BI_CACHE_TTL=3600  # 1 hour
BI_MIN_DATA_POINTS=10  # Minimum data for predictions
```

### Analysis Parameters

```typescript
interface AnalysisConfig {
  // Customer journey
  minimumSessionLength: number;  // Default: 30 seconds
  dropOffThreshold: number;      // Default: 80% of avg

  // Content gaps
  unansweredThreshold: number;   // Default: 3 failed searches
  topicClusterSize: number;      // Default: 5 topics

  // Peak prediction
  historicalWindow: number;      // Default: 90 days
  confidenceThreshold: number;   // Default: 0.7

  // Conversion funnel
  funnelStages: string[];        // Custom stages
  bottleneckThreshold: number;   // Default: 30% drop-off
}
```

## API Reference

### BusinessIntelligence Class

**Constructor:**
```typescript
constructor(supabase?: SupabaseClient)
```

**Methods:**

**Customer Journey:**
```typescript
analyzeCustomerJourney(
  customerId: string,
  timeRange: TimeRange
): Promise<CustomerJourneyMetrics>
```

**Content Analysis:**
```typescript
identifyContentGaps(
  customerId: string,
  timeRange: TimeRange
): Promise<ContentGapAnalysis>
```

**Usage Prediction:**
```typescript
predictPeakUsage(
  customerId: string,
  historicalDays: number
): Promise<PeakUsagePattern>
```

**Conversion Tracking:**
```typescript
trackConversionFunnel(
  customerId: string,
  timeRange: TimeRange
): Promise<ConversionFunnel>
```

## Testing

### Unit Tests

```typescript
import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { createMockSupabaseClient } from '@/__mocks__/supabase';

describe('Business Intelligence', () => {
  it('should analyze customer journey', async () => {
    const mockSupabase = createMockSupabaseClient();
    const bi = new BusinessIntelligence(mockSupabase);

    const result = await bi.analyzeCustomerJourney('test-customer', {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    });

    expect(result.totalSessions).toBeGreaterThan(0);
    expect(result.dropOffPoints).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('BI Integration', () => {
  it('should generate complete analytics report', async () => {
    const bi = new BusinessIntelligence();

    const [journey, gaps, peaks, funnel] = await Promise.all([
      bi.analyzeCustomerJourney('customer-123', { period: '30d' }),
      bi.identifyContentGaps('customer-123', { period: '7d' }),
      bi.predictPeakUsage('customer-123', 90),
      bi.trackConversionFunnel('customer-123', { period: '30d' })
    ]);

    expect(journey).toBeDefined();
    expect(gaps.unansweredQueries).toBeInstanceOf(Array);
    expect(peaks.predictedPeakTime).toBeInstanceOf(Date);
    expect(funnel.stages).toHaveLength(4);
  });
});
```

## Troubleshooting

**Issue: "Insufficient data for analysis"**
- **Cause:** Not enough historical data for predictions
- **Solution:** Increase `historicalDays` parameter or wait for more data
- **Minimum:** At least 10 data points required for predictions

**Issue: "Slow analytics queries"**
- **Cause:** Large dataset without proper indexing
- **Solution:** Add database indexes on frequently queried fields
- **Check:** Review query execution plans in Supabase dashboard

**Issue: "Inaccurate predictions"**
- **Cause:** Irregular usage patterns or insufficient historical data
- **Solution:** Increase historical window or adjust confidence threshold
- **Improve:** Collect more diverse training data

**Issue: "Content gap analysis returns no results"**
- **Cause:** All queries successfully answered or threshold too high
- **Solution:** Lower `unansweredThreshold` parameter
- **Verify:** Check that conversations data is being properly logged

## Related Documentation

**Internal:**
- [lib/monitoring/dashboard-data.ts](/Users/jamesguy/Omniops/lib/monitoring/dashboard-data.ts) - Dashboard analytics
- [lib/search-cache.ts](/Users/jamesguy/Omniops/lib/search-cache.ts) - Caching utilities
- [app/api/analytics/](/Users/jamesguy/Omniops/app/api/analytics/) - Analytics API endpoints
- [docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](/Users/jamesguy/Omniops/docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Database schema

**External:**
- [Supabase Analytics](https://supabase.com/docs/guides/analytics)
- [OpenAI Embeddings for Content Analysis](https://platform.openai.com/docs/guides/embeddings)

## Best Practices

### 1. Data Quality

```typescript
// Validate data before analysis
function validateTimeRange(range: TimeRange): boolean {
  if (range.end < range.start) {
    throw new Error('End date must be after start date');
  }

  const daysDiff = (range.end - range.start) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    console.warn('Large time range may impact performance');
  }

  return true;
}
```

### 2. Performance Considerations

```typescript
// Use pagination for large datasets
async function fetchConversationsPaginated(customerId: string, pageSize = 100) {
  let page = 0;
  let hasMore = true;
  const results = [];

  while (hasMore) {
    const batch = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    results.push(...batch.data);
    hasMore = batch.data.length === pageSize;
    page++;
  }

  return results;
}
```

### 3. Error Handling

```typescript
// Graceful degradation
async function analyzeCustomerJourneyWithFallback(customerId: string) {
  try {
    return await bi.analyzeCustomerJourney(customerId, { period: '30d' });
  } catch (error) {
    logger.error('Journey analysis failed, using simplified metrics', error);

    // Return basic metrics as fallback
    return {
      totalSessions: await getSessionCount(customerId),
      averageSessionLength: null,
      dropOffPoints: [],
      commonPaths: []
    };
  }
}
```

## Contributing

When working with business intelligence analytics:

1. **Optimize Queries**: Use database-level aggregation when possible
2. **Cache Aggressively**: BI results can be cached for hours
3. **Validate Inputs**: Always validate time ranges and parameters
4. **Handle Missing Data**: Provide graceful fallbacks
5. **Document Algorithms**: Explain calculation logic clearly
6. **Test with Real Data**: Use production-like datasets for testing

The analytics system is crucial for business insights and should prioritize accuracy, performance, and reliability.
