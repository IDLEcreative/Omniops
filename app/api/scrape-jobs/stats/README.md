# Job Statistics API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md), [Individual Scrape Job API](/home/user/Omniops/app/api/scrape-jobs/[id]/README.md)
**Estimated Read Time:** 15 minutes

## Purpose

Complete API reference for comprehensive analytics and reporting on scrape jobs, including job performance metrics, success rates, domain-specific analytics, error analysis, and system health indicators.

## Quick Links

- [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md)
- [Individual Scrape Job API](/home/user/Omniops/app/api/scrape-jobs/[id]/README.md)
- [Job Queue API](/home/user/Omniops/app/api/scrape-jobs/next/README.md)
- [Job Retry API](/home/user/Omniops/app/api/scrape-jobs/[id]/retry/README.md)

## Endpoints

### GET /api/scrape-jobs/stats

Get comprehensive statistics about scrape jobs with optional domain filtering.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `domain` | string | Filter statistics to specific domain | All domains |

#### Response

**All Domains Statistics:**
```json
{
  "success": true,
  "data": {
    "domain": "all_domains",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "overview": {
      "totalJobs": 1250,
      "completedJobs": 1150,
      "failedJobs": 75,
      "pendingJobs": 15,
      "runningJobs": 10,
      "cancelledJobs": 25,
      "successRate": 0.92,
      "avgCompletionTime": 180.5
    },
    "statusBreakdown": {
      "pending": 15,
      "running": 10,
      "completed": 1150,
      "failed": 75,
      "cancelled": 25
    },
    "jobTypeBreakdown": {
      "domain_scrape": 800,
      "single_page": 300,
      "sitemap_crawl": 100,
      "product_catalog": 50
    },
    "priorityDistribution": {
      "1": 50,
      "2": 75,
      "3": 100,
      "4": 150,
      "5": 400,
      "6": 200,
      "7": 150,
      "8": 75,
      "9": 35,
      "10": 15
    },
    "performance": {
      "avgPagesPerJob": 85.2,
      "totalPagesProcessed": 106500,
      "avgProcessingSpeed": 2.3,
      "successfulRequests": 98750,
      "failedRequests": 7750,
      "requestSuccessRate": 0.927
    },
    "timeMetrics": {
      "avgJobDuration": 180.5,
      "medianJobDuration": 150.0,
      "fastestJob": 15.2,
      "slowestJob": 1800.0,
      "avgWaitTime": 45.3
    },
    "retryAnalysis": {
      "jobsWithRetries": 125,
      "totalRetries": 180,
      "avgRetriesPerFailedJob": 1.44,
      "retrySuccessRate": 0.67
    },
    "trends": {
      "last24Hours": {
        "jobsCreated": 45,
        "jobsCompleted": 42,
        "successRate": 0.93
      },
      "last7Days": {
        "jobsCreated": 280,
        "jobsCompleted": 265,
        "successRate": 0.95
      },
      "last30Days": {
        "jobsCreated": 1200,
        "jobsCompleted": 1150,
        "successRate": 0.92
      }
    },
    "errorAnalysis": {
      "commonErrors": [
        {
          "error": "Request timeout",
          "count": 25,
          "percentage": 33.3
        },
        {
          "error": "Connection refused",
          "count": 20,
          "percentage": 26.7
        },
        {
          "error": "Rate limit exceeded",
          "count": 15,
          "percentage": 20.0
        }
      ],
      "errorsByDomain": [
        {
          "domain": "slow-site.com",
          "errorCount": 12,
          "totalJobs": 20,
          "errorRate": 0.6
        },
        {
          "domain": "unreliable-site.com",
          "errorCount": 8,
          "totalJobs": 15,
          "errorRate": 0.53
        }
      ]
    }
  }
}
```

**Domain-Specific Statistics:**
```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "overview": {
      "totalJobs": 25,
      "completedJobs": 23,
      "failedJobs": 2,
      "pendingJobs": 0,
      "runningJobs": 0,
      "successRate": 0.92,
      "avgCompletionTime": 165.5
    },
    "jobHistory": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "job_type": "domain_scrape",
        "status": "completed",
        "priority": 5,
        "duration": 180.5,
        "pagesProcessed": 150,
        "dataExtracted": {
          "products": 45,
          "images": 234
        },
        "created_at": "2024-01-01T10:00:00.000Z",
        "completed_at": "2024-01-01T10:03:00.500Z"
      }
    ],
    "performance": {
      "avgPagesPerJob": 125.2,
      "totalPagesProcessed": 3130,
      "avgProcessingSpeed": 2.8,
      "dataExtractionRates": {
        "products": 1.2,
        "images": 8.5,
        "links": 12.3
      }
    },
    "siteCharacteristics": {
      "avgResponseTime": 850,
      "robotsTxtCompliant": true,
      "sslCertValid": true,
      "commonContentTypes": [
        "text/html",
        "application/json",
        "image/jpeg"
      ],
      "avgPageSize": 156.8
    },
    "recommendations": [
      {
        "type": "optimization",
        "message": "Consider increasing concurrent requests for this domain",
        "priority": "medium"
      },
      {
        "type": "configuration",
        "message": "Site responds well to scraping, default settings optimal",
        "priority": "low"
      }
    ]
  }
}
```

