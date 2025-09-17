# WooCommerce API

E-commerce integration endpoints for product management, order processing, and customer service automation.

## Overview

This API provides comprehensive WooCommerce integration capabilities including product search, inventory management, order tracking, and cart operations. All endpoints require proper WooCommerce configuration and support encrypted credential storage.

## Endpoints

### POST `/api/woocommerce/products`

Search and retrieve WooCommerce products with filtering and pagination.

#### Authentication
- **Type**: Domain-based configuration lookup
- **Requirements**: Valid WooCommerce credentials in customer_configs
- **Rate Limits**: Standard domain-based limiting

#### Request Format

```json
{
  "domain": "example.com",
  "per_page": 20,
  "page": 1,
  "search": "hydraulic pump",
  "category": 123,
  "stock_status": "instock",
  "featured": true
}
```

#### Required Fields
- `domain` (string): Customer domain with WooCommerce configuration

#### Optional Fields
- `per_page` (integer, 1-100, default: 10): Products per page
- `page` (integer, min: 1, default: 1): Page number
- `search` (string): Search query for product names/descriptions
- `category` (integer): Category ID filter
- `stock_status` (enum): "instock", "outofstock", "onbackorder"
- `featured` (boolean): Filter for featured products only

#### Response Format

```json
{
  "success": true,
  "products": [
    {
      "id": 123,
      "name": "High-Pressure Hydraulic Pump",
      "sku": "HP-2000-PRO",
      "price": "299.99",
      "regular_price": "349.99",
      "sale_price": "299.99",
      "stock_status": "instock",
      "stock_quantity": 15,
      "manage_stock": true,
      "in_stock": true,
      "categories": ["Hydraulic Parts", "Pumps"],
      "short_description": "Professional grade hydraulic pump for heavy-duty applications",
      "featured": false,
      "images": [
        {
          "src": "https://example.com/images/pump-123.jpg",
          "alt": "High-Pressure Hydraulic Pump"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1
  }
}
```

### GET `/api/woocommerce/products`

Simple product listing endpoint for quick access.

#### Query Parameters
- `domain` (default: "thompsonseparts.co.uk"): Target domain
- `per_page` (default: 10): Products per page
- `stock_status` (default: "instock"): Stock filter

### POST `/api/woocommerce/abandoned-carts`

Retrieve abandoned cart information for customer recovery.

#### Request Format
```json
{
  "domain": "example.com",
  "hours": 24,
  "include_recovered": false
}
```

### GET `/api/woocommerce/stock`

Check stock levels for specific products.

### POST `/api/woocommerce/customer-action`

Perform customer-related operations (orders, cart, etc.).

### GET `/api/woocommerce/dashboard`

Retrieve WooCommerce analytics and dashboard data.

## Features

### Product Management
- **Advanced Search**: Full-text search across products
- **Category Filtering**: Browse by product categories
- **Stock Management**: Real-time inventory checking
- **Pricing Information**: Regular, sale, and dynamic pricing
- **Image Handling**: Product image URL management

### Order Processing
- **Order Lookup**: Secure order information retrieval
- **Status Tracking**: Real-time order status updates
- **Customer Verification**: Multi-level security validation
- **Order History**: Complete order lifecycle tracking

### Cart Operations
- **Add to Cart**: Product addition with quantity management
- **Cart Viewing**: Current cart status and contents
- **Abandoned Cart Recovery**: Automated cart recovery workflows
- **Checkout Integration**: Seamless checkout process

### Inventory Management
- **Stock Checking**: Real-time inventory validation
- **Stock Alerts**: Low stock notifications
- **Quantity Management**: Precise stock level tracking
- **Backorder Handling**: Out-of-stock product management

## Configuration

### WooCommerce Setup
Requires configuration in `customer_configs` table:

```sql
-- Encrypted credentials storage
INSERT INTO customer_configs (
  domain,
  woocommerce_enabled,
  woocommerce_url,
  woocommerce_consumer_key,
  woocommerce_consumer_secret
) VALUES (
  'example.com',
  true,
  'https://example.com',
  'ck_encrypted_key_here',
  'cs_encrypted_secret_here'
);
```

### Security Requirements
- **Encrypted Storage**: All credentials encrypted with AES-256
- **Domain Validation**: Automatic domain verification
- **Rate Limiting**: Configurable request throttling
- **Access Control**: Domain-based permission system

## Performance

### Response Times
- **Product Search**: 200-800ms average
- **Single Product**: 100-300ms average
- **Stock Check**: 150-400ms average
- **Order Lookup**: 300-600ms average

### Caching Strategy
- **Product Data**: Short-term caching for frequently accessed products
- **Category Data**: Extended caching for stable category structures
- **Stock Levels**: Real-time updates with minimal caching
- **Configuration**: Long-term caching with invalidation triggers

### Optimization
- **Batch Operations**: Multiple product retrieval in single requests
- **Selective Fields**: Return only necessary product information
- **Pagination**: Efficient large dataset handling
- **Connection Pooling**: Optimized WooCommerce API connections

## Examples

### Product Search
```bash
curl -X POST 'http://localhost:3000/api/woocommerce/products' \
  -H 'Content-Type: application/json' \
  -d '{
    "domain": "example.com",
    "search": "hydraulic",
    "per_page": 20,
    "stock_status": "instock"
  }'
```

