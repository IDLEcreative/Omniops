**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Stripe Integration Scripts

This directory contains automation scripts for managing the Stripe billing integration.

---

## Scripts Overview

### 🏗️ `create-products.sh`
Creates Stripe products and prices for Omniops subscription plans.

**Usage**:
```bash
./scripts/stripe/create-products.sh
```

**Prerequisites**:
- Stripe CLI installed: `brew install stripe/stripe-cli/stripe`
- Authenticated: `stripe login`

**Creates**:
- Starter product + £29/month price
- Professional product + £99/month price
- Enterprise product (no price - custom)

**Output**:
Price IDs to add to `.env.local`

---

### 🔗 `setup-webhook.sh`
Sets up webhook forwarding for local development.

**Usage**:
```bash
./scripts/stripe/setup-webhook.sh
```

**Prerequisites**:
- Stripe CLI installed and authenticated
- Development server running on port 3000

**What it does**:
- Starts webhook forwarding to `localhost:3000/api/stripe/webhook`
- Displays webhook signing secret for `.env.local`
- Must stay running while developing

**Keep this terminal open** - webhooks only work while this script is running.

---

### 🧪 `test-integration.sh`
Tests the Stripe integration with automated checks.

**Usage**:
```bash
./scripts/stripe/test-integration.sh
```

**Prerequisites**:
- All environment variables set in `.env.local`
- Development server running
- Stripe products created

**Tests**:
- Environment variable presence
- Development server availability
- API endpoint responses
- Billing page accessibility
- Stripe product verification

**Output**:
Pass/fail status for each check + recommendations

---

## Quick Start Guide

### First Time Setup

1. **Install Stripe CLI**:
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   ```

2. **Create Products**:
   ```bash
   chmod +x scripts/stripe/*.sh
   ./scripts/stripe/create-products.sh
   ```
   Copy the price IDs to `.env.local`

3. **Start Webhook Forwarding**:
   ```bash
   ./scripts/stripe/setup-webhook.sh
   ```
   Copy the webhook secret to `.env.local`

4. **Test Integration**:
   ```bash
   npm run dev  # In another terminal
   ./scripts/stripe/test-integration.sh
   ```

---

## Development Workflow

### Daily Development

1. Start dev server: `npm run dev`
2. Start webhook forwarding: `./scripts/stripe/setup-webhook.sh`
3. Develop and test billing features
4. Monitor webhook events in terminal

### Testing Changes

1. Make code changes
2. Restart dev server if needed
3. Run integration tests: `./scripts/stripe/test-integration.sh`
4. Test manually in browser

---

## Environment Variables Required

All scripts expect these in `.env.local`:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook Secret (from setup-webhook.sh)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from create-products.sh)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Troubleshooting

### "Stripe CLI not found"
```bash
brew install stripe/stripe-cli/stripe
```

### "Not authenticated with Stripe"
```bash
stripe login
```

### "Development server not running"
```bash
npm run dev
```

### "Webhook events not received"
1. Verify `setup-webhook.sh` is running
2. Check webhook secret in `.env.local`
3. Restart dev server
4. Test manually: `stripe trigger customer.subscription.created`

### "Products already exist"
Scripts will skip existing products. Safe to re-run.

---

## Production Use

⚠️ **DO NOT** use these scripts for production setup.

For production:
1. Use Stripe Dashboard to create products manually
2. Configure webhooks in Stripe Dashboard → Developers → Webhooks
3. Use live API keys (not test keys)
4. See `DEPLOYMENT_CHECKLIST.md` for complete production setup

---

## Script Maintenance

### Updating Scripts

When making changes:
1. Test in development environment
2. Update this README if behavior changes
3. Update related documentation in `/tmp/claude/`
4. Verify scripts remain POSIX-compliant (for portability)

### Adding New Scripts

Follow this naming convention:
- `action-noun.sh` (e.g., `test-integration.sh`)
- Include help text with `--help` flag
- Add color-coded output (GREEN=success, RED=error, YELLOW=warning)
- Update this README

---

## Related Documentation

- **Complete Integration Guide**: `/tmp/claude/STRIPE_COMPLETE_GUIDE.md`
- **Test Plan**: `/tmp/claude/STRIPE_INTEGRATION_TEST_PLAN.md`
- **Deployment Checklist**: `scripts/stripe/DEPLOYMENT_CHECKLIST.md`
- **Main Documentation**: `docs/STRIPE_INTEGRATION.md`

---

## Support

If scripts fail or behave unexpectedly:
1. Check prerequisites are met
2. Review error messages carefully
3. Verify environment variables are set
4. Check Stripe CLI is up to date: `brew upgrade stripe/stripe-cli/stripe`
5. Refer to Stripe CLI docs: https://stripe.com/docs/stripe-cli

---

**Last Updated**: October 2025
**Version**: 1.0.0
