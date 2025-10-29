# WooCommerce API Endpoints Documentation

This customer service agent now has full access to all WooCommerce REST API v3 endpoints. Below is a comprehensive list of all available endpoints.

## Base URL
`/api/admin/woocommerce/`

## Authentication
All endpoints require authentication via Clerk auth.

## Available Endpoints

### Products
- `GET /products` - List all products with filtering
- `GET /products/{id}` - Get single product
- `POST /products` - Create product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `POST /products/batch` - Batch operations

#### Product Variations
- `GET /products/{id}/variations` - List variations
- `GET /products/{id}/variations/{variation_id}` - Get variation
- `POST /products/{id}/variations` - Create variation
- `PUT /products/{id}/variations/{variation_id}` - Update variation
- `DELETE /products/{id}/variations/{variation_id}` - Delete variation
- `POST /products/{id}/variations/batch` - Batch operations

#### Product Attributes
- `GET /products/attributes` - List attributes
- `GET /products/attributes/{id}` - Get attribute
- `POST /products/attributes` - Create attribute
- `PUT /products/attributes/{id}` - Update attribute
- `DELETE /products/attributes/{id}` - Delete attribute

#### Product Attribute Terms
- `GET /products/attributes/{id}/terms` - List terms
- `GET /products/attributes/{id}/terms/{term_id}` - Get term
- `POST /products/attributes/{id}/terms` - Create term
- `PUT /products/attributes/{id}/terms/{term_id}` - Update term
- `DELETE /products/attributes/{id}/terms/{term_id}` - Delete term

#### Product Categories
- `GET /products/categories` - List categories
- `GET /products/categories/{id}` - Get category
- `POST /products/categories` - Create category
- `PUT /products/categories/{id}` - Update category
- `DELETE /products/categories/{id}` - Delete category

#### Product Tags
- `GET /products/tags` - List tags
- `GET /products/tags/{id}` - Get tag
- `POST /products/tags` - Create tag
- `PUT /products/tags/{id}` - Update tag
- `DELETE /products/tags/{id}` - Delete tag

#### Product Reviews
- `GET /products/reviews` - List reviews
- `GET /products/reviews/{id}` - Get review
- `POST /products/reviews` - Create review
- `PUT /products/reviews/{id}` - Update review
- `DELETE /products/reviews/{id}` - Delete review

#### Product Shipping Classes
- `GET /products/shipping_classes` - List shipping classes
- `GET /products/shipping_classes/{id}` - Get shipping class
- `POST /products/shipping_classes` - Create shipping class
- `PUT /products/shipping_classes/{id}` - Update shipping class
- `DELETE /products/shipping_classes/{id}` - Delete shipping class

### Orders
- `GET /orders` - List all orders with filtering
- `GET /orders/{id}` - Get single order
- `POST /orders` - Create order
- `PUT /orders/{id}` - Update order
- `DELETE /orders/{id}` - Delete order
- `POST /orders/batch` - Batch operations

#### Order Notes
- `GET /orders/{id}/notes` - List order notes
- `GET /orders/{id}/notes/{note_id}` - Get note
- `POST /orders/{id}/notes` - Create note
- `DELETE /orders/{id}/notes/{note_id}` - Delete note

#### Order Refunds
- `GET /orders/{id}/refunds` - List refunds for order
- `GET /orders/{id}/refunds/{refund_id}` - Get refund
- `POST /orders/{id}/refunds` - Create refund
- `DELETE /orders/{id}/refunds/{refund_id}` - Delete refund

#### Standalone Refunds (WooCommerce 9.0+)
- `GET /refunds` - List all refunds
- `GET /refunds/{id}` - Get single refund

### Customers
- `GET /customers` - List all customers
- `GET /customers/{id}` - Get single customer
- `GET /customers/email?email={email}` - Get customer by email
- `POST /customers` - Create customer
- `PUT /customers/{id}` - Update customer
- `DELETE /customers/{id}` - Delete customer
- `POST /customers/batch` - Batch operations
- `GET /customers/{id}/downloads` - Get customer downloads

