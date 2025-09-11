# WooCommerce Integration Documentation

## Overview
This document details the WooCommerce integration for the customer service chat widget, enabling access to customer orders, product data, and automated customer verification.

## Architecture Overview

### Integration Components
1. **WooCommerce API Clients** (`lib/woocommerce-*.ts`)
   - Dynamic API client for multi-tenant support
   - Full API client with comprehensive endpoints
   - Cart tracking and abandoned cart recovery
   - Customer data management

2. **Customer Verification System**
   - Simple verification (`lib/customer-verification-simple.ts`)
   - Full verification with email OTP (`lib/customer-verification.ts`)
   - Multi-tenant verification support

3. **Encrypted Credentials Storage**
   - AES-256 encryption for API keys
   - Per-domain credential isolation
   - Secure key rotation support

## Setup and Configuration

### 1. Environment Configuration
Add to `.env.local` for testing:
```env
# WooCommerce Test Credentials (Optional - for development)
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Encryption Key (REQUIRED - must be exactly 32 characters)
ENCRYPTION_KEY=12345678901234567890123456789012
```

### 2. Database Configuration
WooCommerce credentials are stored encrypted in the `customer_configs` table:

```sql
-- Check existing WooCommerce configurations
SELECT 
  domain,
  woocommerce_url,
  woocommerce_enabled,
  CASE 
    WHEN woocommerce_credentials_encrypted IS NOT NULL THEN 'Encrypted'
    ELSE 'Not Set'
  END as credentials_status,
  updated_at
FROM customer_configs
WHERE woocommerce_enabled = true;
```

### 3. Adding WooCommerce Credentials for a Domain

#### Via Admin Panel (Recommended)
1. Navigate to `http://localhost:3000/admin`
2. Select or add your domain
3. Enable WooCommerce integration
4. Enter:
   - WooCommerce Store URL (e.g., `https://thompsonseparts.co.uk`)
   - Consumer Key (from WooCommerce > Settings > Advanced > REST API)
   - Consumer Secret

#### Via API
```bash
curl -X POST http://localhost:3000/api/admin/config \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "thompsonseparts.co.uk",
    "woocommerce_url": "https://thompsonseparts.co.uk",
    "woocommerce_consumer_key": "ck_your_key_here",
    "woocommerce_consumer_secret": "cs_your_secret_here",
    "woocommerce_enabled": true
  }'
```

#### Via Direct Database (Development Only)
```javascript
// Script to encrypt and store credentials
const crypto = require('crypto');

function encryptCredentials(key, secret) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey),
    iv
  );
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify({ key, secret })),
    cipher.final()
  ]);
  
  return {
    iv: iv.toString('hex'),
    data: encrypted.toString('hex')
  };
}

// Use the encrypted result in your database update
```

## WooCommerce Features

### 1. Product Search and Inventory
```typescript
// Real-time product search
const products = await WooCommerceDynamic.searchProducts(
  domain,
  searchQuery,
  { 
    include_stock: true,
    include_variations: true 
  }
);
```

**Used for:**
- Product availability queries
- Price checking
- Stock level verification
- Product recommendations

### 2. Customer Order Management
```typescript
// Retrieve customer orders after verification
const orders = await WooCommerceCustomer.getCustomerOrders(
  customerEmail,
  { 
    status: ['processing', 'completed', 'on-hold'],
    limit: 10 
  }
);
```

**Provides access to:**
- Order status and tracking
- Shipping information
- Order history
- Invoice details
- Return/refund status

### 3. Customer Verification Flow

#### Simple Verification (No Email Required)
1. Customer provides identifying information (order number, email, name)
2. System verifies against WooCommerce data
3. Returns verification level:
   - `none`: No verification
   - `partial`: Some information matched
   - `full`: Complete verification

```typescript
const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
  conversationId,
  email: "customer@example.com",
  orderNumber: "12345",
  name: "John Doe"
}, domain);
```

#### Full Verification (Email OTP)
1. Customer requests verification
2. System sends OTP to customer email
3. Customer provides OTP code
4. System validates and stores verification

```typescript
// Send verification code
await CustomerVerification.sendVerificationCode(
  customerEmail,
  conversationId,
  domain
);

// Verify code
const isValid = await CustomerVerification.verifyCode(
  customerEmail,
  code,
  conversationId
);
```

### 4. Abandoned Cart Recovery
```typescript
// Track and recover abandoned carts
const abandonedCarts = await WooCommerceCartTracker.getAbandonedCarts(
  domain,
  { 
    hours_abandoned: 24,
    include_guest_carts: false 
  }
);

// Send recovery email
await WooCommerceCartTracker.sendRecoveryEmail(
  cartId,
  customerEmail
);
```

## Chat Integration Flow

### Query Detection
The chat system automatically detects WooCommerce-related queries:

```typescript
// Order/delivery queries
const isOrderQuery = /order|tracking|delivery|shipping|return|refund/i.test(message);

// Product queries (handled by RAG if scraping enabled)
const isProductQuery = /product|price|stock|availability/i.test(message);

// Customer account queries
const isAccountQuery = /account|email|password|login|register/i.test(message);
```

### Context Building
When WooCommerce queries are detected:

1. **Check Domain Configuration**
```typescript
const config = await getCustomerConfig(domain);
if (!config.woocommerce_enabled) return;
```

2. **Verify Customer (if needed)**
```typescript
if (isCustomerQuery) {
  const verification = await verifyCustomer(conversationId, domain);
  if (!verification.isVerified) {
    // Prompt for verification
    return "Please verify your email to access order information...";
  }
}
```