## Statistics Categories

### Overview Metrics

| Metric | Description |
|--------|-------------|
| `totalJobs` | Total number of jobs ever created |
| `completedJobs` | Jobs that finished successfully |
| `failedJobs` | Jobs that failed permanently |
| `pendingJobs` | Jobs waiting to be processed |
| `runningJobs` | Jobs currently being processed |
| `cancelledJobs` | Jobs that were cancelled |
| `successRate` | Percentage of jobs that completed successfully |
| `avgCompletionTime` | Average time to complete a job (seconds) |

### Performance Metrics

| Metric | Description |
|--------|-------------|
| `avgPagesPerJob` | Average number of pages processed per job |
| `totalPagesProcessed` | Total pages scraped across all jobs |
| `avgProcessingSpeed` | Pages processed per second |
| `successfulRequests` | HTTP requests that succeeded |
| `failedRequests` | HTTP requests that failed |
| `requestSuccessRate` | Percentage of successful HTTP requests |

### Time-Based Analysis

| Period | Description |
|--------|-------------|
| `last24Hours` | Statistics for the past 24 hours |
| `last7Days` | Weekly trends and patterns |
| `last30Days` | Monthly overview and trends |

### Error Analysis

| Analysis Type | Description |
|---------------|-------------|
| `commonErrors` | Most frequent error types and counts |
| `errorsByDomain` | Domains with highest error rates |
| `retryAnalysis` | Retry patterns and success rates |

## Error Handling

### 500 Internal Server Error

**Database Query Failed:**
```json
{
  "success": false,
  "error": "Failed to get scrape job statistics",
  "details": "Database connection timeout"
}
```

**Statistics Generation Error:**
```json
{
  "success": false,
  "error": "Failed to calculate job statistics",
  "details": "Insufficient data for analysis"
}
```

## Usage Examples

### cURL Examples

**Get overall statistics:**
```bash
curl "http://localhost:3000/api/scrape-jobs/stats"
```

**Get domain-specific statistics:**
```bash
curl "http://localhost:3000/api/scrape-jobs/stats?domain=example.com"
```

### TypeScript Integration

```typescript
import { scrapeJobManager } from '@/lib/scrape-job-manager';

// Get overall job statistics
const overallStats = await scrapeJobManager.getJobStats();
console.log(`Overall success rate: ${overallStats.overview.successRate * 100}%`);
console.log(`Total pages processed: ${overallStats.performance.totalPagesProcessed}`);

// Get domain-specific statistics
const domainStats = await scrapeJobManager.getJobStats('example.com');
console.log(`Domain success rate: ${domainStats.overview.successRate * 100}%`);
console.log(`Average pages per job: ${domainStats.performance.avgPagesPerJob}`);

// Analyze error patterns
if (overallStats.errorAnalysis.commonErrors.length > 0) {
  console.log('Most common errors:');
  overallStats.errorAnalysis.commonErrors.forEach(error => {
    console.log(`- ${error.error}: ${error.count} occurrences (${error.percentage}%)`);
  });
}
```

### Analytics Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart } from 'recharts';

interface JobStatsProps {
  domain?: string;
  refreshInterval?: number;
}

