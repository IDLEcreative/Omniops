# Queue Utilities

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Operation Job Processor](/home/user/Omniops/lib/autonomous/queue/operation-job-processor.ts), [Handlers](/home/user/Omniops/lib/autonomous/queue/handlers/)
**Estimated Read Time:** 1 minute

## Purpose

Shared utilities for operation job processing including progress tracking, consent validation, and event logging.

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
