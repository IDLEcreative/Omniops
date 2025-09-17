# Monitoring Utilities Documentation

This directory contains monitoring, analytics, and observability utilities that provide insights into application performance, user behavior, and system health. These tools are essential for maintaining service quality and optimizing performance.

## Overview

The monitoring directory provides:
- **Performance Monitoring**: Real-time performance metrics and analysis
- **Dashboard Data**: Aggregated analytics for administrative dashboards
- **Scrape Monitoring**: Specialized monitoring for web scraping operations
- **Health Checks**: System health monitoring and alerting
- **Usage Analytics**: User behavior and system usage tracking

## Architecture

```
monitoring/
├── dashboard-data.ts    # Dashboard analytics and aggregated metrics
└── scrape-monitor.ts    # Specialized scraping operation monitoring
```

## Core Components

### Dashboard Data (`dashboard-data.ts`)

Comprehensive analytics system for administrative dashboards with real-time metrics:

**Key Features:**
- **Real-time Metrics**: Live performance and usage statistics
- **Data Aggregation**: Efficient aggregation of large datasets
- **Trend Analysis**: Historical data analysis and trend identification
- **Custom Dashboards**: Configurable dashboard components
- **Export Capabilities**: Data export for reporting and analysis

**Core Functions:**
```typescript
// Usage statistics
export async function getUsageStatistics(timeRange: TimeRange): Promise<UsageStats>;
export async function getCustomerActivityMetrics(customerId?: string): Promise<ActivityMetrics>;
export async function getSystemPerformanceMetrics(): Promise<PerformanceMetrics>;

// Business analytics
export async function getConversionMetrics(period: string): Promise<ConversionData>;
export async function getPopularContent(limit: number): Promise<ContentMetrics[]>;
export async function getCustomerSegmentation(): Promise<SegmentationData>;

// Technical metrics
export async function getDatabaseMetrics(): Promise<DatabaseStats>;
export async function getAPIPerformanceMetrics(): Promise<APIMetrics>;
export async function getErrorRateMetrics(): Promise<ErrorStats>;
```

**Usage Examples:**
```typescript
import { getUsageStatistics, getSystemPerformanceMetrics } from '@/lib/monitoring/dashboard-data';

// Get dashboard overview data
const dashboardData = await Promise.all([
  getUsageStatistics({ period: '24h' }),
  getSystemPerformanceMetrics(),
  getDatabaseMetrics()
]);

// Display in admin dashboard
const overview = {
  totalUsers: dashboardData[0].activeUsers,
  responseTime: dashboardData[1].averageResponseTime,
  dbConnections: dashboardData[2].activeConnections
};
```

### Scrape Monitor (`scrape-monitor.ts`)

Specialized monitoring system for web scraping operations with detailed tracking:

**Key Features:**
- **Job Tracking**: Monitor individual scraping jobs and their progress
- **Performance Metrics**: Scraping speed, success rates, and error analysis
- **Resource Monitoring**: Memory, CPU, and network usage during scraping
- **Queue Analytics**: Job queue health and processing statistics
- **Error Analysis**: Detailed error categorization and reporting

**Core Functions:**
```typescript
// Job monitoring
export async function trackScrapeJob(jobId: string, metrics: JobMetrics): Promise<void>;
export async function getScrapeJobStatus(jobId: string): Promise<JobStatus>;
export async function getScrapeJobHistory(customerId: string): Promise<JobHistory[]>;

// Performance monitoring
export async function getScrapingPerformanceMetrics(): Promise<ScrapingMetrics>;
export async function getErrorAnalytics(timeRange: TimeRange): Promise<ErrorAnalytics>;
export async function getResourceUsageMetrics(): Promise<ResourceMetrics>;

// Queue monitoring
export async function getQueueHealthMetrics(): Promise<QueueHealth>;
export async function getProcessingStatistics(): Promise<ProcessingStats>;
```

