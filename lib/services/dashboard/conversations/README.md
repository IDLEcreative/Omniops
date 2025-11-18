**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Conversations Service Modules

**Type:** Service
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Conversations Service](/home/user/Omniops/lib/services/dashboard/conversations-service.ts), [Dashboard API](/home/user/Omniops/app/api/dashboard/conversations/route.ts), [Dashboard Types](/home/user/Omniops/types/dashboard)
**Estimated Read Time:** 2 minutes

## Purpose

Extracted modules from the main conversations service to comply with the 300 LOC limit while maintaining clean separation of concerns.

## Overview

This directory contains modular components extracted from `conversations-service.ts` (originally 332 LOC) to improve maintainability and comply with codebase standards.

## Files

### query-builder.ts (184 LOC)
**Purpose:** Database query construction and data fetching

**Functions:**
- `fetchCount()` - Count conversations within date range
- `fetchConversations()` - Fetch conversations with messages and aggregate stats
- `fetchPeakHours()` - Calculate message activity by hour

**Usage:**
```typescript
import { fetchCount, fetchConversations, fetchPeakHours } from './conversations/query-builder';

const count = await fetchCount(supabase, startDate, endDate);
const { conversations, statusCounts } = await fetchConversations(supabase, options, statusDeterminer, languageExtractor);
const peakHours = await fetchPeakHours(supabase, startDate);
```

### data-transformer.ts (98 LOC)
**Purpose:** Data transformation and formatting logic

**Functions:**
- `determineStatus()` - Convert metadata to conversation status (active/waiting/resolved)
- `extractLanguage()` - Extract language from conversation metadata
- `transformLanguages()` - Sort and format language counts with percentages
- `transformPeakHours()` - Format peak hour data with labels and levels
- `calculateChange()` - Calculate percentage change between periods

**Usage:**
```typescript
import {
  determineStatus,
  extractLanguage,
  transformLanguages,
  transformPeakHours,
  calculateChange
} from './conversations/data-transformer';

const status = determineStatus(metadata, endedAt);
const language = extractLanguage(metadata);
const languages = transformLanguages(languageCounts, total);
const peakHours = transformPeakHours(peakHourCounts);
const change = calculateChange(currentCount, previousCount);
```

## Architecture

**Service Pattern:**
1. Main service (`conversations-service.ts`) orchestrates operations
2. Query builder handles all database interactions
3. Data transformer handles all data formatting

**Benefits:**
- **Modularity**: Each file has single responsibility
- **Testability**: Functions can be unit tested independently
- **Maintainability**: Changes isolated to specific concerns
- **Compliance**: All files <300 LOC

## Dependencies

- **Supabase**: Database queries via service role client
- **Types**: `DashboardConversation` from `@/types/dashboard`

## Integration

Used by:
- `lib/services/dashboard/conversations-service.ts` - Main orchestration
- `app/api/dashboard/conversations/route.ts` - API endpoint

## Refactoring History

**2025-11-10:** Extracted from 332 LOC monolithic service into 3 focused modules (120 + 184 + 98 LOC) as part of LOC violation remediation project.
