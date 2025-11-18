**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Dashboard API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Authentication API](/home/user/Omniops/app/api/auth/README.md), [WooCommerce Integration](/home/user/Omniops/lib/woocommerce-api/README.md), [Analytics System](/home/user/Omniops/lib/analytics/README.md)
**Estimated Read Time:** 14 minutes

## Purpose

Complete technical reference for the Dashboard API providing business intelligence, analytics, configuration management, and performance monitoring for authenticated customers. This API enables real-time dashboard functionality with WooCommerce integration, Shopify integration, and comprehensive business metrics tracking.

## Quick Links

- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Authentication API](/home/user/Omniops/app/api/auth/README.md)
- [WooCommerce API](/home/user/Omniops/app/api/woocommerce/README.md)
- [Monitoring API](/home/user/Omniops/app/api/monitoring/README.md)
- [Customer Configuration](/home/user/Omniops/app/api/customer/README.md)

## Table of Contents

- [Purpose](#purpose)
- [Quick Links](#quick-links)
- [Overview](#overview)
- [Endpoints](#endpoints)
  - [GET /api/dashboard/config](#get-apidashboardconfig)
  - [POST /api/dashboard/config](#post-apidashboardconfig)
  - [GET /api/dashboard/test-connection](#get-apidashboardtest-connection)
  - [GET /api/dashboard/analytics](#get-apidashboardanalytics)
  - [GET /api/dashboard/woocommerce/[...path]](#get-apidashboardwoocommercepath)
- [Features](#features)
- [Configuration Schema](#configuration-schema)
- [Security Features](#security-features)
- [Performance Optimization](#performance-optimization)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Analytics Metrics](#analytics-metrics)
- [Integration with External Services](#integration-with-external-services)
- [Real-time Features](#real-time-features)
- [Best Practices](#best-practices)
- [Related Endpoints](#related-endpoints)
- [Future Enhancements](#future-enhancements)
- [Keywords](#keywords)

---

## Overview

This API provides comprehensive dashboard functionality including customer configuration management, WooCommerce integration status, performance analytics, and business intelligence data. Designed for authenticated customer access with real-time data updates.

## Endpoints

### GET `/api/dashboard/config`

Retrieve customer dashboard configuration and settings.

#### Authentication
- **Type**: Supabase Auth (required)
- **Session**: Active customer session required
- **Scope**: Customer-specific data isolation

#### Response Format

```json
{
  "config": {
    "domain": "example.com",
    "owned_domains": ["example.com", "shop.example.com"],
    "woocommerce": {
      "enabled": true,
      "url": "https://example.com",
      "consumer_key": "ck_****",
      "consumer_secret": "cs_****",
      "connection_status": "active",
      "last_sync": "2024-01-17T10:30:00.000Z"
    },
    "shopify": {
      "enabled": false,
      "domain": "",
      "access_token": "",
      "connection_status": "disabled"
    },
    "features": {
      "advanced_analytics": true,
      "ai_chat": true,
      "auto_scraping": true,
      "priority_support": false
    },
    "scraping": {
      "last_scrape": "2024-01-17T08:00:00.000Z",
      "pages_indexed": 1247,
      "auto_scrape_enabled": true,
      "scrape_frequency": "weekly"
    }
  }
}
```

### POST `/api/dashboard/config`

Update customer dashboard configuration and integration settings.

#### Request Format

```json
{
  "domain": "example.com",
  "owned_domains": ["example.com", "shop.example.com"],
  "woocommerce": {
    "enabled": true,
    "url": "https://example.com",
    "consumer_key": "ck_new_key_here",
    "consumer_secret": "cs_new_secret_here"
  },
  "shopify": {
    "enabled": false,
    "domain": "",
    "access_token": ""
  }
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "id": "config_abc123",
    "updated_fields": ["woocommerce.consumer_key", "woocommerce.consumer_secret"],
    "connection_tests": {
      "woocommerce": {
        "status": "success",
        "response_time": 245,
        "products_found": 156
      }
    }
  }
}
```

### GET `/api/dashboard/test-connection`

Test integration connections and validate credentials.

#### Query Parameters
- `service` (optional): Specific service to test ("woocommerce", "shopify")
- `domain` (optional): Domain to test (defaults to customer domain)

#### Response Format

```json
{
  "success": true,
  "tests": {
    "woocommerce": {
      "status": "success",
      "response_time": 312,
      "api_version": "wc/v3",
      "products_count": 456,
      "orders_count": 123,
      "last_test": "2024-01-17T10:30:00.000Z"
    },
    "shopify": {
      "status": "disabled",
      "message": "Shopify integration not enabled"
    },
    "website": {
      "status": "success",
      "response_time": 156,
      "ssl_valid": true,
      "pages_accessible": true
    }
  }
}
```

### GET `/api/dashboard/analytics`

Retrieve comprehensive dashboard analytics and business intelligence.

#### Query Parameters
- `period` (optional): "day", "week", "month", "quarter", "year" (default: "month")
- `metrics` (optional): Comma-separated list of specific metrics
- `include_trends` (boolean, default: true): Include trend analysis

#### Response Format

```json
{
  "period": "month",
  "period_start": "2024-01-01T00:00:00.000Z",
  "period_end": "2024-01-31T23:59:59.000Z",
  "metrics": {
    "chat": {
      "total_conversations": 1247,
      "total_messages": 5632,
      "average_response_time": "2.3s",
      "satisfaction_score": 4.2,
      "common_topics": [
        {"topic": "product_inquiry", "count": 423},
        {"topic": "order_status", "count": 234},
        {"topic": "technical_support", "count": 187}
      ]
    },
    "website": {
      "pages_indexed": 1247,
      "last_scrape": "2024-01-30T08:00:00.000Z",
      "content_freshness": 92.5,
      "broken_links": 3,
      "seo_score": 87
    },
    "ecommerce": {
      "products_tracked": 456,
      "out_of_stock": 12,
      "low_stock": 23,
      "price_changes": 8,
      "new_products": 15
    },
    "performance": {
      "api_response_time": "145ms",
      "chat_load_time": "1.2s",
      "uptime_percentage": 99.8,
      "error_rate": 0.02
    }
  },
  "trends": {
    "chat_volume": {
      "current_period": 1247,
      "previous_period": 1156,
      "change_percent": 7.9,
      "trend": "increasing"
    },
    "response_quality": {
      "current_score": 4.2,
      "previous_score": 4.0,
      "change_percent": 5.0,
      "trend": "improving"
    }
  }
}
```

### GET `/api/dashboard/woocommerce/[...path]`

Proxy endpoint for WooCommerce API requests with authentication.

#### Dynamic Path Routing
- Supports all WooCommerce REST API endpoints
- Automatic authentication and credential management
- Response caching for performance optimization

#### Examples
- `/api/dashboard/woocommerce/products` - List products
- `/api/dashboard/woocommerce/orders` - List orders
- `/api/dashboard/woocommerce/customers` - List customers
- `/api/dashboard/woocommerce/reports/sales` - Sales reports

## Features

### Configuration Management
- **Multi-Integration Support**: WooCommerce, Shopify, and future platforms
- **Credential Encryption**: Secure storage of API credentials
- **Connection Testing**: Real-time integration health monitoring
- **Domain Management**: Multiple domain support per customer

### Business Intelligence
- **Real-time Analytics**: Live performance and usage metrics
- **Trend Analysis**: Historical data analysis and forecasting
- **Custom Metrics**: Configurable KPIs and business metrics
- **Comparative Analysis**: Period-over-period comparisons

### Integration Monitoring
- **Health Checks**: Continuous integration health monitoring
- **Performance Tracking**: API response times and reliability
- **Error Detection**: Automatic error detection and alerting
- **Usage Analytics**: Track integration usage patterns

### Data Visualization
- **Chart Data**: Pre-formatted data for dashboard charts
- **Export Capabilities**: Data export in multiple formats
- **Real-time Updates**: WebSocket support for live updates
- **Custom Dashboards**: Configurable dashboard layouts

## Configuration Schema

### WooCommerce Configuration
```typescript
interface WooCommerceConfig {
  enabled: boolean
  url: string                    // Store URL
  consumer_key: string          // Encrypted API key
  consumer_secret: string       // Encrypted API secret
  version?: string              // API version (default: v3)
  verify_ssl?: boolean          // SSL verification
  timeout?: number              // Request timeout
}
```

### Shopify Configuration
```typescript
interface ShopifyConfig {
  enabled: boolean
  domain: string                // Shop domain
  access_token: string          // Encrypted access token
  api_version?: string          // API version
  private_app?: boolean         // Private app integration
}
```

### Feature Flags
```typescript
interface CustomerFeatures {
  advanced_analytics: boolean   // Advanced analytics access
  ai_chat: boolean             // AI chat functionality
  auto_scraping: boolean       // Automatic content scraping
  priority_support: boolean    // Priority customer support
  custom_branding: boolean     // Custom branding options
  api_access: boolean          // Direct API access
  webhook_support: boolean     // Webhook notifications
}
```

## Security Features

### Authentication & Authorization
- **Supabase Auth Integration**: Secure user authentication
- **Customer Isolation**: Complete data isolation between customers
- **Role-Based Access**: Granular permission management
- **Session Management**: Secure session handling and validation

### Data Protection
- **Credential Encryption**: AES-256 encryption for API credentials
- **Secure Transmission**: HTTPS-only communication
- **Input Validation**: Comprehensive input sanitization
- **Audit Logging**: Complete action audit trails

### API Security
- **Rate Limiting**: Prevent API abuse and excessive usage
- **CORS Protection**: Proper cross-origin request handling
- **XSS Prevention**: Cross-site scripting protection
- **SQL Injection Protection**: Parameterized queries and validation

## Performance Optimization

### Caching Strategy
- **Configuration Caching**: Cache customer configurations
- **Analytics Caching**: Cache expensive analytics queries
- **Integration Caching**: Cache integration responses
- **Smart Invalidation**: Intelligent cache invalidation

### Response Optimization
- **Data Compression**: Gzip compression for large responses
- **Selective Loading**: Load only requested data sections
- **Pagination**: Efficient pagination for large datasets
- **Background Processing**: Async processing for heavy operations

### Database Optimization
- **Query Optimization**: Optimized database queries
- **Index Strategy**: Proper database indexing
- **Connection Pooling**: Efficient connection management
- **Read Replicas**: Use read replicas for analytics

## Examples

### Get Dashboard Configuration
```bash
curl -X GET 'http://localhost:3000/api/dashboard/config' \
  -H 'Authorization: Bearer <customer_token>'
```

### Update WooCommerce Settings
```bash
curl -X POST 'http://localhost:3000/api/dashboard/config' \
  -H 'Authorization: Bearer <customer_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "woocommerce": {
      "enabled": true,
      "url": "https://mystore.com",
      "consumer_key": "ck_new_key",
      "consumer_secret": "cs_new_secret"
    }
  }'
```

### Test Integration Connections
```bash
curl -X GET 'http://localhost:3000/api/dashboard/test-connection?service=woocommerce' \
  -H 'Authorization: Bearer <customer_token>'
```

### Get Monthly Analytics
```bash
curl -X GET 'http://localhost:3000/api/dashboard/analytics?period=month&include_trends=true' \
  -H 'Authorization: Bearer <customer_token>'
```

### WooCommerce Proxy Request
```bash
curl -X GET 'http://localhost:3000/api/dashboard/woocommerce/products?per_page=10' \
  -H 'Authorization: Bearer <customer_token>'
```

## Error Handling

### Configuration Errors
```json
// Invalid WooCommerce credentials
{
  "error": "WooCommerce connection failed",
  "details": {
    "status_code": 401,
    "message": "Invalid consumer key or secret"
  }
}

// Missing required fields
{
  "error": "Invalid configuration data",
  "details": {
    "woocommerce.url": "URL is required when WooCommerce is enabled"
  }
}
```

### Authentication Errors
```json
// Unauthorized access
{
  "error": "Unauthorized"
}

// Customer not found
{
  "error": "Customer not found"
}
```

### System Errors
```json
// Service unavailable
{
  "error": "Failed to initialize Supabase client"
}

// Database connection error
{
  "error": "Database connection unavailable"
}
```

## Analytics Metrics

### Chat Analytics
- **Conversation Volume**: Total conversations and messages
- **Response Times**: Average and median response times
- **Satisfaction Scores**: Customer satisfaction ratings
- **Topic Analysis**: Common inquiry topics and trends
- **Resolution Rates**: Issue resolution effectiveness

### E-commerce Analytics
- **Product Performance**: Best-selling and trending products
- **Inventory Status**: Stock levels and alerts
- **Order Analytics**: Order volume and value trends
- **Customer Behavior**: Purchase patterns and preferences
- **Revenue Tracking**: Sales performance and growth

### Website Analytics
- **Content Freshness**: How current the indexed content is
- **SEO Performance**: Search engine optimization metrics
- **Technical Health**: Broken links, errors, and issues
- **Performance Metrics**: Page load times and availability
- **Content Quality**: Content effectiveness and engagement

### System Analytics
- **API Performance**: Response times and reliability
- **Resource Usage**: System resource consumption
- **Error Rates**: Error frequency and types
- **Uptime Monitoring**: Service availability and reliability
- **Security Events**: Security-related events and alerts

## Integration with External Services

### WooCommerce Integration
- **Product Sync**: Real-time product data synchronization
- **Order Management**: Order tracking and status updates
- **Customer Data**: Customer information and behavior
- **Inventory Tracking**: Stock level monitoring and alerts
- **Sales Analytics**: Comprehensive sales reporting

### Shopify Integration *(Planned)*
- **Store Data**: Product and order synchronization
- **App Integration**: Shopify app ecosystem integration
- **Webhook Support**: Real-time event notifications
- **Analytics Integration**: Shopify analytics data
- **Multi-store Support**: Multiple Shopify store management

### Third-party Analytics
- **Google Analytics**: Website traffic and behavior data
- **SEO Tools**: Search engine optimization metrics
- **Social Media**: Social media engagement and metrics
- **Email Marketing**: Email campaign performance
- **Customer Support**: Support ticket and resolution data

## Real-time Features

### Live Updates
- **WebSocket Support**: Real-time dashboard updates
- **Event Streaming**: Live event notifications
- **Status Monitoring**: Real-time integration status
- **Alert System**: Immediate alert notifications
- **Collaborative Dashboards**: Multi-user real-time updates

### Notification System
- **Email Alerts**: Critical event email notifications
- **Dashboard Notifications**: In-app notification system
- **Webhook Support**: Custom webhook integrations
- **Mobile Push**: Mobile app push notifications
- **Slack Integration**: Team collaboration notifications

## Best Practices

### Configuration Management
- **Regular Backups**: Backup configuration data regularly
- **Version Control**: Track configuration changes
- **Testing Procedures**: Test integrations before deployment
- **Security Reviews**: Regular security audits and updates
- **Documentation**: Maintain configuration documentation

### Performance Optimization
- **Monitor Usage**: Track API usage and performance
- **Optimize Queries**: Regular query performance reviews
- **Cache Strategy**: Implement appropriate caching
- **Load Testing**: Regular load testing and optimization
- **Resource Monitoring**: Monitor system resource usage

### Security Best Practices
- **Credential Rotation**: Regular API key rotation
- **Access Reviews**: Periodic access permission reviews
- **Security Updates**: Keep all systems updated
- **Incident Response**: Prepared incident response procedures
- **Compliance Monitoring**: Regular compliance assessments

## Related Endpoints

- `/api/auth/customer` - Customer authentication and management
- `/api/customer/config` - Customer configuration management
- `/api/woocommerce/*` - WooCommerce integration endpoints
- `/api/monitoring/*` - System monitoring and analytics

## Future Enhancements

### Planned Features
- **Custom Dashboard Builder**: Drag-and-drop dashboard creation
- **Advanced Reporting**: Comprehensive business reporting
- **AI Insights**: AI-powered business insights and recommendations
- **Mobile Dashboard**: Native mobile dashboard application
- **Third-party Integrations**: Extended integration ecosystem

### API Roadmap
- **GraphQL Support**: GraphQL API for flexible data querying
- **Webhook Framework**: Comprehensive webhook system
- **API Versioning**: Versioned API for backward compatibility
- **Rate Limiting Tiers**: Tiered rate limiting based on subscription
- **Advanced Analytics**: Machine learning-powered analytics

## Keywords

**API Categories:** dashboard API, business intelligence, analytics API, configuration management, performance monitoring

**Core Features:** customer dashboard, WooCommerce integration, Shopify integration, real-time analytics, configuration management, connection testing, business metrics, trend analysis, performance tracking

**Technologies:** Supabase Auth, Next.js API Routes, TypeScript, AES-256 encryption, WebSocket, real-time updates, Redis caching

**Operations:** configuration CRUD, integration testing, analytics retrieval, credential encryption, session management, health monitoring, data visualization

**Integrations:** WooCommerce REST API, Shopify Admin API, Google Analytics, SEO tools, social media, email marketing, customer support systems

**Security:** Supabase Auth, customer isolation, role-based access, credential encryption, audit logging, CORS protection, XSS prevention, SQL injection protection

**Metrics:** chat analytics, e-commerce analytics, website analytics, system analytics, conversation volume, satisfaction scores, product performance, inventory status, content freshness, API performance

**Aliases:**
- "dashboard config" (also known as: customer configuration, integration settings, dashboard settings)
- "analytics endpoint" (also known as: business intelligence API, metrics API, BI endpoint)
- "connection testing" (also known as: integration health check, credential validation, connectivity test)
- "WooCommerce proxy" (also known as: WooCommerce passthrough, e-commerce API proxy)