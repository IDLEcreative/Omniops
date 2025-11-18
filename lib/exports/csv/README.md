**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# CSV Export Utilities

**Purpose:** Modular utilities for CSV generation, extracted from `csv-generator.ts` to comply with the 300 LOC file limit.

**Last Updated:** 2025-11-10
**Parent Module:** `lib/exports/csv-generator.ts`

## Module Breakdown

### csv-formatter.ts (81 LOC)
Core CSV formatting functions for RFC 4180 compliance:
- `escapeCSV()` - Escape special characters (quotes, commas, newlines)
- `formatDate()` - Format dates in ISO/US/EU formats
- `stripHtml()` - Remove HTML tags from text
- `joinCSVRow()` - Join values with delimiter

**Usage:**
```typescript
import { escapeCSV, formatDate } from './csv/csv-formatter';

const escaped = escapeCSV('Hello, "World"'); // '"Hello, ""World"""'
const date = formatDate('2025-11-10T10:00:00Z', 'US'); // '11/10/2025 10:00:00 AM'
```

### csv-writer.ts (72 LOC)
Stream-based CSV writing for large datasets:
- `createCSVStream()` - Create readable stream with chunked processing
- `linesToCSV()` - Convert string array to CSV format

**Usage:**
```typescript
import { createCSVStream } from './csv/csv-writer';

const stream = createCSVStream(results, options, 100);
stream.pipe(response);
```

### data-transformer.ts (144 LOC)
Transform search results into CSV rows:
- `buildHeaders()` - Generate CSV headers based on options
- `buildRow()` - Transform SearchResult to CSV row
- `buildThreadHeaders()` - Headers for conversation thread export
- `buildThreadRow()` - Transform conversation thread to CSV row

**Usage:**
```typescript
import { buildHeaders, buildRow } from './csv/data-transformer';

const headers = buildHeaders({ includeScore: true });
const row = buildRow(searchResult, options);
```

### sentiment-analyzer.ts (72 LOC)
Sentiment aggregation for conversation analytics:
- `calculateOverallSentiment()` - Majority voting across messages
- `getSentimentDistribution()` - Count positive/negative/neutral

**Usage:**
```typescript
import { calculateOverallSentiment } from './csv/sentiment-analyzer';

const overall = calculateOverallSentiment(['positive', 'positive', 'neutral']); // 'positive'
```

## Refactoring Results

**Before:**
- 341 LOC in single file (csv-generator.ts)
- Violated 300 LOC production limit

**After:**
- 182 LOC in main file (csv-generator.ts) ✅
- 369 LOC across 4 reusable modules ✅
- All modules <300 LOC ✅
- All exports preserved ✅
- No TypeScript errors introduced ✅

## Design Principles

1. **Single Responsibility:** Each module handles one aspect of CSV generation
2. **Reusability:** Utilities can be used independently
3. **Type Safety:** Full TypeScript support with proper error handling
4. **Performance:** Stream-based processing for large datasets

## Related Files

- `lib/exports/csv-generator.ts` - Main entry point
- `lib/search/conversation-search.ts` - SearchResult type definition
- `app/api/analytics/export/route.ts` - API endpoint using CSV export