**Real-time Monitoring:**
```typescript
import { trackScrapeJob, getScrapingPerformanceMetrics } from '@/lib/monitoring/scrape-monitor';

// Track scraping job progress
async function monitorScrapeJob(jobId: string) {
  const startTime = Date.now();
  
  // Update metrics as job progresses
  await trackScrapeJob(jobId, {
    status: 'running',
    pagesProcessed: 10,
    totalPages: 100,
    errorCount: 0,
    startTime,
    currentUrl: 'https://example.com/page'
  });
  
  // Get real-time performance data
  const metrics = await getScrapingPerformanceMetrics();
  console.log(`Average pages/min: ${metrics.pagesPerMinute}`);
}
```

## Metrics and Analytics

### 1. Usage Statistics
```typescript
interface UsageStats {
  totalRequests: number;
  uniqueUsers: number;
  activeCustomers: number;
  peakConcurrency: number;
  averageSessionDuration: number;
  topFeatures: FeatureUsage[];
  timeDistribution: HourlyStats[];
}

async function getUsageStatistics(timeRange: TimeRange): Promise<UsageStats> {
  const supabase = createServiceRoleClient();
  
  const [requests, users, sessions] = await Promise.all([
    getRequestMetrics(timeRange),
    getUserMetrics(timeRange),
    getSessionMetrics(timeRange)
  ]);
  
  return {
    totalRequests: requests.total,
    uniqueUsers: users.unique,
    activeCustomers: users.activeCustomers,
    peakConcurrency: sessions.peak,
    averageSessionDuration: sessions.averageDuration,
    topFeatures: await getTopFeatures(timeRange),
    timeDistribution: await getHourlyDistribution(timeRange)
  };
}
```

### 2. Performance Metrics
```typescript
interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errorRate: {
    percentage: number;
    total: number;
    byType: ErrorBreakdown[];
  };
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}
```

### 3. Scraping Metrics
```typescript
interface ScrapingMetrics {
  jobsCompleted: number;
  successRate: number;
  averageJobDuration: number;
  pagesPerMinute: number;
  errorBreakdown: ScrapingError[];
  resourceUsage: {
    peakMemory: number;
    averageCpuUsage: number;
    networkBandwidth: number;
  };
  queueMetrics: {
    pendingJobs: number;
    activeJobs: number;
    averageWaitTime: number;
  };
}
```

## Real-time Monitoring

### 1. Live Dashboard Updates
```typescript
class DashboardMonitor {
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(data: DashboardData) => void> = new Set();
  
  startMonitoring(intervalMs: number = 30000) {
    this.updateInterval = setInterval(async () => {
      const data = await this.collectDashboardData();
      this.notifySubscribers(data);
    }, intervalMs);
  }
  
  subscribe(callback: (data: DashboardData) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  private async collectDashboardData(): Promise<DashboardData> {
    return {
      timestamp: new Date(),
      metrics: await getSystemPerformanceMetrics(),
      usage: await getUsageStatistics({ period: '1h' }),
      scraping: await getScrapingPerformanceMetrics()
    };
  }
}
```

### 2. Alert System
```typescript
interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  source: string;
  acknowledged: boolean;
}

class AlertManager {
  private alerts: Alert[] = [];
  private thresholds = {
    errorRate: 5, // 5%
    responseTime: 1000, // 1 second
    memoryUsage: 80, // 80%
    queueBacklog: 100 // 100 pending jobs
  };
  
  async checkAndCreateAlerts(): Promise<Alert[]> {
    const metrics = await getSystemPerformanceMetrics();
    const newAlerts: Alert[] = [];
    
    if (metrics.errorRate.percentage > this.thresholds.errorRate) {
      newAlerts.push({
        id: `error-rate-${Date.now()}`,
        severity: 'warning',
        message: `Error rate is ${metrics.errorRate.percentage}% (threshold: ${this.thresholds.errorRate}%)`,
        timestamp: new Date(),
        source: 'performance-monitor',
        acknowledged: false
      });
    }
    
    return newAlerts;
  }
}
```

