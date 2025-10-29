# Expert-Level Customer Service Competency Improvement Plan

**Target:** Increase accuracy from 71.4% to 90%+ (Expert Level)
**Timeline:** 2-3 weeks
**Priority:** High-Impact Improvements First

---

## Executive Summary

Current system shows **100% critical product accuracy** but struggles with complex conversational context management. This plan addresses the 18.6% gap to expert level through four strategic improvements with measurable impact.

### Quick Win Summary
| Improvement | Current | Target | Impact | Effort | Priority |
|-------------|---------|--------|--------|--------|----------|
| Correction Tracking | 33% | 90% | +19% | Low | 🔴 Critical |
| List Memory | 33% | 85% | +17% | Medium | 🔴 Critical |
| Pronoun Resolution | 50% | 85% | +12% | Medium | 🟡 High |
| Topic Management | 75% | 92% | +6% | Low | 🟢 Medium |

**Expected Overall Accuracy After Implementation:** 90-93% ✅

---

## Phase 1: Conversation Context Enhancement (Week 1)

### 1.1 Implement Conversation Metadata System

**Problem:** No structured tracking of conversation entities, corrections, or references.

**Solution:** Create a conversation metadata layer that tracks important context elements.

#### Technical Design

```typescript
// New file: lib/chat/conversation-metadata.ts

export interface ConversationEntity {
  id: string;
  type: 'product' | 'order' | 'category' | 'correction' | 'list';
  value: string;
  aliases: string[]; // For pronoun resolution
  turnNumber: number;
  metadata?: Record<string, any>;
}

export interface ConversationCorrection {
  turnNumber: number;
  originalValue: string;
  correctedValue: string;
  context: string;
}

export interface NumberedListReference {
  turnNumber: number;
  listId: string;
  items: Array<{
    position: number;
    name: string;
    url?: string;
    details?: string;
  }>;
}

export class ConversationMetadataManager {
  private entities: Map<string, ConversationEntity> = new Map();
  private corrections: ConversationCorrection[] = [];
  private lists: Map<string, NumberedListReference> = new Map();
  private currentTurn: number = 0;

  // Entity tracking for pronoun resolution
  trackEntity(entity: ConversationEntity): void {
    this.entities.set(entity.id, entity);
  }

  resolveReference(reference: string): ConversationEntity | null {
    // Resolve "it", "that", "the first one", etc.
    // Implementation details...
  }

  // Correction tracking
  trackCorrection(original: string, corrected: string, context: string): void {
    this.corrections.push({
      turnNumber: this.currentTurn,
      originalValue: original,
      correctedValue: corrected,
      context
    });
  }

  // List tracking
  trackList(items: Array<{ name: string; url?: string }>): string {
    const listId = `list_${this.currentTurn}_${Date.now()}`;
    this.lists.set(listId, {
      turnNumber: this.currentTurn,
      listId,
      items: items.map((item, idx) => ({
        position: idx + 1,
        name: item.name,
        url: item.url
      }))
    });
    return listId;
  }

  resolveListItem(itemNumber: number): any | null {
    // Get most recent list
    const sortedLists = Array.from(this.lists.values())
      .sort((a, b) => b.turnNumber - a.turnNumber);

    if (sortedLists.length === 0) return null;

    const recentList = sortedLists[0];
    return recentList.items.find(item => item.position === itemNumber);
  }

  // Generate enhanced context for AI
  generateContextSummary(): string {
    let summary = '';

    // Add corrections
    if (this.corrections.length > 0) {
      summary += '\n\n**Important Corrections in This Conversation:**\n';
      this.corrections.forEach(correction => {
        summary += `- User corrected "${correction.originalValue}" to "${correction.correctedValue}" (Turn ${correction.turnNumber})\n`;
      });
    }

    // Add tracked entities
    const recentEntities = Array.from(this.entities.values())
      .filter(e => this.currentTurn - e.turnNumber <= 5)
      .sort((a, b) => b.turnNumber - a.turnNumber);

    if (recentEntities.length > 0) {
      summary += '\n\n**Recently Mentioned:**\n';
      recentEntities.forEach(entity => {
        summary += `- ${entity.type}: "${entity.value}" (Turn ${entity.turnNumber})\n`;
        if (entity.aliases.length > 0) {
          summary += `  Pronouns referring to this: ${entity.aliases.join(', ')}\n`;
        }
      });
    }

    // Add active lists
    if (this.lists.size > 0) {
      const recentList = Array.from(this.lists.values())
        .sort((a, b) => b.turnNumber - a.turnNumber)[0];

      summary += '\n\n**Active Numbered List (Most Recent):**\n';
      recentList.items.forEach(item => {
        summary += `- Item ${item.position}: ${item.name}\n`;
      });
      summary += '\n**When user says "item 2" or "the second one", refer to this list.**\n';
    }

    return summary;
  }

  incrementTurn(): void {
    this.currentTurn++;
  }

  serialize(): string {
    return JSON.stringify({
      entities: Array.from(this.entities.entries()),
      corrections: this.corrections,
      lists: Array.from(this.lists.entries()),
      currentTurn: this.currentTurn
    });
  }

  static deserialize(data: string): ConversationMetadataManager {
    const parsed = JSON.parse(data);
    const manager = new ConversationMetadataManager();
    manager.entities = new Map(parsed.entities);
    manager.corrections = parsed.corrections;
    manager.lists = new Map(parsed.lists);
    manager.currentTurn = parsed.currentTurn;
    return manager;
  }
}
```

