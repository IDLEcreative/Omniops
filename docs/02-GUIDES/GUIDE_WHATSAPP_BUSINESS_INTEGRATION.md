# WhatsApp Business Integration Guide

**Type:** Guide
**Status:** Active (Phase 1 Complete)
**Last Updated:** 2025-11-16
**Verified For:** v0.1.0
**Dependencies:** [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Estimated Setup Time:** 30-60 minutes (Meta approval: 2-3 weeks)

## Purpose

Complete guide for integrating WhatsApp Business API with Omniops using OAuth-based authentication. Enables customers to receive and respond to WhatsApp messages through the Omniops chat system with a simple "Connect WhatsApp" button - similar to "Connect with Shopify" flows.

## Quick Links
- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [WhatsApp Business Platform](https://business.whatsapp.com/developers)
- [Omniops Research Report](../10-ANALYSIS/ANALYSIS_WHATSAPP_BUSINESS_INTEGRATION.md)

---

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Phase 1: Foundation (COMPLETE)](#phase-1-foundation-complete)
- [Meta App Setup](#meta-app-setup)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [OAuth Flow (Customer Experience)](#oauth-flow-customer-experience)
- [Webhook Configuration](#webhook-configuration)
- [Testing](#testing)
- [Phase 2: Implementation (NEXT)](#phase-2-implementation-next)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What's Been Built (Phase 1)

✅ **Database Schema** - Complete multi-channel support with WhatsApp-specific tables
✅ **OAuth Endpoints** - One-click "Connect WhatsApp" flow for customers
✅ **Webhook Receiver** - Receives incoming messages from WhatsApp
✅ **Signature Verification** - Security against unauthorized webhooks
✅ **Session Management** - 24-hour window tracking via SQL functions

### Customer Experience (Simple!)

```
1. Customer logs into Omniops dashboard
   ↓
2. Goes to Settings → Integrations
   ↓
3. Clicks "Connect WhatsApp" button
   ↓
4. Redirected to Facebook/Meta login
   ↓
5. Authorizes Omniops to access WhatsApp Business
   ↓
6. Redirected back to Omniops dashboard
   ↓
7. ✅ WhatsApp connected! Start receiving messages.
```

**No manual API key copying. No technical knowledge required.**

---

## Architecture

### High-Level Flow

```
┌─────────────┐
│   WhatsApp  │
│    Users    │
└──────┬──────┘
       │ 1. User sends message
       ▼
┌──────────────────────────────────┐
│  Meta WhatsApp Cloud API         │
│  - Receives user messages        │
│  - Delivers business replies     │
└──────────┬───────────────────────┘
           │ 2. Webhook POST
           ▼
┌──────────────────────────────────┐
│  /api/whatsapp/webhook           │
│  - Verify signature              │
│  - Store webhook                 │
│  - Route to conversation handler │
└──────────┬───────────────────────┘
           │ 3. Save & process
           ▼
┌──────────────────────────────────┐
│  Conversation Service            │
│  - Find/create conversation      │
│  - Extend 24-hour session        │
│  - Save message to DB            │
└──────────┬───────────────────────┘
           │ 4. Trigger AI
           ▼
┌──────────────────────────────────┐
│  Chat API (/api/chat)            │
│  - AI processing with RAG        │
│  - WooCommerce/Shopify lookup    │
│  - Generate response             │
└──────────┬───────────────────────┘
           │ 5. Send reply
           ▼
┌──────────────────────────────────┐
│  /api/whatsapp/send (Phase 2)    │
│  - Check session active          │
│  - Format for WhatsApp           │
│  - Send via Meta Cloud API       │
└──────────────────────────────────┘
```

### OAuth Flow (One-Time Setup)

```
┌──────────────┐
│   Customer   │
└──────┬───────┘
       │ 1. Click "Connect WhatsApp"
       ▼
┌─────────────────────────────────┐
│  /api/whatsapp/oauth/authorize  │
│  - Generate state (CSRF)        │
│  - Redirect to Meta OAuth       │
└──────────┬──────────────────────┘
           │ 2. Redirect to Meta
           ▼
┌─────────────────────────────────┐
│  Meta OAuth Dialog              │
│  - Customer logs in             │
│  - Authorizes permissions       │
└──────────┬──────────────────────┘
           │ 3. Redirect with code
           ▼
┌─────────────────────────────────┐
│  /api/whatsapp/oauth/callback   │
│  - Verify state                 │
│  - Exchange code for token      │
│  - Get WABA & phone numbers     │
│  - Store encrypted token        │
│  - Redirect to dashboard        │
└─────────────────────────────────┘
```

---

## Phase 1: Foundation (COMPLETE)

### What's Implemented

#### 1. Database Schema

**File:** [supabase/migrations/20251116000000_whatsapp_integration.sql](../../supabase/migrations/20251116000000_whatsapp_integration.sql)

**Tables Created:**
- `whatsapp_templates` - Message templates for 24-hour+ conversations
- `whatsapp_sessions` - Track 24-hour messaging windows
- `whatsapp_webhooks` - Store all webhooks for debugging/retry
- `whatsapp_oauth_tokens` - OAuth tokens (encrypted with AES-256)

**Tables Extended:**
- `customer_configs` - Added WhatsApp columns (phone number, provider, OAuth metadata)
- `conversations` - Added channel support (`web`, `whatsapp`, `email`, etc.)
- `messages` - Added delivery tracking (`status`, `media_type`, `media_url`)

**SQL Functions:**
- `is_whatsapp_session_active(conversation_id)` - Check if in 24-hour window
- `extend_whatsapp_session(conversation_id, phone_number)` - Extend session on user message

#### 2. OAuth Endpoints

**Authorize Endpoint:** [app/api/whatsapp/oauth/authorize/route.ts](../../app/api/whatsapp/oauth/authorize/route.ts)

- Generates OAuth URL with CSRF protection
- Requests scopes: `whatsapp_business_messaging`, `whatsapp_business_management`
- Redirects customer to Meta authorization dialog

**Callback Endpoint:** [app/api/whatsapp/oauth/callback/route.ts](../../app/api/whatsapp/oauth/callback/route.ts)

- Verifies CSRF state
- Exchanges authorization code for access token
- Retrieves WhatsApp Business Account (WABA) info
- Retrieves phone numbers
- Stores encrypted token in database
- Redirects back to dashboard with success message

#### 3. Webhook Endpoint

**Webhook:** [app/api/whatsapp/webhook/route.ts](../../app/api/whatsapp/webhook/route.ts)

**Handles:**
- ✅ Webhook verification (GET request during setup)
- ✅ Signature verification (HMAC-SHA256)
- ✅ Incoming messages (text, image, document, audio, video)
- ✅ Status updates (sent, delivered, read, failed)
- ✅ Template status (approved, rejected)

**Security:**
- All webhooks verified with HMAC-SHA256 signature
- Invalid signatures rejected with 401 Unauthorized
- All webhooks stored in DB for audit trail

---

## Meta App Setup

### Prerequisites

1. **Facebook Business Manager Account**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Create account or use existing

2. **Meta Developer Account**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Sign up with Facebook account

### Step 1: Create Meta App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click "Create App"
3. Select "Business" as app type
4. Fill in:
   - **App Name:** "Omniops WhatsApp Integration"
   - **Contact Email:** Your email
   - **Business Account:** Select your business
5. Click "Create App"

### Step 2: Add WhatsApp Product

1. In app dashboard, find "Add Products"
2. Click "Set Up" on **WhatsApp**
3. Select or create WhatsApp Business Account (WABA)

### Step 3: Configure App Settings

1. Go to **Settings** → **Basic**
2. Copy **App ID** → Save as `META_APP_ID`
3. Copy **App Secret** → Save as `META_APP_SECRET`
4. Add **App Domains:** Your production domain (e.g., `omniops.co.uk`)
5. Add **Website URL:** `https://your-domain.com`

### Step 4: Configure OAuth Redirect

1. Go to **WhatsApp** → **Configuration**
2. Scroll to **Redirect URIs**
3. Add: `https://your-domain.com/api/whatsapp/oauth/callback`
4. Save Changes

### Step 5: Get Phone Number

1. Go to **WhatsApp** → **Getting Started**
2. Add or verify a phone number
3. Copy **Phone Number ID** (you'll see this in webhook metadata)

### Step 6: Configure Webhooks

1. Go to **WhatsApp** → **Configuration**
2. Click **Edit** on Webhook
3. Enter:
   - **Callback URL:** `https://your-domain.com/api/whatsapp/webhook`
   - **Verify Token:** Generate random string, save as `WHATSAPP_VERIFY_TOKEN`
4. Click **Verify and Save**
5. Subscribe to fields:
   - ✅ `messages`
   - ✅ `message_status`
   - ✅ `message_template_status_update`

### Step 7: Business Verification (Required for Production)

1. Go to [Business Settings](https://business.facebook.com/settings)
2. Click **Security Center** → **Business Verification**
3. Submit required documents:
   - Business registration documents
   - Proof of address
   - Business website
4. Wait 2-3 weeks for approval

**Note:** You can test with sandbox phone numbers before verification.

---

## Environment Variables

Add these to `.env.local`:

```bash
# ============================================================================
# WhatsApp Business API (Meta Cloud API)
# ============================================================================

# Meta App Credentials
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here

# Webhook Verification Token (generate random string)
WHATSAPP_VERIFY_TOKEN=generate_random_string_here
WHATSAPP_APP_SECRET=same_as_meta_app_secret

# OAuth Redirect (must match Meta app settings)
# This is already defined: NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Generating Verify Token

```bash
# Generate secure random token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output and use as `WHATSAPP_VERIFY_TOKEN`.

---

## Database Migration

### Apply Migration

**Option 1: Supabase CLI (Recommended)**

```bash
# Navigate to project root
cd /path/to/omniops

# Apply migration
npx supabase db push

# Or apply specific migration
npx supabase migration up
```

**Option 2: Supabase Dashboard**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy contents of `supabase/migrations/20251116000000_whatsapp_integration.sql`
5. Paste and run

**Option 3: Management API**

```bash
curl -X POST "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/database/query" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat supabase/migrations/20251116000000_whatsapp_integration.sql | tr '\n' ' ')\"}"
```

### Verify Migration

```sql
-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'whatsapp_templates',
  'whatsapp_sessions',
  'whatsapp_webhooks',
  'whatsapp_oauth_tokens'
);

-- Check new columns on customer_configs
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'customer_configs'
  AND column_name LIKE 'whatsapp%';

-- Test session management function
SELECT is_whatsapp_session_active('00000000-0000-0000-0000-000000000000'::uuid);
```

---

## OAuth Flow (Customer Experience)

### 1. Create "Connect WhatsApp" Button

Add to your dashboard/integrations page:

```tsx
// app/dashboard/integrations/page.tsx
export default function IntegrationsPage() {
  const connectWhatsApp = () => {
    const domain = window.location.hostname;
    window.location.href = `/api/whatsapp/oauth/authorize?domain=${domain}`;
  };

  return (
    <div className="integrations-page">
      <h1>Integrations</h1>

      <div className="integration-card">
        <img src="/logos/whatsapp.svg" alt="WhatsApp" />
        <h2>WhatsApp Business</h2>
        <p>Receive and respond to WhatsApp messages</p>

        <button onClick={connectWhatsApp}>
          Connect WhatsApp
        </button>
      </div>
    </div>
  );
}
```

### 2. Show Connection Status

```tsx
import { useEffect, useState } from 'react';

function WhatsAppIntegration() {
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    // Check URL params for OAuth result
    const params = new URLSearchParams(window.location.search);

    if (params.get('whatsapp_connected') === 'true') {
      setConnected(true);
      // Show success message
      showToast('WhatsApp connected successfully!');
    }

    if (params.get('whatsapp_error')) {
      showToast(`Error: ${params.get('whatsapp_error')}`, 'error');
    }

    // Fetch connection status from API
    fetchWhatsAppStatus();
  }, []);

  const fetchWhatsAppStatus = async () => {
    const res = await fetch('/api/whatsapp/status');
    const data = await res.json();

    setConnected(data.enabled);
    setPhoneNumber(data.phone_number);
  };

  return connected ? (
    <div className="connected">
      <h3>✅ WhatsApp Connected</h3>
      <p>Phone: {phoneNumber}</p>
      <button onClick={disconnectWhatsApp}>Disconnect</button>
    </div>
  ) : (
    <button onClick={connectWhatsApp}>
      Connect WhatsApp
    </button>
  );
}
```

---

## Webhook Configuration

### Test Webhook with cURL

```bash
# Verify webhook is working
curl -X GET "https://your-domain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=CHALLENGE_STRING"

# Should return: CHALLENGE_STRING
```

### Test Incoming Message

```bash
# Send test webhook (simulate incoming message)
curl -X POST "https://your-domain.com/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$(echo -n '{"entry":[]}' | openssl dgst -sha256 -hmac 'YOUR_APP_SECRET' | cut -d' ' -f2)" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WABA_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "+1234567890",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": { "name": "Test User" },
            "wa_id": "1234567890"
          }],
          "messages": [{
            "from": "1234567890",
            "id": "wamid.TEST123",
            "timestamp": "1234567890",
            "type": "text",
            "text": { "body": "Hello!" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### Monitor Webhooks

Query database to see incoming webhooks:

```sql
-- View recent webhooks
SELECT
  webhook_type,
  payload->>'entry' as entry,
  processed,
  created_at
FROM whatsapp_webhooks
ORDER BY created_at DESC
LIMIT 10;

-- View unprocessed webhooks
SELECT *
FROM whatsapp_webhooks
WHERE processed = FALSE
ORDER BY created_at ASC;
```

---

## Testing

### Test OAuth Flow

1. Start dev server: `npm run dev`
2. Navigate to integrations page
3. Click "Connect WhatsApp"
4. Authorize in Meta dialog
5. Check database for OAuth token:

```sql
SELECT
  customer_config_id,
  provider,
  expires_at,
  scopes,
  token_metadata
FROM whatsapp_oauth_tokens
ORDER BY created_at DESC
LIMIT 1;
```

### Test Webhook Reception

1. Configure webhook URL in Meta app
2. Send message to your WhatsApp Business number
3. Check webhook received:

```sql
SELECT
  webhook_type,
  payload->'entry'->0->'changes'->0->'value'->'messages'->0 as message,
  processed,
  created_at
FROM whatsapp_webhooks
WHERE webhook_type = 'message'
ORDER BY created_at DESC
LIMIT 1;
```

4. Check message saved:

```sql
SELECT
  c.channel,
  c.channel_metadata->>'whatsapp' as whatsapp_data,
  m.content,
  m.media_type,
  m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.channel = 'whatsapp'
ORDER BY m.created_at DESC
LIMIT 5;
```

### Test Session Management

```sql
-- Check active sessions
SELECT
  phone_number,
  session_start,
  session_expires,
  is_active,
  session_expires > NOW() as still_valid
FROM whatsapp_sessions
WHERE is_active = TRUE
ORDER BY created_at DESC;

-- Test session function
SELECT is_whatsapp_session_active('YOUR_CONVERSATION_ID'::uuid);
```

---

## Phase 2: Implementation (NEXT)

### What's Remaining

#### 1. Message Transformer
**File:** `lib/whatsapp/message-transformer.ts`

Convert between WhatsApp format ↔ Omniops format:
- WhatsApp message → Omniops `Message` type
- Omniops response → WhatsApp API format
- Handle all media types

#### 2. Session Management Service
**File:** `lib/whatsapp/session-manager.ts`

- Check if session active
- Get time remaining
- Determine if template required

#### 3. Send Message Endpoint
**File:** `app/api/whatsapp/send/route.ts`

- Check session status
- Send via Meta Cloud API
- Store message with external ID
- Update status on delivery

#### 4. Integrate with Chat API

Modify [app/api/chat/route.ts](../../app/api/chat/route.ts):
- Detect WhatsApp conversations
- Format responses for WhatsApp
- Send via WhatsApp instead of returning JSON

#### 5. Media Handling

**Upload:** `app/api/whatsapp/media/upload/route.ts`
**Download:** `app/api/whatsapp/media/download/route.ts`

- Upload images/documents to WhatsApp
- Download media from WhatsApp
- Store in S3/CDN (permanent storage)

---

## Troubleshooting

### OAuth Errors

**Error:** "Invalid redirect_uri"
- **Solution:** Ensure redirect URI exactly matches Meta app settings
- **Check:** `https://your-domain.com/api/whatsapp/oauth/callback`

**Error:** "Invalid state parameter"
- **Solution:** OAuth state expired (10 minute timeout)
- **Fix:** Try connecting again

**Error:** "No WhatsApp Business Accounts found"
- **Solution:** Create WABA in Meta Business Suite
- **Link:** [business.facebook.com](https://business.facebook.com)

### Webhook Errors

**Error:** Webhook verification fails (403)
- **Solution:** Verify token doesn't match
- **Fix:** Check `WHATSAPP_VERIFY_TOKEN` matches Meta app

**Error:** Invalid signature (401)
- **Solution:** App secret doesn't match
- **Fix:** Check `WHATSAPP_APP_SECRET` equals Meta app secret

**Error:** Webhooks not received
- **Solution:** Check webhook URL is publicly accessible
- **Test:** `curl https://your-domain.com/api/whatsapp/webhook`

### Database Errors

**Error:** Migration fails
- **Solution:** Check existing schema conflicts
- **Fix:** Review migration SQL, check for duplicate columns

**Error:** RLS policy blocks insert
- **Solution:** Service role key not used for webhook endpoint
- **Fix:** Use `createClient()` with service role in webhook handler

---

## Next Steps

### Immediate (Phase 1 Complete ✅)

1. **Apply database migration**
2. **Set up Meta app with credentials**
3. **Add environment variables**
4. **Test OAuth flow with test account**
5. **Verify webhook receiving messages**

### Phase 2 (Implementation)

1. Build message transformer
2. Create send message endpoint
3. Integrate with existing chat API
4. Implement media handling
5. Add comprehensive tests

### Phase 3 (Production)

1. Submit for Meta business verification
2. Create customer onboarding docs
3. Add template management UI
4. Implement error monitoring
5. Launch to pilot customers

---

## Support

**Meta Resources:**
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Business Verification Guide](https://www.facebook.com/business/help/2058515294227817)
- [Webhook Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)

**Omniops Resources:**
- [Research Report](../10-ANALYSIS/ANALYSIS_WHATSAPP_BUSINESS_INTEGRATION.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

**Questions?** Open an issue in the project repository.
