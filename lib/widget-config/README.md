**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Widget Configuration Module

**Type:** Service
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Widget Config API](/home/user/Omniops/app/api/widget/config/route.ts), [Widget Customization Guide](/home/user/Omniops/docs/02-GUIDES/GUIDE_WIDGET_CUSTOMIZATION.md), [Multi-Domain Support](/home/user/Omniops/docs/02-GUIDES/GUIDE_MULTI_DOMAIN_SUPPORT.md)
**Estimated Read Time:** 3 minutes

## Purpose

Provides modular services for loading, validating, transforming, and serving widget configuration from the database.

## Overview

This module was extracted from `app/api/widget/config/route.ts` to comply with the 300 LOC limit. It provides clean, testable services for widget configuration management.

## Module Structure

### Core Services

| Module | LOC | Purpose |
|--------|-----|---------|
| `config-loader.ts` | 159 | Database queries for customer and widget configs |
| `config-transformer.ts` | 229 | Transform DB data to widget-ready format |
| `config-validator.ts` | 34 | Zod schemas and query validation |
| `response-builder.ts` | 111 | Build API responses with CORS headers |
| `domain-utils.ts` | 58 | Domain extraction and alias resolution |
| `defaults.ts` | 93 | Default appearance and behavior settings |
| `index.ts` | 12 | Centralized exports |

**Total:** 696 LOC (extracted from 367 LOC route)

### Benefits of Extraction

1. **Compliance:** Main route reduced from 367 LOC to 87 LOC
2. **Testability:** Each service can be unit tested independently
3. **Reusability:** Services can be used by other endpoints
4. **Maintainability:** Clear separation of concerns
5. **Type Safety:** Full TypeScript types throughout

## Usage Example

### In API Route

```typescript
import {
  validateQueryParams,
  loadCompleteConfig,
  transformConfig,
  buildSuccessResponse,
} from '@/lib/widget-config';

export async function GET(request: NextRequest) {
  // Validate
  const params = validateQueryParams({ domain, id: appId });

  // Load
  const { customerConfig, widgetConfig } = await loadCompleteConfig(
    supabase,
    { domain: params.domain, appId: params.id }
  );

  // Transform
  const config = transformConfig(customerConfig, widgetConfig);

  // Respond
  return buildSuccessResponse(config);
}
```

### In Tests

```typescript
import { transformConfig } from '@/lib/widget-config';

it('should transform customer config correctly', () => {
  const result = transformConfig(mockCustomerConfig, mockWidgetConfig);
  expect(result.appearance.primaryColor).toBe('#3b82f6');
});
```

## Service Details

### config-loader.ts

**Exports:**
- `loadConfigByAppId(supabase, appId)` - Load by app_id (new standard)
- `loadConfigByDomain(supabase, domain)` - Load by domain (legacy)
- `loadWidgetConfig(supabase, customerConfigId)` - Load widget customization
- `loadCompleteConfig(supabase, params)` - Load all configs at once

**Types:**
- `CustomerConfig` - Database customer_configs row
- `WidgetConfig` - Database widget_configs row
- `ConfigLoadResult` - Combined load result

### config-transformer.ts

**Exports:**
- `transformAppearance(customerConfig, widgetConfig)` - Build appearance object
- `transformBehavior(customerConfig, widgetConfig)` - Build behavior object
- `transformBranding(customerConfig, widgetConfig, primaryColor)` - Build branding object
- `transformConfig(customerConfig, widgetConfig)` - Transform complete config

**Types:**
- `TransformedAppearance` - Full appearance configuration
- `TransformedBehavior` - Full behavior configuration
- `TransformedBranding` - Branding configuration
- `TransformedConfig` - Complete widget configuration

### config-validator.ts

**Exports:**
- `QuerySchema` - Zod schema for query parameters
- `validateQueryParams(params)` - Validate query parameters
- `isEmptyQuery(params)` - Check if domain/app_id are missing

### response-builder.ts

**Exports:**
- `withCors(response)` - Add CORS headers to response
- `buildSuccessResponse(config)` - Success with config
- `buildDefaultConfigResponse()` - No domain provided
- `buildConfigNotFoundResponse(domain)` - Config not found
- `buildValidationErrorResponse(error)` - Validation error
- `buildInternalErrorResponse()` - Internal server error
- `buildOptionsResponse()` - OPTIONS request

### domain-utils.ts

**Exports:**
- `extractDomainFromReferer(request, domain)` - Extract domain from referer header
- `applyDomainAlias(domain)` - Apply domain alias mapping (TEMPORARY WORKAROUND)

**Note:** Domain alias logic is a temporary workaround. See comments in code for proper solution.

### defaults.ts

**Exports:**
- `getDefaultAppearance()` - Default appearance settings
- `getDefaultBehavior()` - Default behavior settings

**Types:**
- `DefaultAppearance` - Default appearance structure
- `DefaultBehavior` - Default behavior structure

## API Behavior Preserved

The refactoring preserves all original API behavior:

✅ Supports both `domain` and `id` (app_id) parameters
✅ Falls back to domain extraction from referer header
✅ Applies domain aliases from environment variable
✅ Returns default config when no domain provided
✅ Returns minimal config when customer not found
✅ Merges customer_configs + widget_configs
✅ CORS headers on all responses
✅ Proper error handling and validation

## Testing Strategy

**Unit Tests:**
- `config-transformer.test.ts` - Test transformation logic
- `config-validator.test.ts` - Test validation rules
- `defaults.test.ts` - Test default values

**Integration Tests:**
- `config-loader.test.ts` - Test database queries with mock Supabase client
- `response-builder.test.ts` - Test response formatting

**E2E Tests:**
- `route.test.ts` - Test full API endpoint flow

## Future Improvements

1. **Remove Domain Alias Workaround:** Add staging domains to database
2. **Add Caching:** Cache widget configs with Redis
3. **Add Versioning:** Support config versioning for rollback
4. **Add Validation:** Validate transformed config before sending
5. **Add Metrics:** Track config load times and cache hit rates

## Related Documentation

- [Widget API Documentation](../../docs/09-REFERENCE/REFERENCE_API_ENDPOINTS.md#widget-config)
- [Widget Customization Guide](../../docs/02-GUIDES/GUIDE_WIDGET_CUSTOMIZATION.md)
- [Multi-Domain Support](../../docs/02-GUIDES/GUIDE_MULTI_DOMAIN_SUPPORT.md)