#### Database Schema Addition

```sql
-- Add metadata column to conversations table
ALTER TABLE conversations
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX idx_conversations_metadata ON conversations USING gin(metadata);
```

#### Integration Points

**File:** `app/api/chat/route.ts`

```typescript
// After line 139 - Load or create metadata manager
const metadataJson = await adminSupabase
  .from('conversations')
  .select('metadata')
  .eq('id', conversationId)
  .single();

const metadataManager = metadataJson?.metadata
  ? ConversationMetadataManager.deserialize(JSON.stringify(metadataJson.metadata))
  : new ConversationMetadataManager();

// Increment turn counter
metadataManager.incrementTurn();

// Generate enhanced context for AI
const enhancedContext = metadataManager.generateContextSummary();

// Add to conversation messages (after line 146)
const conversationMessages = buildConversationMessages(
  getCustomerServicePrompt() + enhancedContext, // Enhanced system prompt
  historyData,
  message
);

// After AI response (before line 170) - Parse response for entities/corrections
await parseAndTrackEntities(finalResponse, message, metadataManager);

// Save metadata back to database
await adminSupabase
  .from('conversations')
  .update({ metadata: JSON.parse(metadataManager.serialize()) })
  .eq('id', conversationId);
```

**Success Metrics:**
- ✅ Correction tracking: 33% → 90%
- ✅ List references: 33% → 85%
- ✅ Basic pronoun resolution: 50% → 75%

---

## Phase 2: Intelligent Response Analysis (Week 1-2)

### 2.1 Response Parser for Entity Extraction

**Problem:** AI generates responses but we don't analyze them to track what was mentioned.

**Solution:** Parse AI responses to automatically detect and track entities, corrections, and lists.

#### Technical Design

```typescript
// New file: lib/chat/response-parser.ts

export interface ParsedResponse {
  entities: ConversationEntity[];
  corrections: Array<{ original: string; corrected: string }>;
  lists: Array<{ items: Array<{ name: string; url?: string }> }>;
}

export class ResponseParser {
  /**
   * Parse AI response for trackable elements
   */
  static parseResponse(
    userMessage: string,
    aiResponse: string,
    turnNumber: number
  ): ParsedResponse {
    const result: ParsedResponse = {
      entities: [],
      corrections: [],
      lists: []
    };

    // 1. Detect corrections in user message
    const correctionPatterns = [
      /(?:sorry|actually|no|wait)[,\s]+(?:i meant|it'?s|I said)\s+([^\s,]+)\s+(?:not|instead of)\s+([^\s,]+)/i,
      /not\s+([^\s,]+)[,\s]*(?:but|it's)\s+([^\s,]+)/i,
      /([^\s,]+)\s*→\s*([^\s,]+)/
    ];

    for (const pattern of correctionPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        // For "I meant X not Y", X is corrected, Y is original
        result.corrections.push({
          original: match[2],
          corrected: match[1]
        });
      }
    }

    // 2. Extract product references
    const productUrlPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = productUrlPattern.exec(aiResponse)) !== null) {
      const [_, productName, url] = match;
      result.entities.push({
        id: `product_${turnNumber}_${productName.replace(/\s+/g, '_')}`,
        type: 'product',
        value: productName,
        aliases: ['it', 'that', 'this', 'the product'],
        turnNumber,
        metadata: { url }
      });
    }

    // 3. Extract order references
    const orderPattern = /order\s*#?(\w+)/gi;
    while ((match = orderPattern.exec(aiResponse)) !== null) {
      result.entities.push({
        id: `order_${turnNumber}_${match[1]}`,
        type: 'order',
        value: match[1],
        aliases: ['it', 'that', 'the order', 'my order'],
        turnNumber
      });
    }

    // 4. Detect numbered lists
    const listPattern = /(?:^|\n)[\s]*(?:[•\-*]|\d+\.)\s*\[([^\]]+)\]/gm;
    const listItems: Array<{ name: string; url?: string }> = [];

    while ((match = listPattern.exec(aiResponse)) !== null) {
      const urlMatch = aiResponse.substring(match.index).match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (urlMatch) {
        listItems.push({
          name: urlMatch[1],
          url: urlMatch[2]
        });
      }
    }

    if (listItems.length >= 2) { // Only track if 2+ items
      result.lists.push({ items: listItems });
    }

    return result;
  }
}

/**
 * Helper function to parse and track entities
 */
export async function parseAndTrackEntities(
  aiResponse: string,
  userMessage: string,
  metadataManager: ConversationMetadataManager
): Promise<void> {
  const parsed = ResponseParser.parseResponse(
    userMessage,
    aiResponse,
    metadataManager['currentTurn'] // Access private property
  );

  // Track entities
  parsed.entities.forEach(entity => {
    metadataManager.trackEntity(entity);
  });

  // Track corrections
  parsed.corrections.forEach(correction => {
    metadataManager.trackCorrection(
      correction.original,
      correction.corrected,
      userMessage
    );
  });

  // Track lists
  parsed.lists.forEach(list => {
    metadataManager.trackList(list.items);
  });
}
```

