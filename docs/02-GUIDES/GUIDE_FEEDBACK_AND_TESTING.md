# Feedback Collection & Testing Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Dependencies:**
- [Feedback System](../../lib/feedback/README.md)
- [Completion Report](../../ARCHIVE/completion-reports-2025-11/FEEDBACK_AND_SIMULATION_COMPLETE.md)

## Purpose

Quick start guide for using the feedback collection system and running production readiness tests.

## Quick Links

- [Feedback API](#feedback-api)
- [Dashboard Usage](#dashboard-usage)
- [Running Tests](#running-tests)
- [Load Testing](#load-testing)
- [Troubleshooting](#troubleshooting)

---

## Feedback Collection

### 1. Setup Database

```bash
# Apply migration
supabase db push supabase/migrations/20251103_create_feedback_table.sql

# Verify table created
supabase db execute "SELECT COUNT(*) FROM feedback;"
```

### 2. Integrate Widget

```typescript
import { FeedbackCollector } from '@/lib/feedback/feedback-collector';

// Initialize collector
const collector = new FeedbackCollector({
  domain: 'yoursite.com',
  sessionId: getUserSession(),
});

// Quick rating (after chat message)
await collector.submitQuickRating(5, conversationId);

// Bug report
await collector.submitBugReport('Issue description', {
  category: 'bug_mobile',
  conversationId,
});

// NPS (after conversation)
await collector.submitNPS(9, 'Great experience!');
```

### 3. Add Feedback Button

```typescript
import { createFeedbackWidget } from '@/lib/feedback/feedback-collector';

// Add to page
const widget = createFeedbackWidget({
  domain: 'yoursite.com',
  sessionId: sessionId,
  position: 'bottom-right', // or bottom-left, top-right, top-left
});

document.body.appendChild(widget);
```

### 4. View Dashboard

```tsx
import FeedbackDashboard from '@/components/dashboard/FeedbackDashboard';

export default function AdminFeedbackPage() {
  return <FeedbackDashboard domain="yoursite.com" />;
}
```

---

## API Usage

### Submit Feedback

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "satisfaction",
    "rating": 5,
    "message": "Great chat experience!",
    "category": "positive_feedback",
    "sessionId": "session-123",
    "domain": "example.com"
  }'
```

### Retrieve Feedback

```bash
# All feedback for domain
curl "http://localhost:3000/api/feedback?domain=example.com&limit=50"

# Urgent feedback only
curl "http://localhost:3000/api/feedback?urgent_only=true"

# Negative sentiment
curl "http://localhost:3000/api/feedback?sentiment=negative"

# Date range
curl "http://localhost:3000/api/feedback?start_date=2025-11-01&end_date=2025-11-03"
```

---

## Running Tests

### Simulation Tests

Test all rollout phases with 1000+ simulated users:

```bash
# Run all simulation tests
npm test -- rollout-simulation

# Run specific phase
npm test -- rollout-simulation -t "Phase 1"
npm test -- rollout-simulation -t "Phase 2"
npm test -- rollout-simulation -t "Phase 3"

# Run error scenarios
npm test -- rollout-simulation -t "Error Scenario"

# Run performance tests
npm test -- rollout-simulation -t "Performance Under Load"
```

**Expected Results:**
- All tests should pass ✅
- Phase 1: 1000 users < 2s
- Phase 2: 100 users with multi-tab
- Phase 3: 100 users with cross-page
- No critical errors

### E2E Production Tests

Verify complete user journeys:

```bash
# Run all E2E tests
npm test -- production-readiness

# Run specific journey
npm test -- production-readiness -t "product inquiry"
npm test -- production-readiness -t "support request"

# Run performance benchmarks
npm test -- production-readiness -t "Performance Benchmarks"

# Run analytics tests
npm test -- production-readiness -t "Analytics Accuracy"
```

**Performance Thresholds:**
- Widget load: < 500ms ✅
- First message: < 2000ms ✅
- Subsequent: < 1000ms ✅
- Storage ops: < 50ms ✅

---

## Load Testing

### Quick Load Test (100 Users)

```bash
npx tsx scripts/testing/load-simulator.ts \
  --users=100 \
  --duration=60 \
  --scenario=sustained
```

### Burst Traffic Test

```bash
npx tsx scripts/testing/load-simulator.ts \
  --users=1000 \
  --scenario=burst \
  --messages=5
```

### Ramp-Up Test

```bash
npx tsx scripts/testing/load-simulator.ts \
  --users=1000 \
  --duration=120 \
  --scenario=ramp-up
```

### Memory Leak Detection

```bash
npx tsx scripts/testing/load-simulator.ts \
  --duration=300 \
  --scenario=memory-leak
```

**Understanding Results:**

```
📊 LOAD TEST RESULTS
=================================================================
📈 Request Statistics:
  Total Requests: 5000
  Successful: 4985
  Failed: 15
  Success Rate: 99.70%
  Duration: 62.45s
  Throughput: 80.06 req/s

⏱️  Response Time Statistics:
  Average: 245.32ms
  Min: 45.12ms
  Max: 1234.56ms
  P50: 198.45ms      ← 50% of requests faster than this
  P95: 567.89ms      ← 95% of requests faster than this
  P99: 892.34ms      ← 99% of requests faster than this

💾 Memory Statistics:
  Initial: 45.23 MB
  Peak: 78.45 MB
  Final: 48.67 MB
  Leaked: 3.44 MB ✅  ← Should be < 10MB

🎯 Performance Assessment:
  ✅ Response Time (P95): 567.89ms (> 1000ms)
  ✅ Throughput: 80.06 req/s (> 10 req/s)
  ✅ Success Rate: 99.70% (> 99%)
  ✅ Memory Leak: 3.44MB (< 10MB)
```

---

## Monitoring in Production

### Check Feedback Stats

```bash
# Recent feedback
curl "http://localhost:3000/api/feedback?limit=10" | jq

# Urgent issues
curl "http://localhost:3000/api/feedback?urgent_only=true" | jq

# NPS trend
curl "http://localhost:3000/api/feedback?type=nps" | jq '.stats.nps_score'
```

### Monitor Performance

```typescript
// Add to monitoring dashboard
const metrics = {
  feedbackSubmissions: await getFeedbackCount(),
  avgNPS: await getAverageNPS(),
  urgentCount: await getUrgentFeedbackCount(),
  sentimentBreakdown: await getSentimentBreakdown(),
};

// Alert on issues
if (metrics.urgentCount > 5) {
  sendAlert('High urgent feedback volume');
}

if (metrics.avgNPS < 0) {
  sendAlert('NPS score negative - investigate');
}
```

---

## Troubleshooting

### Feedback Not Saving

**Symptoms:** API returns 200 but feedback doesn't appear in dashboard

**Checks:**
1. Verify RLS policies allow insert:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'feedback';
   ```

2. Check for validation errors:
   ```bash
   curl -X POST http://localhost:3000/api/feedback \
     -H "Content-Type: application/json" \
     -d '{"type":"invalid"}' # Should show validation error
   ```

3. Verify database connection:
   ```bash
   supabase db execute "SELECT COUNT(*) FROM feedback;"
   ```

### Tests Failing

**Symptoms:** Simulation or E2E tests fail

**Common Issues:**

1. **Dev server not running:**
   ```bash
   # Start dev server first
   npm run dev
   # Then run tests in another terminal
   npm test -- production-readiness
   ```

2. **Port conflict:**
   ```bash
   # Check what's on port 3000
   lsof -i :3000
   # Kill if needed
   pkill -f "next dev"
   ```

3. **Database not available:**
   ```bash
   # Check Supabase connection
   curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
   ```

### Load Test Failures

**Symptoms:** Load simulator exits with error code 1

**Checks:**

1. **API endpoint not responding:**
   ```bash
   curl http://localhost:3000/api/chat
   # Should return 405 (Method Not Allowed) not connection error
   ```

2. **Rate limiting triggered:**
   - Reduce `--users` parameter
   - Increase `--duration` to spread load

3. **Memory issues:**
   ```bash
   # Monitor memory during test
   watch -n 1 'ps aux | grep node'
   ```

### Dashboard Not Loading

**Symptoms:** FeedbackDashboard shows loading spinner forever

**Checks:**

1. **Authentication:**
   - User must be organization member
   - Check RLS policies

2. **API errors:**
   ```javascript
   // Check browser console
   // Look for 403 or 500 errors
   ```

3. **Network issues:**
   ```bash
   # Test API directly
   curl -H "x-session-id: test" \
     http://localhost:3000/api/feedback?domain=test.com
   ```

---

## Integration Examples

### React Component

```tsx
import { useState } from 'react';
import { FeedbackCollector } from '@/lib/feedback/feedback-collector';

export function ChatWidget() {
  const [collector] = useState(() => new FeedbackCollector({
    domain: window.location.hostname,
    sessionId: getSessionId(),
  }));

  const handleMessageSent = async (conversationId: string) => {
    // Show quick rating after message
    const rating = await showRatingPrompt();
    if (rating) {
      await collector.submitQuickRating(rating, conversationId);
    }
  };

  return <div>...</div>;
}
```

### Next.js API Route

```typescript
// app/api/custom/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FeedbackCollector } from '@/lib/feedback/feedback-collector';

export async function POST(req: NextRequest) {
  const { rating, conversationId } = await req.json();

  const collector = new FeedbackCollector({
    domain: req.headers.get('host') || 'unknown',
    sessionId: req.cookies.get('session_id')?.value || 'unknown',
  });

  await collector.submitQuickRating(rating, conversationId);

  return NextResponse.json({ success: true });
}
```

### Webhook Integration

```typescript
// Send feedback to external service
async function sendFeedbackWebhook(feedback: FeedbackData) {
  if (feedback.is_urgent) {
    await fetch('https://hooks.slack.com/your-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Urgent Feedback: ${feedback.message}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Type', value: feedback.type, short: true },
            { title: 'Rating', value: feedback.rating?.toString(), short: true },
            { title: 'Domain', value: feedback.domain, short: true },
          ],
        }],
      }),
    });
  }
}
```

---

## Best Practices

### When to Collect Feedback

✅ **Good Times:**
- After conversation completion
- After 5+ message exchanges
- On page exit (with modal)
- After successful order/action
- When user clicks help/support

❌ **Avoid:**
- Immediately on page load
- During active conversation
- More than once per session
- When user is frustrated

### Prompt Design

**Quick Rating:**
```
How was your chat experience?
[😞 😕 😐 🙂 😄]
```

**NPS:**
```
How likely are you to recommend us? (0-10)
[0] [1] [2] ... [10]
```

**Feature Request:**
```
What feature would make this better?
[Text area]
```

### Response Handling

```typescript
// Always handle errors gracefully
try {
  await collector.submitFeedback(...);
  showThankYouMessage();
} catch (error) {
  console.error('Feedback failed:', error);
  // Don't show error to user - fail silently
  // Store locally and retry later
  queueForRetry(feedbackData);
}
```

---

## Related Documentation

- [Feedback System README](../../lib/feedback/README.md) - Complete API reference
- [Completion Report](../../ARCHIVE/completion-reports-2025-11/FEEDBACK_AND_SIMULATION_COMPLETE.md) - Full implementation details
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - feedback table schema
- [API Reference](../09-REFERENCE/REFERENCE_API_ENDPOINTS.md) - All API endpoints

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Completion Report](../../ARCHIVE/completion-reports-2025-11/FEEDBACK_AND_SIMULATION_COMPLETE.md)
3. Check test output for specific errors
4. Review API logs in Supabase dashboard
