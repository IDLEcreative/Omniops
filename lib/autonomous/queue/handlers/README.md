**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Operation Job Handlers

**Type:** System
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Operation Job Processor](/home/user/Omniops/lib/autonomous/queue/operation-job-processor.ts), [Utils](/home/user/Omniops/lib/autonomous/queue/utils/)
**Estimated Read Time:** 2 minutes

## Purpose

Individual job type handlers for autonomous operation processing, handling WooCommerce setup, Shopify setup, and other autonomous tasks.

## Overview

This directory contains specialized handlers for different types of autonomous operations (WooCommerce setup, Shopify setup, etc.). Each handler is responsible for executing its specific operation type using the appropriate agent.

## Files

### woocommerce-handler.ts (67 LOC)
Handles WooCommerce store setup operations.

**Key Function:**
- `executeWooCommerceSetup()` - Creates and executes WooCommerce setup agent

**Usage:**
```typescript
import { executeWooCommerceSetup } from './handlers';

const result = await executeWooCommerceSetup(job, data, updateProgress);
```

### shopify-handler.ts (67 LOC)
Handles Shopify store setup operations.

**Key Function:**
- `executeShopifySetup()` - Creates and executes Shopify setup agent

**Usage:**
```typescript
import { executeShopifySetup } from './handlers';

const result = await executeShopifySetup(job, data, updateProgress);
```

### index.ts (10 LOC)
Central export file for all handlers.

## Handler Interface

All handlers implement the same interface:

```typescript
interface JobHandlerResult {
  success: boolean;
  result?: any;
  error?: string;
}

type ProgressUpdater = (progress: number, message: string) => Promise<void>;

async function executeHandler(
  job: Job<OperationJobData>,
  data: SpecificJobData,
  updateProgress: ProgressUpdater
): Promise<JobHandlerResult>
```

## Adding New Handlers

To add a new operation type:

1. Create `{operation}-handler.ts` in this directory
2. Implement the handler function following the interface above
3. Export from `index.ts`
4. Add case to switch statement in `operation-job-processor.ts`

## Design Rationale

**Why Extract Handlers:**
- Reduces main processor file from 385 → 224 LOC
- Each handler is independent and testable
- Easy to add new operation types
- Clear separation of concerns
