# Feedback Collector Module

**Type:** Service
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Feedback README](/home/user/Omniops/lib/feedback/README.md), [Feedback API](/home/user/Omniops/app/api/feedback/route.ts), [Testing Guide](/home/user/Omniops/docs/02-GUIDES/GUIDE_FEEDBACK_AND_TESTING.md)
**Estimated Read Time:** 3 minutes

## Purpose

Modular implementation of the feedback collection system, extracted from a 485 LOC monolithic file to comply with 300 LOC limit.

## Module Structure

This directory contains the refactored feedback collection system:

```
collector/
├── types.ts        (47 LOC)  - Enums, types, and Zod schemas
├── collector.ts    (173 LOC) - Core FeedbackCollector class
├── analyzer.ts     (79 LOC)  - FeedbackAnalyzer utility class
├── widget.ts       (195 LOC) - Browser widget UI components
└── index.ts        (29 LOC)  - Re-exports and orchestration
```

**Main Entry Point:** `lib/feedback/feedback-collector.ts` (31 LOC) - Re-exports all public APIs

## Architecture

### Separation of Concerns

1. **types.ts** - Type definitions and validation
   - `FeedbackType` enum
   - `SatisfactionRating` enum
   - `FeedbackSchema` (Zod validation)
   - `FeedbackData` type

2. **collector.ts** - Feedback submission logic
   - `FeedbackCollector` class
   - Methods: `submitQuickRating()`, `submitDetailedFeedback()`, `submitBugReport()`, etc.
   - API integration and analytics tracking

3. **analyzer.ts** - Feedback analysis utilities
   - `FeedbackAnalyzer` static class
   - Methods: `calculateNPS()`, `calculateAverageSatisfaction()`, `categorizeSentiment()`, etc.
   - Theme extraction and urgency detection

4. **widget.ts** - Browser UI components
   - `createFeedbackWidget()` - Embeddable button
   - `showFeedbackModal()` - Feedback submission modal
   - DOM manipulation and event handling

## Public API (Preserved)

All exports from the original file are preserved:

```typescript
// Types and enums
import { FeedbackType, SatisfactionRating, FeedbackData } from '@/lib/feedback/feedback-collector';

// Classes
import { FeedbackCollector, FeedbackAnalyzer } from '@/lib/feedback/feedback-collector';

// Widget
import { createFeedbackWidget } from '@/lib/feedback/feedback-collector';
```

## Usage

### Collecting Feedback

```typescript
import { FeedbackCollector, FeedbackType } from '@/lib/feedback/feedback-collector';

const collector = new FeedbackCollector({
  domain: 'example.com',
  sessionId: 'session-123',
});

// Quick rating
await collector.submitQuickRating(5, conversationId);

// Detailed feedback
await collector.submitDetailedFeedback(
  FeedbackType.BUG,
  'The chat widget is not loading',
  { category: 'ui', rating: 2 }
);
```

### Analyzing Feedback

```typescript
import { FeedbackAnalyzer } from '@/lib/feedback/feedback-collector';

// Calculate NPS
const nps = FeedbackAnalyzer.calculateNPS([8, 9, 10, 7, 6]);

// Extract themes
const themes = FeedbackAnalyzer.extractThemes([
  'The chat is too slow',
  'Love the fast responses'
]);
```

### Embedding Widget

```typescript
import { createFeedbackWidget } from '@/lib/feedback/feedback-collector';

const widget = createFeedbackWidget({
  domain: 'example.com',
  sessionId: 'session-123',
  position: 'bottom-right'
});

document.body.appendChild(widget);
```

## Refactoring History

**Date:** 2025-11-08
**Reason:** Compliance with 300 LOC limit
**Original Size:** 485 LOC
**New Size:** 31 LOC (main file) + 523 LOC (modules)

**Changes:**
- Extracted types and schemas to `types.ts`
- Extracted `FeedbackCollector` class to `collector.ts`
- Extracted `FeedbackAnalyzer` class to `analyzer.ts`
- Extracted widget UI to `widget.ts`
- Created orchestrator in `index.ts`
- Main file now re-exports from modular structure

**Breaking Changes:** None - Public API fully preserved

## Related Files

- [lib/feedback/feedback-collector.ts](../feedback-collector.ts) - Main entry point (re-exports)
- [app/api/feedback/route.ts](../../../app/api/feedback/route.ts) - API endpoint for feedback submission
- [docs/02-GUIDES/GUIDE_FEEDBACK_AND_TESTING.md](../../../docs/02-GUIDES/GUIDE_FEEDBACK_AND_TESTING.md) - Feedback testing guide
