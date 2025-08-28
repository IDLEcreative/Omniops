# Enhanced Scraper System Integration Tests

This directory contains comprehensive integration tests for the enhanced scraping system that validate the complete workflow from content extraction to AI optimization, pattern learning, rate limiting, and data storage.

## Overview

The integration tests ensure that all components of the enhanced scraping system work together correctly:

- **AI Content Extraction** - Token optimization, semantic chunking, metadata generation
- **Pattern Learning** - Domain-specific pattern detection and reuse  
- **Rate Limiting** - Adaptive throttling, circuit breakers, backoff strategies
- **Content Deduplication** - Similarity detection, template patterns, compression
- **Configuration Management** - Preset loading, runtime overrides, hot reload
- **E-commerce Extraction** - Product data extraction with structured data support

## Test Structure

### Main Test File
- `enhanced-scraper-system.test.ts` - Main integration test suite with comprehensive scenarios

### Helper Files  
- `integration-test-helpers.ts` - Utilities for creating test data, mocks, and validation
- `integration-setup.js` - Test environment setup and configuration
- `global-setup.js` - One-time setup before all tests
- `global-teardown.js` - Cleanup after all tests complete

### Configuration Files
- `jest.integration.config.js` - Jest configuration optimized for integration tests
- `jest.env.js` - Environment variables for testing

## Test Categories

### 1. E-commerce Scraping with AI Optimization
Tests the complete pipeline from HTML extraction to AI optimization:

```typescript
// Tests token reduction, semantic chunking, metadata generation
const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
expect(optimizedContent.compressionRatio).toBeGreaterThan(0.1);
```

**Validates:**
- Token reduction of 30-70%
- Semantic chunk generation
- Metadata creation (summary, key facts, Q&A pairs)
- Performance benchmarks (< 30 seconds processing)
- Memory efficiency (< 100MB additional usage)

### 2. Pattern Learning Flow
Tests the learning and application of extraction patterns:

```typescript
// First scrape learns patterns
await PatternLearner.learnFromExtraction(url, products, extractionData);

// Second scrape uses learned patterns for faster extraction
const patterns = await PatternLearner.getPatterns(url);
const result = await PatternLearner.applyPatterns(url, $);
```

**Validates:**
- Pattern confidence scoring
- Pattern merging and updating
- Cross-domain pattern recommendations
- Performance improvement over time

### 3. Rate Limiting Integration  
Tests sophisticated rate limiting with multiple strategies:

```typescript
// Multiple rapid requests trigger throttling
const responses = await Promise.all(requests);
const rateLimitedCount = responses.filter(r => !r.allowed).length;
expect(rateLimitedCount).toBeGreaterThan(0);
```

**Validates:**
- Token bucket algorithm
- Exponential backoff on 429 errors
- Circuit breaker activation
- Adaptive throttling based on response times
- Anti-detection measures (user agent rotation, timing randomization)

### 4. Configuration Management
Tests preset loading and runtime configuration:

```typescript
const fastConfig = getCrawlerConfig('fast');
const carefulConfig = getCrawlerConfig('careful');
expect(fastConfig.maxConcurrency).toBeGreaterThan(carefulConfig.maxConcurrency);
```

**Validates:**
- Preset configurations (fast, careful, ecommerce, etc.)
- Environment variable overrides
- AI optimization settings
- Memory and performance tuning

### 5. Complete Pipeline Test
Tests the entire workflow end-to-end:

```typescript
// Rate limiting → AI optimization → Product extraction → Deduplication → Pattern learning
const pipeline = await runCompletePipeline(testHTML, testURL);
expect(pipeline.totalTime).toBeLessThan(15000);
```

**Validates:**
- Data flow between components
- Error handling and recovery
- Performance benchmarks
- Memory efficiency
- Output structure compliance

### 6. Migration Tool Test
Tests optimization of existing scraped data:

```typescript
// Optimize existing unoptimized data
const optimizedContent = await AIContentExtractor.extractOptimized(existingData.content, existingData.url);
expect(optimizedContent.compressionRatio).toBeGreaterThan(0.1);
```

**Validates:**
- Batch processing capabilities
- Token reduction for existing data
- Migration report generation
- Performance statistics

## Test Data Generation

The test suite includes sophisticated data generators:

### E-commerce HTML Generator
```typescript
TestDataFactory.createEcommerceProductHTML({
  productCount: 3,
  includeStructuredData: true,
  platform: 'woocommerce',
  includeReviews: true
});
```

Creates realistic e-commerce HTML with:
- Structured data (JSON-LD, microdata)
- Multiple product variations
- Platform-specific markup
- Navigation, headers, footers
- Customer reviews and ratings

### Template Variation Generator
```typescript
TestDataFactory.createTemplateVariations(5);
```

Generates similar content with variations for pattern detection testing.