**Success Metrics:**
- ✅ Auto-detect corrections: 90%+ accuracy
- ✅ Auto-detect numbered lists: 95%+ accuracy
- ✅ Auto-detect product references: 85%+ accuracy

---

## Phase 3: Enhanced System Prompts (Week 2)

### 3.1 Context-Aware Prompt Enhancement

**Problem:** System prompt is static and doesn't adapt to conversation state.

**Solution:** Generate dynamic system prompts that include conversation metadata.

#### Implementation

**File:** `lib/chat/system-prompts.ts`

Add new function:

```typescript
/**
 * Get enhanced customer service prompt with conversation metadata
 */
export function getEnhancedCustomerServicePrompt(
  metadataManager: ConversationMetadataManager
): string {
  const basePrompt = getCustomerServicePrompt();
  const contextSummary = metadataManager.generateContextSummary();

  // Add metadata-specific instructions
  const enhancements = `

## CRITICAL: Conversation Context Awareness

${contextSummary}

### Reference Resolution Rules:
1. When user says "it", "that", "this", or "the first/second one":
   - Check the "Recently Mentioned" section above
   - Check the "Active Numbered List" section above
   - Use the most recent relevant entity

2. When user provides a correction (e.g., "I meant X not Y"):
   - IMMEDIATELY acknowledge: "Got it, so we're looking at [X] instead of [Y]"
   - Update your understanding completely
   - Reference the correction explicitly in your response

3. When user refers to numbered items (e.g., "tell me about item 2"):
   - Look at "Active Numbered List" above
   - Provide details about that specific item by position
   - Confirm which item: "For item 2 ([Product Name])..."

4. Topic Management:
   - When switching topics, do NOT mention previous topic unless asked
   - Maintain separate mental context for each topic thread
   - When returning to a topic, reference the previous discussion explicitly

### Conversation Quality Standards:
- **Always acknowledge corrections explicitly** - shows you're listening
- **Reference specific items by number when user asks** - shows you remember
- **Use "regarding [specific thing]"** at start of response to show context awareness
- **Never ask "which one?" if you have a numbered list** - the user expects you to remember
`;

  return basePrompt + enhancements;
}
```

**Success Metrics:**
- ✅ Context awareness: Measurable in all test scenarios
- ✅ Correction acknowledgment: 90%+ of corrections explicitly recognized
- ✅ List reference resolution: 85%+ accuracy

---

## Phase 4: Testing & Validation (Week 2-3)

### 4.1 Enhanced Test Suite

**Problem:** Current tests don't validate metadata tracking.

**Solution:** Add metadata validation to existing tests.

#### New Test File

