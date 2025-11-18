**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Session Tracking Modules

**Purpose:** Modular session tracking components extracted from session-tracker.ts to comply with 300 LOC limit.

**Last Updated:** 2025-11-08
**Related:** [lib/analytics/session-tracker.ts](../session-tracker.ts), [types/analytics.ts](../../../types/analytics.ts)

## Overview

This directory contains focused modules for session tracking functionality:

| Module | Lines | Purpose |
|--------|-------|---------|
| **browser-detection.ts** | 66 | Browser/OS/device detection and session ID generation |
| **session-storage.ts** | 93 | localStorage persistence and activity tracking |
| **session-metrics.ts** | 66 | Metric calculations (duration, bounce rate, interactions) |
| **page-tracking.ts** | 86 | Page view tracking and conversation linking |
| **activity-monitor.ts** | 48 | User activity monitoring and cleanup |

**Total:** 359 LOC (distributed across 5 modules)
**Main File:** 161 LOC (orchestrator only)

## Architecture

```
session-tracker.ts (161 LOC)
├─ SessionTracker class (orchestrates all modules)
├─ getSessionTracker() (singleton pattern)
└─ destroySessionTracker()

tracking/
├─ browser-detection.ts    → detectBrowser(), generateSessionId()
├─ session-storage.ts      → save/load session, activity tracking
├─ session-metrics.ts      → calculateSessionMetrics(), calculateEndMetrics()
├─ page-tracking.ts        → page view CRUD operations
└─ activity-monitor.ts     → DOM event listeners, interval management
```

## Module Details

### browser-detection.ts

**Exports:**
- `detectBrowser(): BrowserInfo` - Parse user agent for browser/OS/device info
- `generateSessionId(): string` - Generate unique session identifier

**No Dependencies:** Pure browser API usage (navigator, window)

### session-storage.ts

**Exports:**
- `saveSession(metadata)` - Persist to localStorage
- `loadSession()` - Retrieve from localStorage
- `updateLastActivity()` - Update activity timestamp
- `getLastActivity()` - Get last activity timestamp
- `isSessionActive()` - Check if session within 30min timeout
- `getCurrentSessionId()` - Get ID without full metadata
- `SESSION_TIMEOUT_MS` - Constant (30 minutes)

**Used By:** Main tracker for all persistence operations

### session-metrics.ts

**Exports:**
- `calculateSessionMetrics(metadata): SessionMetrics` - Full metrics
- `calculateEndMetrics(metadata)` - End time and duration

**Calculations:**
- Duration (session start to now)
- Average page duration
- Total interactions
- Average scroll depth
- Bounce rate (1 if single page view)

### page-tracking.ts

**Exports:**
- `createPageView(url?, title?): PageView` - New page view record
- `updatePageDuration(metadata, startTime)` - Update current page duration
- `trackScrollDepth(metadata, depth)` - Record max scroll depth
- `trackInteraction(metadata)` - Increment interaction counter
- `addPageView(metadata, pageView)` - Add page to session
- `linkConversation(metadata, conversationId)` - Link conversation

**Pattern:** All functions return updated metadata (immutable style)

### activity-monitor.ts

**Exports:**
- `startActivityMonitoring(callback): NodeJS.Timeout` - Start monitoring
- `stopActivityMonitoring(interval)` - Stop monitoring
- `setupBeforeUnload(callback)` - Register unload handler

**Events Tracked:** click, scroll, keydown, mousemove
**Update Frequency:** Every 10 seconds for page duration

## Public API Preservation

**All original exports maintained:**

```typescript
// Class export
export class SessionTracker { /* ... */ }

// Factory functions
export function getSessionTracker(domain: string): SessionTracker
export function destroySessionTracker(): void

// Utility functions (re-exported from session-storage.ts)
export function getCurrentSessionId(): string | null
export function isSessionActive(): boolean
```

**No Breaking Changes:** Existing code using session-tracker.ts requires no modifications.

## Usage Example

```typescript
import { getSessionTracker } from '@/lib/analytics/session-tracker';

// Initialize tracker
const tracker = getSessionTracker('example.com');

// Track page view
tracker.trackPageView('/products', 'Product Catalog');

// Track user activity
tracker.trackScrollDepth(75);
tracker.trackInteraction();

// Link conversation
tracker.linkConversation('conv-123');

// Get metrics
const metrics = tracker.calculateMetrics();
console.log(metrics.duration_seconds, metrics.page_views);

// Export data
const sessionData = tracker.exportData();

// Cleanup
destroySessionTracker();
```

## Testing

**Location:** `__tests__/lib/analytics/session-tracker.test.ts`

**Coverage:**
- Session creation and resumption
- Page view tracking
- Metrics calculation
- localStorage persistence
- Activity timeout handling

## Design Decisions

**Why Functional Modules Instead of Classes?**
- Easier to test (pure functions where possible)
- Clearer dependencies (explicit imports)
- Better tree-shaking
- Simpler mental model

**Why Immutable-Style in page-tracking.ts?**
- Functions return updated metadata
- Main class handles mutation (controlled)
- Easier to track changes
- Prevents accidental state corruption

**Why Separate storage.ts and metrics.ts?**
- Storage = I/O operations (side effects)
- Metrics = Pure calculations (no side effects)
- Clear separation of concerns

## Maintenance

**When Adding Features:**
1. Determine which module handles the concern
2. Add function to appropriate module
3. Export from module
4. Import in main session-tracker.ts
5. Add to SessionTracker class method

**When Fixing Bugs:**
1. Identify affected module
2. Add test case to module's test file
3. Fix in isolated module
4. Verify main tracker behavior

**Line Count Monitoring:**
- All modules must stay < 300 LOC
- Main file must stay < 200 LOC (currently 161)
- Run `wc -l tracking/*.ts` to verify
