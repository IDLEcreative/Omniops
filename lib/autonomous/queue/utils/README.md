**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Queue Utilities

**Purpose:** Shared utilities for operation job processing (progress tracking, consent validation, event logging).

**Last Updated:** 2025-11-10
**Related:** [../operation-job-processor.ts](../operation-job-processor.ts), [../handlers/](../handlers/)

## Overview

This directory contains reusable utility functions extracted from the operation job processor to improve modularity and testability.

## Files

### progress-tracker.ts (60 LOC)
Manages progress updates for operation jobs, storing state in Redis for real-time monitoring.

**Key Functions:**
- `updateOperationProgress()` - Updates progress in Redis with 1-hour expiry
- `createProgressUpdater()` - Creates bound progress updater for specific job

**Usage:**
```typescript
import { createProgressUpdater } from './utils';

const updateProgress = createProgressUpdater(job, operationId);
await updateProgress(50, 'Executing setup');
```

### consent-validator.ts (28 LOC)
Validates user consent before executing autonomous operations.

**Key Function:**
- `validateConsent()` - Verifies consent exists and hasn't expired

**Usage:**
```typescript
import { validateConsent } from './utils';

await validateConsent(data); // Throws if no consent
```

### event-logger.ts (41 LOC)
Handles logging of worker events for monitoring and debugging.

**Key Function:**
- `setupWorkerEventListeners()` - Attaches event listeners to BullMQ worker

**Usage:**
```typescript
import { setupWorkerEventListeners } from './utils';

setupWorkerEventListeners(worker);
// Logs: completed, failed, error, stalled events
```

### index.ts (11 LOC)
Central export file for all utilities.

## Design Rationale

**Why Extract Utils:**
- Reduces code duplication
- Each utility is independently testable
- Clear single responsibility for each module
- Easy to mock in tests
- Improves readability of main processor

## Integration

All utilities are used by `operation-job-processor.ts` and can be used by handlers as needed.
