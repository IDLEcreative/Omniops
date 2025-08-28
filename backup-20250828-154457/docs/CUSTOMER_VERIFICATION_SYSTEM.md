# Customer Verification System Documentation

## Overview

The Customer Verification System enables secure access to WooCommerce customer data through a progressive verification approach. It provides minimal friction while maintaining data security and GDPR compliance.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Verification Levels](#verification-levels)
3. [Implementation Guide](#implementation-guide)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Security & Compliance](#security--compliance)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Chat Interface                        │
│                 (app/api/chat/route.ts)                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Verification Controller                      │
│        (lib/customer-verification-simple.ts)             │
├───────────────────────────────────────────────────────────┤
│  • Progressive verification (none/basic/full)            │
│  • Automatic info extraction from messages               │
│  • Context generation based on access level              │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ WooCommerce │ │  Supabase   │ │   Audit     │
│     API     │ │   Storage   │ │   Logging   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### File Structure

```
customer-service-agent/
├── lib/
│   ├── customer-verification.ts          # Email-based verification (high security)
│   ├── customer-verification-simple.ts   # Progressive verification (low friction)
│   ├── woocommerce-customer.ts          # WooCommerce customer operations
│   └── woocommerce-api.ts               # Core WooCommerce API client
├── app/api/
│   ├── chat/route.ts                    # Main chat endpoint with verification
│   ├── customer/
│   │   ├── verify/route.ts              # Email verification endpoint
│   │   └── quick-verify/route.ts        # Progressive verification endpoint
│   └── woocommerce/
│       └── customer-test/route.ts       # Testing endpoint
└── scripts/
    └── create-customer-tables.sql       # Database schema

```

## Verification Levels

### Level 0: No Verification
**Access:** General information only
- Product information
- Store policies  
- General shipping times
- Public FAQs

**Example:**
```typescript
// No customer info provided
{
  level: 'none',
  allowedData: ['general_info', 'policies', 'product_info']
}
```

### Level 1: Basic Verification
**Requirements:** 2 out of 3:
- Customer name
- Order number
- Postal/ZIP code

**Access:**
- Specific order status
- Shipping information
- Order tracking
- Basic order details

**Example:**
```typescript
// Customer provides name + order number
{
  level: 'basic',
  allowedData: ['order_status', 'shipping_info', 'order_details']
}
```

### Level 2: Full Verification
**Requirements:**
- Email address (must match WooCommerce records)
- Optional: Name confirmation

**Access:**
- Complete order history
- Account details
- Personal information
- Ability to make changes
- Full customer context

**Example:**
```typescript
// Customer provides matching email
{
  level: 'full',
  customerId: 123,
  customerEmail: 'customer@example.com',
  allowedData: ['orders', 'account', 'personal_info', 'order_history']
}
```

## Implementation Guide

### 1. Basic Setup

First, ensure your environment variables are configured:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WooCommerce
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_your_key
WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret
```

### 2. Database Setup

Run the SQL script in your Supabase dashboard:

```sql
-- Key tables needed:
- conversations        # Track chat sessions
- messages            # Store messages
- customer_verifications  # Email verification codes
- customer_access_logs    # Audit trail
- customer_data_cache     # Performance caching
```

### 3. Integration in Chat

The chat route automatically handles verification:

```typescript
// app/api/chat/route.ts
import { SimpleCustomerVerification } from '@/lib/customer-verification-simple';

// Automatic extraction from message
const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
const orderMatch = message.match(/#?\d{4,}/);
const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+)/i);

// Progressive verification
const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
  conversationId,
  email: emailMatch?.[0],
  orderNumber: orderMatch?.[0],
  name: nameMatch?.[1],
}, domain);
```

### 4. Using Verification Results

```typescript
// Get appropriate context based on level
const context = await SimpleCustomerVerification.getCustomerContext(
  verificationLevel,
  conversationId,
  domain
);

