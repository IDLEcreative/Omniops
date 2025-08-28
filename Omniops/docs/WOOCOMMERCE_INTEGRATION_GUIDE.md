# WooCommerce Integration Guide

## Quick Start

This guide will help you integrate WooCommerce with your Customer Service Agent in 5 minutes.

## Prerequisites

- WooCommerce store (version 3.5+)
- WooCommerce REST API enabled
- Admin access to generate API keys

## Step 1: Generate WooCommerce API Keys

1. Log into your WooCommerce admin panel
2. Navigate to **WooCommerce → Settings → Advanced → REST API**
3. Click **"Add key"**
4. Configure the key:
   - **Description**: "Customer Service Agent"
   - **User**: Select your admin user
   - **Permissions**: Select **"Read/Write"** for full access
5. Click **"Generate API key"**
6. Copy the **Consumer key** and **Consumer secret** (you won't see them again!)

## Step 2: Configure the Integration

### Option A: Environment Variables (Recommended for single store)

Add to your `.env.local` file:
```env
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Option B: Admin Dashboard (Recommended for multiple stores)

1. Go to your Customer Service Agent admin dashboard
2. Navigate to **Integrations → WooCommerce**
3. Enter your store details:
   - Store URL (e.g., `https://your-store.com`)
   - Consumer Key
   - Consumer Secret
4. Click **"Test Connection"**
5. Click **"Save Configuration"**

## Step 3: Test the Integration

### Using the API directly:
```bash
# Test products endpoint
curl http://localhost:3000/api/admin/woocommerce/products

# Test orders endpoint
curl http://localhost:3000/api/admin/woocommerce/orders
```

### In your application:
```typescript
import { WooCommerceAPI } from '@/lib/woocommerce-api';

const wc = new WooCommerceAPI();
const products = await wc.getProducts({ per_page: 5 });
console.log('Products:', products);
```

## Step 4: Enable Features in Chat

The customer service agent can now:

### Product Inquiries
- "What products do you have in stock?"
- "Show me your latest products"
- "Is the [product name] available?"
- "What's the price of [product]?"

### Order Support
- "Where is my order #12345?"
- "I need to check my order status"
- "Can I get a refund for order #12345?"
- "Update the shipping address for my order"

### Customer Management
- "Update my email address"
- "Change my shipping information"
- "What orders have I placed?"

## Common Use Cases

### 1. Product Search in Chat
When customers ask about products, the agent automatically searches your WooCommerce catalog:

```typescript
// This happens automatically when customers ask about products
const products = await wc.getProducts({
  search: customerQuery,
  status: 'publish',
  stock_status: 'instock'
});
```

### 2. Order Tracking
Customers can check their order status:

```typescript
// Agent finds order by email or order number
const customer = await wc.getCustomerByEmail(customerEmail);
const orders = await wc.getOrders({
  customer: customer.id,
  per_page: 5
});
```

### 3. Process Refunds
Support agents can process refunds directly:

```typescript
const refund = await wc.createOrderRefund(orderId, {
  amount: refundAmount,
  reason: customerReason,
  api_refund: true // Process refund through payment gateway
});
```

## Advanced Configuration

### Enable Webhooks for Real-time Updates

1. In the admin dashboard, enable webhooks
2. WooCommerce will send real-time updates for:
   - New orders
   - Order status changes
   - Inventory updates
   - Customer updates

### Configure Sync Settings

1. Enable automatic synchronization
2. Set sync interval (hourly, daily, etc.)
3. Choose what to sync:
   - ✅ Products
   - ✅ Orders
   - ✅ Customers

### Set Up Permissions

Control what the agent can do:
- **Read-only**: Agent can view but not modify data
- **Full access**: Agent can create orders, process refunds, update customers

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for your WooCommerce store
2. **Limit Permissions**: Only grant necessary permissions
3. **Rotate Keys**: Regenerate API keys periodically
4. **Monitor Usage**: Check API logs for unusual activity
5. **IP Restrictions**: Restrict API access by IP if possible

## Troubleshooting

### "Connection Failed"
- Verify your store URL (include https://)
- Check API keys are correct
- Ensure REST API is enabled in WooCommerce
- Check for security plugins blocking API access

### "401 Unauthorized"
- Regenerate API keys
- Ensure keys have Read/Write permissions
- Check WordPress user has admin privileges

### "Products not showing in chat"
- Verify products are published
- Check products are in stock
- Ensure product visibility is set to "Shop and search"

### Performance Issues
- Enable caching for product queries
- Limit the number of products returned
- Use pagination for large catalogs

## API Rate Limits

WooCommerce enforces these limits:
- **Default**: 100 requests per minute
- **Batch operations**: Count as single request
- **Recommendation**: Implement caching to reduce API calls

## Next Steps

1. **Test Customer Scenarios**: Try common customer questions
2. **Train Your Team**: Show support staff the new capabilities
3. **Monitor Performance**: Check response times and accuracy
4. **Customize Responses**: Tailor how product information is presented
5. **Set Up Alerts**: Configure notifications for important events

## Support

- **Documentation**: See [WOOCOMMERCE_FULL_API.md](./WOOCOMMERCE_FULL_API.md)
- **API Reference**: See [woocommerce-api-endpoints.md](./woocommerce-api-endpoints.md)
- **WooCommerce Docs**: https://woocommerce.github.io/woocommerce-rest-api-docs/

## Changelog

- **v2.0.0**: Full API access to all WooCommerce endpoints
- **v1.0.0**: Basic product search functionality