## Data Visualization

### 1. Chart Data Preparation
```typescript
export async function getChartData(type: string, timeRange: TimeRange): Promise<ChartData> {
  switch (type) {
    case 'requests':
      return await getRequestsChartData(timeRange);
    case 'performance':
      return await getPerformanceChartData(timeRange);
    case 'errors':
      return await getErrorsChartData(timeRange);
    default:
      throw new Error(`Unknown chart type: ${type}`);
  }
}

async function getRequestsChartData(timeRange: TimeRange): Promise<ChartData> {
  const data = await getHourlyRequestCounts(timeRange);
  
  return {
    labels: data.map(d => d.hour),
    datasets: [{
      label: 'Requests',
      data: data.map(d => d.count),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)'
    }]
  };
}
```

### 2. Export and Reporting
```typescript
export async function generateReport(
  type: 'usage' | 'performance' | 'scraping',
  timeRange: TimeRange,
  format: 'json' | 'csv' | 'pdf'
): Promise<ReportData> {
  const data = await collectReportData(type, timeRange);
  
  switch (format) {
    case 'json':
      return { format: 'json', data };
    case 'csv':
      return { format: 'csv', data: convertToCSV(data) };
    case 'pdf':
      return { format: 'pdf', data: await generatePDF(data) };
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
```

## Performance Optimization

### 1. Efficient Data Aggregation
```typescript
// Use database-level aggregation for performance
async function getHourlyMetrics(timeRange: TimeRange): Promise<HourlyMetrics[]> {
  const supabase = createServiceRoleClient();
  
  const { data } = await supabase
    .from('request_logs')
    .select(`
      created_at,
      response_time,
      status_code
    `)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString());
  
  // Group by hour and calculate metrics
  const hourlyGroups = groupByHour(data);
  return hourlyGroups.map(group => ({
    hour: group.hour,
    requestCount: group.requests.length,
    averageResponseTime: average(group.requests.map(r => r.response_time)),
    errorRate: group.requests.filter(r => r.status_code >= 400).length / group.requests.length
  }));
}
```

### 2. Caching Strategy
```typescript
import { getSearchCacheManager } from '@/lib/search-cache';

class MetricsCache {
  private cache = getSearchCacheManager();
  private defaultTTL = 300; // 5 minutes
  
  async getMetrics(key: string, fetcher: () => Promise<any>): Promise<any> {
    const cached = await this.cache.get(key);
    if (cached) return cached;
    
    const data = await fetcher();
    await this.cache.set(key, data, this.defaultTTL);
    return data;
  }
  
  async invalidateMetrics(pattern: string): Promise<void> {
    await this.cache.deletePattern(pattern);
  }
}
```

## Integration with APIs

### 1. Monitoring API Endpoints
```typescript
// GET /api/monitoring/dashboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseTimeRange(searchParams.get('period') || '24h');
    
    const data = await Promise.all([
      getUsageStatistics(timeRange),
      getSystemPerformanceMetrics(),
      getScrapingPerformanceMetrics()
    ]);
    
    return Response.json({
      usage: data[0],
      performance: data[1],
      scraping: data[2],
      timestamp: new Date()
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
```

### 2. Real-time WebSocket Updates
```typescript
// WebSocket handler for real-time metrics
export function setupMetricsWebSocket(ws: WebSocket) {
  const monitor = new DashboardMonitor();
  
  const unsubscribe = monitor.subscribe((data) => {
    ws.send(JSON.stringify({
      type: 'metrics_update',
      data
    }));
  });
  
  monitor.startMonitoring(10000); // Update every 10 seconds
  
  ws.on('close', () => {
    unsubscribe();
    monitor.stopMonitoring();
  });
}
```

## Testing

