# Quick Start: Owned Domains for Fast Scraping

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- Admin panel configuration
- Scraping system
- Domain detection logic
**Estimated Read Time:** 5 minutes

## Purpose
Quick start guide for configuring owned domains to enable turbo-speed web scraping (20-50x faster) when training customer service bots on your own websites. Covers setup in admin panel, automatic detection, performance expectations, and troubleshooting for high-speed concurrent scraping without rate limits.

## Quick Links
- [What is it?](#what-is-it)
- [Setup (2 minutes)](#setup-2-minutes)
- [What Happens Next?](#what-happens-next)
- [Usage](#usage)
- [Performance Expectations](#performance-expectations)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Security Note](#security-note)

## Keywords
owned domains, fast scraping, turbo mode, web scraping, concurrent browsers, parallel jobs, rate limits, domain detection, training data, performance optimization, scraping configuration, admin panel, domain ownership, high-speed scraping

## Aliases
- "owned domains" (also known as: your domains, whitelisted domains, turbo domains)
- "turbo mode" (also known as: high-speed mode, fast scraping, accelerated scraping)
- "concurrent browsers" (also known as: parallel scrapers, simultaneous crawlers, browser pool)
- "rate limits" (also known as: throttling, request limits, scraping restrictions)

---

## What is it?

When training your customer service bot on your own website, you can now scrape 20-50x faster by telling the system which domains you own.

## Setup (2 minutes)

### 1. Go to Admin Panel
Navigate to **Admin → Owned Domains** tab

### 2. Add Your Domains
Enter your domains one by one:
- `yourcompany.com`
- `docs.yourcompany.com`
- `shop.yourcompany.com`

**Format:** Just the domain, no `https://` or trailing slashes

### 3. Save
Click Save Configuration - that's it!

## What Happens Next?

When you scrape any of your owned domains:
- ✅ **Automatic detection** - no extra settings needed
- ⚡ **20x faster** - up to 100+ pages/second
- 🚀 **No rate limits** - it's your site!
- 🔧 **20 concurrent browsers** per job
- 📈 **Up to 20 parallel jobs** (400 browsers total!)

## Usage

### Training Your Bot

Just use the training page as normal:
1. Go to **Dashboard → Training**
2. Enter your website URL
3. Click "Scrape Full Site"

The system automatically detects it's your domain and uses turbo settings!

### Manual Override

Force high-speed mode for any domain:
```typescript
await crawlWebsite('https://staging.example.com', {
  ownSite: true  // Force turbo mode
});
```

## Performance Expectations

| Site Size | Time (Normal) | Time (Owned) | Speed |
|-----------|---------------|--------------|--------|
| 100 pages | 1-2 minutes | 5-10 seconds | 10x |
| 1,000 pages | 10-20 minutes | 30-60 seconds | 20x |
| 10,000 pages | 2-3 hours | 3-5 minutes | 40x |

## FAQ

**Q: What if I have multiple domains?**
A: Add them all! Include subdomains separately.

**Q: Does this work for staging sites?**
A: Yes! Add your staging domains too.

**Q: What about localhost?**
A: Localhost is automatically detected as owned.

**Q: Can I remove domains later?**
A: Yes, just click Remove next to any domain.

**Q: Is there a limit?**
A: No limit on domains you can add.

## Troubleshooting

**Not going fast?**
1. Check domain is in your owned list
2. Make sure format is correct (no https://)
3. Check your server can handle the load

**Server overloaded?**
- Reduce concurrent browsers in settings
- Use fewer parallel jobs
- Check your hosting limits

## Security Note

- Only YOU can see and edit your domains
- Domains are stored securely with your account
- No sensitive data is exposed

---

💡 **Pro Tip:** Start with a small test (10-20 pages) to ensure your server handles the load well, then scale up!