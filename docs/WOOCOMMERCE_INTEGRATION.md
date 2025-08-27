# WooCommerce Integration Documentation

## Overview

This document describes the WooCommerce integration for the Customer Service Agent, which provides secure access to customer order data while maintaining privacy through a verification system.

## Architecture

### Data Separation Model

The system implements a two-tier data access model:

1. **Public Data** (No verification required)
   - Product information
   - Stock levels
   - Pricing
   - General store information
   - Source: Scraped website data

2. **Private Data** (Verification required)
   - Order status and details
   - Customer information
   - Delivery tracking
   - Order history
   - Address updates
   - Order cancellations
   - Source: WooCommerce API

## Key Components

### 1. WooCommerce API Client (`lib/woocommerce-dynamic.ts`)
- Dynamically loads credentials per domain
- Handles encrypted and unencrypted credentials
- Provides connection to WooCommerce REST API v3

### 2. Customer Verification System (`lib/customer-verification-simple.ts`)
- Verifies customer identity before granting access to private data
- Matches email addresses with order information
- Maintains verification state per conversation

### 3. Customer Actions (`lib/woocommerce-customer-actions.ts`)
Available post-verification actions:
- `getCustomerInfo()` - Retrieve customer details
- `getOrderStatus()` - Check specific order status
- `getRecentOrders()` - List recent purchases
- `getTrackingInfo()` - Get delivery tracking information
- `updateShippingAddress()` - Change delivery address
- `cancelOrder()` - Cancel pending orders

### 4. Stock API (`app/api/woocommerce/stock/route.ts`)
- Real-time stock checking without verification
- Supports queries by SKU, product ID, or product name
- Returns stock status and quantity

## Security Features

### Credential Encryption
- Uses AES-256-GCM encryption for WooCommerce credentials
- Backward compatible with unencrypted credentials
- Automatic detection of encryption status

### Privacy Protection
- Customer data only accessible after email verification
- Order information protected by customer email matching
- Session-based verification state

## API Endpoints

### `/api/chat`
Main chat endpoint that handles:
- Order/delivery queries (triggers verification)
- Product/stock queries (no verification needed)
- Customer verification flow

### `/api/woocommerce/stock`
```typescript
POST /api/woocommerce/stock
{
  "domain": "thompsonseparts.co.uk",
  "productName": "Palfinger" // or use "sku" or "productId"
}
```

### `/api/woocommerce/customer-action`
```typescript
POST /api/woocommerce/customer-action
{
  "action": "get-order-status",
  "domain": "thompsonseparts.co.uk",
  "conversationId": "uuid",
  "data": {
    "orderNumber": "119166"
  }
}
```

### `/api/test-woocommerce`
Test endpoint to verify WooCommerce connectivity and configuration.

## Configuration

### Database Schema

The `customer_configs` table stores WooCommerce settings:
```sql
- domain (text) - Customer domain
- woocommerce_url (text) - WooCommerce store URL
- woocommerce_consumer_key (text) - API consumer key (encrypted)
- woocommerce_consumer_secret (text) - API consumer secret (encrypted)
```

### Environment Variables
```env
# Required for encryption
ENCRYPTION_KEY=your-32-byte-key

# Optional - for testing
WOOCOMMERCE_URL=https://store.example.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
```

## Customer Journey Flow

### 1. Customer Asks About Order
```
Customer: "What's the status of order 119166?"
System: Detects order query → Requests verification
```

### 2. Verification Request
```
Assistant: "To assist with your order, please provide your email address"
Customer: "My email is customer@example.com"
```

### 3. Verification Process
```
System: Matches email with order in WooCommerce
System: If match found → Mark conversation as verified
System: If no match → Inform customer
```

### 4. Post-Verification Access
```
Customer: "Show me the order details"
System: Retrieves full order information from WooCommerce
Assistant: Provides order status, items, tracking, etc.
```

## Testing

### Test Scripts

1. **Customer Journey Test** (`scripts/test-customer-journey.js`)
   - Simulates complete customer interactions
   - Tests verification flow
   - Validates data separation

2. **Simple Order Test** (`scripts/simple-order-test.js`)
   - Quick verification that order queries trigger verification
   - Tests stock API without verification

3. **Real Order Test** (`scripts/test-with-real-order.js`)
   - Uses actual WooCommerce order data
   - Tests with real order numbers

### Running Tests
```bash
# Test basic functionality
node scripts/simple-order-test.js

# Test full customer journey
node scripts/test-customer-journey.js

# Test with real WooCommerce data
node scripts/test-with-real-order.js
```

## Error Handling

### Common Issues and Solutions

1. **Decryption Errors**
   - Issue: "Unsupported state or unable to authenticate data"
   - Solution: The system now auto-detects and handles both encrypted and unencrypted credentials

2. **Customer Not Found**
   - Issue: Email doesn't match any orders
   - Solution: Customer must use the exact email associated with their order

3. **Rate Limiting**
   - Issue: Too many requests from same domain
   - Solution: System enforces per-domain rate limits

## Implementation Details

### Order Detection Pattern
```typescript
const isOrderDeliveryQuery = /order|tracking|delivery|shipping|return|refund|invoice|receipt|my purchase|where is|when will|status|order #|dispatch/i.test(message);
```

### Customer Detection Pattern
```typescript
const isCustomerQuery = /my|I|me|I'm|I am|I've|I have/i.test(message);
```

### Verification State Management
- Stored in Supabase `conversations` table
- `verified` boolean field
- `verified_email` stores verified customer email
- Persists for entire conversation

## Security Considerations

1. **Never log sensitive data**
   - No customer emails in logs
   - No order details in error messages
   - No API credentials in console output

2. **Always verify before access**
   - Every request for private data checks verification status
   - Verification cannot be bypassed

3. **Rate limiting**
   - Prevents abuse of verification system
   - Per-domain limits on API calls

## Production Deployment

### Prerequisites
1. WooCommerce store with REST API enabled
2. Consumer key and secret from WooCommerce
3. Supabase database with proper schema
4. Encryption key set in environment

### Setup Steps
1. Add customer domain to `customer_configs` table
2. Store WooCommerce URL and credentials
3. Run encryption migration if needed
4. Test with `/api/test-woocommerce` endpoint
5. Verify customer journey with test scripts

## Monitoring

### Key Metrics to Track
- Verification success rate
- API response times
- Decryption errors
- Rate limit hits
- Customer action usage

### Health Checks
- `/api/test-woocommerce` - Verify API connectivity
- Chat endpoint with product query - Test public data access
- Chat endpoint with order query - Test verification trigger

## Future Enhancements

1. **Email Verification Codes**
   - Send actual verification codes via email
   - Time-limited verification tokens
   - Multi-factor authentication support

2. **Extended Customer Actions**
   - Process returns
   - Download invoices
   - Update payment methods
   - Subscribe to order notifications

3. **Analytics Integration**
   - Track customer service metrics
   - Identify common issues
   - Measure resolution times

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Run test scripts to isolate problems
3. Verify WooCommerce API credentials
4. Ensure proper database configuration

---

*Last Updated: January 2025*
*Version: 1.0.0*