# Vercel Environment Variables Setup Guide

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v2.1.0
**Dependencies:**
- [SETUP_SUPABASE.md](SETUP_SUPABASE.md)
- [VERCEL_REDIS_SETUP.md](VERCEL_REDIS_SETUP.md)
- [.env.example](../../.env.example)
**Estimated Read Time:** 7 minutes

## Purpose
Step-by-step configuration guide for setting up 7 required Vercel environment variables including Supabase credentials (URL, anon key, service role key), OpenAI API key, Redis connection string, 32-byte AES encryption key, with instructions for accessing Vercel dashboard, generating secure keys, testing deployments, and security best practices for production vs development environments.

## Quick Links
- [Required Environment Variables](#required-environment-variables)
- [How to Add Environment Variables in Vercel](#how-to-add-environment-variables-in-vercel)
- [Verifying Your Setup](#verifying-your-setup)
- [Getting Your Supabase Keys](#getting-your-supabase-keys)
- [Generating an Encryption Key](#generating-an-encryption-key)
- [Troubleshooting](#troubleshooting)

## Keywords
Vercel environment variables, Supabase configuration, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, REDIS_URL, ENCRYPTION_KEY, deployment secrets, production config, environment setup, Vercel dashboard, API key management, crypto.randomBytes, service role security, anon key, 32-byte encryption

## Aliases
- "NEXT_PUBLIC_SUPABASE_URL" (also known as: Supabase URL, project URL, database URL)
- "SUPABASE_SERVICE_ROLE_KEY" (also known as: service key, admin key, backend key)
- "NEXT_PUBLIC_SUPABASE_ANON_KEY" (also known as: anon key, public key, client key)
- "ENCRYPTION_KEY" (also known as: secret key, AES key, credential encryption key)
- "REDIS_URL" (also known as: Redis connection string, cache URL, job queue URL)
- "environment variables" (also known as: env vars, config vars, deployment secrets)

---

## Required Environment Variables

You need to configure the following environment variables in your Vercel project settings:

### 1. Supabase Configuration (REQUIRED)
```
NEXT_PUBLIC_SUPABASE_URL=https://jfapqplncdtsocuetgbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. OpenAI Configuration (REQUIRED for chat functionality)
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Redis Configuration (OPTIONAL - will use in-memory fallback if not provided)
```
REDIS_URL=redis://default:your_password@your-redis-host:port
```

### 4. Encryption Key (REQUIRED for WooCommerce features)
```
ENCRYPTION_KEY=your-32-byte-encryption-key-here
```

## How to Add Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project: `omniops` 
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable with the following settings:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Your actual value
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save** for each variable

## Verifying Your Setup

After adding all environment variables:

1. **Trigger a new deployment** by pushing a commit or clicking "Redeploy" in Vercel
2. Check the deployment logs for any errors
3. Test the following endpoints:
   - Homepage: `https://omniops-at8bjqre7-idlecreatives-projects.vercel.app/`
   - Training page: `https://omniops-at8bjqre7-idlecreatives-projects.vercel.app/admin/training`
   - Chat widget: `https://omniops-at8bjqre7-idlecreatives-projects.vercel.app/embed`

## Getting Your Supabase Keys

If you don't have your Supabase keys:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Generating an Encryption Key

If you need a new encryption key:

```bash
# Generate a secure 32-byte key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### If you see "Service temporarily unavailable" errors:
- Check that all required environment variables are set in Vercel
- Verify the values are correct (no extra spaces or quotes)
- Ensure you've redeployed after adding the variables

### If Redis is not available:
- The app will automatically use in-memory storage as a fallback
- This is fine for development/testing but not recommended for production
- Consider using Vercel KV or Upstash Redis for production

### If avatars are not loading:
- The avatars are now included in the deployment
- Clear your browser cache if you still see 404 errors
- The files are located at `/avatars/01.png`, `/avatars/alice.png`, etc.

## Security Notes

⚠️ **NEVER commit these values to Git**
⚠️ **Keep `SUPABASE_SERVICE_ROLE_KEY` and `ENCRYPTION_KEY` secret**
⚠️ **Use different keys for production vs development**