// Add to AI prompt
if (verificationLevel.level === 'full') {
  // Include full customer context
  systemPrompt += context;
} else if (verificationLevel.level === 'basic') {
  // Include limited context
  systemPrompt += context;
  systemPrompt += '\nAsk for email if customer needs more access.';
}
```

## API Reference

### POST /api/customer/quick-verify

Progressive verification endpoint.

**Request:**
```json
{
  "conversation_id": "uuid",
  "name": "John Smith",        // Optional
  "email": "john@example.com", // Optional
  "order_number": "12345",     // Optional
  "postal_code": "10001",      // Optional
  "domain": "store.com"        // Optional
}
```

**Response:**
```json
{
  "success": true,
  "verification_level": "basic",
  "allowed_data": ["order_status", "shipping_info"],
  "customer_context": "Customer Order Information...",
  "prompt": "For full access, please provide email.",
  "can_access": {
    "general_info": true,
    "order_status": true,
    "order_history": false,
    "account_details": false,
    "make_changes": false
  }
}
```

### POST /api/customer/verify

Email-based verification (high security).

**Send Code:**
```json
{
  "conversation_id": "uuid",
  "email": "customer@example.com",
  "method": "email"
}
```

**Verify Code:**
```json
{
  "conversation_id": "uuid",
  "email": "customer@example.com",
  "code": "123456"
}
```

### GET /api/woocommerce/customer-test

Test endpoint for verification system.

**Parameters:**
- `test`: all | schema | verification | customer | masking | logging | caching
- `email`: Customer email to test
- `domain`: Store domain

**Example:**
```bash
curl "http://localhost:3000/api/woocommerce/customer-test?test=all&email=test@example.com"
```

## Database Schema

### Core Tables

#### conversations
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  session_id TEXT NOT NULL,
  verification_status TEXT DEFAULT 'unverified',
  verified_customer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### customer_verifications
```sql
CREATE TABLE customer_verifications (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  method TEXT DEFAULT 'email',
  attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### customer_access_logs
```sql
CREATE TABLE customer_access_logs (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  woo_customer_id INTEGER,
  accessed_data TEXT[],
  reason TEXT,
  verified_via TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now()
);
```

## Security & Compliance

### Data Protection

1. **Data Masking**
   - Emails: `jo***oe@example.com`
   - Phones: `***-***-1234`
   - Addresses: `City, State` only
   - Credit cards: `****-****-****-1234`

2. **Access Control**
   - Row Level Security (RLS) enabled
   - Service role required for sensitive operations
   - Audit logging for all data access

3. **Rate Limiting**
   - Max 3 verification attempts per 15 minutes
   - Domain-based rate limiting for API calls

### GDPR Compliance

- **Right to Access**: Customer can request their data
- **Right to Erasure**: Data can be deleted on request
- **Data Minimization**: Only necessary data collected
- **Audit Trail**: All access logged with reason
- **Data Expiry**: Cache expires after 15 minutes

### Implementation Example

```typescript
// Data masking
import { DataMasker } from '@/lib/customer-verification';

const maskedEmail = DataMasker.maskEmail('john@example.com');
// Result: "jo***hn@example.com"

// Audit logging
await CustomerVerification.logAccess(
  conversationId,
  customerEmail,
  customerId,
  ['order_history', 'personal_info'],
  'Customer requested order status',
  'email_verification'
);
```

## Testing

### Unit Tests

Test individual components:

```typescript
// Test verification levels
describe('SimpleCustomerVerification', () => {
  it('should return basic level with name + order', async () => {
    const result = await SimpleCustomerVerification.verifyCustomer({
      conversationId: 'test-uuid',
      name: 'John Smith',
      orderNumber: '12345'
    });
    expect(result.level).toBe('basic');
  });
});
```

### Integration Tests

Test the complete flow:

```bash
# Test all components
curl http://localhost:3000/api/woocommerce/customer-test?test=all

# Test specific verification scenario
curl -X POST http://localhost:3000/api/customer/quick-verify \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test-uuid",
    "name": "John Smith",
    "order_number": "12345"
  }'
```

### Manual Testing Scenarios

1. **No Verification Path**
   - Message: "What are your shipping rates?"
   - Expected: General information only

2. **Basic Verification Path**
   - Message: "My name is John, order 12345 status?"
   - Expected: Order status shown, prompt for email for more

3. **Full Verification Path**
   - Message: "I'm john@example.com, need my order history"
   - Expected: Complete customer context

## Troubleshooting

### Common Issues

#### 1. Tables Not Found
**Error:** `Could not find the table 'public.conversations' in the schema cache`

**Solution:**
- Ensure tables exist in correct Supabase project
- Check project URL matches in `.env.local`
- Run migration script in Supabase dashboard

#### 2. WooCommerce Connection Failed
**Error:** `401 Unauthorized`

**Solution:**
- Verify WooCommerce credentials
- Check API permissions (read access required)
- Ensure URL includes https://

#### 3. Verification Not Working
**Error:** Customer data not showing despite verification

**Solution:**
- Check Supabase connection
- Verify WooCommerce customer exists
- Check audit logs for access attempts
- Ensure domain matches if using multi-tenant setup

### Debug Mode

Enable detailed logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Verification Level:', verificationLevel);
  console.log('Customer Context:', customerContext);
  console.log('Allowed Data:', verificationLevel.allowedData);
}
```

### Health Check Endpoint

```bash
# Check system health
curl http://localhost:3000/api/test-db

