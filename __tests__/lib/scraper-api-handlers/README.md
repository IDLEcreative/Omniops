**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Structure Created - Implementation Pending
**Type:** Reference

# Scraper API Handlers Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 4 minutes

**Purpose:** Test suite for the refactored scraper request handling modules.

**Related:** [lib/scraper-api-handlers/](/home/user/Omniops/lib/scraper-api-handlers/)

## Overview

This directory contains test files for all scraper API handler modules that were extracted from the monolithic `scraper-api-core.ts` file. The tests validate:

- Page navigation and content waiting
- Content extraction and transformation
- Validation of page size and content quality
- Resource blocking for performance
- AI optimization integration
- Result building and formatting
- Error handling and recovery

## Test Files

| Test File | Module Tested | Test Count | Description |
|-----------|---------------|------------|-------------|
| `index.test.ts` | Main orchestrator | 10 tests | Tests the main `handlePageRequest` function |
| `page-navigation.test.ts` | Navigation setup | 10 tests | Tests viewport, user agent, request interception |
| `validation.test.ts` | Content validation | 10 tests | Tests page size and content quality validation |
| `extraction.test.ts` | Content extraction | 8 tests | Tests content extraction with different modes |
| `resource-blocker.test.ts` | Resource blocking | 7 tests | Tests blocking of images, media, fonts, etc. |
| `result-builder.test.ts` | Result formatting | 7 tests | Tests building ScrapedPage and AIOptimizedResult |
| `ai-optimizer.test.ts` | AI optimization | 8 tests | Tests token reduction and semantic chunking |
| `error-handler.test.ts` | Error handling | 7 tests | Tests failed request handling and logging |

**Total:** 8 test files, 67 test placeholders

## Test Coverage Plan

### Core Functionality
- **Request Handling:** Full request lifecycle from navigation to result
- **Content Extraction:** HTML parsing, readability extraction, metadata
- **Validation:** Size limits, word counts, content quality
- **Performance:** Resource blocking, turbo mode, adaptive delays
- **AI Features:** Token optimization, semantic chunking, caching

### Edge Cases
- Malformed HTML
- Oversized pages
- Timeout scenarios
- Network errors
- Missing content
- Empty responses

### Configuration Scenarios
- Different viewport sizes
- Various user agents
- Turbo mode on/off
- E-commerce mode
- AI optimization levels (fast, standard, quality)
- Resource blocking combinations

## Mock Strategy

### External Dependencies
- **Playwright Page:** Mock page object with content(), waitForSelector(), setViewport()
- **Playwright Request:** Mock request object with url property
- **Redis:** Use in-memory mock from `__mocks__/@/lib/redis.js`
- **ContentExtractor:** Mock the extraction logic for unit tests

### Configuration Mocks
```typescript
const mockConfig = {
  browser: {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 Test Agent',
    blockResources: ['image', 'media'],
  },
  timeouts: {
    request: 30000,
    navigation: 30000,
    selector: 5000,
  },
  content: {
    maxPageSizeMB: 10,
    minWordCount: 50,
  },
  rateLimit: {
    adaptiveDelay: true,
  },
};
```

### Mock Files to Create
- `__mocks__/playwright-crawler.ts` - Mock PlaywrightCrawler
- `__mocks__/@/lib/content-extractor.ts` - Mock ContentExtractor (if needed)

## Implementation Guidelines

### Test Structure
Each test file follows this pattern:
```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    let mockDependency: any;

    beforeEach(() => {
      // Set up mocks
    });

    it('should handle basic case', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Test implementation
    });
  });
});
```

### Naming Conventions
- Test files: `module-name.test.ts`
- Describe blocks: Use module/function names
- Test cases: Start with "should" for clarity

### What to Test
1. **Happy Path:** Normal operation with valid inputs
2. **Edge Cases:** Boundary conditions, empty inputs, null/undefined
3. **Error Handling:** Invalid inputs, network failures, timeouts
4. **Integration:** Interaction between modules
5. **Configuration:** Different config combinations

### What NOT to Test
- Implementation details (test behavior, not internals)
- External libraries (assume they work)
- Trivial getters/setters

## Next Steps for Developers

1. **Review Module Implementation**
   - Read the actual module code in `lib/scraper-api-handlers/`
   - Understand the function signatures and behavior
   - Identify edge cases and error scenarios

2. **Implement Test Cases**
   - Replace `expect(true).toBe(true)` with actual tests
   - Create realistic mock data
   - Test both success and failure paths

3. **Add Integration Tests**
   - Test how modules work together
   - Verify the full request handling flow
   - Test configuration cascading

4. **Measure Coverage**
   - Run `npm run test:coverage`
   - Aim for >80% coverage on all modules
   - Focus on critical paths first

5. **Document Findings**
   - Update this README with actual test counts
   - Note any bugs found during testing
   - Document complex test scenarios

## Running Tests

```bash
# Run all scraper-api-handlers tests
npm test -- __tests__/lib/scraper-api-handlers

# Run specific test file
npm test -- __tests__/lib/scraper-api-handlers/page-navigation.test.ts

# Run with coverage
npm run test:coverage -- __tests__/lib/scraper-api-handlers

# Watch mode for development
npm run test:watch -- __tests__/lib/scraper-api-handlers
```

## Related Documentation
- [Scraper API Handlers Implementation](../../../lib/scraper-api-handlers/README.md)
- [Content Extractor Tests](../content-extractor/README.md)
- [Scraper API Core Tests](../scraper-api-core.test.ts)
