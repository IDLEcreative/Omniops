# WooCommerce API Key Regeneration Guide

**Type:** Integration
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 10 minutes

## Purpose
1. Log into WordPress admin dashboard 2. Navigate to: **WooCommerce → Settings** 3. Click the **Advanced** tab

## Quick Links
- [🔐 How to Regenerate WooCommerce API Keys](#-how-to-regenerate-woocommerce-api-keys)
- [🔄 Update Credentials in Application](#-update-credentials-in-application)
- [✅ Verify New Credentials Work](#-verify-new-credentials-work)
- [🔍 Troubleshooting](#-troubleshooting)
- [📋 Quick Reference](#-quick-reference)

## Keywords
api, application, checklist, credentials, integration, key, keys, quick, reference, regenerate

---


**Issue**: 401 Unauthorized - `woocommerce_rest_cannot_view`
**Cause**: API keys have insufficient permissions or have been revoked
**Solution**: Regenerate API keys with Read/Write permissions

---

## 🔐 How to Regenerate WooCommerce API Keys

### Step 1: Access WooCommerce Settings

1. Log into WordPress admin dashboard
2. Navigate to: **WooCommerce → Settings**
3. Click the **Advanced** tab
4. Click the **REST API** sub-tab

### Step 2: Check Existing Keys

1. Look for existing API keys in the list
2. Check if Thompson's E Parts API key exists
3. Note the permissions (should be "Read/Write")

### Step 3: Revoke Old Keys (Recommended)

1. Find the old API key entry
2. Click the **Revoke** button
3. Confirm revocation

### Step 4: Create New API Keys

1. Click **Add key** button
2. Fill in the form:
   - **Description**: `Thompson's E Parts - AI Customer Service`
   - **User**: Select admin user
   - **Permissions**: Select **Read/Write** ⚠️ **CRITICAL**
3. Click **Generate API key**

### Step 5: Copy Credentials

**⚠️ IMPORTANT**: You will only see these credentials once!

Copy and save:
- **Consumer key**: Starts with `ck_`
- **Consumer secret**: Starts with `cs_`

Example format:
```
Consumer key: ck_abc123def456...
Consumer secret: cs_xyz789uvw012...
```

---

## 🔄 Update Credentials in Application

Once you have new credentials, update them in the application:

### Option 1: Update Environment Variables (Temporary)

Edit `.env.local`:

```bash
WOOCOMMERCE_URL=https://thompsonseparts.co.uk
WOOCOMMERCE_CONSUMER_KEY=ck_[NEW_KEY_HERE]
WOOCOMMERCE_CONSUMER_SECRET=cs_[NEW_SECRET_HERE]
```

Then restart the application:
```bash
npm run dev
```

### Option 2: Update Database (Production Method)

Use the provided script:

```bash
# Update with new credentials
npx tsx update-woocommerce-credentials.ts \
  --domain thompsonseparts.co.uk \
  --key "ck_[NEW_KEY_HERE]" \
  --secret "cs_[NEW_SECRET_HERE]"
```

This will:
- ✅ Encrypt the credentials
- ✅ Update the database
- ✅ Clear the provider cache
- ✅ Verify the update

---

## ✅ Verify New Credentials Work

After updating, test the API:

```bash
npx tsx diagnose-woocommerce-api.ts
```

Expected output:
```
✅ AUTHENTICATION WORKING
Working method: Query Parameters (Current Method)
Products returned: 1
Sample product: [Product Name]
```

---

## 🔍 Troubleshooting

### Still Getting 401 After Regeneration?

**Check Permissions**:
- Ensure API key has **Read/Write** permissions (not just Read)
- Verify the user associated with the key has admin privileges

**Check REST API Status**:
1. Go to: **WooCommerce → Status → Tools**
2. Look for "REST API" settings
3. Ensure REST API is enabled

**Check WordPress Security Plugins**:
- Some security plugins block REST API access
- Temporarily disable security plugins to test
- Add REST API to security plugin whitelist if needed

**Check .htaccess Rules**:
- Some hosts add security rules that block API access
- Check for rules blocking `/wp-json/` paths
- Contact hosting support if needed

### Getting Different Errors?

**403 Forbidden**:
- Server-side firewall blocking
- Contact hosting provider
- Check if IP is whitelisted

**404 Not Found**:
- Permalink settings issue
- Go to: **Settings → Permalinks**
- Click "Save Changes" to flush rewrite rules

**500 Internal Server Error**:
- WooCommerce plugin issue
- Check WordPress debug logs
- Ensure WooCommerce is up to date

---

## 📋 Quick Reference

### WooCommerce API Documentation
- REST API Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/
- Authentication: https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication

### Required Permissions
- **Minimum**: Read/Write
- **User Role**: Administrator or Shop Manager
- **REST API**: Enabled

### Security Best Practices
1. Use unique descriptions for each API key
2. Regenerate keys periodically (every 90 days)
3. Revoke unused keys immediately
4. Never commit keys to version control
5. Use environment variables or encrypted database storage

---

## 🎯 Success Checklist

- [ ] Logged into WooCommerce dashboard
- [ ] Navigated to REST API settings
- [ ] Revoked old API key
- [ ] Created new API key with Read/Write permissions
- [ ] Copied consumer key and secret
- [ ] Updated credentials (environment or database)
- [ ] Ran diagnostic script
- [ ] Verified authentication working
- [ ] Tested product search working

---

**Last Updated**: 2025-10-23
**Issue**: WooCommerce 401 Unauthorized
**Status**: Awaiting new API credentials from dashboard
