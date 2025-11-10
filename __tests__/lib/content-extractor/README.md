# Content Extractor Tests

**Purpose:** Test suite for the refactored content extraction modules.

**Last Updated:** 2025-11-10
**Status:** Structure Created - Implementation Pending
**Related:** [lib/content-extractor/](../../../lib/content-extractor/)

## Overview

This directory contains test files for all content extraction modules that were extracted from the monolithic `content-extractor.ts` file. The tests validate:

- HTML to text conversion
- Boilerplate removal
- Metadata extraction (Open Graph, Twitter Cards, etc.)
- Image extraction with filtering
- Link extraction and normalization
- Content cleaning and validation
- Content hashing for deduplication
- Readability-based extraction

## Test Files

| Test File | Module Tested | Test Count | Description |
|-----------|---------------|------------|-------------|
| `index.test.ts` | ContentExtractor class | 15 tests | Tests main extraction API and static methods |
| `converters.test.ts` | HTML converters | 9 tests | Tests HTML-to-text and boilerplate removal |
| `extractors.test.ts` | Content extractors | 28 tests | Tests metadata, images, links, fallback extraction |
| `utilities.test.ts` | Content utilities | 18 tests | Tests cleaning, hashing, validation |

**Total:** 4 test files, 70 test placeholders

## Test Coverage Plan

### Core Functionality
- **Readability Extraction:** Mozilla Readability integration
- **Metadata Extraction:** Title, description, author, dates, OG tags
- **Image Extraction:** Source URLs, alt text, filtering small images
- **Link Extraction:** Href resolution, text extraction, deduplication
- **Content Cleaning:** Whitespace normalization, special character handling
- **Validation:** Content quality checks, error page detection

### Edge Cases
- Malformed HTML
- Missing metadata
- Relative URLs
- Unicode content
- Empty documents
- Very large documents
- Documents with no readable content

### Content Types
- Blog articles
- Product pages
- News articles
- Landing pages
- Error pages (404, 500)
- JavaScript-heavy pages
- Multi-language content

## Mock Strategy

### External Dependencies
- **JSDOM:** Create virtual DOM for testing
- **Mozilla Readability:** Use actual library (integration test)
- **business-content-extractor:** Mock or stub if needed

### Test Data
Create realistic HTML fixtures:
```typescript
const mockHtmlFixtures = {
  blog: `<html>...</html>`,
  product: `<html>...</html>`,
  error404: `<html>...</html>`,
  empty: `<html><body></body></html>`,
};
```

### Mock Document Objects
```typescript
const createMockDocument = (html: string) => {
  const { window } = new JSDOM(html);
  return window.document;
};
```

## Implementation Guidelines

### Test Structure
```typescript
describe('content-extractor/module', () => {
  describe('functionName', () => {
    it('should handle basic case', () => {
      const input = '...';
      const result = functionName(input);
      expect(result).toMatchObject({...});
    });
  });
});
```

### HTML Fixtures
Create a fixtures file:
```typescript
// fixtures/html-samples.ts
export const blogArticle = `<!DOCTYPE html>...`;
export const productPage = `<!DOCTYPE html>...`;
export const errorPage = `<!DOCTYPE html>...`;
```

### Snapshot Testing
Use snapshots for complex HTML conversions:
```typescript
it('should convert complex HTML to text', () => {
  const result = htmlToText(complexHtml);
  expect(result).toMatchSnapshot();
});
```

### What to Test

#### Converters
- HTML entity decoding
- Whitespace normalization
- Script/style removal
- Boilerplate element removal
- Unicode handling

#### Extractors
- Metadata tag parsing
- Image URL resolution
- Link URL resolution
- Fallback extraction accuracy
- Empty result handling

#### Utilities
- Content cleaning consistency
- Hash uniqueness and stability
- Validation logic correctness
- Edge case handling

## Test Data Examples

### Metadata Extraction
```typescript
const htmlWithMetadata = `
  <html>
    <head>
      <title>Test Article</title>
      <meta name="description" content="Test description">
      <meta name="author" content="Test Author">
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Description">
      <meta name="twitter:card" content="summary">
    </head>
    <body>Content</body>
  </html>
`;
```

### Image Extraction
```typescript
const htmlWithImages = `
  <html>
    <body>
      <img src="/image1.jpg" alt="Main image">
      <img src="data:image/gif;base64,..." alt="Tracking pixel">
      <img src="/icon.png" width="16" height="16">
    </body>
  </html>
`;
// Should extract: image1.jpg (filter out pixel and icon)
```

### Link Extraction
```typescript
const htmlWithLinks = `
  <html>
    <body>
      <a href="/page">Internal link</a>
      <a href="https://external.com">External link</a>
      <a href="#section">Anchor link</a>
      <a href="javascript:void(0)">JS link</a>
    </body>
  </html>
`;
// Should extract: /page, https://external.com (filter out anchor and JS)
```

## Next Steps for Developers

1. **Create HTML Fixtures**
   - Create realistic HTML samples for different content types
   - Include edge cases (malformed HTML, unicode, etc.)
   - Store in `__tests__/fixtures/html-samples.ts`

2. **Implement Converter Tests**
   - Test HTML-to-text conversion accuracy
   - Test boilerplate removal effectiveness
   - Verify whitespace normalization

3. **Implement Extractor Tests**
   - Test metadata extraction completeness
   - Test image/link filtering logic
   - Test fallback extraction

4. **Implement Utility Tests**
   - Test content cleaning consistency
   - Test hash generation uniqueness
   - Test validation logic

5. **Add Integration Tests**
   - Test full ContentExtractor.extractWithReadability() flow
   - Test integration with business-content-extractor
   - Verify end-to-end extraction accuracy

6. **Measure Coverage**
   - Run `npm run test:coverage`
   - Aim for >85% coverage (extraction is critical)
   - Focus on edge cases and error paths

## Running Tests

```bash
# Run all content-extractor tests
npm test -- __tests__/lib/content-extractor

# Run specific test file
npm test -- __tests__/lib/content-extractor/extractors.test.ts

# Run with coverage
npm run test:coverage -- __tests__/lib/content-extractor

# Watch mode for development
npm run test:watch -- __tests__/lib/content-extractor
```

## Expected Behavior

### Successful Extraction
```typescript
const result = ContentExtractor.extractWithReadability(html, url);
// Should return:
{
  title: string,
  content: string, // Clean text
  textContent: string, // Raw text
  excerpt: string,
  author?: string,
  publishedDate?: string,
  modifiedDate?: string,
  lang: string,
  images: Array<{ src, alt }>,
  links: Array<{ href, text }>,
  metadata: Record<string, any>,
  contentHash: string, // Unique hash
  wordCount: number,
  readingTime: number, // Minutes
  businessInfo?: any,
}
```

### Error Page Detection
```typescript
const result = ContentExtractor.extractWithReadability(error404Html, url);
expect(ContentExtractor.isValidContent(result)).toBe(false);
// Should detect: "404", "not found", low word count
```

## Related Documentation
- [Content Extractor Implementation](../../../lib/content-extractor/README.md)
- [Scraper API Handlers Tests](../scraper-api-handlers/README.md)
- [Business Content Extractor](../../../lib/business-content-extractor.ts)
