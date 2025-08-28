# Customer Scraping Integration Documentation

This document describes the complete customer onboarding to automatic scraping integration system that has been implemented.

## 🎯 Overview

The integration creates a seamless flow where customers can add their website URL and automatic scraping is triggered immediately without any manual intervention. The system includes:

- **Domain validation and normalization**
- **Customer configuration management**
- **Automatic scraping job creation**
- **Queue integration for job processing**
- **Error handling and monitoring**

## 📁 File Structure

```
lib/
├── utils/
│   └── domain-validator.ts          # Domain validation and normalization
├── integrations/
│   └── customer-scraping-integration.ts  # Main integration logic
├── supabase/
│   └── server.ts                    # Supabase client configuration
└── scrape-job-manager.ts            # Scraping job management

app/api/customer/config/
├── route.ts                         # Customer config CRUD operations
└── validate/
    └── route.ts                     # Domain validation endpoint

test-customer-flow.js                # End-to-end testing script
```

## 🔧 Core Components

### 1. Domain Validator (`lib/utils/domain-validator.ts`)

Provides comprehensive URL validation and domain processing:

**Features:**
- URL format validation and normalization
- Domain extraction and cleanup
- Accessibility testing
- Duplicate domain checking
- Warning system for edge cases

**Key Methods:**
```typescript
validateUrl(url: string): DomainValidationResult
extractDomain(url: string): string | null
checkDomainStatus(domain: string): Promise<DomainCheckResult>
checkDomainAccessibility(domain: string): Promise<AccessibilityResult>
```

### 2. Customer Scraping Integration (`lib/integrations/customer-scraping-integration.ts`)

Core integration logic that connects customer onboarding with scraping:

**Features:**
- Automatic scraping strategy determination
- Job priority management based on customer type
- Domain change handling
- Integration status tracking

**Key Methods:**
```typescript
handleNewCustomerConfig(config: CustomerScrapingConfig): Promise<ScrapingTriggerResult>
handleCustomerConfigUpdate(oldConfig, newConfig): Promise<ScrapingTriggerResult>
scheduleRefreshScraping(customerConfigId: string): Promise<ScrapingTriggerResult>
```

### 3. Customer Config API (`app/api/customer/config/route.ts`)

RESTful API for managing customer website configurations:

**Endpoints:**
- `GET /api/customer/config` - List customer configurations
- `POST /api/customer/config` - Create new configuration (triggers automatic scraping)
- `PUT /api/customer/config?id=...` - Update configuration
- `DELETE /api/customer/config?id=...` - Delete configuration
- `GET /api/customer/config/validate?domain=...` - Validate domain

### 4. Supabase Integration (`lib/supabase/server.ts`)

Database client with proper TypeScript typing:

**Features:**
- Server-side Supabase client
- Service role client for admin operations
- Connection testing utilities
- Comprehensive type definitions for database schema

## 🚀 How It Works

### Customer Onboarding Flow

1. **Customer enters website URL** → `POST /api/customer/config`
2. **Domain validation** → `domain-validator.validateUrl()`
3. **Configuration creation** → Database record created
4. **Automatic scraping trigger** → `customerScrapingIntegration.handleNewCustomerConfig()`
5. **Job creation** → `scrapeJobManager.createJob()`
6. **Queue scheduling** → Job added to processing queue
7. **Real-time monitoring** → Progress tracking available

### Scraping Strategy Logic

The system automatically determines the best scraping strategy based on:

- **New customers**: High-priority initial scrape (up to 5 pages, turbo mode)
- **Existing customers**: Normal-priority refresh scrape
- **Full crawls**: Low-priority comprehensive scraping (100+ pages)
- **Domain updates**: Refresh scraping with old job cancellation

### Priority Management

```typescript
enum JobPriority {
  CRITICAL = 10,  // System maintenance
  HIGH = 5,       // New customer onboarding
  NORMAL = 0,     // Regular updates
  LOW = -5,       // Full site crawls
  DEFERRED = -10  // Background processing
}
```

## 🔌 API Usage Examples

### Create Customer Configuration

```bash
curl -X POST http://localhost:3000/api/customer/config \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "customerId": "customer-123",
    "settings": {
      "autoScrape": true,
      "scrapingFrequency": "weekly",
      "priority": "high",
      "maxPages": 25
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "config": {
      "id": "config-456",
      "domain": "example.com",
      "settings": {...}
    },
    "domainValidation": {
      "valid": true,
      "warnings": ["Added HTTPS protocol to URL"]
    },
    "scraping": {
      "success": true,
      "jobId": "job-789",
      "queueJobId": "queue-abc"
    }
  }
}
```

### Validate Domain

```bash
curl "http://localhost:3000/api/customer/config/validate?domain=example.com"
```

