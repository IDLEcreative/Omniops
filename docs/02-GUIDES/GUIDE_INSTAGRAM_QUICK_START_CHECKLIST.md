# Instagram Integration: Quick Start Checklist

**Get Instagram Messenger integration live in 30 minutes**

---

## Prerequisites (5 minutes)

- [ ] Instagram account converted to Business account
- [ ] Facebook page created and linked to Instagram Business account
- [ ] Omniops account with admin access

---

## Step 1: Create Meta App (10 minutes)

### 1.1 Create Facebook App

- [ ] Go to https://developers.facebook.com/apps
- [ ] Click "Create App"
- [ ] Select app type: **"Business"**
- [ ] App name: "Your Company Instagram Bot"
- [ ] Contact email: your@email.com
- [ ] Click "Create App"

### 1.2 Add Instagram Product

- [ ] In app dashboard, click "Add Product"
- [ ] Find "Instagram" → Click "Set Up"
- [ ] Click "Instagram Graph API" → "Configure"

### 1.3 Configure OAuth

- [ ] In left sidebar: Settings → Basic
- [ ] Copy **App ID** (save for later)
- [ ] Click "Show" on **App Secret** (save for later)
- [ ] Scroll to "Add Platform" → Select "Website"
- [ ] Site URL: `https://yourdomain.com`
- [ ] Click "Save Changes"

### 1.4 Add OAuth Redirect URI

- [ ] In left sidebar: Instagram → Basic
- [ ] Find "OAuth Redirect URIs"
- [ ] Add: `https://yourdomain.com/api/instagram/callback`
- [ ] Click "Save Changes"

### 1.5 Request Permissions

- [ ] In left sidebar: App Review → Permissions and Features
- [ ] Request these permissions:
  - [ ] `instagram_basic` (instant approval)
  - [ ] `instagram_manage_messages` (needs review for production)
  - [ ] `pages_manage_metadata` (needs review for production)

**Note:** For testing, use test accounts (no review needed). For production, submit for review.

---

## Step 2: Configure Webhooks (5 minutes)

### 2.1 Add Webhook URL

- [ ] In Meta app dashboard: Products → Webhooks
- [ ] Click "Edit Subscription"
- [ ] Callback URL: `https://yourdomain.com/api/webhooks/instagram`
- [ ] Verify Token: (generate random token, save for later)
- [ ] Click "Verify and Save"

### 2.2 Subscribe to Events

- [ ] In Webhooks section: Select "Instagram"
- [ ] Subscribe to fields:
  - [ ] `messages`
  - [ ] `messaging_postbacks` (optional, for button clicks)
- [ ] Click "Save"

---

## Step 3: Environment Variables (2 minutes)

Add to your `.env.local` file:

```bash
# Instagram Integration (from Meta App)
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here

# OAuth Configuration
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/instagram/callback

# Webhook Configuration
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_random_token_here

# App URL (already exists)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**How to generate webhook verify token:**
```bash
# On Mac/Linux:
openssl rand -hex 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Database Migration (1 minute)

```bash
# Run the Instagram migration
npm run db:migrate

# Or manually apply:
psql $DATABASE_URL < supabase/migrations/20251116000000_instagram_integration.sql
```

**Verify migration:**
```sql
-- Check if table exists
SELECT * FROM instagram_credentials LIMIT 1;

-- Check if conversations has channel column
SELECT channel FROM conversations LIMIT 1;
```

---

## Step 5: Deploy Code (5 minutes)

### 5.1 Add OAuth Routes

- [ ] Create: `app/api/instagram/auth/url/route.ts`
- [ ] Create: `app/api/instagram/callback/route.ts`
- [ ] Create: `lib/instagram-oauth.ts`
- [ ] Create: `lib/instagram-api.ts`

### 5.2 Add Webhook Handler

- [ ] Create: `app/api/webhooks/instagram/route.ts`

### 5.3 Add UI Components (optional)

- [ ] Create: `components/dashboard/integrations/ConnectInstagramButton.tsx`
- [ ] Create: `components/dashboard/integrations/InstagramStatus.tsx`

### 5.4 Deploy

```bash
# Build and test locally
npm run build
npm run dev

# Deploy to production
git add .
git commit -m "feat: add Instagram OAuth integration"
git push origin main

# Vercel auto-deploys
```

---

## Step 6: Test Integration (5 minutes)

### 6.1 Test OAuth Flow

- [ ] Open: `https://yourdomain.com/dashboard/integrations`
- [ ] Click "Connect Instagram" button
- [ ] Should redirect to Facebook login
- [ ] Approve permissions
- [ ] Should redirect back to dashboard
- [ ] Check database for encrypted credentials:
  ```sql
  SELECT
    instagram_username,
    is_active,
    oauth_completed_at
  FROM instagram_credentials;
  ```

### 6.2 Test Webhook