```typescript
// New file: scripts/tests/test-metadata-tracking.ts

describe('Metadata Tracking Competency', () => {
  it('should track corrections accurately', async () => {
    const conversation = await startConversation();

    // Turn 1
    await sendMessage(conversation, "I need parts for ZF5 pump");
    const response1 = await getResponse(conversation);

    // Turn 2 - Correction
    await sendMessage(conversation, "Sorry, I meant ZF4 not ZF5");
    const response2 = await getResponse(conversation);

    // Validation
    expect(response2).toContain('ZF4'); // Uses corrected value
    expect(response2).toMatch(/got it|understood|so.*ZF4/i); // Acknowledges correction
    expect(response2).not.toContain('ZF5'); // Doesn't use old value
  });

  it('should resolve numbered list references', async () => {
    const conversation = await startConversation();

    // Turn 1 - Generate list
    await sendMessage(conversation, "Show me Cifa mixer pumps");
    const response1 = await getResponse(conversation);

    // Extract second item name from list
    const listItems = extractNumberedList(response1);
    const item2Name = listItems[1].name;

    // Turn 2 - Reference item by number
    await sendMessage(conversation, "Tell me about item 2");
    const response2 = await getResponse(conversation);

    // Validation
    expect(response2).toContain(item2Name); // References correct item
    expect(response2).toMatch(/item 2|second one/i); // Acknowledges which item
  });

  it('should maintain pronoun resolution chains', async () => {
    const conversation = await startConversation();

    // Turn 1
    await sendMessage(conversation, "Do you have the A4VTG90 pump?");
    await getResponse(conversation);

    // Turn 2
    await sendMessage(conversation, "How much does it cost?");
    const response2 = await getResponse(conversation);
    expect(response2).toContain('A4VTG90'); // Resolves "it"

    // Turn 3
    await sendMessage(conversation, "Do you have alternatives to it?");
    const response3 = await getResponse(conversation);
    expect(response3).toContain('A4VTG90'); // Still resolves "it"

    // Turn 4
    await sendMessage(conversation, "Which one would you recommend?");
    const response4 = await getResponse(conversation);
    expect(response4).toMatch(/A4VTG90|alternative/i); // Resolves "one"
  });
});
```

### 4.2 Regression Testing

Run all existing tests to ensure no degradation:

```bash
# Run all competency tests
npm run test:competency

# Run individual test suites
npx tsx scripts/tests/test-chat-accuracy.ts
npx tsx scripts/tests/test-metadata-tracking.ts
npx tsx test-agent-quick-demo.ts
npx tsx test-agent-conversation-suite.ts

# Generate comprehensive report
npx tsx test-accuracy-summary.ts
```

**Success Criteria:**
- All existing tests continue to pass (100%)
- New metadata tests achieve 90%+ pass rate
- Overall accuracy reaches 90-93%

---

## Implementation Roadmap

### Week 1: Core Infrastructure
**Days 1-2:** Conversation Metadata System
- ✅ Create `ConversationMetadataManager` class
- ✅ Add database schema changes
- ✅ Integrate with chat route

**Days 3-4:** Response Parser
- ✅ Create `ResponseParser` class
- ✅ Implement entity detection
- ✅ Implement correction detection
- ✅ Implement list detection

**Day 5:** Testing & Validation
- ✅ Unit tests for metadata manager
- ✅ Unit tests for response parser
- ✅ Integration tests

### Week 2: Enhancement & Testing
**Days 1-2:** Enhanced System Prompts
- ✅ Implement context-aware prompt generation
- ✅ Add conversation quality instructions
- ✅ Test prompt effectiveness

**Days 3-4:** Comprehensive Testing
- ✅ Create new metadata tracking tests
- ✅ Run full competency test suite
- ✅ Analyze results and identify gaps

**Day 5:** Optimization & Fixes
- ✅ Address any failing tests
- ✅ Optimize performance
- ✅ Documentation

### Week 3: Validation & Deployment
**Days 1-2:** Final Testing
- ✅ Run complete regression suite
- ✅ Validate 90%+ accuracy target
- ✅ Edge case testing

**Days 3-4:** Documentation & Review
- ✅ Update all documentation
- ✅ Code review
- ✅ Performance profiling

**Day 5:** Deployment
- ✅ Deploy to staging
- ✅ Monitor metrics
- ✅ Production deployment

---

## Success Metrics & Monitoring

### Primary Metrics
| Metric | Baseline | Week 1 Target | Week 2 Target | Final Target |
|--------|----------|---------------|---------------|--------------|
| Overall Accuracy | 71.4% | 78% | 85% | **90%+** |
| Correction Tracking | 33% | 70% | 85% | **90%** |
| List References | 33% | 65% | 80% | **85%** |
| Pronoun Resolution | 50% | 70% | 80% | **85%** |
| Topic Management | 75% | 85% | 90% | **92%** |