### Unit Tests
```typescript
describe('Dashboard Data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should calculate usage statistics correctly', async () => {
    const mockData = createMockUsageData();
    jest.spyOn(supabaseClient, 'from').mockReturnValue(mockQuery(mockData));
    
    const stats = await getUsageStatistics({ period: '24h' });
    
    expect(stats.totalRequests).toBe(1000);
    expect(stats.uniqueUsers).toBe(50);
    expect(stats.activeCustomers).toBe(25);
  });
  
  it('should handle errors gracefully', async () => {
    jest.spyOn(supabaseClient, 'from').mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    
    await expect(getUsageStatistics({ period: '24h' }))
      .rejects.toThrow('Database connection failed');
  });
});
```

### Integration Tests
```typescript
describe('Monitoring Integration', () => {
  it('should collect and aggregate metrics end-to-end', async () => {
    // Create test data
    await createTestMetricsData();
    
    // Fetch dashboard data
    const response = await fetch('/api/monitoring/dashboard?period=1h');
    const data = await response.json();
    
    expect(data.usage).toBeDefined();
    expect(data.performance).toBeDefined();
    expect(data.scraping).toBeDefined();
    
    // Cleanup
    await cleanupTestData();
  });
});
```

## Security and Privacy

### 1. Data Anonymization
```typescript
function anonymizeUserData(data: UserMetric[]): UserMetric[] {
  return data.map(metric => ({
    ...metric,
    userId: hashUserId(metric.userId),
    email: null,
    personalInfo: null
  }));
}
```

### 2. Access Control
```typescript
async function requireMonitoringAccess(request: Request): Promise<User> {
  const user = await authenticateRequest(request);
  
  if (!user || !hasPermission(user, 'monitoring:read')) {
    throw new Error('Insufficient permissions for monitoring data');
  }
  
  return user;
}
```

## Best Practices

### 1. Efficient Querying
```typescript
// ✅ Use database aggregation
const metrics = await supabase
  .from('request_logs')
  .select('count(*), avg(response_time)')
  .gte('created_at', startTime)
  .single();

// ❌ Avoid fetching all data for aggregation
const allRequests = await supabase.from('request_logs').select('*');
const average = allRequests.reduce((sum, req) => sum + req.response_time, 0) / allRequests.length;
```

### 2. Monitoring Strategy
```typescript
// Monitor key business metrics
const KEY_METRICS = {
  userExperience: ['page_load_time', 'error_rate', 'conversion_rate'],
  systemHealth: ['cpu_usage', 'memory_usage', 'response_time'],
  businessMetrics: ['active_users', 'revenue', 'customer_satisfaction']
};
```

### 3. Alert Configuration
```typescript
// Set appropriate thresholds
const ALERT_THRESHOLDS = {
  critical: {
    errorRate: 10, // 10%
    responseTime: 5000, // 5 seconds
    memoryUsage: 95 // 95%
  },
  warning: {
    errorRate: 5, // 5%
    responseTime: 2000, // 2 seconds
    memoryUsage: 80 // 80%
  }
};
```

## Related Components

- `/lib/performance-monitor.ts` - System performance monitoring
- `/lib/error-logger.ts` - Error tracking and analysis
- `/lib/redis.ts` - Caching and queue monitoring
- `/app/api/monitoring/` - Monitoring API endpoints
- `/components/dashboard/` - Dashboard UI components

## Contributing

When working with monitoring utilities:

1. **Performance First**: Ensure monitoring doesn't impact application performance
2. **Data Privacy**: Anonymize or exclude sensitive data from metrics
3. **Scalable Design**: Design for high-volume data collection
4. **Clear Metrics**: Use meaningful metric names and descriptions
5. **Efficient Storage**: Optimize data storage for time-series data
6. **Real-time Capability**: Support real-time monitoring where needed

The monitoring system is essential for maintaining service quality and should be designed with performance, scalability, and reliability in mind.