- [ ] In Meta app dashboard: Products → Webhooks
- [ ] Click "Test" next to `messages` subscription
- [ ] Send test webhook
- [ ] Check your app logs for:
  ```
  ✅ Instagram webhook verified
  📨 Instagram message from [user]: [message]
  ✅ Instagram response sent
  ```

### 6.3 Test Real Message

- [ ] Open Instagram app on your phone
- [ ] Send DM to your business account
- [ ] Should receive AI-powered response
- [ ] Check database for conversation:
  ```sql
  SELECT
    channel,
    external_username,
    created_at
  FROM conversations
  WHERE channel = 'instagram'
  ORDER BY created_at DESC
  LIMIT 1;
  ```

---

## Troubleshooting

### "Redirect URI Mismatch" Error

**Issue:** OAuth redirect fails

**Fix:**
- Verify `INSTAGRAM_REDIRECT_URI` in `.env.local` exactly matches Meta dashboard
- Must be HTTPS in production
- No trailing slashes

### "Invalid Webhook Signature" Error

**Issue:** Webhooks rejected

**Fix:**
- Verify `INSTAGRAM_APP_SECRET` is correct
- Check webhook signature validation code
- Ensure payload is read as raw text (not JSON)

### "No Facebook Page Found" Error

**Issue:** User has Instagram but no page

**Fix:**
1. Create Facebook page
2. Link Instagram Business account to page
3. Settings → Instagram → Connect account

### "No Instagram Business Account" Error

**Issue:** User has personal Instagram account

**Fix:**
1. Convert to Business account in Instagram app
2. Settings → Account → Switch to Business Account
3. Link to Facebook page

### Webhooks Not Receiving Messages

**Issue:** Message sent but no webhook received

**Fix:**
- [ ] Check webhook URL is publicly accessible (HTTPS)
- [ ] Verify webhook subscription is active in Meta dashboard
- [ ] Check webhook responds within 20 seconds
- [ ] Review webhook logs for errors

---

## Production Checklist

Before going live with real customers:

- [ ] Meta App Review approved for permissions
- [ ] HTTPS certificate valid
- [ ] Environment variables set in production
- [ ] Database migration applied to production
- [ ] Webhook endpoint responding < 20 seconds
- [ ] Error logging/monitoring configured
- [ ] Rate limiting configured (Meta: 200 req/hour)
- [ ] Token expiry monitoring (60-day tokens)
- [ ] Support documentation created
- [ ] Test with real Instagram account
- [ ] E2E tests passing

---

## Optional: Advanced Features

After basic integration works:

### Multi-Account Support
- [ ] Allow customers to connect multiple Instagram accounts
- [ ] Update schema to support multiple credentials per customer

### Rich Media
- [ ] Support image responses
- [ ] Support carousel/gallery messages
- [ ] Support quick reply buttons

### Analytics
- [ ] Track Instagram message volume
- [ ] Measure response times
- [ ] Monitor conversation completion rates

### Auto-Refresh Tokens
- [ ] Implement background job to refresh tokens before expiry
- [ ] Send email alerts 7 days before token expiry
- [ ] Provide "Refresh Token" button in dashboard

---

## Support Resources

### Meta Documentation
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- Webhooks Guide: https://developers.facebook.com/docs/graph-api/webhooks
- OAuth Guide: https://developers.facebook.com/docs/facebook-login/overview

### Internal Documentation
- [Full Integration Guide](./GUIDE_INSTAGRAM_MESSENGER_INTEGRATION.md)
- [OAuth vs Manual Comparison](./GUIDE_INSTAGRAM_OAUTH_VS_MANUAL.md)

### Meta Developer Support
- Community Forum: https://developers.facebook.com/community
- Bug Reports: https://developers.facebook.com/support/bugs

---

## Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Create Meta App | 10 min | ⬜ |
| Configure Webhooks | 5 min | ⬜ |
| Set Environment Variables | 2 min | ⬜ |
| Run Database Migration | 1 min | ⬜ |
| Deploy Code | 5 min | ⬜ |
| Test Integration | 5 min | ⬜ |
| **Total** | **28 min** | |

**Production (with app review):** + 3-5 business days for Meta approval

---

## Success Criteria

You'll know it's working when:

- ✅ User clicks "Connect Instagram" → redirects to Facebook
- ✅ User approves → redirects back with success message
- ✅ Database shows encrypted credentials
- ✅ Send test DM → receive AI response in Instagram
- ✅ Conversation appears in database with `channel = 'instagram'`
- ✅ No errors in logs

**You're done!** 🎉

---

## Next Steps

After Instagram integration is live:

1. **Monitor Performance**
   - Response times
   - Error rates
   - Customer satisfaction

2. **Add More Channels**
   - WhatsApp Business API (similar OAuth flow)
   - Facebook Messenger
   - Twitter/X DMs

3. **Enhance Features**
   - Story replies
   - Product tagging
   - Quick reply templates
   - Rich media support

4. **Scale**
   - Multi-account support
   - Team inbox UI
   - Analytics dashboard