export function JobStatsDashboard({ domain, refreshInterval = 30000 }: JobStatsProps) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const url = domain 
        ? `/api/scrape-jobs/stats?domain=${encodeURIComponent(domain)}`
        : '/api/scrape-jobs/stats';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [domain, refreshInterval]);

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No statistics available</div>;

  const statusData = Object.entries(stats.statusBreakdown).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const trendData = [
    { period: '24h', success: stats.trends.last24Hours.successRate * 100 },
    { period: '7d', success: stats.trends.last7Days.successRate * 100 },
    { period: '30d', success: stats.trends.last30Days.successRate * 100 }
  ];

  return (
    <div className="stats-dashboard">
      <h2>Job Statistics {domain && `- ${domain}`}</h2>
      
      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Success Rate</h3>
          <div className={`stat-value ${stats.overview.successRate > 0.9 ? 'good' : 'warning'}`}>
            {(stats.overview.successRate * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <div className="stat-value">{stats.overview.totalJobs}</div>
        </div>
        
        <div className="stat-card">
          <h3>Avg Completion Time</h3>
          <div className="stat-value">{stats.overview.avgCompletionTime.toFixed(1)}s</div>
        </div>
        
        <div className="stat-card">
          <h3>Pages Processed</h3>
          <div className="stat-value">{stats.performance.totalPagesProcessed.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Job Status Distribution</h3>
          <PieChart width={300} height={200} data={statusData}>
            {/* Chart configuration */}
          </PieChart>
        </div>
        
        <div className="chart-container">
          <h3>Success Rate Trends</h3>
          <LineChart width={400} height={200} data={trendData}>
            {/* Chart configuration */}
          </LineChart>
        </div>
      </div>

      {/* Error Analysis */}
      {stats.errorAnalysis.commonErrors.length > 0 && (
        <div className="error-analysis">
          <h3>Common Errors</h3>
          <div className="error-list">
            {stats.errorAnalysis.commonErrors.map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-message">{error.error}</span>
                <span className="error-count">{error.count} ({error.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {stats.recommendations && (
        <div className="recommendations">
          <h3>Recommendations</h3>
          <div className="recommendation-list">
            {stats.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation ${rec.priority}`}>
                <strong>{rec.type}:</strong> {rec.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Automated Reporting

```typescript
class JobStatsReporter {
  async generateDailyReport() {
    const stats = await this.getStats();
    
    const report = {
      date: new Date().toISOString().split('T')[0],
      summary: {
        totalJobs: stats.trends.last24Hours.jobsCreated,
        completedJobs: stats.trends.last24Hours.jobsCompleted,
        successRate: stats.trends.last24Hours.successRate,
        avgProcessingTime: stats.timeMetrics.avgJobDuration
      },
      alerts: this.generateAlerts(stats),
      recommendations: this.generateRecommendations(stats)
    };

    return report;
  }

  generateAlerts(stats: any) {
    const alerts = [];

    // Low success rate alert
    if (stats.trends.last24Hours.successRate < 0.85) {
      alerts.push({
        type: 'warning',
        message: `Success rate dropped to ${(stats.trends.last24Hours.successRate * 100).toFixed(1)}%`,
        severity: 'high'
      });
    }

    // High error rate alert
    const errorRate = stats.errorAnalysis.commonErrors.reduce((sum, error) => sum + error.count, 0);
    if (errorRate > stats.trends.last24Hours.jobsCreated * 0.1) {
      alerts.push({
        type: 'error',
        message: `High error rate: ${errorRate} errors in last 24 hours`,
        severity: 'high'
      });
    }

    // Queue backlog alert
    if (stats.overview.pendingJobs > 50) {
      alerts.push({
        type: 'warning',
        message: `Large queue backlog: ${stats.overview.pendingJobs} pending jobs`,
        severity: 'medium'
      });
    }

    return alerts;
  }

  generateRecommendations(stats: any) {
    const recommendations = [];

    // Performance recommendations
    if (stats.timeMetrics.avgJobDuration > 300) {
      recommendations.push({
        type: 'performance',
        message: 'Consider optimizing job processing speed',
        action: 'Increase worker concurrency or optimize scraping logic'
      });
    }

    // Error reduction recommendations
    const timeoutErrors = stats.errorAnalysis.commonErrors
      .find(e => e.error.includes('timeout'));
    
    if (timeoutErrors && timeoutErrors.percentage > 20) {
      recommendations.push({
        type: 'configuration',
        message: 'High timeout error rate detected',
        action: 'Consider increasing request timeout values'
      });
    }

    return recommendations;
  }

  async getStats() {
    const response = await fetch('/api/scrape-jobs/stats');
    const data = await response.json();
    return data.data;
  }
}

// Usage
const reporter = new JobStatsReporter();
const dailyReport = await reporter.generateDailyReport();
console.log('Daily Report:', dailyReport);
```

## Performance Considerations

### Database Optimization

- Statistics queries can be expensive on large datasets
- Consider caching results for frequently requested statistics
- Use database indexes on timestamp and status columns
- Implement query time limits to prevent long-running queries

### Real-time Updates

For real-time dashboards, consider:
- WebSocket connections for live updates
- Server-sent events for statistics streaming
- Caching layer (Redis) for frequently accessed metrics
- Background job to pre-calculate expensive statistics

## Use Cases

### Business Intelligence

- **Success Rate Monitoring**: Track job success rates over time
- **Performance Analysis**: Identify bottlenecks and optimization opportunities
- **Capacity Planning**: Understand resource requirements and scaling needs
- **Error Pattern Analysis**: Identify systemic issues and fix root causes

### Operational Monitoring

- **Alert Systems**: Set up alerts for performance degradation
- **Health Checks**: Monitor system health and queue status
- **Trend Analysis**: Identify patterns and seasonal variations
- **Resource Utilization**: Track worker efficiency and resource usage

### Customer Reporting

- **SLA Compliance**: Report on service level agreement metrics
- **Domain Performance**: Provide customers with domain-specific insights
- **Data Quality**: Report on data extraction success rates
- **Usage Analytics**: Track customer usage patterns and requirements

## Related APIs

- [Scrape Jobs API](/app/api/scrape-jobs/README.md) - Job creation and listing
- [Individual Scrape Job API](/app/api/scrape-jobs/[id]/README.md) - Job details and updates
- [Job Queue API](/app/api/scrape-jobs/next/README.md) - Worker job processing
- [Job Retry API](/app/api/scrape-jobs/[id]/retry/README.md) - Retry operations