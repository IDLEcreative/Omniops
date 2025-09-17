# Customer API

Customer management and configuration endpoints for domain setup, scraping automation, and business settings.

## Overview

This API provides comprehensive customer management functionality including domain configuration, automatic scraping triggers, and customer settings management. Designed for multi-tenant applications with domain-based isolation.

## Endpoints

### GET `/api/customer/config`

Retrieve customer configurations with optional filtering and status information.

#### Authentication
- **Type**: Service role or customer authentication
- **Rate Limits**: Standard domain-based limiting
- **Permissions**: Customer isolation and access control

#### Query Parameters
- `customerId` (optional): Filter by specific customer ID
- `domain` (optional): Filter by domain name
- `includeStatus` (boolean, default: false): Include scraping status
- `limit` (integer, 1-100, default: 50): Results per page
- `offset` (integer, default: 0): Pagination offset

#### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "config_abc123",
      "customer_id": "cust_456",
      "domain": "example.com",
      "settings": {
        "autoScrape": true,
        "scrapingFrequency": "weekly",
        "priority": "normal",
        "maxPages": 500,
        "includeSubdomains": false
      },
      "metadata": {
        "originalUrl": "https://www.example.com",
        "domainValidation": {
          "isValid": true,
          "normalizedUrl": "https://example.com"
        },
        "createdViaApi": true
      },
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-17T09:15:00.000Z",
      "scrapingStatus": {
        "hasActiveJobs": false,
        "totalJobs": 15,
        "successfulJobs": 14,
        "failedJobs": 1
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### POST `/api/customer/config`

Create new customer configuration with automatic domain validation and scraping triggers.

#### Request Format

```json
{
  "domain": "https://example.com",
  "customerId": "cust_456",
  "settings": {
    "autoScrape": true,
    "scrapingFrequency": "weekly",
    "priority": "high",
    "maxPages": 1000,
    "includeSubdomains": true
  },
  "metadata": {
    "source": "dashboard",
    "notes": "Customer onboarding configuration"
  }
}
```

#### Required Fields
- `domain` (string): Target domain URL (will be normalized)

#### Optional Fields
- `customerId` (string): Customer identifier for ownership
- `settings` (object): Scraping and automation settings
- `metadata` (object): Additional configuration metadata

#### Response Format

```json
{
  "success": true,
  "data": {
    "config": {
      "id": "config_xyz789",
      "customer_id": "cust_456",
      "domain": "example.com",
      "settings": {
        "autoScrape": true,
        "scrapingFrequency": "weekly",
        "priority": "high",
        "maxPages": 1000,
        "includeSubdomains": true
      },
      "created_at": "2024-01-17T10:30:00.000Z"
    },
    "domainValidation": {
      "isValid": true,
      "domain": "example.com",
      "normalizedUrl": "https://example.com",
      "warnings": []
    },
    "scraping": {
      "success": true,
      "jobId": "scrape_20240117_103000_abc123",
      "message": "Automatic scraping triggered"
    }
  }
}
```

### PUT `/api/customer/config?id={configId}`

Update existing customer configuration with optional domain changes.

#### Query Parameters
- `id` (required): Configuration ID to update

#### Request Format

```json
{
  "domain": "https://newdomain.com",
  "settings": {
    "scrapingFrequency": "daily",
    "maxPages": 2000
  },
  "metadata": {
    "updateReason": "Domain migration",
    "updatedBy": "customer-service"
  }
}
```

### DELETE `/api/customer/config?id={configId}`

Delete customer configuration and cancel associated scraping jobs.

#### Query Parameters
- `id` (required): Configuration ID to delete

#### Response Format

```json
{
  "success": true,
  "message": "Configuration deleted successfully",
  "cancelledJobs": 2
}
```

## Features

### Domain Management
- **URL Normalization**: Automatic URL cleanup and standardization
- **Domain Validation**: Comprehensive domain accessibility checking
- **Subdomain Support**: Configurable subdomain inclusion
- **Ownership Verification**: Domain ownership validation

### Automatic Scraping
- **Trigger Integration**: Automatic scraping on configuration creation
- **Frequency Control**: Configurable scraping schedules
- **Priority Management**: High/normal/low priority job queuing
- **Page Limits**: Configurable maximum page crawling

### Configuration Validation
- **Schema Validation**: Comprehensive input validation
- **Domain Accessibility**: Real-time domain reachability testing
- **Conflict Detection**: Prevent duplicate domain configurations
- **Settings Validation**: Validate scraping settings and limits

## Configuration Schema

### Settings Object
```typescript
interface CustomerScrapingSettings {
  autoScrape: boolean              // Enable automatic scraping
  scrapingFrequency: 'daily' | 'weekly' | 'monthly'
  priority: 'high' | 'normal' | 'low'
  maxPages: number                 // 1-100000, default: 50
  includeSubdomains: boolean       // Include subdomains in crawling
}
```

### Metadata Object
```typescript
interface ConfigurationMetadata {
  originalUrl?: string             // Original URL before normalization
  domainValidation?: object        // Validation results
  createdViaApi?: boolean          // API creation flag
  source?: string                  // Creation source identifier
  notes?: string                   // Customer notes
  [key: string]: any              // Additional metadata
}
```

## Domain Validation

### Validation Process
1. **URL Parsing**: Extract and validate URL components
2. **Normalization**: Standardize domain format
3. **Accessibility Check**: Verify domain is reachable
4. **Conflict Check**: Ensure domain not already configured
5. **Security Validation**: Check for malicious domains

### Validation Response
```json
{
  "isValid": true,
  "domain": "example.com",
  "normalizedUrl": "https://example.com",
  "warnings": [
    "Domain uses non-standard port"
  ],
  "accessibility": {
    "accessible": true,
    "statusCode": 200,
    "responseTime": 245
  }
}
```

## Scraping Integration

### Automatic Triggers
- **New Configuration**: Trigger initial scraping on creation
- **Domain Changes**: Re-scrape when domain is updated
- **Schedule Management**: Recurring scraping based on frequency
- **Priority Queuing**: Handle high-priority configurations first

### Job Management
```json
{
  "scraping": {
    "success": true,
    "jobId": "scrape_20240117_103000_abc123",
    "priority": "high",
    "estimatedCompletion": "2024-01-17T10:35:00.000Z",
    "config": {
      "maxPages": 1000,
      "includeSubdomains": true
    }
  }
}
```

## Performance

### Response Times
- **Configuration Retrieval**: 100-300ms typical
- **Configuration Creation**: 200-800ms (includes validation)
- **Bulk Operations**: 500-2000ms for large datasets
- **Domain Validation**: 200-1000ms depending on target

### Optimization
- **Batch Operations**: Efficient bulk configuration management
- **Caching Strategy**: Cache validation results and configurations
- **Async Processing**: Background scraping triggers
- **Connection Pooling**: Optimized database connections

## Examples

### Create Basic Configuration
```bash
curl -X POST 'http://localhost:3000/api/customer/config' \
  -H 'Content-Type: application/json' \
  -d '{
    "domain": "https://example.com",
    "customerId": "cust_123"
  }'
```

### Create Advanced Configuration
```bash
curl -X POST 'http://localhost:3000/api/customer/config' \
  -H 'Content-Type: application/json' \
  -d '{
    "domain": "https://bigsite.com",
    "customerId": "cust_456",
    "settings": {
      "autoScrape": true,
      "scrapingFrequency": "daily",
      "priority": "high",
      "maxPages": 5000,
      "includeSubdomains": true
    },
    "metadata": {
      "source": "enterprise-onboarding",
      "notes": "Large e-commerce site",
      "industry": "automotive"
    }
  }'
```

### Get Customer Configurations
```bash
curl 'http://localhost:3000/api/customer/config?customerId=cust_123&includeStatus=true&limit=10'
```

### Update Configuration
```bash
curl -X PUT 'http://localhost:3000/api/customer/config?id=config_abc123' \
  -H 'Content-Type: application/json' \
  -d '{
    "settings": {
      "scrapingFrequency": "weekly",
      "maxPages": 2000
    }
  }'
```

### Delete Configuration
```bash
curl -X DELETE 'http://localhost:3000/api/customer/config?id=config_abc123'
```

## Error Handling

### Validation Errors
```json
// Invalid domain
{
  "error": "Invalid domain",
  "details": "Domain is not accessible",
  "warnings": ["SSL certificate expired"]
}

// Duplicate configuration
{
  "error": "Domain already configured",
  "existingConfigId": "config_existing123"
}

// Invalid settings
{
  "error": "Invalid request body",
  "details": {
    "fieldErrors": {
      "settings.maxPages": ["Must be between 1 and 100000"]
    }
  }
}
```

### System Errors
```json
// Service unavailable
{
  "error": "Service temporarily unavailable",
  "message": "The service is currently undergoing maintenance. Please try again later."
}

// Database connection error
{
  "error": "Database connection failed"
}

// Configuration not found
{
  "error": "Configuration not found"
}
```

## Security Features

### Access Control
- **Customer Isolation**: Configurations isolated by customer
- **Domain Ownership**: Validate customer domain ownership
- **Permission Checks**: Verify customer permissions for operations
- **Audit Logging**: Log all configuration changes

### Data Protection
- **Encrypted Storage**: Configuration data encrypted at rest
- **Secure Transmission**: HTTPS-only API communication
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against abuse

### Domain Security
- **Malicious Domain Detection**: Block known malicious domains
- **SSL Validation**: Verify SSL certificates for security
- **Access Restrictions**: Prevent unauthorized domain access
- **Subdomain Validation**: Validate subdomain accessibility

## Integration

### With Scraping System
- **Automatic Triggers**: Seamless scraping job creation
- **Job Monitoring**: Track scraping progress and status
- **Error Handling**: Handle scraping failures gracefully
- **Result Processing**: Process scraping results automatically

### With Customer Management
- **Customer Association**: Link configurations to customers
- **Permission Management**: Control customer access levels
- **Billing Integration**: Track usage for billing purposes
- **Support Integration**: Customer support access to configurations

### With Analytics
- **Usage Tracking**: Track configuration usage and performance
- **Success Metrics**: Monitor scraping success rates
- **Performance Analytics**: Configuration performance analysis
- **Cost Analysis**: Track scraping costs per configuration

## Best Practices

### Configuration Management
- **Descriptive Metadata**: Include comprehensive metadata
- **Appropriate Settings**: Set realistic page limits and frequencies
- **Regular Reviews**: Periodically review and update configurations
- **Documentation**: Document configuration purposes and changes

### Domain Management
- **Domain Verification**: Verify domain ownership before configuration
- **SSL Requirements**: Ensure domains have valid SSL certificates
- **Performance Monitoring**: Monitor domain performance and accessibility
- **Change Management**: Plan and communicate domain changes

### Scraping Optimization
- **Appropriate Limits**: Set reasonable page limits for domain size
- **Frequency Tuning**: Adjust scraping frequency based on content updates
- **Priority Management**: Use appropriate priority levels
- **Resource Monitoring**: Monitor scraping resource usage

## Monitoring and Analytics

### Configuration Metrics
```json
{
  "configurations": {
    "total": 450,
    "active": 425,
    "with_auto_scrape": 380,
    "by_frequency": {
      "daily": 120,
      "weekly": 200,
      "monthly": 60
    }
  },
  "scraping": {
    "triggered_jobs": 1250,
    "success_rate": 94.5,
    "average_pages_per_job": 85
  }
}
```

### Performance Tracking
- **Response Times**: API endpoint performance monitoring
- **Success Rates**: Configuration creation and update success
- **Error Analysis**: Common error patterns and resolution
- **Usage Patterns**: Customer configuration usage analysis

## Related Endpoints

- `/api/scrape` - Website scraping functionality
- `/api/auth/customer` - Customer authentication and management
- `/api/monitoring/scraping` - Scraping analytics and monitoring
- `/api/dashboard/config` - Dashboard configuration management

## Future Enhancements

### Planned Features
- **Bulk Configuration Import**: CSV/JSON bulk configuration import
- **Configuration Templates**: Pre-defined configuration templates
- **Advanced Scheduling**: Complex scraping schedules and triggers
- **Webhook Integration**: Real-time configuration change notifications
- **Configuration Backup**: Backup and restore configuration data