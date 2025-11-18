**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Library

# Feedback Collection System

**Type:** Library
**Status:** Active
**Last Updated:** 2025-11-03
**Dependencies:**
- [API Routes](../../app/api/feedback/route.ts) - Feedback API endpoints
- [Dashboard Component](../../components/dashboard/FeedbackDashboard.tsx) - Admin UI
- [Database Schema](../../supabase/migrations/20251103_create_feedback_table.sql) - Storage

## Purpose

Comprehensive user feedback collection system supporting quick ratings, detailed feedback forms, bug reports, feature requests, and NPS scoring with automatic sentiment analysis and trend tracking.

## Features

### Feedback Types

1. **Quick Satisfaction Ratings** - Thumbs up/down (1-5 scale)
2. **Detailed Feedback Forms** - Text-based feedback with categories
3. **Bug Reports** - Structured bug reporting with metadata
4. **Feature Requests** - Customer feature suggestions
5. **NPS Score Collection** - Net Promoter Score (0-10 scale)

### Analytics Features

- Automatic sentiment categorization (positive/neutral/negative)
- Urgent feedback flagging
- Common theme extraction
- NPS score calculation
- Average satisfaction tracking
- Trend analysis over time

## Quick Start

### In-Widget Feedback Button

```typescript
import { FeedbackCollector } from '@/lib/feedback/feedback-collector';

const collector = new FeedbackCollector({
  domain: 'example.com',
  sessionId: 'user-session-123',
});

// Quick rating (thumbs up)
await collector.submitQuickRating(5, conversationId);

// Detailed feedback
await collector.submitDetailedFeedback(
  FeedbackType.GENERAL,
  'The chat was very helpful!',
  {
    rating: 5,
    category: 'positive_experience',
    conversationId,
  }
);
```

### Browser Widget Integration

```html
<script>
import { createFeedbackWidget } from '@/lib/feedback/feedback-collector';

// Add feedback button to page
const widget = createFeedbackWidget({
  domain: 'example.com',
  sessionId: getCurrentSessionId(),
  position: 'bottom-right',
});

document.body.appendChild(widget);
</script>
```

### Admin Dashboard

```tsx
import FeedbackDashboard from '@/components/dashboard/FeedbackDashboard';

export default function AdminPage() {
  return (
    <div>
      <h1>Customer Feedback</h1>
      <FeedbackDashboard domain="example.com" />
    </div>
  );
}
```

## API Reference

### FeedbackCollector Class

#### Constructor

```typescript
new FeedbackCollector({
  domain: string;
  sessionId: string;
  apiEndpoint?: string; // Default: '/api/feedback'
})
```

#### Methods

**submitQuickRating(rating, conversationId?)**
- Submit 1 (thumbs down) or 5 (thumbs up)
- Optional conversation linking

**submitDetailedFeedback(type, message, options?)**
- Full feedback with message
- Options: category, rating, conversationId, metadata

**submitBugReport(description, options?)**
- Structured bug reporting
- Auto-captures: userAgent, URL, timestamp

**submitFeatureRequest(description, options?)**
- Feature suggestion submission
- Optional categorization

**submitNPS(score, comment?)**
- NPS score (0-10)
- Optional text comment

### FeedbackAnalyzer Utility

**Static Methods:**

```typescript
// Calculate NPS (% promoters - % detractors)
FeedbackAnalyzer.calculateNPS(scores: number[]): number

// Average satisfaction rating
FeedbackAnalyzer.calculateAverageSatisfaction(ratings: number[]): number

// Sentiment categorization
FeedbackAnalyzer.categorizeSentiment(rating: number): 'negative' | 'neutral' | 'positive'

// Extract common themes from text
FeedbackAnalyzer.extractThemes(messages: string[]): Map<string, number>

// Identify urgent feedback
FeedbackAnalyzer.isUrgent(feedback: FeedbackData): boolean
```

## API Endpoints

### POST /api/feedback

Submit new feedback.

**Request:**
```json
{
  "type": "satisfaction" | "bug" | "feature_request" | "general" | "nps",
  "rating": 1-5,
  "npsScore": 0-10,
  "message": "User feedback text",
  "category": "optional_category",
  "conversationId": "uuid",
  "sessionId": "session-id",
  "domain": "example.com",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "feedback_id": "uuid",
  "message": "Feedback submitted successfully"
}
```

### GET /api/feedback

Retrieve feedback (admin only).

**Query Parameters:**
- `domain` - Filter by domain
- `type` - Filter by feedback type
- `sentiment` - Filter by sentiment
- `urgent_only=true` - Urgent feedback only
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset
- `start_date` - ISO date string
- `end_date` - ISO date string

