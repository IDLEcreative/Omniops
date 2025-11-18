**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Monitoring API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Chat API](/home/user/Omniops/app/api/chat/README.md), [Analytics System](/home/user/Omniops/lib/analytics/README.md)
**Estimated Read Time:** 20 minutes

## Purpose

This document provides comprehensive technical reference for system monitoring, analytics, and performance tracking including chat telemetry, cost analytics, performance metrics, system health monitoring, and business intelligence with real-time data processing and alerting capabilities.

## Quick Links

- [Chat API](/home/user/Omniops/app/api/chat/README.md)
- [Analytics Implementation](/home/user/Omniops/lib/analytics/README.md)
- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Dashboard Analytics](/home/user/Omniops/app/dashboard/README.md)

## Keywords

**Primary**: monitoring API, analytics, telemetry, performance tracking, cost analytics, system health, business intelligence
**Aliases**: monitoring endpoints, analytics API, metrics API, telemetry API
**Related**: chat analytics, token usage, cost tracking, performance metrics, real-time monitoring, alerting

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [GET /api/monitoring/chat](#get-apimonitoringchat)
  - [GET /api/monitoring/system](#get-apimonitoringsystem)
  - [GET /api/monitoring/performance](#get-apimonitoringperformance)
  - [GET /api/monitoring/costs](#get-apimonitoringcosts)
- [Metrics](#metrics)
- [Analytics](#analytics)
- [Performance Tracking](#performance-tracking)
- [Cost Management](#cost-management)
- [System Health](#system-health)
- [Real-time Monitoring](#real-time-monitoring)
- [Alerting](#alerting)
- [Examples](#examples)
- [Integration](#integration)
- [Best Practices](#best-practices)

---

System monitoring, analytics, and performance tracking endpoints for operational insights and business intelligence.

## Overview

This API provides comprehensive monitoring capabilities including chat analytics, cost tracking, performance metrics, and system health monitoring. Designed for operational teams and customer analytics with real-time data processing and alerting.

## Endpoints

### GET `/api/monitoring/chat`

Comprehensive chat telemetry and cost analytics with real-time performance tracking.

#### Authentication
- **Type**: Service role or administrative access
- **Rate Limits**: Enhanced limits for monitoring operations
- **Scope**: System-wide or domain-specific monitoring

#### Query Parameters
- `period` (enum): "hour", "day", "week", "month" (default: "day")
- `domain` (optional): Filter by specific customer domain
- `model` (optional): Filter by AI model (e.g., "gpt-5-mini", "gpt-4.1")
- `details` (boolean, default: false): Include detailed request logs
- `live` (boolean, default: true): Include live session data

#### Response Format

```json
{
  "success": true,
  "metrics": {
    "period": "day",
    "periodStart": "2024-01-16T10:30:00.000Z",
    "periodEnd": "2024-01-17T10:30:00.000Z",
    "totalRequests": 1247,
    "successfulRequests": 1235,
    "failedRequests": 12,
    "successRate": "99.04",
    "tokenUsage": {
      "totalInput": 1560000,
      "totalOutput": 485000,
      "totalTokens": 2045000,
      "avgInputPerRequest": 1251,
      "avgOutputPerRequest": 389
    },
    "cost": {
      "totalCostUSD": "61.3500",
      "avgCostPerRequest": "0.049217",
      "maxRequestCost": "0.245000",
      "minRequestCost": "0.008500",
      "costPerHour": "2.5563",
      "projectedDailyCost": "61.35",
      "projectedMonthlyCost": "1840.50"
    },
    "performance": {
      "avgDurationMs": 3245,
      "medianDurationMs": 2850,
      "p95DurationMs": 6200,
      "avgIterations": "2.15",
      "avgSearches": "3.42"
    },
    "modelBreakdown": {
      "gpt-5-mini": {
        "requests": 890,
        "tokens": 1543000,
        "cost": "46.290000",
        "avgDuration": 2950
      },
      "gpt-4.1": {
        "requests": 357,
        "tokens": 502000,
        "cost": "15.060000",
        "avgDuration": 3850
      }
    },
    "domainBreakdown": {
      "example.com": {
        "requests": 523,
        "cost": "25.650000",
        "tokens": 845000
      },
      "shop.example.com": {
        "requests": 724,
        "cost": "35.700000",
        "tokens": 1200000
      }
    }
  },
  "hourlyTrend": [
    {
      "hour": "2024-01-17T09:00:00.000Z",
      "requests": 52,
      "cost": "2.560000",
      "input_tokens": 65000,
      "output_tokens": 20000
    }
  ],
  "costAlerts": [
    {
      "type": "daily_threshold",
      "threshold": 50.00,
      "current": 61.35,
      "exceeded": true,
      "exceedance_percent": 22.7
    }
  ],
  "liveMetrics": {
    "activeSessions": 15,
    "liveAnalytics": {
      "sessionsLast24h": 145,
      "totalCostLast24h": "61.35",
      "avgCostPerSession": "0.423"
    }
  },
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

### POST `/api/monitoring/chat`

Perform monitoring actions and manage cost alerts.

#### Request Format

```json
{
  "action": "set-alert",
  "domain": "example.com",
  "alert_type": "daily_cost",
  "threshold_usd": 100.00
}
```

#### Supported Actions
- `set-alert`: Create or update cost alert thresholds
- `check-alerts`: Check current alert status
- `get-summary`: Get cost summary for specified period
- `cleanup-old-data`: Clean up old telemetry data

#### Response Format

```json
{
  "success": true,
  "alert": {
    "id": "alert_abc123",
    "domain": "example.com",
    "alert_type": "daily_cost",
    "threshold_usd": 100.00,
    "enabled": true,
    "created_at": "2024-01-17T10:30:00.000Z"
  }
}
```

### GET `/api/monitoring/scraping`

Website scraping performance and job monitoring.

#### Query Parameters
- `period` (enum): "hour", "day", "week", "month" (default: "day")
- `domain` (optional): Filter by specific domain
- `status` (optional): Filter by job status ("completed", "failed", "running")
- `includeDetails` (boolean, default: false): Include detailed job information

#### Response Format

```json
{
  "success": true,
  "metrics": {
    "period": "day",
    "totalJobs": 45,
    "completedJobs": 42,
    "failedJobs": 2,
    "runningJobs": 1,
    "successRate": "93.33",
    "pagesScraped": 12450,
    "avgPagesPerJob": 276,
    "avgJobDuration": "4.5 minutes",
    "totalDataProcessed": "156.7 MB",
    "embeddingsGenerated": 45230
  },
  "jobBreakdown": {
    "by_domain": {
      "example.com": {
        "jobs": 15,
        "pages": 4500,
        "success_rate": 100
      }
    },
    "by_priority": {
      "high": 8,
      "normal": 32,
      "low": 5
    }
  },
  "performance": {
    "avgPageProcessingTime": "2.3s",
    "avgEmbeddingTime": "0.8s",
    "avgDatabaseWriteTime": "0.2s"
  }
}
```

### GET `/api/monitoring/system`

Overall system health and performance monitoring.

#### Response Format

```json
{
  "success": true,
  "system": {
    "status": "healthy",
    "uptime": "99.95%",
    "services": {
      "api": {
        "status": "healthy",
        "response_time": "145ms",
        "error_rate": "0.02%"
      },
      "database": {
        "status": "healthy",
        "connection_pool": "85% utilized",
        "query_performance": "excellent"
      },
      "redis": {
        "status": "healthy",
        "memory_usage": "42%",
        "hit_rate": "96.8%"
      },
      "openai": {
        "status": "healthy",
        "api_latency": "850ms",
        "rate_limit_status": "normal"
      }
    },
    "performance": {
      "cpu_usage": "35%",
      "memory_usage": "67%",
      "disk_usage": "45%",
      "network_io": "normal"
    }
  }
}
```

## Features

### Real-time Analytics
- **Live Session Tracking**: Active chat sessions and user activity
- **Cost Monitoring**: Real-time cost tracking and projections
- **Performance Metrics**: Response times and system performance
- **Error Tracking**: Real-time error detection and analysis

### Cost Management
- **Token Usage Tracking**: Detailed token consumption analysis
- **Cost Projection**: Daily and monthly cost forecasting
- **Alert System**: Configurable cost threshold alerts
- **Model Comparison**: Performance and cost comparison across AI models

### Performance Monitoring
- **Response Time Analysis**: Distribution and percentile analysis
- **System Health**: Comprehensive system status monitoring
- **Resource Utilization**: CPU, memory, and network monitoring
- **Bottleneck Detection**: Identify and analyze performance bottlenecks

### Business Intelligence
- **Usage Patterns**: Customer usage analysis and trends
- **Domain Analytics**: Per-domain performance and cost tracking
- **Trend Analysis**: Historical trend analysis and forecasting
- **Custom Metrics**: Configurable business metrics and KPIs

## Cost Analytics

### Token Tracking
```json
{
  "tokenMetrics": {
    "models": {
      "gpt-5-mini": {
        "input_cost_per_1k": 0.015,
        "output_cost_per_1k": 0.060,
        "reasoning_cost_per_1k": 0.030
      },
      "gpt-4.1": {
        "input_cost_per_1k": 0.030,
        "output_cost_per_1k": 0.120
      }
    },
    "usage": {
      "total_input_tokens": 1560000,
      "total_output_tokens": 485000,
      "total_reasoning_tokens": 125000,
      "total_cost_usd": 61.35
    }
  }
}
```

### Cost Optimization
- **Model Selection**: Optimize model selection based on cost and performance
- **Token Efficiency**: Track token efficiency and optimization opportunities
- **Usage Forecasting**: Predict future usage and costs
- **Budget Management**: Set and monitor budget thresholds

## Performance Metrics

### Response Time Analysis
```json
{
  "responseTimeMetrics": {
    "percentiles": {
      "p50": 2850,
      "p75": 3950,
      "p90": 5200,
      "p95": 6200,
      "p99": 8900
    },
    "breakdown": {
      "search_time": 1200,
      "ai_processing": 1800,
      "database_time": 250
    }
  }
}
```

### System Performance
- **API Latency**: Request/response time tracking
- **Database Performance**: Query performance and optimization
- **Memory Usage**: Memory consumption and optimization
- **Cache Performance**: Cache hit rates and efficiency

## Alerting System

### Cost Alerts
```typescript
interface CostAlert {
  domain?: string               // Domain-specific or global
  alert_type: 'hourly' | 'daily' | 'weekly' | 'monthly'
  threshold_usd: number        // Cost threshold in USD
  enabled: boolean             // Alert enabled status
  notification_channels: string[] // Email, webhook, etc.
}
```

### Performance Alerts
- **Response Time Alerts**: Alert on slow response times
- **Error Rate Alerts**: Alert on increased error rates
- **System Health Alerts**: Alert on system issues
- **Capacity Alerts**: Alert on resource utilization

### Alert Management
- **Custom Thresholds**: Configurable alert thresholds
- **Multiple Channels**: Email, webhook, and dashboard notifications
- **Alert Escalation**: Escalation procedures for critical alerts
- **Alert History**: Complete alert history and resolution tracking

## Examples

### Get Daily Chat Analytics
```bash
curl -X GET 'http://localhost:3000/api/monitoring/chat?period=day&includeDetails=false&live=true' \
  -H 'Authorization: Bearer <admin_token>'
```

### Domain-Specific Monitoring
```bash
curl -X GET 'http://localhost:3000/api/monitoring/chat?domain=example.com&period=week' \
  -H 'Authorization: Bearer <admin_token>'
```

### Set Cost Alert
```bash
curl -X POST 'http://localhost:3000/api/monitoring/chat' \
  -H 'Authorization: Bearer <admin_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "set-alert",
    "domain": "example.com",
    "alert_type": "daily_cost",
    "threshold_usd": 50.00
  }'
```

### Get Scraping Analytics
```bash
curl -X GET 'http://localhost:3000/api/monitoring/scraping?period=day&includeDetails=true' \
  -H 'Authorization: Bearer <admin_token>'
```

### System Health Check
```bash
curl -X GET 'http://localhost:3000/api/monitoring/system' \
  -H 'Authorization: Bearer <admin_token>'
```

### Model Performance Comparison
```bash
curl -X GET 'http://localhost:3000/api/monitoring/chat?period=week&model=gpt-5-mini' \
  -H 'Authorization: Bearer <admin_token>'
```

## Database Schema

### Telemetry Tables
```sql
-- Chat telemetry
CREATE TABLE chat_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  domain TEXT,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10,6),
  duration_ms INTEGER,
  iterations INTEGER,
  search_count INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost alerts
CREATE TABLE chat_cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT,
  alert_type TEXT,
  threshold_usd DECIMAL(10,2),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain, alert_type)
);

-- Hourly cost aggregation
CREATE TABLE chat_telemetry_hourly_costs (
  hour TIMESTAMPTZ,
  domain TEXT,
  requests INTEGER,
  cost DECIMAL(10,6),
  input_tokens BIGINT,
  output_tokens BIGINT,
  PRIMARY KEY (hour, domain)
);
```

### Monitoring Functions
```sql
-- Check cost thresholds
CREATE OR REPLACE FUNCTION check_cost_thresholds()
RETURNS TABLE (
  alert_type TEXT,
  domain TEXT,
  threshold_usd DECIMAL,
  current_cost DECIMAL,
  exceeded BOOLEAN
);

-- Get cost summary
CREATE OR REPLACE FUNCTION get_chat_cost_summary(
  p_domain TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  period TEXT,
  total_cost DECIMAL,
  total_requests INTEGER,
  avg_cost_per_request DECIMAL
);
```

## Security and Access Control

### Authentication
- **Admin Access**: Full monitoring capabilities
- **Customer Access**: Limited to own domain data
- **Service Accounts**: Programmatic access for integrations
- **Read-only Access**: View-only monitoring access

### Data Privacy
- **Data Anonymization**: Personal data anonymization in logs
- **Retention Policies**: Automatic data retention and cleanup
- **Access Logging**: Complete access audit trails
- **GDPR Compliance**: Privacy-compliant data handling

### Rate Limiting
- **Enhanced Limits**: Higher limits for monitoring operations
- **Burst Capacity**: Handle monitoring traffic spikes
- **Priority Access**: Priority for critical monitoring requests
- **Quota Management**: Monitoring-specific quota management

## Integration

### Dashboard Integration
- **Real-time Updates**: Live dashboard data updates
- **Custom Dashboards**: Configurable monitoring dashboards
- **Alert Integration**: Dashboard alert notifications
- **Export Capabilities**: Data export for external analysis

### External Systems
- **Webhook Integration**: Real-time event notifications
- **SIEM Integration**: Security information and event management
- **APM Tools**: Application performance monitoring integration
- **Business Intelligence**: BI tool integration and data feeds

### API Integration
- **REST API**: Standard REST API for monitoring data
- **GraphQL**: Flexible data querying with GraphQL
- **WebSocket**: Real-time data streaming
- **Batch API**: Bulk data operations and exports

## Best Practices

### Monitoring Strategy
- **Key Metrics**: Focus on business-critical metrics
- **Alert Tuning**: Properly tune alerts to avoid noise
- **Trend Analysis**: Regular trend analysis and forecasting
- **Capacity Planning**: Use monitoring for capacity planning

### Performance Optimization
- **Query Optimization**: Optimize monitoring queries
- **Data Aggregation**: Use aggregated data for historical analysis
- **Caching Strategy**: Cache frequently accessed monitoring data
- **Resource Management**: Efficient resource usage for monitoring

### Cost Management
- **Budget Monitoring**: Regular budget monitoring and forecasting
- **Cost Optimization**: Identify cost optimization opportunities
- **Usage Analysis**: Analyze usage patterns for optimization
- **Alert Management**: Proactive cost alert management

## Related Endpoints

- `/api/chat-intelligent` - Generates telemetry data
- `/api/scrape` - Generates scraping performance data
- `/api/dashboard/analytics` - Customer-facing analytics
- `/api/admin/*` - Administrative monitoring endpoints

## Future Enhancements

### Planned Features
- **Machine Learning Insights**: AI-powered anomaly detection
- **Predictive Analytics**: Predictive performance and cost modeling
- **Advanced Alerting**: Intelligent alerting with ML-based thresholds
- **Custom Metrics**: User-defined custom metrics and KPIs
- **Mobile Dashboard**: Native mobile monitoring applications

### Integration Roadmap
- **Third-party Tools**: Enhanced third-party tool integrations
- **Cloud Monitoring**: Cloud provider monitoring integration
- **Log Aggregation**: Centralized log aggregation and analysis
- **Distributed Tracing**: End-to-end request tracing capabilities