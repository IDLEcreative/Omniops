# Quick Reference Guide

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 8 minutes

## Purpose
npm run dev # Start dev server npm test # Run tests npm run test:watch # Watch mode

## Quick Links
- [🚀 Quick Commands](#-quick-commands)
- [🔧 Environment Variables](#-environment-variables)
- [📁 Key Files & Locations](#-key-files--locations)
- [🔌 API Endpoints](#-api-endpoints)
- [🗄️ Database Tables](#-database-tables)

## Keywords
checklist, commands, common, database, deployment, embedding, endpoints, environment, files, issues

---


## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run build           # Build for production
npm run lint            # Run linter

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed data
npm run db:reset        # Reset database
```

## 🔧 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
FIRECRAWL_API_KEY=
ENCRYPTION_KEY=              # 32 characters

# Optional
WOOCOMMERCE_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
```

## 📁 Key Files & Locations

| File/Directory | Purpose |
|---------------|---------|
| `app/api/chat/route.ts` | Main chat endpoint |
| `lib/supabase/` | Database clients |
| `lib/config.ts` | Widget configuration |
| `types/` | TypeScript definitions |
| `constants/` | App constants |
| `__tests__/` | Test files |

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Send chat message |
| `/api/scrape` | POST | Scrape website |
| `/api/admin/config` | GET/POST | Manage config |
| `/api/woocommerce/products` | GET | Search products |
| `/api/health` | GET | Health check |

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `customer_configs` | Customer settings |
| `scraped_pages` | Indexed content |
| `page_embeddings` | Vector search |
| `conversations` | Chat sessions |
| `messages` | Chat messages |

## 🎨 Widget Embedding

```html
<script>
(function() {
  var s = document.createElement('script');
  s.src = 'https://your-domain.com/embed?domain=' + window.location.hostname;
  s.async = true;
  document.head.appendChild(s);
})();
</script>
```

## 🔒 Security Checklist

- [ ] Set strong `ENCRYPTION_KEY`
- [ ] Enable Supabase RLS
- [ ] Configure CORS
- [ ] Set rate limits
- [ ] Use HTTPS only

## 🐛 Common Issues

### Rate Limiting
```typescript
// Increase limits in constants/index.ts
RATE_LIMITS.default = { requests: 200, window: 60000 }
```

### CORS Errors
```javascript
// Add to next.config.js
headers: [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: '*' },
    ],
  },
]
```

### Database Connection
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

## 📊 Monitoring

| What | Where |
|------|-------|
| Errors | Vercel Functions logs |
| API Usage | OpenAI Dashboard |
| Database | Supabase Dashboard |
| Performance | Vercel Analytics |

## 🚀 Deployment Checklist

1. [ ] Update environment variables
2. [ ] Run database migrations
3. [ ] Test all endpoints
4. [ ] Enable monitoring
5. [ ] Configure domain
6. [ ] Test embedding script

## 📞 Support Resources

- **Docs**: `/docs` directory
- **API Reference**: `docs/03-API/REFERENCE_API_ENDPOINTS.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Deployment**: `docs/DEPLOYMENT.md`

## 💡 Tips

1. **Test locally first**: Use `.env.local`
2. **Check logs**: `vercel logs` or dashboard
3. **Monitor costs**: Track API usage
4. **Regular backups**: Enable in Supabase
5. **Update deps**: `npm update` monthly
