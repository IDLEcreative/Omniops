# Shopify Configuration Guide

## Overview

This guide explains how to configure Shopify integration for customer domains, enabling order lookup, product search, and inventory management through the chat widget.

## Prerequisites

1. A Shopify store (any plan)
2. Admin access to the Shopify store
3. Access to your Omniops customer configuration

## Step 1: Generate Shopify Admin API Access Token

### Option A: Using Shopify Admin (Recommended for Store Owners)

1. Log into your Shopify Admin dashboard
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps** (you may need to enable custom app development first)
4. Click **Create an app**
5. Name your app (e.g., "Omniops Chat Widget")
6. Click **Configure Admin API scopes**
7. Select the following scopes:
   - `read_products` - To search and display products
   - `read_orders` - To lookup customer orders
   - `read_customers` - To search customer information
   - `read_inventory` - To check stock levels
8. Click **Save**
9. Click **Install app**
10. Click **Reveal token once** under **Admin API access token**
11. **IMPORTANT**: Copy this token immediately - you won't be able to see it again!

### Option B: Using Shopify Partner Account (for Agencies)

1. Log into Shopify Partners
2. Navigate to **Apps** → **All apps**
3. Click **Create app**
4. Select **Public app** or **Custom app**
5. Follow similar scope selection as above
6. Generate and save the access token

## Step 2: Find Your Shopify Shop Domain

Your shop domain is typically in the format:
```
your-store-name.myshopify.com
```

You can find it in:
- Shopify Admin URL (https://your-store-name.myshopify.com/admin)
- Settings → Domains

**Note**: Use the `.myshopify.com` domain, not your custom domain.

## Step 3: Configure in Omniops

### Database Configuration

Connect to your Supabase database and update the `customer_configs` table:

```sql
-- Update existing customer config
UPDATE customer_configs
SET
  shopify_shop = 'your-store-name.myshopify.com',
  shopify_access_token = encrypt('shpat_your_access_token_here')
WHERE domain = 'your-website.com';

-- Or insert new config
INSERT INTO customer_configs (
  domain,
  business_name,
  shopify_shop,
  shopify_access_token
) VALUES (
  'your-website.com',
  'Your Business Name',
  'your-store-name.myshopify.com',
  encrypt('shpat_your_access_token_here')
);
```

**Security Note**: The `encrypt()` function uses AES-256-GCM encryption to securely store your access token.

### UI Configuration (Future Enhancement)

A dashboard UI for Shopify configuration is planned with the following fields:

```typescript
interface ShopifyConfigForm {
  enabled: boolean;
  shop: string;           // e.g., "mystore.myshopify.com"
  accessToken: string;    // Admin API access token
}
```

## Step 4: Test the Integration

### Using the Test Endpoint

```bash
curl "http://localhost:3000/api/shopify/test?domain=your-website.com"
```

Expected success response:
```json
{
  "success": true,
  "message": "Shopify connection successful",
  "configured": true,
  "productCount": 1,
  "testProduct": {
    "id": 12345,
    "title": "Example Product",
    "vendor": "Your Store"
  }
}
```

### Test Product Search

```bash
curl "http://localhost:3000/api/shopify/products?domain=your-website.com&query=shirt&limit=5"
```

## Step 5: Using Shopify in Chat

Once configured, the chat widget can:

### 1. **Lookup Orders**

User: "What's the status of order #1001?"

System: Uses ShopifyProvider to lookup order by number, ID, or customer email

### 2. **Search Products**

User: "Do you have any blue t-shirts?"

System: Searches Shopify products and returns relevant matches

### 3. **Check Stock**

User: "Is SKU ABC123 in stock?"

System: Checks inventory levels and availability

### 4. **Get Product Details**

User: "Tell me about product ID 12345"

System: Retrieves full product information including variants, images, pricing

## Troubleshooting

### "Shopify is not configured for this domain"

**Cause**: No Shopify configuration found in database

**Solution**:
1. Verify `shopify_shop` field is set in `customer_configs`
2. Check domain matches exactly (case-sensitive)

### "Shopify API connection failed"

**Causes**:
1. Invalid access token
2. Token doesn't have required scopes
3. Token has been revoked
4. Shop domain is incorrect

**Solutions**:
1. Regenerate access token with correct scopes
2. Verify shop domain format (should be `*.myshopify.com`)
3. Check token hasn't expired or been deleted

### "Failed to decrypt Shopify credentials"

**Cause**: Encryption key mismatch or corrupted encrypted data

**Solution**:
1. Verify `ENCRYPTION_KEY` environment variable is set correctly
2. Re-encrypt the access token:
   ```sql
   UPDATE customer_configs
   SET shopify_access_token = encrypt('your_new_token')
   WHERE domain = 'your-website.com';
   ```

## Security Best Practices

1. **Never commit access tokens** to version control
2. **Use environment variables** for test/development tokens
3. **Rotate tokens regularly** (every 90 days recommended)
4. **Use minimal scopes** - only request what you need
5. **Monitor API usage** in Shopify Admin → Apps → API access
6. **Revoke unused tokens** immediately

## API Rate Limits

Shopify enforces rate limits on Admin API:

- **REST API**: 2 requests per second (bucket-based)
- **GraphQL API**: Points-based system (1000 points per second)

The implementation includes automatic retry with exponential backoff for rate limit errors.

## Comparison: Shopify vs WooCommerce

| Feature | Shopify | WooCommerce |
|---------|---------|-------------|
| **Authentication** | Single access token | OAuth (key + secret) |
| **Configuration Fields** | 2 (shop, token) | 3 (URL, key, secret) |
| **API Complexity** | Simpler | More complex |
| **Variants** | Native support | Custom implementation |
| **Setup Time** | ~5 minutes | ~10 minutes |
| **Maintenance** | Lower | Higher |

## Future Enhancements

Planned improvements:

- [ ] GraphQL API support (for better performance)
- [ ] Webhook integration (real-time order updates)
- [ ] Multi-location inventory support
- [ ] Customer order history in chat
- [ ] Abandoned cart recovery
- [ ] Metafields access
- [ ] Shopify Plus features

## Example Configurations

### Basic E-commerce Store

```sql
UPDATE customer_configs
SET
  shopify_shop = 'coolshirts.myshopify.com',
  shopify_access_token = encrypt('shpat_abc123xyz789')
WHERE domain = 'coolshirts.com';
```

### Multi-brand Setup

```sql
-- Brand A
UPDATE customer_configs
SET shopify_shop = 'brand-a.myshopify.com', ...
WHERE domain = 'brand-a.com';

-- Brand B
UPDATE customer_configs
SET shopify_shop = 'brand-b.myshopify.com', ...
WHERE domain = 'brand-b.com';
```

## Support

For issues or questions:

1. Check the [Shopify Admin API documentation](https://shopify.dev/docs/api/admin-rest)
2. Review [SHOPIFY_INTEGRATION_IMPLEMENTATION.md](../SHOPIFY_INTEGRATION_IMPLEMENTATION.md)
3. Test using `/api/shopify/test` endpoint
4. Check Supabase logs for detailed error messages

## Related Documentation

- [Shopify Integration Implementation](../SHOPIFY_INTEGRATION_IMPLEMENTATION.md)
- [WooCommerce Integration Guide](./WOOCOMMERCE_INTEGRATION_GUIDE.md)
- [Commerce Provider Pattern](../COMMERCE_PROVIDER_PATTERN.md)
- [Encryption Implementation](./ENCRYPTION_IMPLEMENTATION.md)

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