### Coupons
- `GET /coupons` - List all coupons
- `GET /coupons/{id}` - Get single coupon
- `GET /coupons/code?code={code}` - Get coupon by code
- `POST /coupons` - Create coupon
- `PUT /coupons/{id}` - Update coupon
- `DELETE /coupons/{id}` - Delete coupon
- `POST /coupons/batch` - Batch operations

### Reports
- `GET /reports/sales` - Sales report
- `GET /reports/top_sellers` - Top sellers report
- `GET /reports/coupons` - Coupons report
- `GET /reports/customers` - Customers report
- `GET /reports/orders` - Orders report
- `GET /reports/products` - Products report
- `GET /reports/reviews` - Reviews report

### Taxes
- `GET /taxes` - List tax rates
- `GET /taxes/{id}` - Get tax rate
- `POST /taxes` - Create tax rate
- `PUT /taxes/{id}` - Update tax rate
- `DELETE /taxes/{id}` - Delete tax rate

#### Tax Classes
- `GET /taxes/classes` - List tax classes
- `POST /taxes/classes` - Create tax class
- `DELETE /taxes/classes/{slug}` - Delete tax class

### Shipping

#### Shipping Zones
- `GET /shipping/zones` - List zones
- `GET /shipping/zones/{id}` - Get zone
- `POST /shipping/zones` - Create zone
- `PUT /shipping/zones/{id}` - Update zone
- `DELETE /shipping/zones/{id}` - Delete zone

#### Shipping Zone Locations
- `GET /shipping/zones/{id}/locations` - Get zone locations
- `PUT /shipping/zones/{id}/locations` - Update zone locations

#### Shipping Zone Methods
- `GET /shipping/zones/{id}/methods` - List zone methods
- `GET /shipping/zones/{id}/methods/{instance_id}` - Get method
- `POST /shipping/zones/{id}/methods` - Create method
- `PUT /shipping/zones/{id}/methods/{instance_id}` - Update method
- `DELETE /shipping/zones/{id}/methods/{instance_id}` - Delete method

#### Shipping Methods
- `GET /shipping_methods` - List all shipping methods
- `GET /shipping_methods/{id}` - Get shipping method

### Payment Gateways
- `GET /payment_gateways` - List gateways
- `GET /payment_gateways/{id}` - Get gateway
- `PUT /payment_gateways/{id}` - Update gateway settings

### Settings
- `GET /settings` - List setting groups
- `GET /settings/{group}` - Get group settings
- `GET /settings/{group}/{id}` - Get specific setting
- `PUT /settings/{group}/{id}` - Update setting
- `POST /settings/{group}/batch` - Batch update settings

### System Status
- `GET /system_status` - Get system status
- `GET /system_status/tools` - List tools
- `GET /system_status/tools/{id}` - Get tool
- `PUT /system_status/tools/{id}` - Run tool

### Webhooks
- `GET /webhooks` - List webhooks
- `GET /webhooks/{id}` - Get webhook
- `POST /webhooks` - Create webhook
- `PUT /webhooks/{id}` - Update webhook
- `DELETE /webhooks/{id}` - Delete webhook
- `POST /webhooks/batch` - Batch operations

### Data Endpoints
- `GET /data/countries` - List countries
- `GET /data/currencies` - List currencies
- `GET /data/currencies/current` - Get current currency
- `GET /data/continents` - List continents

## Query Parameters

Most GET endpoints support these common parameters:
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10, max: 100)
- `search` - Search term
- `order` - Sort order (asc/desc)
- `orderby` - Sort field
- `status` - Filter by status
- `include` - Include specific IDs
- `exclude` - Exclude specific IDs

## Batch Operations

Batch endpoints accept:
```json
{
  "create": [{ /* resource data */ }],
  "update": [{ "id": 123, /* update data */ }],
  "delete": [123, 456]
}
```

## Error Responses

All endpoints return standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

Error format:
```json
{
  "error": "Error message"
}
```

## Usage Example

```javascript
// Get all products
const response = await fetch('/api/admin/woocommerce/products?per_page=20&status=publish');
const products = await response.json();

// Create an order
const order = await fetch('/api/admin/woocommerce/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payment_method: 'bacs',
    payment_method_title: 'Direct Bank Transfer',
    billing: { /* billing data */ },
    shipping: { /* shipping data */ },
    line_items: [{ /* items */ }]
  })
});
```