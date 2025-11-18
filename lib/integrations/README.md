**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# External Integrations

**Purpose:** Service orchestration layer for coordinating external APIs and complex multi-service workflows.

**Integration Type:** Service
**Last Updated:** 2025-10-30
**Status:** Active

This directory contains integrations with external services and APIs that extend the platform's capabilities. These integrations handle complex data flows, third-party service connections, and advanced business logic coordination.

## Overview

The integrations layer sits between the core business logic and external services, providing:
- **Service Abstractions**: Clean interfaces for external APIs
- **Data Transformation**: Convert between internal and external data formats
- **Error Handling**: Robust error management for external service failures
- **Rate Limiting**: Respect external service limits and quotas
- **Caching**: Intelligent caching to reduce external API calls

## Architecture

```
integrations/
└── customer-scraping-integration.ts    # Customer-specific scraping workflows
```

## Core Components

### Customer Scraping Integration (`customer-scraping-integration.ts`)

A comprehensive integration that orchestrates customer-specific web scraping workflows with advanced features:

**Key Features:**
- **Multi-Stage Processing**: Coordinates scraping, extraction, and embedding generation
- **Customer Context**: Handles customer-specific configurations and requirements
- **Intelligent Retry Logic**: Robust error handling with exponential backoff
- **Progress Tracking**: Real-time progress updates for long-running operations
- **Resource Management**: Efficient memory and connection pool management

**Core Functionality:**
```typescript
interface CustomerScrapingIntegration {
  // Main workflow orchestration
  processCustomerScraping(customerId: string, config: ScrapingConfig): Promise<ScrapingResult>;
  
  // Individual workflow steps
  initializeCustomerContext(customerId: string): Promise<CustomerContext>;
  executeScraping(urls: string[], config: ScrapingConfig): Promise<ScrapedData[]>;
  processExtraction(data: ScrapedData[]): Promise<ExtractedContent[]>;
  generateEmbeddings(content: ExtractedContent[]): Promise<EmbeddingResult[]>;
  
  // Progress and monitoring
  getProgressStatus(jobId: string): Promise<ProgressStatus>;
  cancelJob(jobId: string): Promise<boolean>;
}
```

**Usage Examples:**
```typescript
import { CustomerScrapingIntegration } from '@/lib/integrations/customer-scraping-integration';

// Initialize integration
const integration = new CustomerScrapingIntegration();

// Process customer scraping with custom configuration
const result = await integration.processCustomerScraping('customer-123', {
  urls: ['https://example.com'],
  maxPages: 50,
  extractProducts: true,
  generateEmbeddings: true,
  turboMode: true
});

// Monitor progress
const status = await integration.getProgressStatus(result.jobId);
console.log(`Progress: ${status.percentage}% - ${status.currentStep}`);
```

## Integration Patterns

### 1. Service Orchestration
Coordinates multiple services to complete complex workflows:

```typescript
async processCustomerScraping(customerId: string, config: ScrapingConfig) {
  // Step 1: Initialize customer context
  const context = await this.initializeCustomerContext(customerId);
  
  // Step 2: Execute scraping with customer-specific settings
  const scrapedData = await this.executeScraping(config.urls, {
    ...config,
    customerSettings: context.settings
  });
  
  // Step 3: Process and extract content
  const extractedContent = await this.processExtraction(scrapedData);
  
  // Step 4: Generate embeddings for search
  const embeddings = await this.generateEmbeddings(extractedContent);
  
  // Step 5: Store results and update customer data
  return await this.finalizeResults(customerId, embeddings);
}
```

### 2. Error Recovery and Resilience
Implements robust error handling across service boundaries:

```typescript
async executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 3. Progress Tracking
Provides real-time feedback for long-running operations:

```typescript
interface ProgressStatus {
  jobId: string;
  percentage: number;
  currentStep: string;
  estimatedTimeRemaining: number;
  processedItems: number;
  totalItems: number;
  errors: ErrorInfo[];
}
```

## External Service Integrations

### OpenAI Integration
- **Embedding Generation**: Convert text to vector embeddings
- **Content Analysis**: AI-powered content classification
- **Error Handling**: Retry logic for rate limits and temporary failures

### WooCommerce Integration
- **Dynamic API Discovery**: Automatically detect available endpoints
- **Customer Data Sync**: Synchronize customer information
- **Order Processing**: Handle order-related workflows

### Redis Integration
- **Job Queue Management**: Background task processing
- **Caching Layer**: Performance optimization
- **Rate Limiting**: Request throttling and quota management

### Supabase Integration
- **Data Persistence**: Store processed results
- **Real-time Updates**: Live progress tracking
- **Query Optimization**: Efficient data retrieval

## Configuration Management

### Environment-Based Configuration
```typescript
interface IntegrationConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    rateLimit: number;
  };
  redis: {
    url: string;
    keyPrefix: string;
    ttl: number;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
}
```

### Customer-Specific Settings
```typescript
interface CustomerSettings {
  scrapingPreferences: {
    respectRobots: boolean;
    crawlDelay: number;
    maxConcurrency: number;
  };
  contentFilters: {
    excludePatterns: string[];
    includeSelectors: string[];
  };
  embeddingConfig: {
    chunkSize: number;
    overlap: number;
    model: string;
  };
}
```

## Performance Optimization

### 1. Batch Processing
Process multiple items together to reduce API overhead:

```typescript
async processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### 2. Intelligent Caching
Cache expensive operations with smart invalidation:

```typescript
async getWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await this.cache.get(key);
  if (cached) return cached;
  
  const result = await fetcher();
  await this.cache.set(key, result, ttl);
  return result;
}
```

### 3. Resource Pooling
Manage connections and resources efficiently:

```typescript
class ConnectionPool {
  private pool: Connection[] = [];
  private maxSize: number = 10;
  
  async acquire(): Promise<Connection> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return await this.createConnection();
  }
  
  async release(connection: Connection): Promise<void> {
    if (this.pool.length < this.maxSize) {
      this.pool.push(connection);
    } else {
      await connection.close();
    }
  }
}
```

## Error Handling and Monitoring

### 1. Structured Error Handling
```typescript
interface IntegrationError {
  code: string;
  message: string;
  service: string;
  context: Record<string, any>;
  retryable: boolean;
  timestamp: Date;
}

class IntegrationErrorHandler {
  handle(error: Error, context: any): IntegrationError {
    return {
      code: this.getErrorCode(error),
      message: error.message,
      service: context.service,
      context: this.sanitizeContext(context),
      retryable: this.isRetryable(error),
      timestamp: new Date()
    };
  }
}
```

### 2. Health Monitoring
```typescript
interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

async checkServiceHealth(): Promise<ServiceHealth[]> {
  return await Promise.all([
    this.checkOpenAIHealth(),
    this.checkRedisHealth(),
    this.checkSupabaseHealth()
  ]);
}
```

## Testing

### Integration Testing
```typescript
describe('CustomerScrapingIntegration', () => {
  it('should process customer scraping workflow', async () => {
    const integration = new CustomerScrapingIntegration();
    const result = await integration.processCustomerScraping('test-customer', {
      urls: ['https://example.com'],
      maxPages: 5
    });
    
    expect(result.success).toBe(true);
    expect(result.processedPages).toBeGreaterThan(0);
  });
  
  it('should handle service failures gracefully', async () => {
    // Mock service failure
    jest.spyOn(openaiService, 'generateEmbedding').mockRejectedValue(new Error('Service unavailable'));
    
    const integration = new CustomerScrapingIntegration();
    const result = await integration.processCustomerScraping('test-customer', testConfig);
    
    expect(result.errors).toHaveLength(1);
    expect(result.success).toBe(false);
  });
});
```

### Mock Services
```typescript
// Mock external services for testing
jest.mock('@/lib/openai-client', () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3])
}));

jest.mock('@/lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));
```

## Security Considerations

### 1. API Key Management
- Store API keys securely in environment variables
- Rotate keys regularly
- Use least-privilege access principles
- Monitor API key usage

### 2. Data Sanitization
```typescript
function sanitizeCustomerData(data: any): any {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.apiKeys;
  delete sanitized.passwords;
  delete sanitized.personalInfo;
  
  return sanitized;
}
```

### 3. Rate Limiting
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(service: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(service) || [];
    
    // Remove expired requests
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(service, validRequests);
    return true;
  }
}
```

## Best Practices

### 1. Design Principles
- **Single Responsibility**: Each integration handles one primary concern
- **Fail Fast**: Detect and report errors early in the process
- **Graceful Degradation**: Continue partial operation when services fail
- **Idempotency**: Operations can be safely retried

### 2. Performance Guidelines
- Use connection pooling for database connections
- Implement request batching where possible
- Cache expensive computations
- Monitor and optimize bottlenecks

### 3. Monitoring and Observability
- Log all external service interactions
- Track performance metrics
- Set up alerts for failures
- Maintain service health dashboards

## Configuration

### Environment Variables

Required for external service connections:

```bash
# OpenAI Integration
OPENAI_API_KEY=sk_...

# Redis Integration
REDIS_URL=redis://localhost:6379

# Supabase Integration
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# WooCommerce (per-customer, stored encrypted in DB)
# No environment variables needed
```

## Troubleshooting

**Issue: "Service unavailable" errors**
- **Cause:** External API down or unreachable
- **Solution:** Check health monitoring, implement retry logic
- **Test:** Use `await checkServiceHealth()` to verify connectivity

**Issue: "Rate limit exceeded"**
- **Cause:** Too many requests to external service
- **Solution:** Implement request throttling and batching
- **Check:** Review rate limiting configuration in integration code

**Issue: "Integration timeout"**
- **Cause:** Long-running operation exceeds timeout
- **Solution:** Increase timeout or break into smaller operations
- **Alternative:** Use background jobs for long-running tasks

**Issue: "Data transformation failed"**
- **Cause:** Unexpected data format from external API
- **Solution:** Add validation and error handling for edge cases
- **Debug:** Log raw API responses to identify format issues

## Related Documentation

**Internal:**
- [lib/embeddings.ts](/Users/jamesguy/Omniops/lib/embeddings.ts) - AI embedding generation
- [lib/woocommerce-full.ts](/Users/jamesguy/Omniops/lib/woocommerce-full.ts) - WooCommerce API integration
- [lib/redis.ts](/Users/jamesguy/Omniops/lib/redis.ts) - Redis caching and queuing
- [lib/scraper-api.ts](/Users/jamesguy/Omniops/lib/scraper-api.ts) - Web scraping functionality
- [app/api/scrape/route.ts](/Users/jamesguy/Omniops/app/api/scrape/route.ts) - HTTP API endpoints
- [lib/queue/](/Users/jamesguy/Omniops/lib/queue/) - Job queue system for background processing

**External:**
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [Supabase Documentation](https://supabase.com/docs)

## Contributing

When adding new integrations:

1. **Follow the established patterns** for error handling and configuration
2. **Implement proper testing** with mocked external services
3. **Add monitoring and health checks** for new services
4. **Document configuration requirements** and usage examples
5. **Consider rate limiting and caching** for external API calls
6. **Implement proper security measures** for API keys and sensitive data

The integrations layer is crucial for maintaining reliable, performant connections to external services while providing a clean abstraction for the rest of the application.