### Monitoring Plan

```typescript
// New file: lib/chat/competency-metrics.ts

export interface CompetencyMetrics {
  conversationId: string;
  correctionAccuracy: number;
  listReferenceAccuracy: number;
  pronounResolutionAccuracy: number;
  topicManagementScore: number;
  overallScore: number;
}

export async function trackCompetencyMetrics(
  conversationId: string,
  metadataManager: ConversationMetadataManager
): Promise<CompetencyMetrics> {
  // Implementation for tracking metrics in production
  // ...
}
```

### Dashboard Queries

```sql
-- Track correction accuracy over time
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_corrections,
  SUM(CASE WHEN metadata->>'correctionAcknowledged' = 'true' THEN 1 ELSE 0 END)::float / COUNT(*) as accuracy
FROM conversations
WHERE metadata->>'hasCorrections' = 'true'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Track list reference resolution
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_list_references,
  SUM(CASE WHEN metadata->>'listReferenceResolved' = 'true' THEN 1 ELSE 0 END)::float / COUNT(*) as resolution_rate
FROM conversations
WHERE metadata->>'hasListReferences' = 'true'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Risk Mitigation

### Technical Risks

**Risk 1: Performance Degradation**
- **Impact:** Metadata processing adds latency
- **Mitigation:**
  - Profile all new code paths
  - Optimize JSON serialization
  - Use in-memory caching for active conversations
  - Target: <50ms overhead per request

**Risk 2: Metadata Storage Growth**
- **Impact:** Database size increases
- **Mitigation:**
  - Implement metadata cleanup after 30 days
  - Compress metadata JSON
  - Use JSONB for efficient storage

**Risk 3: False Positive Entity Detection**
- **Impact:** Incorrect entity tracking confuses AI
- **Mitigation:**
  - Conservative detection patterns
  - Confidence scoring for entities
  - Allow manual correction via metadata API

### Rollback Plan

If accuracy decreases or critical issues arise:

```bash
# Feature flag to disable metadata system
export USE_METADATA_SYSTEM=false

# Database rollback
ALTER TABLE conversations DROP COLUMN IF EXISTS metadata;

# Code rollback via git
git revert <commit-range>
```

---

## Post-Implementation

### Continuous Improvement

**Monthly Reviews:**
- Analyze conversation logs for new patterns
- Identify edge cases not covered
- Update entity detection patterns
- Refine system prompts

**Quarterly Goals:**
- Target 95% accuracy (Master Level)
- Expand entity types (shipping, returns, etc.)
- Implement multi-language support
- Add sentiment analysis

### Documentation Updates

Files to update after implementation:
- ✅ [CUSTOMER_SERVICE_ACCURACY_TESTING.md](CUSTOMER_SERVICE_ACCURACY_TESTING.md)
- ✅ [01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md](01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- ✅ [README.md](../README.md) - Add metadata system documentation
- ✅ [CLAUDE.md](../CLAUDE.md) - Update with new capabilities

---

## Appendix A: File Changes Summary

### New Files
- `lib/chat/conversation-metadata.ts` (~300 LOC)
- `lib/chat/response-parser.ts` (~250 LOC)
- `lib/chat/competency-metrics.ts` (~150 LOC)
- `scripts/tests/test-metadata-tracking.ts` (~200 LOC)

### Modified Files
- `app/api/chat/route.ts` (~30 LOC added)
- `lib/chat/system-prompts.ts` (~80 LOC added)
- `lib/chat/conversation-manager.ts` (~20 LOC added)

### Database Changes
- `conversations` table: Add `metadata` JSONB column
- New index: `idx_conversations_metadata`

**Total New Code:** ~800 LOC
**Total Modified Code:** ~130 LOC
**Expected Implementation Time:** 2-3 weeks

---

## Appendix B: Testing Checklist

- [ ] Unit tests for `ConversationMetadataManager`
- [ ] Unit tests for `ResponseParser`
- [ ] Integration tests for metadata persistence
- [ ] Correction tracking accuracy tests (target: 90%)
- [ ] List reference resolution tests (target: 85%)
- [ ] Pronoun resolution tests (target: 85%)
- [ ] Topic management tests (target: 92%)
- [ ] Performance benchmarks (<50ms overhead)
- [ ] Memory leak tests
- [ ] Concurrent conversation tests
- [ ] Regression testing (all existing tests pass)
- [ ] End-to-end conversation flows
- [ ] Edge case testing (malformed input, etc.)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Status:** Ready for Implementation
**Approved By:** [Pending Review]