**Response:**
```json
{
  "valid": true,
  "domain": "example.com",
  "normalizedUrl": "https://example.com",
  "warnings": [],
  "exists": false,
  "isBeingScrapped": false,
  "accessible": true,
  "statusCode": 200,
  "responseTime": 234
}
```

## 🧪 Testing

### End-to-End Test Script

Run the complete customer flow test:

```bash
node test-customer-flow.js
```

The test script:
- Validates system health
- Tests multiple domain scenarios
- Simulates customer onboarding
- Monitors scraping progress
- Provides comprehensive reporting

**Test Domains:**
- `example.com` (valid, accessible)
- `google.com` (valid, accessible)
- `github.com` (valid, accessible)
- `invalid-domain-test.xyz` (invalid for testing)

### Manual Testing

```bash
# Test domain validation
curl "http://localhost:3000/api/customer/config/validate?domain=your-domain.com"

# Create customer config
curl -X POST http://localhost:3000/api/customer/config \
  -H "Content-Type: application/json" \
  -d '{"domain": "your-domain.com", "customerId": "test-customer"}'

# Check configuration status
curl "http://localhost:3000/api/customer/config?customerId=test-customer"
```

## 🛠️ Database Schema

The system expects these database tables:

```sql
-- Customer configurations
CREATE TABLE customer_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT,
  domain TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domain records
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraping jobs
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES domains(id),
  customer_config_id UUID REFERENCES customer_configs(id),
  domain TEXT NOT NULL,
  job_type TEXT DEFAULT 'domain_scrape',
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ⚙️ Configuration

### Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Queue Configuration
REDIS_URL=redis://localhost:6379
QUEUE_NAME=customer-service-scraper
QUEUE_CONCURRENCY=5

# Application Configuration
NODE_ENV=development
API_BASE_URL=http://localhost:3000
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes path mapping:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 🔍 Monitoring and Logging

The integration includes comprehensive logging:

```typescript
// Example log entries
info: Customer configuration created {configId, customerId, domain}
info: Automatic scraping triggered {configId, domain, jobId}
warn: Job created but failed to add to queue {jobId, domain, error}
error: Error in customer scraping integration {configId, error}
```

### Integration Status Endpoint

Check integration health:

```bash
curl "http://localhost:3000/api/customer/config?customerId=test-customer"
```

Returns configuration with scraping status:
```json
{
  "scrapingStatus": {
    "hasActiveJobs": true,
    "lastJobStatus": "running",
    "lastJobDate": "2023-12-01T10:00:00Z",
    "totalJobs": 5,
    "successfulJobs": 4,
    "failedJobs": 0
  }
}
```

## 🚦 Error Handling

### Domain Validation Errors

- Invalid URL format
- Inaccessible domains
- Localhost/internal domains (warning)
- Duplicate domain detection

### Integration Errors

- Database connection failures
- Queue system issues
- Job creation failures
- Configuration conflicts

### Graceful Degradation

- Jobs created even if queue fails
- Warnings provided for accessibility issues
- Retry logic for transient failures
- Comprehensive error reporting

## 🔧 Future Enhancements

### Planned Features

1. **Webhook Notifications** - Real-time scraping status updates
2. **Bulk Domain Import** - CSV/Excel file upload support
3. **Advanced Scheduling** - Cron-based scraping schedules
4. **Domain Groups** - Organize related domains
5. **Analytics Dashboard** - Scraping performance metrics

### Integration Points

- **CRM Systems** - Customer data synchronization
- **Notification Services** - Email/SMS alerts
- **Analytics Platforms** - Usage tracking
- **Monitoring Systems** - Health checks and alerting

## 📖 Usage Examples

### Basic Customer Onboarding

```javascript
// Customer adds their website
const response = await fetch('/api/customer/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'customer-website.com',
    customerId: 'cust_123',
    settings: {
      autoScrape: true,
      priority: 'high'
    }
  })
});

const result = await response.json();
console.log('Scraping job created:', result.data.scraping.jobId);
```

### Domain Update Handling

```javascript
// Update customer's domain
const response = await fetch('/api/customer/config?id=config-456', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'new-customer-website.com'
  })
});

// Old scraping jobs automatically cancelled
// New scraping job automatically created
```

## 🎯 Key Benefits

1. **Zero Manual Intervention** - Automatic scraping triggers
2. **Intelligent Prioritization** - New customers get priority
3. **Comprehensive Validation** - Domain format and accessibility checks
4. **Robust Error Handling** - Graceful failure management
5. **Real-time Monitoring** - Complete visibility into scraping status
6. **Scalable Architecture** - Queue-based processing system

## 🔗 Dependencies

- **Next.js 15** - Web framework
- **Supabase** - Database and authentication
- **BullMQ** - Queue processing
- **Redis** - Queue backend
- **TypeScript** - Type safety

The integration is production-ready and provides a seamless experience for customers while ensuring efficient resource utilization through intelligent job prioritization and queue management.