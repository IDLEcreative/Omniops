# WooCommerce Authentication Fix Guide

## Current Status
The chatbot is currently using **mock data** for order lookups because the WooCommerce API authentication is failing with a 401 error. This allows testing to continue while the authentication issue is resolved.

## Mock Data Available
When authentication fails, the system falls back to mock data for:
- **Customer Email**: samguy@thompsonsuk.com
- **Order Numbers**: 119410 (processing), 119411 (completed)
- **Customer Name**: Sam Guy

## Steps to Fix WooCommerce Authentication

### 1. Verify WooCommerce REST API is Enabled
1. Log into WordPress admin: https://thompsonseparts.co.uk/wp-admin
2. Navigate to: **WooCommerce → Settings → Advanced → REST API**
3. Ensure REST API is enabled

### 2. Generate New API Credentials
1. In WordPress admin, go to: **WooCommerce → Settings → Advanced → REST API**
2. Click **"Add key"** or **"Create an API key"**
3. Fill in the details:
   - **Description**: "Customer Service Chatbot"
   - **User**: Select an administrator account
   - **Permissions**: Select **"Read/Write"** (or at minimum "Read")
4. Click **"Generate API Key"**
5. **IMPORTANT**: Copy both the Consumer Key and Consumer Secret immediately
   - They will only be shown once!
   - Consumer Key starts with: `ck_`
   - Consumer Secret starts with: `cs_`

### 3. Update Environment Variables
Update your `.env.local` file with the new credentials:

```env
WOOCOMMERCE_URL=https://thompsonseparts.co.uk
WOOCOMMERCE_CONSUMER_KEY=ck_your_new_consumer_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_new_consumer_secret_here
```

### 4. Test the Connection
Run the test script to verify the connection works:

```bash
node test-woo-package.js
```

You should see successful responses for:
- System status
- Products
- Orders
- Customers

### 5. Common Issues and Solutions

#### Issue: Still getting 401 errors
**Solutions**:
- Ensure the user account associated with the API key has administrator privileges
- Check that the API key has "Read" or "Read/Write" permissions (not "Write" only)
- Verify the store URL is correct (with or without www)
- Try regenerating the API keys

#### Issue: 404 errors on API endpoints
**Solutions**:
- Check permalink settings in WordPress (Settings → Permalinks)
- Ensure pretty permalinks are enabled (not "Plain")
- Save permalink settings again to flush rewrite rules

#### Issue: SSL/HTTPS errors
**Solutions**:
- Ensure the site has a valid SSL certificate
- Try using `http://` instead of `https://` for local development only

### 6. Verify Full Functionality
Once authentication is working:

1. Test with the chatbot test script:
```bash
npx tsx test-chatbot-orders.js
```

2. Test in the chat widget:
   - Open: http://localhost:3000/embed?domain=thompsonseparts.co.uk
   - Type: "samguy@thompsonsuk.com"
   - The bot should retrieve real orders from WooCommerce

### 7. Remove Mock Data Warning
Once real authentication is working, you'll no longer see:
```
[WooCommerce] Authentication failed, using mock data for testing
```

## Current Mock Data Implementation
The mock data fallback is implemented in:
- `/lib/woocommerce-mock.ts` - Mock data definitions
- `/lib/woocommerce-api/orders.ts` - Fallback logic for orders
- `/lib/woocommerce-api/customers.ts` - Fallback logic for customers

This ensures the chatbot remains functional during development even when WooCommerce authentication is not configured.

## Need Help?
If you continue to have issues:
1. Check WooCommerce documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/
2. Verify with your hosting provider that API access is not blocked
3. Check WordPress/WooCommerce error logs for more details