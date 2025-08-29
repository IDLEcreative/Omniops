# Production Deployment Guide

## How the Chat Agent Works in Different Environments

### Demo/Testing Environments (Automatic Configuration)

The system automatically detects demo environments and maps them to `thompsonseparts.co.uk` for testing. This happens when the domain matches:

- `localhost` - Local development
- `*.vercel.app` - Vercel preview deployments
- `*.vercel.sh` - Older Vercel domains
- Any domain containing `preview`
- `127.0.0.1` - Local IP
- `*.ngrok.io` or similar - Tunnel services

**In demo mode, the chat agent will:**
1. Use thompsonseparts.co.uk's scraped content for RAG/embeddings
2. Use thompsonseparts.co.uk's WooCommerce API for real-time stock
3. Return actual product data including:
   - Product names and descriptions
   - Real-time stock levels
   - Prices and SKUs

### Production Deployment (Custom Domains)

When deploying to a real customer domain (e.g., `customerclient.com`), you need:

#### 1. Database Configuration

Add a record to the `customer_configs` table with:
```sql
- domain: 'customerclient.com' (without www)
- woocommerce_url: 'https://customerclient.com'
- woocommerce_consumer_key: [encrypted key]
- woocommerce_consumer_secret: [encrypted secret]
```

#### 2. Content Scraping

Run the web scraper for the customer's domain to populate:
- `scraped_pages` - Raw HTML content
- `page_embeddings` - Vector embeddings for semantic search
- `domains` table - Domain registration

#### 3. WooCommerce Integration

The customer needs to:
1. Install WooCommerce on their WordPress site
2. Generate API credentials (WooCommerce > Settings > Advanced > REST API)
3. Provide consumer key and secret for configuration

### How Product Search Works

The chat agent uses a multi-step approach to find products:

1. **Extract Search Terms**
   - Removes stock-related words ("is", "in stock", "available", etc.)
   - Identifies potential SKUs (e.g., "PK-EK 291", "2EVRA48")
   - Preserves quoted text as high-priority search terms

2. **WooCommerce API Search Strategy**
   ```
   Try in order:
   1. Exact SKU match
   2. SKU variations (spaces → dashes)
   3. General search API (searches name, description, SKU)
   4. Fallback to out-of-stock items if nothing found
   ```

3. **Response Generation**
   - Combines RAG results (website content) with WooCommerce data
   - Prioritizes real-time stock info over scraped content
   - Includes product details: name, SKU, price, stock status

### Testing After Deployment

#### On Vercel Preview (Automatic Demo Mode)
```bash
# Your preview URL will automatically use thompsonseparts.co.uk data
https://your-app-xyz.vercel.app

# Test queries:
"Is PK-EK 291 in stock?"
"Do you have 140ltr Steel Side Oil Tank Full Kit?"
"Check availability of [any product]"
```

#### On Production Domain
```bash
# Ensure customer_configs has the domain configured
# Ensure content has been scraped
# Test with actual customer products

# The system will use the real domain's data:
- customer_configs.domain = 'actualclient.com'
- WooCommerce API calls to actualclient.com
- Embeddings filtered by actualclient.com domain
```

### Troubleshooting

#### Product Not Found
1. Check if product exists in WooCommerce
2. Verify SKU format matches exactly
3. Check logs for search attempts:
   ```
   Extracted search terms: { quoted: [], skus: ['...'], cleaned: '...' }
   Trying SKU variation: ...
   Trying general search for: ...
   ```

#### No Stock Information
1. Verify WooCommerce credentials are configured
2. Check if domain is in demo mode (logs will show)
3. Ensure WooCommerce API is accessible

#### Wrong Domain Mapping
Check logs for:
```
Real-time stock check: domain [mapped] (original: [input], isDemo: true/false)
```

### Important Files

- `/app/api/chat/route.ts` - Main chat endpoint with product search logic
- `/lib/woocommerce-dynamic.ts` - Dynamic WooCommerce client
- `/lib/embeddings.ts` - RAG/semantic search implementation

### Recent Improvements (2025-08-29)

1. **Better SKU Extraction**: Regex pattern now handles:
   - Alphanumeric codes with spaces: "PK-EK 291"
   - Continuous codes: "2EVRA48"
   - Dashed variants: "PK-EK-291"

2. **Smart Search Fallback**: System tries multiple search strategies
   - Exact SKU → SKU variations → General search

3. **Demo Environment Mapping**: Both embeddings and WooCommerce now properly map demo domains to thompsonseparts.co.uk

### Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# OpenAI
OPENAI_API_KEY=[your-openai-key]

# Redis (for background jobs)
REDIS_URL=redis://localhost:6379
```

### Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migrations run
- [ ] Customer domain added to customer_configs
- [ ] WooCommerce credentials encrypted and stored
- [ ] Content scraped for customer domain
- [ ] Test product search with real SKUs
- [ ] Verify stock information displays correctly
- [ ] Test on preview URL first (auto-demo mode)
- [ ] Test on production domain