# Phase 4 Technical Specification

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-11-03
**Target Version:** v0.2.0
**Dependencies:**
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Phase 4 tables
- [Search Architecture](./ARCHITECTURE_SEARCH_SYSTEM.md) - AI integration patterns
- [Phase 4 Planning](../11-PLANNING/PHASE4_PLANNING.md) - Feature specifications
**Estimated Read Time:** 30 minutes

## Purpose
Comprehensive technical specification for Phase 4 AI-powered features documenting architecture patterns, API specifications, database schema changes, ML model integration strategy, performance requirements, security considerations, and testing strategy for engineering teams.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [API Specifications](#api-specifications)
4. [Database Schema](#database-schema)
5. [ML Model Integration](#ml-model-integration)
6. [Data Flow](#data-flow)
7. [Performance Requirements](#performance-requirements)
8. [Security & Privacy](#security--privacy)
9. [Testing Strategy](#testing-strategy)
10. [Scalability Considerations](#scalability-considerations)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser/Mobile)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Chat     │  │ Agent    │  │ Insights │  │ Alerts   │   │
│  │ Widget   │  │ Dashboard│  │ Dashboard│  │ Panel    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Next.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Rate Limiting | Auth | Validation | Response Cache   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Sentiment  │  │ Suggestion │  │ Escalation │           │
│  │ Analyzer   │  │ Generator  │  │ Engine     │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Category   │  │ Prediction │  │ Insights   │           │
│  │ Classifier │  │ Engine     │  │ Extractor  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│                  Message Processing Queue                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ BullMQ (Redis-backed)                                 │  │
│  │ - Priority queues for real-time vs batch             │  │
│  │ - Retry logic with exponential backoff               │  │
│  │ - Dead letter queue for failed jobs                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services Layer                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ OpenAI API │  │ Embeddings │  │ Supabase   │           │
│  │ (GPT-4)    │  │ (Vector)   │  │ (Postgres) │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 + React 19 | UI components, server-side rendering |
| **API** | Next.js API Routes | RESTful endpoints, WebSocket support |
| **Queue** | BullMQ + Redis | Async message processing |
| **ML/AI** | OpenAI GPT-4/4o-mini | Sentiment, suggestions, predictions |
| **Database** | Supabase (Postgres 15) | Data persistence, vector search |
| **Cache** | Redis | Result caching, session storage |
| **Monitoring** | Datadog + Sentry | Observability, error tracking |
| **Deployment** | Docker + Kubernetes | Container orchestration |

---

## System Components

### 1. Sentiment Analyzer

**Responsibility**: Analyze message emotion in real-time

**Interface**:
```typescript
interface SentimentAnalyzer {
  analyze(message: string, context?: ConversationContext): Promise<SentimentResult>;
  batchAnalyze(messages: string[]): Promise<SentimentResult[]>;
}

interface SentimentResult {
  emotion: Emotion;
  confidence: number; // 0-1
  indicators: string[]; // Keywords that triggered classification
  timestamp: Date;
}

type Emotion = 'frustrated' | 'satisfied' | 'confused' | 'urgent' | 'angry' | 'neutral' | 'happy';
```

**Implementation**:
```typescript
// lib/phase4/sentiment-analyzer.ts
export class SentimentAnalyzer {
  private openai: OpenAI;
  private cache: LRUCache<string, SentimentResult>;

  async analyze(message: string, context?: ConversationContext): Promise<SentimentResult> {
    // 1. Check cache
    const cacheKey = this.getCacheKey(message);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // 2. Build prompt with context
    const prompt = this.buildSentimentPrompt(message, context);

    // 3. Call OpenAI with structured output
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for consistency
      max_tokens: 100
    });

    // 4. Parse and validate result
    const result = JSON.parse(response.choices[0].message.content!);
    const validated = SentimentResultSchema.parse(result);

    // 5. Cache and return
    this.cache.set(cacheKey, validated);
    return validated;
  }

  private buildSentimentPrompt(message: string, context?: ConversationContext): string {
    return `Analyze the emotion in this customer message.

${context ? `Previous context: ${this.summarizeContext(context)}` : ''}

Message: "${message}"

Classify as one of: frustrated, satisfied, confused, urgent, angry, neutral, happy

Respond in JSON:
{
  "emotion": "frustrated",
  "confidence": 0.85,
  "indicators": ["taking too long", "frustrated"]
}`;
  }
}
```

**Performance Target**: <300ms p95 latency

---

### 2. Response Suggestion Generator

**Responsibility**: Generate 3 contextual response options

**Interface**:
```typescript
interface SuggestionGenerator {
  generateSuggestions(
    conversation: Conversation,
    latestMessage: Message,
    options?: SuggestionOptions
  ): Promise<ResponseSuggestion[]>;
}

interface ResponseSuggestion {
  tone: 'formal' | 'friendly' | 'technical';
  text: string;
  confidence: number;
}

interface SuggestionOptions {
  tones?: ('formal' | 'friendly' | 'technical')[];
  maxLength?: number; // words
  includeProductLinks?: boolean;
}
```

**Implementation**:
```typescript
// lib/phase4/suggestion-generator.ts
export class SuggestionGenerator {
  async generateSuggestions(
    conversation: Conversation,
    latestMessage: Message,
    options: SuggestionOptions = {}
  ): Promise<ResponseSuggestion[]> {
    // 1. Build context from conversation history
    const context = this.buildContext(conversation);

    // 2. Retrieve relevant product/content knowledge
    const knowledge = await this.retrieveKnowledge(latestMessage.content);

    // 3. Generate suggestions in parallel for each tone
    const tones = options.tones || ['formal', 'friendly', 'technical'];
    const suggestions = await Promise.all(
      tones.map(tone => this.generateSuggestion(context, knowledge, tone))
    );

    // 4. Rank by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private async generateSuggestion(
    context: string,
    knowledge: string,
    tone: string
  ): Promise<ResponseSuggestion> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        { role: 'system', content: SUGGESTION_SYSTEM_PROMPT },
        { role: 'user', content: this.buildPrompt(context, knowledge, tone) }
      ],
      temperature: 0.7, // Higher temperature for variety
      max_tokens: 200
    });

    return {
      tone: tone as 'formal' | 'friendly' | 'technical',
      text: response.choices[0].message.content!,
      confidence: this.calculateConfidence(response)
    };
  }
}
```

**Performance Target**: <1s p95 latency (async, doesn't block user)

---

### 3. Escalation Engine

**Responsibility**: Evaluate escalation rules and trigger actions

**Interface**:
```typescript
interface EscalationEngine {
  evaluateRules(
    conversation: Conversation,
    message: Message,
    sentiment?: SentimentResult
  ): Promise<EscalationDecision>;

  executeEscalation(
    decision: EscalationDecision
  ): Promise<EscalationEvent>;
}

interface EscalationDecision {
  shouldEscalate: boolean;
  matchingRules: EscalationRule[];
  priority: number; // 1-10
  routingStrategy: RoutingStrategy;
}

interface EscalationRule {
  id: string;
  name: string;
  triggerConditions: TriggerCondition[];
  routingStrategy: RoutingStrategy;
  enabled: boolean;
}
```

**Implementation**:
```typescript
// lib/phase4/escalation-engine.ts
export class EscalationEngine {
  private ruleCache: Map<string, EscalationRule[]>;

  async evaluateRules(
    conversation: Conversation,
    message: Message,
    sentiment?: SentimentResult
  ): Promise<EscalationDecision> {
    // 1. Load rules for domain
    const rules = await this.loadRules(conversation.domain_id);

    // 2. Evaluate each rule
    const matchingRules: EscalationRule[] = [];
    for (const rule of rules) {
      if (this.evaluateRule(rule, conversation, message, sentiment)) {
        matchingRules.push(rule);
      }
    }

    // 3. Determine if escalation needed
    const shouldEscalate = matchingRules.length > 0;

    // 4. Select routing strategy (highest priority rule)
    const routingStrategy = shouldEscalate
      ? matchingRules.sort((a, b) => b.priority - a.priority)[0].routingStrategy
      : null;

    return {
      shouldEscalate,
      matchingRules,
      priority: shouldEscalate ? routingStrategy!.priority : 0,
      routingStrategy: routingStrategy!
    };
  }

  private evaluateRule(
    rule: EscalationRule,
    conversation: Conversation,
    message: Message,
    sentiment?: SentimentResult
  ): boolean {
    for (const condition of rule.triggerConditions) {
      switch (condition.type) {
        case 'sentiment':
          if (!sentiment) return false;
          if (sentiment.emotion === condition.value && sentiment.confidence >= condition.threshold!) {
            return true;
          }
          break;

        case 'confidence':
          // Check AI confidence from last message
          const aiConfidence = this.getAIConfidence(message);
          if (aiConfidence < condition.threshold!) {
            return true;
          }
          break;

        case 'explicit':
          // Check for keywords like "human", "agent", "speak to someone"
          if (condition.keywords!.some(kw => message.content.toLowerCase().includes(kw))) {
            return true;
          }
          break;

        case 'custom':
          // Execute custom JavaScript condition
          if (this.evaluateCustomCondition(condition.expression!, conversation, message)) {
            return true;
          }
          break;
      }
    }
    return false;
  }

  async executeEscalation(decision: EscalationDecision): Promise<EscalationEvent> {
    // 1. Create escalation event
    const event = await this.createEscalationEvent(decision);

    // 2. Route to agent
    await this.routeToAgent(event, decision.routingStrategy);

    // 3. Send notifications
    await this.sendNotifications(event, decision.routingStrategy);

    return event;
  }
}
```

**Performance Target**: <50ms p95 latency (rule evaluation)

---

### 4. Insights Extractor (Batch)

**Responsibility**: Analyze conversation patterns and extract insights

**Interface**:
```typescript
interface InsightsExtractor {
  extractInsights(
    domainId: string,
    timeRange: TimeRange
  ): Promise<ConversationInsight[]>;

  clusterSimilarIssues(
    insights: ConversationInsight[]
  ): Promise<InsightCluster[]>;
}

interface ConversationInsight {
  insightType: InsightType;
  summary: string;
  frequency: number;
  conversationIds: string[];
  sentimentAvg: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

type InsightType = 'common_question' | 'pain_point' | 'feature_request' | 'competitor_mention' | 'product_feedback';
```

**Implementation**:
```typescript
// lib/phase4/insights-extractor.ts
export class InsightsExtractor {
  async extractInsights(domainId: string, timeRange: TimeRange): Promise<ConversationInsight[]> {
    // 1. Fetch conversations from time range
    const conversations = await this.fetchConversations(domainId, timeRange);

    // 2. Generate embeddings for all messages
    const embeddings = await this.generateEmbeddings(conversations);

    // 3. Cluster similar conversations
    const clusters = await this.clusterByTopic(embeddings);

    // 4. For each cluster, extract insights
    const insights: ConversationInsight[] = [];
    for (const cluster of clusters) {
      const insight = await this.analyzeCluster(cluster);
      if (insight.frequency >= 3) { // Minimum 3 occurrences
        insights.push(insight);
      }
    }

    // 5. Calculate trends
    const trendsAdded = await this.addTrends(insights, domainId);

    return trendsAdded;
  }

  private async analyzeCluster(cluster: EmbeddingCluster): Promise<ConversationInsight> {
    // Use GPT-4 to summarize cluster
    const summaryPrompt = this.buildClusterSummaryPrompt(cluster);
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-2024-04-09',
      messages: [
        { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
        { role: 'user', content: summaryPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return {
      insightType: parsed.insight_type,
      summary: parsed.summary,
      frequency: cluster.conversations.length,
      conversationIds: cluster.conversations.map(c => c.id),
      sentimentAvg: this.calculateAvgSentiment(cluster),
      trend: 'stable' // Updated in addTrends()
    };
  }
}
```

**Performance Target**: <5 minutes for 1000 conversations (batch processing)

---

## API Specifications

### Sentiment Analysis API

**Endpoint**: `GET /api/conversations/:id/sentiment`

**Request**:
```typescript
GET /api/conversations/uuid-here/sentiment
Authorization: Bearer <token>
```

**Response**:
```typescript
{
  "conversation_id": "uuid-here",
  "overall_sentiment": {
    "emotion": "satisfied",
    "confidence": 0.82,
    "trend": "improving"  // improving | stable | declining
  },
  "sentiment_timeline": [
    {
      "message_id": "msg-1",
      "emotion": "neutral",
      "confidence": 0.75,
      "timestamp": "2025-11-03T10:30:00Z"
    },
    {
      "message_id": "msg-2",
      "emotion": "satisfied",
      "confidence": 0.88,
      "timestamp": "2025-11-03T10:32:00Z"
    }
  ]
}
```

**Error Responses**:
```typescript
400 Bad Request: { "error": "Invalid conversation ID" }
401 Unauthorized: { "error": "Invalid or missing auth token" }
404 Not Found: { "error": "Conversation not found" }
500 Internal Server Error: { "error": "Sentiment analysis unavailable", "retry_after": 60 }
```

---

### Response Suggestions API

**Endpoint**: `POST /api/conversations/:id/suggest-responses`

**Request**:
```typescript
POST /api/conversations/uuid-here/suggest-responses
Authorization: Bearer <token>
Content-Type: application/json

{
  "message_id": "msg-123",
  "tone_preference": "friendly",  // optional
  "max_length": 100  // optional, words
}
```

**Response**:
```typescript
{
  "suggestions": [
    {
      "tone": "friendly",
      "text": "Hi there! I'd be happy to help you with that. Let me check on your order status right away.",
      "confidence": 0.92
    },
    {
      "tone": "formal",
      "text": "Thank you for contacting us. I will investigate your order status and provide an update shortly.",
      "confidence": 0.88
    },
    {
      "tone": "technical",
      "text": "I've located your order #12345 in our system. Current status: Shipped (tracking: 1Z999AA1). ETA: Nov 5.",
      "confidence": 0.85
    }
  ],
  "generated_at": "2025-11-03T10:35:00Z"
}
```

---

### Escalation Evaluation API

**Endpoint**: `POST /api/escalations/evaluate`

**Request**:
```typescript
POST /api/escalations/evaluate
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation_id": "uuid-here",
  "force_check": false  // optional
}
```

**Response**:
```typescript
{
  "should_escalate": true,
  "matching_rules": [
    {
      "rule_id": "rule-1",
      "rule_name": "Angry Customer Escalation",
      "trigger": "sentiment_angry_80"
    }
  ],
  "recommended_agent_type": "senior_support",
  "priority": 8,
  "estimated_wait_time": 120  // seconds
}
```

---

### Insights API

**Endpoint**: `GET /api/insights`

**Request**:
```typescript
GET /api/insights?domain_id=uuid&insight_type=common_question&min_frequency=5&trend=increasing
Authorization: Bearer <token>
```

**Response**:
```typescript
{
  "insights": [
    {
      "id": "insight-1",
      "insight_type": "common_question",
      "summary": "How do I track my order?",
      "frequency": 47,
      "sentiment_avg": 0.65,
      "trend": "increasing",
      "conversation_ids": ["conv-1", "conv-2", ...],
      "extracted_at": "2025-11-03T06:00:00Z"
    },
    {
      "id": "insight-2",
      "insight_type": "pain_point",
      "summary": "Checkout process is confusing",
      "frequency": 23,
      "sentiment_avg": 0.42,
      "trend": "stable",
      "conversation_ids": ["conv-5", "conv-9", ...],
      "extracted_at": "2025-11-03T06:00:00Z"
    }
  ],
  "total_count": 15,
  "page": 1,
  "page_size": 10
}
```

---

## Database Schema

See [PHASE4_PLANNING.md](../11-PLANNING/PHASE4_PLANNING.md#database-schema-changes) for complete schema definitions.

**Key Tables**:
1. `sentiment_analysis` - Message-level sentiment data
2. `response_suggestions` - Generated suggestions + usage tracking
3. `conversation_categories` - Auto-categorization results
4. `prediction_analysis` - Churn risk + outcome predictions
5. `escalation_rules` - Configurable escalation triggers
6. `escalation_events` - Escalation history
7. `conversation_insights` - Extracted patterns

**Total Storage Estimate**:
- 5,998 messages → 5,998 sentiment records (~12 MB)
- 2,132 conversations → 2,132 category records (~4 MB)
- 300 escalations → 300 events (~600 KB)
- 50 insights → 50 records (~100 KB)
- **Total**: ~17 MB initially, ~150 MB after 6 months

---

## ML Model Integration

### Model Selection & Costs

| Feature | Model | Input Tokens | Output Tokens | Cost per Call |
|---------|-------|--------------|---------------|---------------|
| Sentiment | GPT-4o-mini | ~50 | ~30 | $0.001 |
| Suggestions | GPT-4o-mini | ~500 | ~600 | $0.005 |
| Categories | GPT-4o-mini | ~300 | ~50 | $0.002 |
| Predictions | GPT-4 | ~800 | ~200 | $0.01 |
| Insights | GPT-4 + Embeddings | ~2000 | ~500 | $0.05 |

**Total Monthly Cost** (1000 customers, 20k conversations/month):
- Sentiment: 20k × $0.001 = $20
- Suggestions: 10k × $0.005 = $50
- Categories: 20k × $0.002 = $40
- Predictions: 5k × $0.01 = $50
- Insights: 200 batches × $0.05 = $10
- **Total**: ~$170/month

### Prompt Engineering

**Sentiment System Prompt**:
```
You are an expert at analyzing customer emotions in support conversations.
Classify the emotion as one of: frustrated, satisfied, confused, urgent, angry, neutral, happy.

Consider:
- Explicit emotional language ("frustrated", "love it")
- Implicit cues (repeated questions = confused, exclamation marks = urgent/angry)
- Context from conversation flow

Be conservative with negative emotions (threshold: 80%+ confidence).
Prefer "neutral" over guessing.

Respond ONLY in JSON format:
{
  "emotion": "frustrated",
  "confidence": 0.85,
  "indicators": ["taking too long", "frustrated"]
}
```

---

## Performance Requirements

### Latency Targets

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| Sentiment Analysis | 150ms | 300ms | 500ms |
| Suggestion Generation | 500ms | 1000ms | 2000ms |
| Escalation Evaluation | 20ms | 50ms | 100ms |
| Insight Extraction | N/A (batch) | N/A | N/A |

### Throughput Targets

- 1,000 sentiment analyses per minute
- 500 suggestions per minute
- 2,000 escalation evaluations per minute
- 100 conversations processed per minute (insights batch)

### Availability

- 99.9% uptime (SLA)
- <10 minutes downtime per month
- Graceful degradation if ML APIs fail (fallback to rule-based)

---

## Security & Privacy

### Data Protection

**Encryption**:
- All ML API calls use TLS 1.3
- Sentiment data encrypted at rest (database-level)
- No customer data sent to OpenAI for training (zero data retention policy)

**Access Control**:
- RLS policies on all Phase 4 tables
- Organization-based isolation
- API authentication required for all endpoints

**GDPR Compliance**:
- Sentiment data included in GDPR export
- Sentiment data deleted with conversation deletion
- Opt-out capability via widget configuration

---

## Testing Strategy

### Unit Tests

```typescript
describe('SentimentAnalyzer', () => {
  it('should classify angry message correctly', async () => {
    const analyzer = new SentimentAnalyzer();
    const result = await analyzer.analyze("This is unacceptable! I want a refund now!");

    expect(result.emotion).toBe('angry');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.indicators).toContain('unacceptable');
  });

  it('should return neutral for ambiguous message', async () => {
    const result = await analyzer.analyze("Ok");
    expect(result.emotion).toBe('neutral');
  });
});
```

### Integration Tests

```typescript
describe('Phase 4 E2E', () => {
  it('should analyze sentiment and trigger escalation', async () => {
    // 1. Send angry message
    const message = await sendMessage("This product is terrible!");

    // 2. Wait for sentiment analysis
    await waitFor(() => {
      expect(message.sentiment).toBeDefined();
      expect(message.sentiment.emotion).toBe('angry');
    });

    // 3. Check escalation triggered
    const escalation = await getEscalationEvent(message.conversation_id);
    expect(escalation).toBeDefined();
    expect(escalation.escalation_rule_id).toBe('angry-customer-rule');
  });
});
```

---

## Scalability Considerations

### Horizontal Scaling

- API servers: Auto-scale from 3 to 20 pods based on CPU
- Queue workers: Scale from 2 to 10 based on queue depth
- Redis: Cluster mode with 3 replicas

### Vertical Scaling

- Database: Upgrade from 2 CPU/8GB to 4 CPU/16GB if query latency >100ms
- Redis: Upgrade from 4GB to 10GB if memory >80%

### Cost Optimization

- Cache sentiment results (24 hour TTL) → 60% reduction
- Batch insight extraction (every 6 hours) → 80% reduction
- Use GPT-4o-mini instead of GPT-4 where possible → 75% reduction

---

**Document Status**: ✅ Complete technical specification
**Next Review**: 2025-11-10 (after architecture review)
**Owner**: Engineering Team