### Category Browse
```bash
curl -X POST 'http://localhost:3000/api/woocommerce/products' \
  -H 'Content-Type: application/json' \
  -d '{
    "domain": "example.com",
    "category": 123,
    "per_page": 50,
    "featured": true
  }'
```

### Stock Check
```bash
curl 'http://localhost:3000/api/woocommerce/stock?domain=example.com&sku=HP-2000-PRO'
```

### Simple Product List
```bash
curl 'http://localhost:3000/api/woocommerce/products?domain=example.com&per_page=10&stock_status=instock'
```

### Abandoned Cart Recovery
```bash
curl -X POST 'http://localhost:3000/api/woocommerce/abandoned-carts' \
  -H 'Content-Type: application/json' \
  -d '{
    "domain": "example.com",
    "hours": 24,
    "include_recovered": false
  }'
```

## Security Features

### Credential Protection
- **AES-256 Encryption**: All WooCommerce credentials encrypted at rest
- **Environment Isolation**: Separate encryption keys per environment
- **Key Rotation**: Support for credential rotation and updates
- **Secure Transmission**: HTTPS-only API communication

### Access Control
- **Domain Verification**: Automatic domain ownership validation
- **Session Security**: Secure session management for customer operations
- **Rate Limiting**: Protection against abuse and excessive requests
- **Audit Logging**: Comprehensive operation logging for security

### Customer Verification
```json
{
  "verification_levels": {
    "none": "No verification required",
    "basic": "Email or session verification",
    "full": "Email + order number + billing info"
  }
}
```

## Error Handling

### Common Errors
```json
// WooCommerce not configured
{
  "error": "WooCommerce not configured for this domain"
}

// Invalid credentials
{
  "error": "Failed to fetch products",
  "message": "Authentication failed"
}

// Product not found
{
  "success": false,
  "data": null,
  "message": "Product not found"
}

// Rate limit exceeded
{
  "error": "Rate limit exceeded for domain"
}
```

### Retry Logic
- **Automatic Retries**: Exponential backoff for transient failures
- **Circuit Breaker**: Protection against cascading failures
- **Fallback Responses**: Graceful degradation when possible
- **Error Classification**: Distinction between permanent and temporary errors

## Integration

### With Chat System
WooCommerce data integrates seamlessly with chat endpoints:

```json
{
  "tool": "woocommerce_agent",
  "operation": "search_products",
  "parameters": {
    "query": "hydraulic pump",
    "limit": 10
  }
}
```

### With Customer Service
- **Order Assistance**: Automated order lookup and status updates
- **Product Recommendations**: AI-powered product suggestions
- **Inventory Inquiries**: Real-time stock information
- **Technical Support**: Product specification and compatibility

### With Analytics
- **Sales Tracking**: Integration with analytics dashboards
- **Customer Behavior**: Cart and purchase pattern analysis
- **Inventory Optimization**: Stock level and demand forecasting
- **Performance Monitoring**: API usage and response time tracking

## WooCommerce Agent Operations

### Supported Operations
```json
{
  "search_products": "Search product catalog",
  "get_product_details": "Retrieve detailed product information",
  "check_stock": "Verify inventory levels",
  "view_order": "Customer order lookup (requires verification)",
  "track_order": "Order shipping and delivery tracking",
  "add_to_cart": "Add products to shopping cart",
  "view_cart": "Display current cart contents",
  "get_categories": "Browse product categories",
  "get_shipping_options": "Calculate shipping costs and options"
}
```

### Security Gates
Sensitive operations require customer verification:
- `view_order`: Email + order number verification
- `update_order`: Full customer authentication
- `view_customer`: Account verification required
- `checkout`: Complete customer validation

## Best Practices

### API Usage
- **Batch Requests**: Combine multiple operations when possible
- **Efficient Filtering**: Use appropriate filters to reduce data transfer
- **Pagination**: Implement proper pagination for large datasets
- **Error Handling**: Implement robust error handling and retries

### Security
- **Credential Management**: Regularly rotate WooCommerce API keys
- **Domain Verification**: Ensure proper domain configuration
- **Access Logging**: Monitor API access patterns
- **Rate Limiting**: Implement appropriate request throttling

### Performance
- **Caching Strategy**: Cache stable data (categories, featured products)
- **Connection Management**: Reuse WooCommerce API connections
- **Response Optimization**: Request only necessary product fields
- **Monitoring**: Track API performance and response times

## Troubleshooting

### Common Issues
- **Authentication Failures**: Check WooCommerce API credentials
- **Slow Responses**: Verify WooCommerce site performance
- **Missing Products**: Check product visibility and stock status
- **Connection Errors**: Validate WooCommerce URL and SSL configuration

### Debug Information
- Comprehensive error logging with operation context
- WooCommerce API response tracking
- Performance metrics for optimization
- Security event logging for audit trails

## Related Endpoints

- `/api/chat-intelligent` - AI-powered product assistance
- `/api/customer/config` - WooCommerce configuration management
- `/api/monitoring/woocommerce` - Performance analytics
- `/api/dashboard/woocommerce` - Business intelligence dashboards

## Migration & Updates

### API Versioning
- Support for WooCommerce REST API v3
- Backward compatibility for legacy integrations
- Automatic API version detection and adaptation
- Migration tools for configuration updates

### Feature Updates
- Regular feature additions based on WooCommerce updates
- Enhanced security measures and encryption improvements
- Performance optimizations and caching enhancements
- Extended analytics and reporting capabilities