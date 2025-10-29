# Dashboard Integration Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Dashboard Implementation Guide](GUIDE_DASHBOARD.md)
- [Telemetry System](../01-ARCHITECTURE/TELEMETRY_SYSTEM.md)
**Estimated Read Time:** 19 minutes

## Purpose
Quick-start integration guide for connecting analytics dashboard to telemetry endpoints with step-by-step frontend integration examples. Covers telemetry enablement in chat endpoints, parallel API fetching patterns, real-time data display components, domain-specific filtering, cost threshold alerts, and missing products analysis for business intelligence.

## Quick Links
- [Enable Telemetry](#step-1-enable-telemetry)
- [Access Dashboard Data](#step-2-access-dashboard-data)
- [Display Key Metrics](#step-3-display-key-metrics)
- [Monitor Domain-Specific Metrics](#step-4-monitor-domain-specific-metrics)
- [Set Up Alerts](#step-5-set-up-alerts)
- [Analyze Missing Products](#step-6-analyze-missing-products)
- [Available Endpoints](#available-endpoints)
- [Best Practices](#best-practices)

## Keywords
dashboard integration, telemetry setup, analytics endpoints, React components, data fetching, API integration, cost monitoring, performance widgets, domain filtering, alert configuration, CostWidget, PerformanceWidget, DomainMetrics, MissingProductsAnalysis, frontend integration, real-time updates

## Aliases
- "telemetry" (also known as: usage tracking, metrics collection, analytics data, performance monitoring)
- "dashboard data" (also known as: analytics data, metrics data, dashboard metrics, KPI data)
- "cost threshold" (also known as: budget alert, spending limit, cost alert, usage alert)
- "domain-specific" (also known as: tenant-specific, customer-specific, per-domain, multi-tenant filtering)
- "widgets" (also known as: dashboard components, metric cards, display components, UI widgets)

---

## Quick Start

This guide helps you integrate the analytics dashboard into your application and start tracking metrics immediately.

## Prerequisites

- Next.js application running
- Supabase database configured
- Environment variables set

## Step 1: Enable Telemetry

### In Your Chat Endpoints

```typescript
// app/api/chat/route.ts
import { telemetryManager } from '@/lib/chat-telemetry';

export async function POST(request: Request) {
  const sessionId = generateUUID();
  
  // Start telemetry tracking
  const telemetry = telemetryManager.createSession(
    sessionId,
    'gpt-4-turbo', // or your model
    {
      persistToDatabase: true,
      domain: extractDomain(request)
    }
  );
  
  try {
    // Your chat logic here
    const response = await processChat(message);
    
    // Track the operation
    telemetry.trackTokenUsage(response.usage);
    
    // Complete successfully
    await telemetry.complete(response.content);
    
    return response;
  } catch (error) {
    // Track failures
    await telemetry.complete(undefined, error.message);
    throw error;
  }
}
```

## Step 2: Access Dashboard Data

### Frontend Integration

```typescript
// components/Dashboard.tsx
import { useEffect, useState } from 'react';

function Dashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all dashboard endpoints in parallel
        const [
          conversations,
          analytics,
          scraped,
          woocommerce,
          telemetry,
          missingProducts
        ] = await Promise.all([
          fetch('/api/dashboard/conversations').then(r => r.json()),
          fetch('/api/dashboard/analytics').then(r => r.json()),
          fetch('/api/dashboard/scraped').then(r => r.json()),
          fetch('/api/dashboard/woocommerce').then(r => r.json()),
          fetch('/api/dashboard/telemetry').then(r => r.json()),
          fetch('/api/dashboard/missing-products').then(r => r.json())
        ]);

        setData({
          conversations,
          analytics,
          scraped,
          woocommerce,
          telemetry,
          missingProducts
        });
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      {/* Render your dashboard components */}
      <CostWidget data={data.telemetry} />
      <ConversationsWidget data={data.conversations} />
      <AnalyticsWidget data={data.analytics} />
    </div>
  );
}
```

## Step 3: Display Key Metrics

### Cost Tracking Widget

```typescript
function CostWidget({ data }) {
  return (
    <div className="cost-widget">
      <h3>AI Usage Costs</h3>
      <div className="metrics">
        <div className="metric">
          <span className="label">Today's Cost</span>
          <span className="value">${data.cost.total}</span>
        </div>
        <div className="metric">
          <span className="label">Projected Monthly</span>
          <span className="value">${data.cost.projectedMonthly}</span>
        </div>
        <div className="metric">
          <span className="label">Active Sessions</span>
          <span className="value">{data.overview.activeSessions}</span>
        </div>
      </div>
      <CostTrendChart data={data.hourlyTrend} />
    </div>
  );
}
```

### Performance Metrics

```typescript
function PerformanceWidget({ data }) {
  return (
    <div className="performance-widget">
      <h3>System Performance</h3>
      <div className="stats">
        <div className="stat">
          <CircularProgress value={data.overview.successRate} />
          <span>Success Rate</span>
        </div>
        <div className="stat">
          <span className="number">{data.performance.avgResponseTime}ms</span>
          <span>Avg Response Time</span>
        </div>
        <div className="stat">
          <span className="number">{data.tokens.avgPerRequest}</span>
          <span>Tokens per Request</span>
        </div>
      </div>
    </div>
  );
}
```

## Step 4: Monitor Domain-Specific Metrics

### Filter by Domain

```typescript
// Fetch metrics for specific domain
const domainMetrics = await fetch(
  `/api/dashboard/telemetry?domain=example.com&days=30`
).then(r => r.json());

// Display domain-specific data
function DomainMetrics({ domain }) {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    fetch(`/api/dashboard/telemetry?domain=${domain}`)
      .then(r => r.json())
      .then(setMetrics);
  }, [domain]);
  
  if (!metrics) return null;
  
  return (
    <div>
      <h4>{domain} Metrics</h4>
      <p>Requests: {metrics.overview.totalRequests}</p>
      <p>Cost: ${metrics.cost.total}</p>
      <p>Success Rate: {metrics.overview.successRate}%</p>
    </div>
  );
}
```

## Step 5: Set Up Alerts

### Cost Threshold Monitoring

```typescript
// utils/monitoring.ts
async function checkCostThresholds() {
  const data = await fetch('/api/dashboard/telemetry').then(r => r.json());
  
  const dailyLimit = 10.00; // $10 per day
  const monthlyLimit = 200.00; // $200 per month
  
  if (parseFloat(data.cost.projectedDaily) > dailyLimit) {
    sendAlert('Daily cost threshold exceeded', {
      current: data.cost.projectedDaily,
      limit: dailyLimit
    });
  }
  
  if (parseFloat(data.cost.projectedMonthly) > monthlyLimit) {
    sendAlert('Monthly cost projection exceeded', {
      projected: data.cost.projectedMonthly,
      limit: monthlyLimit
    });
  }
}

// Run checks every hour
setInterval(checkCostThresholds, 3600000);
```

## Step 6: Analyze Missing Products

### Inventory Intelligence

```typescript
function MissingProductsAnalysis() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch('/api/dashboard/missing-products?days=30')
      .then(r => r.json())
      .then(data => setProducts(data.missingProducts));
  }, []);
  
  return (
    <div className="missing-products">
      <h3>Customer Demand - Products Not Found</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Requests</th>
            <th>Last Requested</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.name}>
              <td>{product.name}</td>
              <td>{product.count}</td>
              <td>{new Date(product.lastRequested).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Available Endpoints

### 1. Conversations
- **Endpoint**: `/api/dashboard/conversations`
- **Purpose**: Track chat sessions and activity
- **Key Metrics**: Total conversations, change percentage, recent chats

### 2. Analytics
- **Endpoint**: `/api/dashboard/analytics`
- **Purpose**: Performance and satisfaction metrics
- **Key Metrics**: Response time, satisfaction score, top queries

### 3. Scraped Content
- **Endpoint**: `/api/dashboard/scraped`
- **Purpose**: Monitor content indexing
- **Key Metrics**: Total pages, last update, queued jobs

### 4. WooCommerce
- **Endpoint**: `/api/dashboard/woocommerce`
- **Purpose**: E-commerce integration status
- **Key Metrics**: Products, orders, revenue

### 5. Telemetry
- **Endpoint**: `/api/dashboard/telemetry`
- **Purpose**: Cost and performance tracking
- **Key Metrics**: Costs, tokens, model usage

### 6. Missing Products
- **Endpoint**: `/api/dashboard/missing-products`
- **Purpose**: Identify inventory gaps
- **Key Metrics**: Requested products not in catalog

## Best Practices

### 1. Caching
```typescript
// Cache dashboard data for 30 seconds
const CACHE_DURATION = 30000;
let cache = null;
let cacheTime = 0;

async function getDashboardData() {
  if (cache && Date.now() - cacheTime < CACHE_DURATION) {
    return cache;
  }
  
  cache = await fetchAllEndpoints();
  cacheTime = Date.now();
  return cache;
}
```

### 2. Error Handling
```typescript
// All endpoints return safe defaults on error
const safetyDefaults = {
  conversations: { total: 0, change: 0, recent: [] },
  analytics: { responseTime: 0, satisfactionScore: 0 },
  telemetry: { cost: { total: "0.00" }, overview: {} }
};

// Use defaults as fallbacks
const data = await fetch('/api/dashboard/telemetry')
  .then(r => r.json())
  .catch(() => safetyDefaults.telemetry);
```

### 3. Real-time Updates
```typescript
// Use WebSocket for live updates (future enhancement)
const ws = new WebSocket('ws://localhost:3000/dashboard/live');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Update specific metric in real-time
  updateMetric(update.type, update.data);
};
```

## Troubleshooting

### No Data Showing
1. Check database connection
2. Verify environment variables
3. Ensure telemetry is enabled in chat endpoints

### Costs Not Tracking
1. Verify model pricing configuration
2. Check token usage is being passed
3. Ensure telemetry.complete() is called

### Performance Issues
1. Implement caching on frontend
2. Use pagination for large datasets
3. Consider aggregating data server-side

## Next Steps

1. **Customize Dashboard UI**: Adapt the components to your design system
2. **Add Visualizations**: Integrate charting libraries (Chart.js, Recharts)
3. **Set Up Monitoring**: Configure alerts for important thresholds
4. **Export Capabilities**: Add CSV/PDF export for reports
5. **Mobile Dashboard**: Create responsive mobile views

## Related Documentation

- [Telemetry System Documentation](./TELEMETRY_SYSTEM.md)
- [Dashboard API Documentation](./DASHBOARD_API.md)
- [Performance Optimization](./PERFORMANCE.md)