### Large Content Generator
```typescript
TestDataFactory.createLargeContentHTML(100);
```

Creates large documents for performance testing.

## Mock Services

All external services are comprehensively mocked:

### Supabase Mock
- Full CRUD operations
- Query builder chain methods
- Error simulation capabilities

### Redis Mock  
- In-memory storage simulation
- Full Redis command support
- Expiration handling

### OpenAI Mock
- Chat completions with structured responses
- Embeddings generation
- Token usage tracking

## Performance Monitoring

Built-in performance measurement utilities:

```typescript
PerformanceHelpers.startTimer('ai-optimization');
const optimizedContent = await AIContentExtractor.extractOptimized(html, url);
const duration = PerformanceHelpers.endTimer('ai-optimization');
```

**Tracks:**
- Processing times per operation
- Memory usage before/after operations
- Compression ratios achieved
- Token reduction statistics

## Running the Tests

### Basic Commands

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration:coverage  

# Run in watch mode
npm run test:integration:watch

# Run all tests (unit + integration)
npm run test:all
```

### Individual Test Categories

```bash
# Run specific test describe block
npm run test:integration -- --testNamePattern="E-commerce Scraping"

# Run with verbose output
npm run test:integration -- --verbose

# Run with specific timeout
npm run test:integration -- --testTimeout=180000
```

## Configuration Options

### Test Timeouts
- Individual tests: 2 minutes (120,000ms)
- Global timeout: Configurable per test

### Memory Limits
- Node.js max old space: 4GB
- Test worker processes: 50% of available cores

### Coverage Thresholds
- Functions: 60%
- Lines: 70% 
- Branches: 60%
- Statements: 70%

## Environment Variables

Required for testing:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=test-openai-key
NODE_ENV=test
DISABLE_REAL_REQUESTS=true
```

## Debugging Tests

### Enable Detailed Logging
```typescript
// In test files, enable console output
beforeEach(() => {
  console.log = originalConsoleLog; // Re-enable console.log
});
```

### Memory Analysis
```typescript
// Check memory usage during tests
const memoryUsage = PerformanceHelpers.getMemoryUsage();
console.log('Memory usage:', memoryUsage);
```

### Performance Profiling
```typescript
// Measure specific operations
const result = await PerformanceHelpers.measureAsync('operation-name', async () => {
  return await someExpensiveOperation();
});
console.log('Operation took:', result.duration, 'ms');
```

## Continuous Integration

The integration tests are designed to run reliably in CI/CD environments:

- **Deterministic**: All external dependencies are mocked
- **Fast**: Optimized for CI with proper timeouts
- **Reliable**: No flaky tests or network dependencies  
- **Comprehensive**: Full system coverage
- **Memory Efficient**: Automatic cleanup and garbage collection

### CI Configuration Example

```yaml
# .github/workflows/test.yml
- name: Run Integration Tests
  run: |
    npm run test:integration:coverage
    npm run test:all
  env:
    NODE_ENV: test
    CI: true
```

## Best Practices

### Writing New Integration Tests

1. **Use the test data factories** for consistent, realistic test data
2. **Mock all external services** to ensure deterministic behavior
3. **Validate complete workflows** rather than individual functions
4. **Include performance assertions** for critical operations
5. **Test error scenarios** and edge cases
6. **Use validation helpers** for consistent structure checking

### Performance Considerations

1. **Set reasonable timeouts** based on operation complexity
2. **Monitor memory usage** to prevent memory leaks
3. **Use batch operations** where possible for efficiency
4. **Clean up resources** in afterEach/afterAll hooks
5. **Measure and assert performance** for critical paths

### Maintenance

1. **Update test data** when system requirements change
2. **Review performance benchmarks** periodically
3. **Add new test scenarios** for new features
4. **Keep mocks synchronized** with real service APIs
5. **Monitor test execution times** and optimize slow tests

## Contributing

When adding new integration tests:

1. Follow the existing test structure and naming conventions
2. Use the provided test utilities and helpers
3. Include comprehensive assertions and validations
4. Add performance measurements for new operations
5. Update this README with new test categories or features

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase `testTimeout` in jest.integration.config.js
- Check for unresolved promises or infinite loops

**Memory errors:**
- Increase `--max-old-space-size` in jest.env.js
- Add more frequent garbage collection calls

**Mock issues:**
- Verify mock setup in integration-setup.js  
- Check that mocks match the expected API signatures

**Performance test failures:**
- Review performance benchmarks for reasonableness
- Consider CI environment performance differences

### Getting Help

1. Check the console output for detailed error messages
2. Enable verbose logging with `--verbose` flag
3. Review the test helpers and validation utilities
4. Examine successful tests for patterns and examples

The integration test suite provides confidence that the enhanced scraping system works correctly as a complete system, handling real-world scenarios with proper error handling, performance optimization, and data consistency.