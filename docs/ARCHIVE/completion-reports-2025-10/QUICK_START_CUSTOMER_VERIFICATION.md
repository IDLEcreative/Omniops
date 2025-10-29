# Customer Verification - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Supabase project (`birugqyuqhiahxvxeyqg`)
- WooCommerce store with API access
- Node.js environment

### Step 1: Environment Variables
Add to `.env.local`:
```env
# Supabase (your project)
NEXT_PUBLIC_SUPABASE_URL=https://birugqyuqhiahxvxeyqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WooCommerce
WOOCOMMERCE_URL=https://thompsonseparts.co.uk
WOOCOMMERCE_CONSUMER_KEY=ck_your_key
WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret
```

### Step 2: Create Database Tables
1. Go to: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new
2. Copy & paste: `scripts/create-customer-tables.sql`
3. Click "Run"

### Step 3: Test the System
```bash
# Start dev server
npm run dev

# Test connection (in another terminal)
curl http://localhost:3000/api/woocommerce/customer-test?test=all
```

## 💬 How It Works in Chat

### Customer Service Flow

**Customer asks about order:**
```
User: "Where is my order 12345?"
Bot: "I can help with that. May I have your name to verify the order?"
User: "John Smith"
Bot: "Thank you John. Your order #12345 shipped yesterday..."
```

**Customer needs full access:**
```
User: "Show me all my orders"
Bot: "I'll need your email to access your full order history."
User: "john@example.com"
Bot: "Perfect! Here are all your orders: [full history]"
```

## 🔑 Verification Levels

| Level | Required Info | Access Granted |
|-------|--------------|----------------|
| **None** | Nothing | General info, policies, FAQs |
| **Basic** | Name + Order# OR Name + ZIP | Specific order status, tracking |
| **Full** | Email (verified) | Everything: history, account, changes |

## 📁 Key Files

```
lib/
├── customer-verification-simple.ts  # Main verification logic
├── woocommerce-customer.ts         # WooCommerce operations
└── customer-verification.ts        # Email-based verification (optional)

app/api/
├── chat/route.ts                   # Chat with auto-verification
├── customer/quick-verify/route.ts  # Manual verification endpoint
└── woocommerce/customer-test/      # Testing endpoint
```

## 🧪 Testing Scenarios

### 1. Test Basic Verification
```bash
curl -X POST http://localhost:3000/api/customer/quick-verify \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "order_number": "12345"
  }'
```

### 2. Test Full Verification
```bash
curl -X POST http://localhost:3000/api/customer/quick-verify \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com"
  }'
```

### 3. Test in Chat Widget
```javascript
// In browser console on your site
fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "My name is John, where is order 12345?",
    session_id: "test-session",
    conversation_id: "550e8400-e29b-41d4-a716-446655440000"
  })
}).then(r => r.json()).then(console.log);
```

## 🔒 Security Features

### Automatic Data Masking
```javascript
// Customer sees:
Email: jo***hn@example.com
Phone: ***-***-1234
Address: New York, NY

// Full data only shown when appropriate
```

### Audit Logging
Every data access is logged with:
- Who accessed (conversation ID)
- What was accessed (data types)
- When (timestamp)
- Why (reason/context)
- How verified (method)

### Progressive Disclosure
- Start with public info
- Request only what's needed
- Explain why info is needed
- Escalate gracefully

## 🎯 Common Use Cases

### 1. Order Status Check
```javascript
Message: "Order 12345 status"
Extract: orderNumber = "12345"
Action: Request name for basic verification
Result: Show order status only
```

### 2. Account Information
```javascript
Message: "I need my order history"
Extract: Needs full access
Action: Request email verification
Result: Show complete history
```

### 3. General Question
```javascript
Message: "What's your return policy?"
Extract: No personal info needed
Action: No verification required
Result: Show public information
```

## ⚙️ Configuration

### Adjust Verification Requirements
```typescript
// lib/customer-verification-simple.ts

// Change minimum info needed
const MIN_INFO_FOR_BASIC = 2;  // Default: 2 pieces
const MIN_INFO_FOR_FULL = 1;   // Default: email only

// Customize access levels
if (level === 'basic') {
  return ['order_status', 'tracking'];  // Customize
}
```

### Email Verification (Optional High Security)
```typescript
// Use for sensitive operations
import { CustomerVerification } from '@/lib/customer-verification';

// Send 6-digit code
await CustomerVerification.createVerification({
  conversationId,
  email,
  method: 'email'
});

// Verify code
await CustomerVerification.verifyCode(
  conversationId,
  email,
  code
);
```

## 🐛 Troubleshooting

### Issue: "Tables not found"
```bash
# Check tables exist
curl http://localhost:3000/api/test-db

# Solution: Run SQL in Supabase dashboard
```

### Issue: "WooCommerce 401 error"
```bash
# Check credentials in .env.local
# Ensure using https:// in URL
# Verify API keys have read permissions
```

### Issue: "Verification not working"
```bash
# Test endpoint directly
curl http://localhost:3000/api/woocommerce/customer-test?test=verification

# Check logs in Supabase dashboard
```

## 📊 Monitoring

### Key Metrics
- Verification success rate
- Average time to verify
- Most common verification level
- Failed attempts

### View Logs
```sql
-- In Supabase SQL editor
SELECT * FROM customer_access_logs 
ORDER BY accessed_at DESC 
LIMIT 50;

SELECT * FROM customer_verifications 
WHERE verified_at IS NOT NULL 
ORDER BY created_at DESC;
```

## 🚢 Production Checklist

- [ ] Database tables created in production Supabase
- [ ] Environment variables set
- [ ] WooCommerce API credentials verified
- [ ] Email service configured (if using email verification)
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Audit log retention policy defined
- [ ] Privacy policy updated

## 📚 More Resources

- [Full Documentation](./CUSTOMER_VERIFICATION_SYSTEM.md)
- [Database Schema](../scripts/create-customer-tables.sql)
- [API Reference](./CUSTOMER_VERIFICATION_SYSTEM.md#api-reference)
- [Security Guide](./CUSTOMER_VERIFICATION_SYSTEM.md#security--compliance)

---

**Need Help?** Check the test endpoint first:
```bash
curl http://localhost:3000/api/woocommerce/customer-test?test=all
```

This will tell you exactly what's working and what's not!