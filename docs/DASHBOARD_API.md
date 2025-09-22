# Dashboard API Documentation

## Overview

The Dashboard API provides real-time analytics and metrics for the customer service chat system. All endpoints return data from the Supabase database and include intelligent fallbacks for when data is unavailable.

The API includes 6 core endpoints:
- **Conversations**: Chat session metrics and recent activity
- **Analytics**: Performance metrics, satisfaction scores, and query analysis
- **Scraped**: Content indexing statistics and domain coverage
- **WooCommerce**: E-commerce integration status and product metrics
- **Telemetry**: Cost tracking, token usage, and AI model analytics
- **Missing Products**: Customer demand intelligence for inventory optimization

## Base URL

```
/api/dashboard
```

## Endpoints

### 1. Conversations Endpoint

**GET** `/api/dashboard/conversations`

Returns conversation metrics including total count, percentage change, and recent conversations.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | number | 7 | Number of days to look back for data |

#### Response

```json
{
  "total": 156,
  "change": 12.5,
  "recent": [
    {
      "id": "uuid",
      "message": "First 100 characters of user message...",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### Fields

- `total`: Total number of conversations in the specified period
- `change`: Percentage change from previous period (can be negative)
- `recent`: Array of up to 10 most recent conversations

---

### 2. Analytics Endpoint

**GET** `/api/dashboard/analytics`

Returns performance metrics, satisfaction scores, and query analytics.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | number | 7 | Number of days to analyze |

#### Response

```json
{
  "responseTime": 2.3,
  "satisfactionScore": 4.5,
  "resolutionRate": 89,
  "topQueries": [
    {
      "query": "product availability",
      "count": 45,
      "percentage": 15
    }
  ],
  "failedSearches": ["query1", "query2"],
  "languageDistribution": [
    {
      "language": "English",
      "percentage": 75,
      "color": "bg-blue-500"
    }
  ],
  "metrics": {
    "totalMessages": 1234,
    "userMessages": 617,
    "avgMessagesPerDay": 88
  }
}
```

#### Fields

- `responseTime`: Average response time in seconds
- `satisfactionScore`: Calculated from message sentiment (1-5 scale)
- `resolutionRate`: Percentage of conversations resolved without issues
- `topQueries`: Most common user queries with frequency
- `failedSearches`: Queries that returned no results
- `languageDistribution`: Breakdown of languages used by customers
- `metrics`: Additional statistics about message volume

---

### 3. Scraped Content Endpoint

**GET** `/api/dashboard/scraped`

Returns statistics about scraped website content and indexing status.

#### Response

```json
{
  "totalPages": 523,
  "lastUpdated": "2025-01-15T12:00:00Z",
  "queuedJobs": 5,
  "statistics": {
    "uniqueDomains": 3,
    "totalEmbeddings": 498,
    "avgContentLength": 2456,
    "embeddingCoverage": 95
  },
  "domains": ["example.com", "shop.example.com"]
}
```

#### Fields

- `totalPages`: Total number of scraped pages in database
- `lastUpdated`: Timestamp of most recent scraping activity
- `queuedJobs`: Number of pending scraping jobs
- `statistics`: Detailed metrics about content
- `domains`: List of top domains being scraped

---

### 4. WooCommerce Endpoint

**GET** `/api/dashboard/woocommerce`

Returns e-commerce integration status and metrics.

#### Response

```json
{
  "totalProducts": 1250,
  "totalOrders": 89,
  "revenue": 15670,
  "status": "active",
  "abandonedCarts": {
    "count": 12,
    "value": 3400
  },
  "statistics": {
    "avgProductPrice": 45.99,
    "configuredDomains": 2,
    "productsIndexed": 1250
  },
  "domains": ["shop1.com", "shop2.com"]
}
```

#### Fields

- `totalProducts`: Number of products in catalog
- `totalOrders`: Order count (estimated if WooCommerce not connected)
- `revenue`: Total revenue in default currency
- `status`: Integration status (`active`, `not_configured`, or `error`)
- `abandonedCarts`: Information about abandoned shopping carts
- `statistics`: Additional e-commerce metrics
- `domains`: List of configured WooCommerce domains

---

### 5. Telemetry Endpoint

**GET** `/api/dashboard/telemetry`

Returns comprehensive telemetry data including cost analytics, token usage, and performance metrics.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | number | 7 | Number of days to analyze |
| domain | string | - | Filter by specific domain |

#### Response

```json
{
  "overview": {
    "totalRequests": 156,
    "successfulRequests": 150,
    "failedRequests": 6,
    "successRate": 96,
    "errorRate": 4,
    "activeSessions": 2,
    "timeRange": "Last 7 days"
  },
  "cost": {
    "total": "12.5430",
    "average": "0.080404",
    "projectedDaily": "1.79",
    "projectedMonthly": "53.70",
    "perHour": "0.0745",
    "trend": "stable"
  },
  "tokens": {
    "totalInput": 245000,
    "totalOutput": 89000,
    "total": 334000,
    "avgPerRequest": 2141
  },
  "performance": {
    "avgResponseTime": 2340,
    "totalSearches": 423,
    "avgSearchesPerRequest": "2.7",
    "avgIterations": "1.8"
  },
  "modelUsage": [
    {
      "model": "gpt-4-turbo",
      "count": 100,
      "cost": "8.2300",
      "tokens": 215000,
      "percentage": 64
    }
  ],
  "domainBreakdown": [
    {
      "domain": "example.com",
      "requests": 85,
      "cost": "6.8900"
    }
  ],
  "hourlyTrend": [
    {
      "hour": "2025-01-15T10:00:00Z",
      "cost": 0.245,
      "requests": 12
    }
  ],
  "live": {
    "activeSessions": 2,
    "currentCost": "0.002450",
    "sessionsData": []
  }
}
```

#### Fields

- `overview`: High-level metrics including success rates and active sessions
- `cost`: Comprehensive cost analytics with projections
- `tokens`: Token usage statistics (input, output, total)
- `performance`: Average response times and search statistics
- `modelUsage`: Breakdown by AI model with costs and usage
- `domainBreakdown`: Per-domain usage and costs
- `hourlyTrend`: Hourly cost and request data for charts
- `live`: Real-time session information

---

### 6. Missing Products Endpoint

**GET** `/api/dashboard/missing-products`

Tracks products that customers search for but aren't found in the catalog.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | number | 30 | Number of days to analyze |

#### Response

```json
{
  "missingProducts": [
    {
      "name": "quantum flux capacitor",
      "count": 15,
      "lastRequested": "2025-01-15T14:30:00Z",
      "examples": [
        "do you have quantum flux capacitors?",
        "I need a flux capacitor model XYZ"
      ]
    }
  ],
  "statistics": {
    "totalMissingProducts": 47,
    "totalRequests": 156,
    "avgRequestsPerProduct": 3.3,
    "timeRange": "Last 30 days"
  },
  "categories": {
    "tools": ["wrench", "hammer"],
    "parts": ["filter", "belt"],
    "equipment": ["pump", "motor"],
    "other": ["misc items"]
  },
  "recommendations": [
    "Consider adding \"flux capacitor\" - requested 15 times",
    "12 products have been requested multiple times"
  ]
}
```

#### Fields

- `missingProducts`: Detailed list of products not found
- `statistics`: Summary metrics about missing products
- `categories`: Categorized breakdown of missing items
- `recommendations`: AI-generated suggestions for inventory

---

## Error Handling

All endpoints implement graceful error handling:

1. **Database Unavailable**: Returns default values with HTTP 200
2. **Invalid Parameters**: Returns HTTP 400 with error details
3. **Server Errors**: Returns HTTP 500 with generic error message

### Default Response on Error

```json
{
  "total": 0,
  "change": 0,
  "recent": []
}
```

## Rate Limiting

Dashboard endpoints are not rate-limited as they're intended for internal use only. However, they respect the overall API rate limits if accessed externally.

## Authentication

Currently, dashboard endpoints don't require authentication but should be protected in production:

```typescript
// Recommended: Add authentication middleware
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user?.role === 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... endpoint logic
}
```

## Performance Considerations

- All endpoints cache results for 30 seconds (via dashboard component)
- Queries are optimized with proper indexes
- Heavy calculations are done server-side
- Responses are kept lightweight (< 10KB typically)

## Usage in Dashboard Component

The dashboard uses the `DashboardDataLoader` component to fetch all endpoints in parallel:

```typescript
import { useDashboardData } from '@/components/dashboard/dashboard-data-loader';

function MyDashboard() {
  const { data, loading, error } = useDashboardData();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  return (
    <div>
      <ConversationMetrics data={data.conversations} />
      <AnalyticsChart data={data.analytics} />
      {/* ... other components */}
    </div>
  );
}
```

## Development Tips

1. **Testing**: Use curl or Postman to test endpoints individually
2. **Debugging**: Check server logs for detailed error messages
3. **Mock Data**: Endpoints return sensible defaults when no data exists
4. **Performance**: Monitor response times in browser DevTools

## Future Enhancements

- [ ] Add WebSocket support for real-time updates
- [ ] Implement data export functionality (CSV/JSON)
- [ ] Add customizable date ranges
- [ ] Include predictive analytics
- [ ] Add role-based access control
- [ ] Implement result caching with Redis

## Related Documentation

- [Dashboard UI Components](./DASHBOARD_UI.md)
- [Database Schema](./SUPABASE_SCHEMA.md)
- [Chat System API](./CHAT_API.md)