# Expected response
{
  "config": {
    "url": "https://your-project.supabase.co",
    "hasServiceKey": true,
    "hasAnonKey": true
  },
  "tableTests": {
    "conversations": { "success": true },
    "messages": { "success": true },
    // ... all tables should show success
  }
}
```

## Best Practices

### 1. Progressive Disclosure
- Start with minimal verification
- Only request additional info when needed
- Explain why information is needed

### 2. Clear Communication
```typescript
// Good
"To help with your order, could you provide your name and order number?"

// Bad
"Verification required. Enter credentials."
```

### 3. Graceful Degradation
- Always provide some level of help
- Fall back to general information
- Offer alternative verification methods

### 4. Performance Optimization
- Cache customer data (15-minute expiry)
- Reuse verification across conversation
- Batch WooCommerce API calls

## Configuration Options

### Environment Variables

```env
# Verification Settings
VERIFICATION_CODE_LENGTH=6              # Length of verification codes
VERIFICATION_EXPIRY_MINUTES=15          # Code expiry time
VERIFICATION_MAX_ATTEMPTS=3             # Max attempts before lockout
VERIFICATION_RATE_LIMIT_MINUTES=15      # Rate limit window

# Feature Flags
ENABLE_EMAIL_VERIFICATION=true          # Use email codes
ENABLE_SIMPLE_VERIFICATION=true         # Use progressive verification
ENABLE_AUDIT_LOGGING=true               # Log all access
ENABLE_DATA_MASKING=true               # Mask sensitive data
```

### Customization

Modify verification requirements:

```typescript
// lib/customer-verification-simple.ts
export class SimpleCustomerVerification {
  // Adjust minimum requirements
  private static readonly MIN_INFO_FOR_BASIC = 2;  // Default: 2 pieces
  private static readonly MIN_INFO_FOR_FULL = 1;   // Default: email only
  
  // Customize data access per level
  static getAccessLevel(level: string): string[] {
    switch(level) {
      case 'basic':
        return ['order_status', 'shipping_info', 'tracking'];
      case 'full':
        return ['all_data'];
      default:
        return ['general_info'];
    }
  }
}
```

## Support & Maintenance

### Monitoring

Key metrics to track:
- Verification success rate
- Average verification time
- Failed verification attempts
- Customer satisfaction scores

### Updates

Keep the system current:
1. Regular security audits
2. Update WooCommerce API version
3. Review and rotate API keys
4. Update verification logic based on usage

### Contact

For issues or questions:
- Check logs in Supabase Dashboard
- Review audit logs for access patterns
- Test with the customer-test endpoint
- Enable debug mode for detailed output

---

## Quick Start Checklist

- [ ] Configure environment variables
- [ ] Create database tables in Supabase
- [ ] Test WooCommerce connection
- [ ] Verify MCP server connected
- [ ] Run test endpoint
- [ ] Test chat with customer query
- [ ] Check audit logs
- [ ] Configure email service (production)

This system provides a complete, secure, and user-friendly customer verification solution for your chat application.