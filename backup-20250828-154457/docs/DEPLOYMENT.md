# Deployment Guide

This guide covers deploying the Customer Service Agent to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Vercel Deployment](#vercel-deployment)
- [Self-Hosting](#self-hosting)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Accounts Created**:
   - [ ] Supabase account
   - [ ] OpenAI account with API access
   - [ ] Firecrawl account
   - [ ] Vercel account (if using Vercel)

2. **API Keys Ready**:
   - [ ] OpenAI API key
   - [ ] Firecrawl API key
   - [ ] Supabase project URL and keys

3. **Domain Setup**:
   - [ ] Domain name configured
   - [ ] SSL certificate (automatic with Vercel)

## Deployment Options

### Option 1: Vercel (Recommended)

Best for: Quick deployment, automatic scaling, built-in CI/CD

### Option 2: Self-Hosting

Best for: Full control, on-premise requirements, custom infrastructure

## Environment Setup

### 1. Create Production Environment File

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
FIRECRAWL_API_KEY=your-firecrawl-key
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 2. Generate Encryption Key

```bash
# Generate a secure 32-character key
openssl rand -base64 32 | head -c 32
```

### 3. Configure Production URLs

Update `next.config.js` if needed:

```javascript
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
  },
}
```

## Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Note the project URL and keys

### 2. Enable pgvector Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Run Database Migrations

Execute in order:

```sql
-- 1. Create schema
\i supabase-schema.sql

-- 2. Create vector search functions
\i supabase-vector-search.sql

-- 3. Enable Row Level Security
\i supabase-rls-policies.sql
```

### 4. Verify Setup

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Connect to GitHub

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Import Project"
4. Select your GitHub repository

### 3. Configure Environment Variables

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.production`
3. Select "Production" environment

### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Or use GitHub integration for automatic deploys
```

### 5. Configure Domains

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## Self-Hosting

### 1. Build Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Set Up Server

#### Using Node.js

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "customer-service-agent" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t customer-service-agent .
docker run -p 3000:3000 --env-file .env.production customer-service-agent
```

### 3. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Set Up SSL

```bash
# Using Certbot
sudo certbot --nginx -d your-domain.com
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. Test Core Functionality

- [ ] Visit homepage
- [ ] Test embedding script
- [ ] Send test message
- [ ] Check admin panel
- [ ] Verify rate limiting

### 3. Configure Monitoring

#### Vercel Analytics

Automatically included with Vercel deployment.

#### Custom Monitoring

```javascript
// Add to your application
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 4. Set Up Backups

#### Database Backups

In Supabase Dashboard:
1. Go to Settings → Backups
2. Enable automatic backups
3. Configure retention period

#### Manual Backup Script

```bash
#!/bin/bash
# backup.sh
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Monitoring

### 1. Application Monitoring

- **Uptime**: Use services like UptimeRobot or Pingdom
- **Performance**: Vercel Analytics or custom APM
- **Errors**: Sentry or LogRocket

### 2. Database Monitoring

Monitor in Supabase Dashboard:
- Query performance
- Connection count
- Storage usage
- Replication lag

### 3. API Usage Monitoring

Track usage of:
- OpenAI API calls and tokens
- Firecrawl API requests
- Rate limit hits

### 4. Business Metrics

Create dashboard for:
- Active conversations
- Messages per day
- Customer count
- Response times

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Verify environment variables
echo $SUPABASE_URL
```

#### 2. Rate Limiting Issues

```javascript
// Increase limits in production
const limits = {
  default: { requests: 100, window: 60 * 1000 },
  premium: { requests: 500, window: 60 * 1000 },
};
```

#### 3. CORS Errors

```javascript
// Add to next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

#### 4. Memory Issues

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Debug Mode

Enable debug logging:

```javascript
// Set in environment
DEBUG=customer-service:* npm start
```

### Health Checks

Implement health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    await supabase.from('conversations').select('id').limit(1);
    
    // Check external services
    await fetch('https://api.openai.com/v1/models');
    
    return Response.json({ 
      status: 'healthy',
      services: {
        database: 'ok',
        openai: 'ok',
      }
    });
  } catch (error) {
    return Response.json({ 
      status: 'unhealthy',
      error: error.message 
    }, { status: 503 });
  }
}
```

## Security Checklist

Before going live:

- [ ] Enable Supabase RLS policies
- [ ] Set strong encryption key
- [ ] Configure CORS properly
- [ ] Enable HTTPS only
- [ ] Set secure headers
- [ ] Remove debug endpoints
- [ ] Update dependencies
- [ ] Configure firewall rules
- [ ] Set up DDoS protection
- [ ] Enable audit logging

## Scaling Considerations

### Horizontal Scaling

1. **Multiple Instances**: Run multiple Node.js processes
2. **Load Balancer**: Distribute traffic evenly
3. **Session Affinity**: Not required (stateless)

### Database Scaling

1. **Connection Pooling**: Use PgBouncer
2. **Read Replicas**: For heavy read loads
3. **Partitioning**: For large tables

### Caching Strategy

1. **CDN**: Cache static assets
2. **API Cache**: Cache frequent queries
3. **Database Cache**: Use Redis for hot data

## Maintenance

### Regular Tasks

- [ ] Weekly: Check error logs
- [ ] Monthly: Review API usage
- [ ] Quarterly: Update dependencies
- [ ] Yearly: Security audit

### Update Process

```bash
# 1. Test in staging
git checkout staging
npm update
npm test
npm run build

# 2. Deploy to production
git checkout main
git merge staging
vercel --prod
```

## Support

For deployment issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review logs in Vercel/server
3. Contact support@your-domain.com