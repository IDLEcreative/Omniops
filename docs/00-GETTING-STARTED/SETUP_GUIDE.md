# 🚀 Quick Setup Guide

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 9 minutes

## Purpose
git clone [your-repo-url] cd customer-service-agent npm install

## Quick Links
- [Step 1: Clone and Install](#step-1-clone-and-install)
- [Step 2: Set Up Supabase (5 minutes)](#step-2-set-up-supabase-5-minutes)
- [Step 3: Get API Keys (5 minutes)](#step-3-get-api-keys-5-minutes)
- [Step 4: Configure Environment](#step-4-configure-environment)
- [Step 5: Run Locally](#step-5-run-locally)

## Keywords
clone, configure, cost, customer, deploy, endpoints, environment, estimates, everything, first

---


## Step 1: Clone and Install

```bash
git clone [your-repo-url]
cd customer-service-agent
npm install
```

## Step 2: Set Up Supabase (5 minutes)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up (free tier works!)
   - Create a new project
   - Choose a strong database password
   - Select region closest to your users

2. **Get Your Supabase Keys**
   - Go to **Settings → API**
   - You'll see:
     ```
     Project URL: https://abcdefghijklmnop.supabase.co
     anon public: eyJhbGc...
     service_role: eyJhbGc... (keep secret!)
     ```

3. **Set Up Database**
   - Go to **SQL Editor**
   - Click "New query"
   - Copy & paste contents of `supabase-schema.sql`
   - Click "Run"
   - Create another query
   - Copy & paste contents of `supabase-schema-update.sql`
   - Click "Run"

## Step 3: Get API Keys (5 minutes)

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up/login
3. Add payment method (required)
4. Go to **API keys**
5. Click **"+ Create new secret key"**
6. Name it (e.g., "Chat Widget")
7. Copy the key `sk-proj-...` (save it, you can't see it again!)

### Firecrawl API Key
1. Go to [firecrawl.dev](https://www.firecrawl.dev)
2. Sign up (free plan available)
3. Go to **Dashboard → API Keys**
4. Click **"Create API Key"**
5. Copy the key `fc-...`

## Step 4: Configure Environment

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your keys:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_key

   # OpenAI
   OPENAI_API_KEY=sk-proj-...your_openai_key

   # Firecrawl
   FIRECRAWL_API_KEY=fc-...your_firecrawl_key
   ```

## Step 5: Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 6: Test Everything

1. **Test Chat**: Go to [localhost:3000/chat](http://localhost:3000/chat)
2. **Test Admin**: Go to [localhost:3000/admin](http://localhost:3000/admin)
3. **Test Widget**: Go to [localhost:3000/embed](http://localhost:3000/embed)

## Step 7: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repo
   - Add environment variables (same as .env.local)
   - Click "Deploy"

3. **Update your `.env.local`**
   ```env
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

## Step 8: First Customer Setup

1. Direct them to: `https://your-app.vercel.app/setup`
2. They'll need to:
   - Enter their domain
   - Add WooCommerce keys (optional)
   - Scrape their website
   - Get embed code

## 🎉 You're Live!

### Embed Code for Customers
```html
<script>
window.ChatWidgetConfig = {
  // Optional configuration
};
</script>
<script src="https://your-app.vercel.app/embed.js" async></script>
```

## 📞 Need Help?

- **Supabase Issues**: Check SQL ran successfully
- **Widget Not Showing**: Check browser console for CORS errors
- **Chat Not Working**: Verify OpenAI key has credits
- **Scraping Failed**: Check Firecrawl key is valid

## 🔍 Useful Endpoints

- Health Check: `/api/health`
- Debug Info: `/api/debug/[domain]`
- Admin Panel: `/admin`
- Setup Wizard: `/setup`

## 💰 Cost Estimates

With moderate usage (1000 messages/day):
- **OpenAI**: ~$1-3/day (GPT-4)
- **Firecrawl**: ~$0.10/website scraped
- **Supabase**: Free tier covers most use cases
- **Vercel**: Free tier is usually sufficient

## 🚨 Important Notes

1. **Add Authentication** before public launch
2. **Monitor Usage** to prevent abuse
3. **Set Up Billing Alerts** on OpenAI
4. **Regular Backups** of Supabase data
5. **Rate Limiting** is set to 100 msg/min per domain
