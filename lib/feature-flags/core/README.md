# Feature Flags Core Modules

**Type:** System
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Feature Flags Admin API](/home/user/Omniops/app/api/admin/feature-flags/route.ts), [Chat Widget Config](/home/user/Omniops/lib/chat-widget/default-config.ts), [Pilot Rollout Manager](/home/user/Omniops/lib/rollout/pilot-manager.ts)
**Estimated Read Time:** 4 minutes

## Purpose

Modular architecture for feature flag management system with focused modules under 300 LOC, following single-responsibility principle.

## Architecture Overview

The feature flags system is refactored into focused modules, each under 300 LOC, following single-responsibility principle:

```
lib/feature-flags/
├── index.ts (204 LOC)           # Main orchestrator - public API
└── core/
    ├── types.ts (51 LOC)         # Type definitions
    ├── cache.ts (104 LOC)        # In-memory caching
    ├── storage.ts (137 LOC)      # Database operations
    ├── merge.ts (39 LOC)         # Config merging
    ├── change-tracking.ts (90 LOC) # Audit trail
    └── evaluator.ts (116 LOC)    # Flag evaluation engine
```

## Module Responsibilities

### types.ts (51 LOC)
**Purpose:** Core type definitions and enums

**Exports:**
- `FlagSource` - Priority hierarchy enum
- `FlagEvaluation` - Evaluation result interface
- `FlagChangeEvent` - Change tracking interface
- `CacheEntry` - Cache structure

### cache.ts (104 LOC)
**Purpose:** In-memory cache management with TTL

**Key Features:**
- Map-based storage with 5-minute default TTL
- Key generation from customer/org IDs
- Selective invalidation (customer, organization, all)
- Cache statistics

**Public API:**
- `new FlagCache(ttl?)` - Constructor
- `get(key)` - Retrieve cached config
- `set(key, config)` - Store config
- `invalidateCustomer(id)` - Clear customer cache
- `invalidateOrganization(id)` - Clear org cache
- `clear()` - Clear all
- `getStats()` - Get metrics

### storage.ts (137 LOC)
**Purpose:** Database operations for feature flag persistence

**Operations:**
- `getCustomerOverride(id)` - Fetch customer flags
- `getOrganizationOverride(id)` - Fetch org flags
- `saveCustomerFlags(id, flags, changedBy)` - Persist customer flags
- `saveOrganizationFlags(id, flags, changedBy)` - Persist org flags

**Database Tables:**
- `customer_feature_flags` - Customer-specific overrides
- `organization_feature_flags` - Org-wide defaults

### merge.ts (39 LOC)
**Purpose:** Deep merge of partial flag overrides with defaults

**Key Function:**
- `mergeFlags(defaults, overrides)` - Combines nested configs
  - Merges sessionPersistence.phase1/2/3
  - Merges experimental features
  - Preserves type safety

### change-tracking.ts (90 LOC)
**Purpose:** Audit trail for feature flag changes

**Key Functions:**
- `detectChanges(oldConfig, newConfig)` - Diff configs, return change list
- `logFlagChanges(old, new, context)` - Write to audit table

**Features:**
- Tracks individual flag path changes (e.g., "sessionPersistence.phase2.enhancedStorage")
- Records who, when, why for compliance
- Non-blocking (doesn't fail main operation)

**Database Table:**
- `feature_flag_changes` - Audit log

### evaluator.ts (116 LOC)
**Purpose:** Core evaluation engine with fallback hierarchy

**Priority Order:**
1. Customer-specific override (database)
2. Organization-wide override (database)
3. Environment-based defaults
4. System defaults

**Public API:**
- `new FlagEvaluator(cacheTTL?)` - Constructor
- `evaluate(params)` - Main evaluation method
- `getCache()` - Access cache instance

**Features:**
- Automatic caching with TTL
- Error handling with fallbacks
- Source tracking for debugging

## Data Flow

```
Request → Evaluator
           ↓
    Check Cache? → HIT → Return
           ↓ MISS
    Storage.getCustomerOverride() → Found? → Merge + Cache → Return
           ↓ Not Found
    Storage.getOrganizationOverride() → Found? → Merge + Cache → Return
           ↓ Not Found
    getEnvironmentConfig() → Cache → Return
           ↓ Error
    DEFAULT_CONFIG → Return
```

## Public API (index.ts)

**Preserved Exports:**
```typescript
// Types
export { FlagSource, type FlagEvaluation, type FlagChangeEvent } from './core/types';

// Main Class
export class FeatureFlagManager {
  async getFlags(params)
  async setCustomerFlags(id, flags, changedBy?, reason?)
  async setOrganizationFlags(id, flags, changedBy?, reason?)
  invalidateCache(customerId)
  invalidateCacheForOrganization(orgId)
  clearCache()
  getCacheStats()
}

// Singleton
export function getFeatureFlagManager(): FeatureFlagManager

// Convenience Functions
export async function getCustomerFlags(customerId): Promise<ChatWidgetFeatureFlags>
export async function getOrganizationFlags(orgId): Promise<ChatWidgetFeatureFlags>
```

## Usage Example

```typescript
import { getFeatureFlagManager, FlagSource } from '@/lib/feature-flags';

const manager = getFeatureFlagManager();

// Get flags for customer
const evaluation = await manager.getFlags({
  customerId: 'cust_123',
  organizationId: 'org_456'
});

console.log(evaluation.config); // Merged config
console.log(evaluation.source); // FlagSource.CUSTOMER_OVERRIDE
console.log(evaluation.evaluatedAt); // Timestamp

// Update flags
await manager.setCustomerFlags(
  'cust_123',
  { sessionPersistence: { phase2: { enhancedStorage: true } } },
  'admin_user_id',
  'Enabling enhanced storage for pilot'
);
```

## Testing Considerations

**Unit Tests:**
- Test each module independently
- Mock dependencies (storage, cache)
- Focus on single responsibility

**Integration Tests:**
- Test full evaluation flow
- Verify priority hierarchy
- Test cache behavior
- Verify audit logging

**Key Test Cases:**
1. Cache hit/miss scenarios
2. Fallback hierarchy (customer → org → env → default)
3. Change detection accuracy
4. Merge logic correctness
5. Invalidation cascades (customer, org)

## Performance Characteristics

**Cache:**
- O(1) get/set operations
- 5-minute TTL reduces DB load
- Selective invalidation prevents over-clearing

**Storage:**
- Single DB query per evaluation (when cache miss)
- Indexed by customer_id/organization_id
- Async operations (non-blocking)

**Change Tracking:**
- O(n) where n = number of flags changed
- Async logging (doesn't block main flow)
- Non-critical path (failures logged, not thrown)

## Migration Notes

**From Original (504 LOC):**
- Preserved all public API exports
- Maintained identical behavior
- Improved testability via modularity
- Reduced coupling (easier to modify individual modules)

**Benefits:**
- Each module < 300 LOC (complies with guidelines)
- Clear separation of concerns
- Easier to understand and maintain
- Better test isolation
- Reusable components (cache, merge, storage)

## Related Documentation

- [Feature Flags Admin API](../../../../app/api/admin/feature-flags/route.ts)
- [Chat Widget Config](../../chat-widget/default-config.ts)
- [Pilot Rollout Manager](../../rollout/pilot-manager.ts)