3. **Retrieve Relevant Data**
```typescript
// For verified customers
const customerContext = await WooCommerceCustomer.getCustomerContext(
  customerEmail,
  conversationId
);
```

4. **Include in AI Response**
The retrieved data is included in the system prompt for accurate responses.

## Testing WooCommerce Integration

### 1. Test Configuration
```bash
# Check if WooCommerce is configured for a domain
curl http://localhost:3000/api/customer/config?domain=thompsonseparts.co.uk
```

### 2. Test Product Search
```bash
curl -X POST http://localhost:3000/api/woocommerce/products/search \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "thompsonseparts.co.uk",
    "query": "hydraulic pump",
    "limit": 5
  }'
```

### 3. Test Customer Verification
```bash
# Send verification code
curl -X POST http://localhost:3000/api/customer/verify \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "email": "customer@example.com",
    "conversationId": "test-conv-123",
    "domain": "thompsonseparts.co.uk"
  }'

# Verify code
curl -X POST http://localhost:3000/api/customer/verify \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verify",
    "email": "customer@example.com",
    "code": "123456",
    "conversationId": "test-conv-123"
  }'
```

### 4. Test Chat with WooCommerce Context
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of my order #12345?",
    "session_id": "test-session",
    "domain": "thompsonseparts.co.uk",
    "conversation_id": "test-conv-123",
    "config": {
      "features": {
        "woocommerce": { "enabled": true }
      }
    }
  }'
```

## Security Considerations

### Credential Encryption
- All WooCommerce API credentials are encrypted using AES-256-CBC
- Encryption key must be 32 characters exactly
- Each domain's credentials are isolated
- Never store plaintext credentials

### Customer Data Protection
- Customer verification required for sensitive data
- Session-based verification (expires after conversation)
- PII is not stored in conversation history
- GDPR-compliant data handling

### API Rate Limiting
- Per-domain rate limiting implemented
- Default: 100 requests per hour per domain
- Prevents abuse and protects WooCommerce servers

## Troubleshooting

### Issue: "WooCommerce not configured"
**Solution:**
1. Check if credentials are set for the domain
2. Verify encryption key is configured
3. Ensure woocommerce_enabled is true

### Issue: "Failed to fetch products"
**Possible Causes:**
- Invalid API credentials
- WooCommerce REST API not enabled
- Network connectivity issues
- SSL certificate problems

**Debug Steps:**
```bash
# Test WooCommerce API directly
curl https://your-store.com/wp-json/wc/v3/products \
  -u "consumer_key:consumer_secret"
```

### Issue: "Customer verification failing"
**Check:**
1. Email service configuration
2. Customer exists in WooCommerce
3. Correct domain configuration
4. Verification code expiry (5 minutes)

### Issue: "Slow WooCommerce responses"
**Optimizations:**
- Implement caching (`lib/woocommerce-cache.ts`)
- Reduce API calls with batch operations
- Use webhook updates for real-time data
- Limit product search results

## Performance Optimizations

### Caching Strategy
```typescript
// Product cache: 5 minutes
const products = await WooCommerceCache.getProducts(domain, {
  ttl: 300,
  force_refresh: false
});

// Customer data cache: 1 minute (more dynamic)
const customerData = await WooCommerceCache.getCustomer(email, {
  ttl: 60,
  force_refresh: isImportantQuery
});
```

### Batch Operations
```typescript
// Fetch multiple resources in parallel
const [products, orders, customer] = await Promise.all([
  WooCommerce.getProducts({ per_page: 10 }),
  WooCommerce.getOrders({ customer: customerId }),
  WooCommerce.getCustomer(customerId)
]);
```

## Integration Priority

### When to Use WooCommerce API
1. **Real-time data required**:
   - Order status
   - Current stock levels
   - Customer account details

2. **Customer verification needed**:
   - Accessing personal orders
   - Account modifications
   - Sensitive information

### When to Use Scraped Data (RAG)
1. **General product information**:
   - Product descriptions
   - Categories and collections
   - Static content

2. **Performance critical**:
   - High-volume queries
   - Public information
   - SEO content

## API Endpoints Reference

### Customer Configuration
- `GET /api/customer/config?domain={domain}` - Get WooCommerce config
- `POST /api/admin/config` - Update WooCommerce credentials

### WooCommerce Operations
- `POST /api/woocommerce/products/search` - Search products
- `GET /api/woocommerce/stock?sku={sku}` - Check stock levels
- `POST /api/woocommerce/customer-test` - Test customer access

### Customer Verification
- `POST /api/customer/verify` - Send/verify OTP
- `POST /api/auth/customer` - Customer authentication

### Chat with WooCommerce
- `POST /api/chat` - Chat endpoint with WooCommerce context

## Configuration Checklist

- [ ] Environment variables set (ENCRYPTION_KEY required)
- [ ] WooCommerce REST API enabled on store
- [ ] API credentials generated in WooCommerce
- [ ] Credentials added via Admin panel
- [ ] Domain configuration verified
- [ ] Customer verification tested
- [ ] Product search working
- [ ] Order retrieval functioning
- [ ] Chat integration tested

## Related Files
- `/lib/woocommerce-dynamic.ts` - Dynamic multi-tenant client
- `/lib/woocommerce-full.ts` - Complete API implementation
- `/lib/woocommerce-customer.ts` - Customer-specific operations
- `/lib/woocommerce-cache.ts` - Caching layer
- `/lib/customer-verification-simple.ts` - Simple verification
- `/lib/customer-verification.ts` - Full OTP verification
- `/app/api/chat/route.ts` - Chat integration point

## Last Updated
August 28, 2025