**Response:**
```json
{
  "feedback": [...],
  "count": 150,
  "stats": {
    "total": 150,
    "by_type": { "satisfaction": 80, "bug": 20, ... },
    "by_sentiment": { "positive": 100, "neutral": 30, "negative": 20 },
    "average_rating": 4.2,
    "nps_score": 42
  },
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 150
  }
}
```

## Database Schema

### feedback Table

```sql
id              UUID PRIMARY KEY
type            TEXT NOT NULL -- satisfaction, bug, feature_request, general, nps
category        TEXT
sentiment       TEXT -- positive, neutral, negative
is_urgent       BOOLEAN DEFAULT FALSE

rating          INTEGER (1-5)
nps_score       INTEGER (0-10)
message         TEXT

conversation_id UUID REFERENCES conversations(id)
session_id      TEXT
domain          TEXT
user_agent      TEXT
url             TEXT

metadata        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**Indexes:**
- `idx_feedback_domain` - Domain filtering
- `idx_feedback_type` - Type filtering
- `idx_feedback_sentiment` - Sentiment filtering
- `idx_feedback_is_urgent` - Urgent feedback (partial index)
- `idx_feedback_created_at` - Time-based queries
- `idx_feedback_metadata` - JSONB GIN index

## Row Level Security (RLS)

**Policies:**
1. **Public Insert** - Anyone can submit feedback
2. **Domain Owners Read** - Organization members read their domain's feedback
3. **Admins Read All** - Organization owners read all feedback

## Usage Examples

### Bug Report

```typescript
const collector = new FeedbackCollector({
  domain: 'myapp.com',
  sessionId: getUserSession(),
});

await collector.submitBugReport(
  'Chat widget not loading on mobile',
  {
    category: 'mobile_issue',
    conversationId: currentConversationId,
    metadata: {
      device: 'iPhone 15',
      os: 'iOS 17',
      browser: 'Safari 17',
    },
  }
);
```

### NPS Survey

```typescript
// After conversation completion
await collector.submitNPS(
  9, // Score 0-10
  'Great experience, very helpful!'
);
```

### Feature Request

```typescript
await collector.submitFeatureRequest(
  'Add voice message support',
  {
    category: 'feature_voice',
  }
);
```

## Analytics Dashboard

The `FeedbackDashboard` component provides:

1. **Stats Overview**
   - Total feedback count
   - Average satisfaction rating (with stars)
   - NPS score with trend indicator
   - Sentiment breakdown

2. **Filters**
   - All feedback
   - Urgent only
   - Negative sentiment only

3. **Feedback List**
   - Type-specific icons
   - Urgency badges
   - Star ratings
   - NPS scores
   - Time since submission
   - Domain and category tags
   - Link to related conversation

## Performance

- **Submission:** < 100ms (database write)
- **Retrieval:** < 200ms (with stats calculation)
- **Dashboard Load:** < 500ms (50 items + stats)

## Testing

### Unit Tests

```bash
npm test -- feedback-collector.test.ts
```

### Integration Tests

```bash
npm test -- feedback-api.test.ts
```

### Load Tests

```bash
npx tsx scripts/testing/load-simulator.ts --scenario=sustained --users=1000
```

## Troubleshooting

### Feedback Not Appearing in Dashboard

1. Check RLS policies - user must be organization member
2. Verify domain filter matches submitted feedback domain
3. Check browser console for API errors

### Urgent Feedback Not Flagged

Urgent criteria:
- Type = 'bug'
- Rating ≤ 2
- NPS score ≤ 3
- Keywords: broken, crash, error, urgent, critical, can't

### NPS Score Incorrect

NPS calculation:
- Promoters: scores 9-10
- Passives: scores 7-8
- Detractors: scores 0-6
- NPS = (% Promoters) - (% Detractors)

Example: 40% promoters, 30% detractors → NPS = 10

## Related Documentation

- [Database Schema](../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [API Documentation](../../docs/09-REFERENCE/REFERENCE_API_ENDPOINTS.md)
- [Analytics System](../analytics/README.md)
- [Dashboard Components](../../components/dashboard/README.md)

## Roadmap

- [ ] Email notifications for urgent feedback
- [ ] Slack integration for real-time alerts
- [ ] Automated response suggestions
- [ ] Sentiment analysis using AI
- [ ] Feedback clustering (similar issues)
- [ ] Multi-language support
- [ ] Export to CSV/Excel
- [ ] Webhook integration for third-party tools
