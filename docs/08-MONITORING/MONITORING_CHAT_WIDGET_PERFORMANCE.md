# Chat Widget Performance Monitoring System

**Type:** Architecture & Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Verified For:** v0.1.0
**Dependencies:**
- [Performance Optimization Reference](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Purpose

Comprehensive monitoring, metrics collection, and alerting system for the chat widget rollout. Tracks conversation persistence, performance, memory usage, and API health with real-time alerting.

## Quick Links

- [Persistence Monitor](#persistence-monitor)
- [Performance Collector](#performance-collector)
- [Alerting System](#alerting-system)
- [API Endpoints](#api-endpoints)
- [Dashboard UI](#dashboard-ui)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Metrics Tracked](#metrics-tracked)
- [Target Thresholds](#target-thresholds)
- [Components](#components)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Alerting Rules](#alerting-rules)
- [Dashboard Guide](#dashboard-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Chat Widget Performance Monitoring System provides production-grade observability for the embedded chat widget. It tracks critical metrics across five categories:

1. **Persistence**: Conversation storage and restoration reliability
2. **Performance**: Render times, scroll performance, and responsiveness
3. **Memory**: Memory usage and leak detection
4. **API**: Response times, error rates, and cache effectiveness
5. **Tab Sync**: Multi-tab synchronization performance

### Key Features

- ✅ Real-time metrics collection
- ✅ Automatic threshold-based alerting
- ✅ Historical trend analysis
- ✅ Customer-specific metrics
- ✅ Export capabilities for external monitoring
- ✅ Zero-overhead when disabled
- ✅ Comprehensive dashboard UI

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat Widget (Client)                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ Persistence    │  │ Performance      │  │ API Calls   │ │
│  │ Operations     │  │ Measurements     │  │             │ │
│  └────────┬───────┘  └────────┬─────────┘  └──────┬──────┘ │
│           │                    │                    │        │
└───────────┼────────────────────┼────────────────────┼────────┘
            │                    │                    │
            ▼                    ▼                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │          POST /api/monitoring/widget (Ingest)           │
  └─────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
  │ Persistence      │  │ Performance      │  │ Alerting     │
  │ Monitor          │  │ Collector        │  │ System       │
  └──────────────────┘  └──────────────────┘  └──────────────┘
            │                    │                    │
            └────────────────────┴────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │  GET /api/monitoring/widget         │
            │  (Aggregated Metrics & Health)      │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │   Performance Monitoring Dashboard  │
            │   (components/dashboard/*)          │
            └─────────────────────────────────────┘
```

---

## Metrics Tracked

### Persistence Metrics

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|----------------|
| `persistence.success_rate` | % of successful storage operations | >99% | <95% |
| `persistence.restore_time` | Time to restore conversation | <200ms | >200ms |
| `persistence.data_loss` | Data loss incidents | 0 | >0 |
| `persistence.operations` | Total operations (save/restore/sync) | - | - |
| `persistence.error_rate` | Failed operations rate | <1% | >1% |

**Sub-Metrics:**
- Session restoration success rate
- Cross-page navigation data preservation
- Storage adapter reliability
- Error breakdown by type

### Performance Metrics

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|----------------|
| `render.message_time` | Time to render single message | <16ms | >16ms (p95) |
| `scroll.fps` | Scroll frames per second | >55fps | <55fps |
| `scroll.jank_percentage` | % of frames >16ms | <5% | >10% |
| `tabsync.latency` | Tab synchronization delay | <50ms | >50ms (p95) |

**Sub-Metrics:**
- Slow render count (>16ms)
- Minimum FPS observed
- Average render time
- P50, P95, P99 percentiles

### Memory Metrics

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|----------------|
| `memory.usage` | Current heap usage | <30MB | >50MB |
| `memory.peak` | Peak heap usage | <50MB | >75MB |
| `memory.average` | Average usage over window | <40MB | >60MB |

### API Metrics

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|----------------|
| `api.latency` | API response time | <300ms avg | >500ms (p95) |
| `api.error_rate` | Failed requests | <0.5% | >1% |
| `api.cache_hit_rate` | Cache effectiveness | >60% | <40% |

### Bundle Metrics

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|----------------|
| `bundle.load_time` | Time to load bundles | <500ms | >1000ms |
| `bundle.size` | Total bundle size | <500KB | >1MB |
| `bundle.cache_hit_rate` | Cached loads | >70% | <50% |

---

## Components

### 1. Persistence Monitor

**File:** `lib/monitoring/persistence-monitor.ts`

Tracks all conversation persistence operations including saves, restores, navigation events, and data loss incidents.

**Key Classes:**
- `PersistenceMonitor`: Singleton monitoring service
- `PersistenceMetric`: Individual operation metric
- `SessionRestorationMetric`: Session restore tracking
- `CrossPageNavigationMetric`: Cross-page data preservation

**Usage:**
```typescript
import { trackPersistence } from '@/lib/monitoring/persistence-monitor';

// Track a save operation
const startTime = performance.now();
try {
  await saveConversation(data);
  trackPersistence({
    operation: 'save',
    success: true,
    duration: performance.now() - startTime,
    timestamp: new Date(),
    sessionId: session.id,
    conversationId: conversation.id,
    metadata: {
      messageCount: messages.length,
      storageType: 'localStorage',
      dataSize: JSON.stringify(data).length,
    },
  });
} catch (error) {
  trackPersistence({
    operation: 'save',
    success: false,
    duration: performance.now() - startTime,
    timestamp: new Date(),
    sessionId: session.id,
    errorType: error.name,
    errorMessage: error.message,
  });
}
```

### 2. Performance Collector

**File:** `lib/monitoring/performance-collector.ts`

Collects render times, scroll performance (FPS), memory snapshots, tab sync latencies, API response times, and bundle load times.

**Key Classes:**
- `PerformanceCollector`: Singleton collection service
- `RenderMetric`: Message render performance
- `ScrollMetric`: Scroll FPS and jank tracking
- `MemorySnapshot`: Memory usage snapshots
- `TabSyncMetric`: Multi-tab sync performance
- `APIMetric`: API call performance
- `BundleLoadMetric`: Bundle loading performance

**Usage:**
```typescript
import { trackRender, startScrollMonitoring, stopScrollMonitoring } from '@/lib/monitoring/performance-collector';

// Track message render
const startTime = performance.now();
renderMessage(message);
trackRender({
  messageId: message.id,
  renderTime: performance.now() - startTime,
  contentLength: message.content.length,
  hasMarkdown: /[*_`]/.test(message.content),
  hasCodeBlocks: /```/.test(message.content),
  timestamp: new Date(),
});

// Track scroll performance
startScrollMonitoring();
// ... user scrolls ...
stopScrollMonitoring(scrollHeight, messageCount);
```

### 3. Alerting System

**File:** `lib/monitoring/alerting.ts`

Automatic threshold-based alerting with configurable severity levels and multiple dispatch channels.

**Key Classes:**
- `AlertingSystem`: Singleton alerting service
- `Alert`: Individual alert instance
- `AlertThresholds`: Configurable thresholds
- `AlertingConfig`: System configuration

**Alert Severities:**
- `info`: Informational alerts
- `warning`: Degraded performance
- `error`: Serious issues
- `critical`: System-critical failures

**Alert Categories:**
- `persistence`: Storage reliability
- `performance`: Render/scroll performance
- `memory`: Memory usage
- `api`: API health
- `error_rate`: Error rate thresholds
- `scroll`: Scroll performance
- `tab_sync`: Tab synchronization

**Usage:**
```typescript
import { alertingSystem } from '@/lib/monitoring/alerting';

// Configure custom thresholds
alertingSystem.config.thresholds.persistence.successRate = 97; // Lower threshold

// Manually check thresholds
alertingSystem.checkThresholds();

// Get active alerts
const alerts = alertingSystem.getAlerts({ resolved: false });

// Resolve an alert
alertingSystem.resolveAlert('alert_id_123');
```

---

## API Reference

### GET /api/monitoring/widget

Returns comprehensive widget metrics and health scores.

**Query Parameters:**
- `window` (number, optional): Time window in milliseconds (default: 300000 = 5 minutes)
- `format` ('json' | 'export', optional): Response format (default: 'json')
- `alerts` ('true' | 'false', optional): Include alerts (default: 'true')

**Response Format:**
```json
{
  "timestamp": "2025-11-03T10:00:00.000Z",
  "timeWindow": 300000,
  "health": {
    "overall": 95,
    "scores": {
      "persistence": 99,
      "performance": 92,
      "memory": 88,
      "api": 97
    },
    "status": "healthy"
  },
  "persistence": {
    "operations": {
      "total": 1250,
      "successful": 1248,
      "failed": 2,
      "successRate": 99.84
    },
    "performance": {
      "avgDuration": 45.2,
      "p50Duration": 38.0,
      "p95Duration": 125.0,
      "p99Duration": 180.0
    },
    "reliability": {
      "dataLossIncidents": 0,
      "errorsByType": {}
    },
    "restoration": {
      "total": 45,
      "successRate": 100.0,
      "avgDuration": 152.3,
      "avgMessagesRestored": 8.5
    },
    "navigation": {
      "total": 23,
      "successCount": 23,
      "dataPreservedCount": 23,
      "dataLossCount": 0,
      "avgDuration": 78.4
    }
  },
  "performance": {
    "renders": {
      "count": 452,
      "avgTime": 8.3,
      "p95Time": 14.2,
      "slowRenders": 12,
      "slowRenderRate": 2.65
    },
    "scroll": {
      "avgFps": 58.2,
      "minFps": 52.1,
      "jankPercentage": 3.2
    },
    "memory": {
      "current": {
        "bytes": 28639232,
        "mb": 27.31
      },
      "peak": {
        "bytes": 42598400,
        "mb": 40.63
      },
      "average": {
        "bytes": 33456128,
        "mb": 31.91
      }
    },
    "tabSync": {
      "operations": 156,
      "avgLatency": 32.5,
      "p95Latency": 48.2,
      "failures": 1,
      "failureRate": 0.64
    },
    "api": {
      "totalCalls": 89,
      "avgDuration": 285.4,
      "p95Duration": 445.2,
      "errorRate": 0.0,
      "cacheHitRate": 67.4
    },
    "bundles": {
      "totalLoaded": 3,
      "totalSize": {
        "bytes": 458752,
        "kb": 448.0,
        "mb": 0.44
      },
      "avgLoadTime": 425.3,
      "cacheHitRate": 66.7
    }
  },
  "alerts": {
    "active": [],
    "stats": {
      "total": 12,
      "unresolved": 0,
      "bySeverity": {
        "warning": 8,
        "error": 3,
        "critical": 1
      },
      "byCategory": {
        "performance": 5,
        "memory": 4,
        "api": 3
      }
    }
  }
}
```

**Health Score Calculation:**
- Overall score is weighted average:
  - Persistence: 40%
  - Performance: 30%
  - Memory: 15%
  - API: 15%

### POST /api/monitoring/widget

Record widget metrics from client-side.

**Request Body:**
```json
{
  "type": "persistence" | "restoration" | "navigation" | "render" | "tabSync" | "api" | "bundle",
  "metric": {
    // Metric-specific fields
  }
}
```

**Examples:**

```typescript
// Track persistence operation
fetch('/api/monitoring/widget', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'persistence',
    metric: {
      operation: 'save',
      success: true,
      duration: 42.5,
      timestamp: new Date(),
      sessionId: 'session_123',
      conversationId: 'conv_456',
      metadata: {
        messageCount: 10,
        storageType: 'localStorage',
        dataSize: 8192,
      },
    },
  }),
});

// Track render performance
fetch('/api/monitoring/widget', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'render',
    metric: {
      messageId: 'msg_789',
      renderTime: 12.3,
      contentLength: 256,
      hasMarkdown: true,
      hasCodeBlocks: false,
      timestamp: new Date(),
    },
  }),
});
```

---

## Dashboard Guide

### Accessing the Dashboard

Navigate to `/dashboard/performance` (component will need to be integrated into routing).

### Dashboard Sections

#### 1. Overall Health

Shows aggregated health score (0-100) and status indicator:
- **Healthy** (90-100): Green badge, all systems operational
- **Degraded** (70-89): Yellow badge, performance issues detected
- **Unhealthy** (<70): Red badge, critical issues requiring attention

Health scores breakdown by category with progress bars.

#### 2. Active Alerts

Displays unresolved alerts with:
- Severity badge (info/warning/error/critical)
- Alert title and message
- Category and timestamp
- Quick resolution actions

#### 3. Persistence Tab

- **Persistence Operations**: Success rate, duration metrics, data loss tracking
- **Session Restoration**: Restore success rate, timing, messages restored
- **Cross-Page Navigation**: Navigation count, data preservation rate

#### 4. Performance Tab

- **Render Performance**: Average render time, slow render rate, P95 metrics
- **Scroll Performance**: FPS metrics, jank percentage, minimum FPS
- **Tab Synchronization**: Sync operations, latency, failure rate

#### 5. Memory & API Tab

- **Memory Usage**: Current, peak, and average memory consumption
- **API Performance**: Response times, error rates, cache hit rates
- **Bundle Loading**: Bundle sizes, load times, cache effectiveness

#### 6. Alerts Tab

- **Alert Statistics**: Total alerts, unresolved count, severity breakdown
- **Active Alerts List**: Detailed view of all unresolved alerts
- **Resolution Actions**: Mark alerts as resolved

---

## Alerting Rules

### Persistence Alerts

| Condition | Severity | Threshold | Action |
|-----------|----------|-----------|--------|
| Success rate < 95% | **Error** | Last 5 min | Investigate storage adapter |
| Success rate < 90% | **Critical** | Last 5 min | Immediate investigation |
| Data loss > 0 | **Critical** | Any | Emergency response |
| P95 duration > 200ms | **Warning** | Last 5 min | Performance review |

### Performance Alerts

| Condition | Severity | Threshold | Action |
|-----------|----------|-----------|--------|
| P95 render > 16ms | **Warning** | Last 5 min | Optimize render logic |
| Avg FPS < 55 | **Warning** | Last 5 min | Scroll optimization |
| Jank > 10% | **Warning** | Last 5 min | Identify bottlenecks |
| Performance degradation > 20% | **Warning** | vs baseline | Compare with baseline |

### Memory Alerts

| Condition | Severity | Threshold | Action |
|-----------|----------|-----------|--------|
| Peak > 50MB | **Warning** | Current | Memory leak check |
| Peak > 75MB | **Error** | Current | Immediate cleanup |

### API Alerts

| Condition | Severity | Threshold | Action |
|-----------|----------|-----------|--------|
| P95 latency > 500ms | **Warning** | Last 5 min | API optimization |
| Error rate > 1% | **Warning** | Last 5 min | Error investigation |
| Error rate > 5% | **Error** | Last 5 min | Service health check |

---

## Usage Examples

### Basic Integration

```typescript
// In your chat widget initialization
import { trackPersistence, trackRender } from '@/lib/monitoring';

// Track conversation save
async function saveConversation(data: ConversationData) {
  const start = performance.now();
  try {
    await storage.save(data);
    trackPersistence({
      operation: 'save',
      success: true,
      duration: performance.now() - start,
      timestamp: new Date(),
      sessionId: data.sessionId,
      conversationId: data.id,
    });
  } catch (error) {
    trackPersistence({
      operation: 'save',
      success: false,
      duration: performance.now() - start,
      timestamp: new Date(),
      errorType: error.name,
      errorMessage: error.message,
    });
    throw error;
  }
}

// Track message render
function MessageComponent({ message }: { message: Message }) {
  useEffect(() => {
    const start = performance.now();
    return () => {
      trackRender({
        messageId: message.id,
        renderTime: performance.now() - start,
        contentLength: message.content.length,
        hasMarkdown: /[*_`]/.test(message.content),
        hasCodeBlocks: /```/.test(message.content),
        timestamp: new Date(),
      });
    };
  }, [message]);

  return <div>{message.content}</div>;
}
```

### Advanced: Custom Alerting

```typescript
import { AlertingSystem } from '@/lib/monitoring/alerting';

// Create custom alerting config
const customAlerting = AlertingSystem.getInstance({
  enabled: true,
  checkIntervalMs: 30000, // Check every 30 seconds
  thresholds: {
    persistence: {
      successRate: 97, // Stricter threshold
      restoreTime: 150,
      dataLoss: 0,
    },
    performance: {
      renderTime: 12, // Target 80fps instead of 60fps
      degradationPercent: 15,
    },
  },
  channels: ['console', 'webhook'], // Add webhook notifications
});

// Capture performance baseline for comparison
customAlerting.captureBaseline();
```

### Exporting Metrics

```typescript
// Export all metrics for external monitoring
const response = await fetch('/api/monitoring/widget?format=export');
const exportData = await response.json();

// Send to external monitoring service
await fetch('https://monitoring-service.com/ingest', {
  method: 'POST',
  body: JSON.stringify(exportData),
});
```

---

## Troubleshooting

### Issue: No Metrics Appearing

**Symptoms:**
- Dashboard shows "Loading..."
- API returns empty metrics

**Solutions:**
1. Verify metrics are being tracked in client code
2. Check POST requests to `/api/monitoring/widget` succeed
3. Ensure monitoring services initialized: `persistenceMonitor.getInstance()`
4. Check browser console for errors

### Issue: High Alert Volume

**Symptoms:**
- Too many alerts triggering
- Alert fatigue

**Solutions:**
1. Adjust thresholds in `lib/monitoring/alerting.ts`
2. Increase `checkIntervalMs` to reduce check frequency
3. Review and tune baseline metrics
4. Implement alert suppression for known issues

### Issue: Inaccurate Metrics

**Symptoms:**
- Metrics don't match observed behavior
- Wildly inconsistent values

**Solutions:**
1. Verify `performance.now()` availability in target browsers
2. Check clock synchronization for timestamp accuracy
3. Ensure metrics tracked at correct lifecycle points
4. Review calculation logic in collectors

### Issue: Performance Overhead

**Symptoms:**
- Widget feels slower with monitoring enabled
- High CPU usage

**Solutions:**
1. Reduce metric retention (adjust `MAX_METRICS` constants)
2. Increase aggregation intervals
3. Disable non-critical metric collection
4. Use sampling for high-frequency events

---

## Performance Baselines

### Expected Values (Healthy System)

| Metric | Target | Excellent | Good | Degraded |
|--------|--------|-----------|------|----------|
| Persistence Success Rate | >99% | >99.5% | 98-99% | <98% |
| Restore Time (P95) | <200ms | <100ms | 100-200ms | >200ms |
| Render Time (Avg) | <16ms | <10ms | 10-16ms | >16ms |
| Scroll FPS | >55fps | >58fps | 55-58fps | <55fps |
| Memory Usage | <30MB | <25MB | 25-40MB | >40MB |
| API Latency (P95) | <500ms | <300ms | 300-500ms | >500ms |
| Error Rate | <0.5% | <0.1% | 0.1-1% | >1% |

---

## Data Retention

- **In-Memory Metrics**: Last 1 hour (5000 metrics per category)
- **API Response Cache**: 30 seconds
- **Alert History**: Last 1000 alerts
- **Cleanup**: Automatic every 5 minutes

---

## Future Enhancements

**Planned Features:**
- [ ] Webhook notifications for critical alerts
- [ ] Email alerting integration
- [ ] Database persistence for historical analysis
- [ ] Grafana/Prometheus export format
- [ ] Customer-specific metric views
- [ ] Anomaly detection with ML
- [ ] Performance regression detection
- [ ] A/B test metric comparison

---

## References

- [Performance Optimization Guide](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Chat Widget Architecture](../01-ARCHITECTURE/ARCHITECTURE_CHAT_WIDGET.md)
- [Conversation Persistence](../08-MONITORING/CONVERSATION_ACCURACY_IMPROVEMENTS.md)

**Last Review:** 2025-11-03
**Next Review:** 2025-12-03
