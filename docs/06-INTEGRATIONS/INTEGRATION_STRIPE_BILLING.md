# Stripe Billing Integration

**Type:** Integration
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0 (Production Ready)
**Dependencies:**
- [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - billing_events and invoices tables
- [Multi-Tenant Architecture](../01-ARCHITECTURE/ARCHITECTURE_MULTI_TENANT.md) - Organization billing isolation
**Estimated Read Time:** 21 minutes

## Purpose
Complete Stripe subscription billing integration providing Starter (£29/month) and Professional (£99/month) plans with webhook-driven subscription management, idempotent event processing, Customer Portal access, invoice history with PDF downloads, and production-ready security features including signature verification and RLS policies.

## Quick Links
- [Architecture](#architecture) - 6 API routes, 5 components, 3 database tables
- [Quick Start](#quick-start) - Setup in 5 steps
- [Testing](#testing) - Automated and manual test scenarios
- [Security Features](#security-features) - Webhook verification, idempotency, RLS
- [Production Deployment](#production-deployment) - Live environment setup
- [Troubleshooting](#troubleshooting) - Common issues and solutions

## Keywords
Stripe, billing, payments, subscriptions, payment processing, invoices, webhooks, idempotency, checkout, customer portal, subscription management, recurring billing, payment methods, 3D Secure, PCI compliance, pricing tiers, SCA

## Aliases
- "Stripe" (also known as: payment processor, payment gateway, billing provider, payment platform)
- "webhook" (also known as: callback, event notification, API event, HTTP callback)
- "idempotency" (also known as: duplicate prevention, request deduplication, idempotent operations)
- "3D Secure" (also known as: 3DS, SCA, Strong Customer Authentication)
- "subscription" (also known as: recurring payment, billing plan, membership plan)

---

## Overview

This integration adds subscription billing capabilities to Omniops using Stripe. Users can:
- Subscribe to Starter (£29/month) or Professional (£99/month) plans
- Manage subscriptions via Stripe Customer Portal
- View invoice history with PDF downloads
- Cancel subscriptions (active until period end)

---

## Architecture

### Components

**Backend** (6 API routes, 489 LOC)
- `/api/stripe/checkout` - Creates checkout sessions
- `/api/stripe/webhook` - Processes Stripe webhooks (idempotent)
- `/api/stripe/portal` - Customer portal access
- `/api/stripe/subscription` - Fetches subscription status
- `/api/stripe/cancel` - Cancels subscriptions
- `/api/stripe/invoices` - Lists invoice history

**Frontend** (5 components, 579 LOC)
- `BillingDashboard` - Main orchestrator
- `SubscriptionCard` - Active subscription display
- `PlanSelector` - Pricing/plan selection
- `InvoiceHistory` - Past invoices table
- Billing page with auth and org selection

**Database** (3 tables)
- `organizations` - Added 7 Stripe columns
- `billing_events` - Webhook audit log (idempotency)
- `invoices` - Invoice history

### Data Flow

```
User → /billing → Select Plan
  ↓
Stripe Checkout → Payment
  ↓
Webhook → /api/stripe/webhook
  ↓
Database Update (organizations, billing_events)
  ↓
User Returns → See Active Subscription
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install  # Already completed
```

### 2. Configure Environment
Add to `.env.local` (already added with placeholders):
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...
```

### 3. Create Stripe Products
```bash
chmod +x scripts/stripe/create-products.sh
./scripts/stripe/create-products.sh
# Copy the price IDs to .env.local
```

### 4. Set Up Webhooks (Local Dev)
```bash
./scripts/stripe/setup-webhook.sh
# Copy the webhook secret to .env.local
# Keep this terminal open while developing
```

### 5. Test the Integration
```bash
npm run dev
# Navigate to http://localhost:3000/billing
# Use test card: 4242 4242 4242 4242
```

---

## Files Created

### Core Implementation
- `lib/stripe-client.ts` - Stripe SDK initialization
- `types/stripe.ts` - TypeScript interfaces
- 6 API routes in `app/api/stripe/`
- 5 React components in `components/billing/`
- `app/billing/page.tsx` - Billing page

### Automation Scripts
- `scripts/stripe/create-products.sh` - Create Stripe products
- `scripts/stripe/setup-webhook.sh` - Webhook forwarding
- `scripts/stripe/test-integration.sh` - Integration tests
- `scripts/stripe/DEPLOYMENT_CHECKLIST.md` - Deployment guide

### Database Migrations
- `add_stripe_billing_to_organizations` - Add Stripe columns
- `create_billing_events_table` - Webhook audit log
- `create_invoices_table` - Invoice history

---

## Testing

### Automated Tests
```bash
./scripts/stripe/test-integration.sh
```

### Manual Test Scenarios

**Test Cards**:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 9995`
- Auth Required: `4000 0025 0000 3155`

**Test Flow**:
1. Subscribe to plan
2. Verify webhook received
3. Check subscription status
4. Manage payment method
5. Cancel subscription
6. Verify cancellation warning

### Webhook Testing
```bash
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

---

## Security Features

✅ **Webhook Signature Verification** - All webhooks validated
✅ **Idempotent Processing** - Duplicates automatically ignored
✅ **Row Level Security (RLS)** - Database isolation per organization
✅ **Role-Based Access Control** - Only owners/admins manage billing
✅ **PCI Compliance** - Stripe Checkout (no card data stored)
✅ **Environment Validation** - Server won't start without required keys

---

## Subscription Plans

### Starter - £29/month
- 1,000 messages/month
- Web scraping
- Basic integrations
- Email support

### Professional - £99/month
- 10,000 messages/month
- Priority support
- Advanced analytics
- WooCommerce & Shopify integrations
- Custom branding

### Enterprise - Custom Pricing
- Unlimited messages
- Dedicated support
- Custom integrations
- SLA guarantees

---

## Webhook Events Handled

- `checkout.session.completed` - Activates subscription
- `customer.subscription.created` - Initial subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellations
- `invoice.paid` - Successful payments
- `invoice.payment_failed` - Failed payments

---

## Database Schema

### organizations table (additions)
- `stripe_customer_id` TEXT - Stripe Customer ID
- `stripe_subscription_id` TEXT - Active subscription
- `subscription_status` TEXT - Status enum
- `current_period_start` TIMESTAMP - Billing period start
- `current_period_end` TIMESTAMP - Billing period end
- `cancel_at_period_end` BOOLEAN - Cancellation flag
- `plan_type` TEXT - Plan name

### billing_events table (new)
- `id` UUID - Primary key
- `organization_id` UUID - Foreign key
- `stripe_event_id` TEXT - Unique Stripe event ID
- `event_type` TEXT - Event type
- `event_data` JSONB - Full webhook payload
- `processed_at` TIMESTAMP - Processing time

### invoices table (new)
- `id` UUID - Primary key
- `organization_id` UUID - Foreign key
- `stripe_invoice_id` TEXT - Stripe invoice ID
- `amount_due` INTEGER - Amount in pence
- `amount_paid` INTEGER - Paid amount
- `currency` TEXT - Currency code
- `status` TEXT - Invoice status
- `invoice_pdf` TEXT - PDF URL
- `hosted_invoice_url` TEXT - Hosted page URL
- `period_start` TIMESTAMP - Billing period
- `period_end` TIMESTAMP - Billing period

---

## Production Deployment

### Prerequisites
1. Stripe account with verified business details
2. Live API keys from Stripe Dashboard
3. Production database with migrations applied
4. Domain with HTTPS enabled

### Steps

1. **Create Live Products**
   ```bash
   ./scripts/stripe/create-products.sh
   # Use live API keys
   ```

2. **Set Production Environment Variables**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (from dashboard)
   NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
   NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Configure Production Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events (see "Webhook Events Handled")
   - Copy signing secret to environment

4. **Deploy**
   ```bash
   npm run build
   # Deploy to your hosting provider
   ```

5. **Test with Real Payment**
   - Make test purchase
   - Immediately refund
   - Verify webhook delivery

6. **Monitor**
   - Watch webhook success rate (>99%)
   - Check error logs
   - Monitor database for anomalies

---

## Troubleshooting

### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint URL is correct
- Ensure HTTPS in production

### "Database error when creating subscription"
- Verify migrations applied
- Check RLS policies active
- Verify foreign key constraints

### "TypeScript compilation errors"
- Run `npm install` to update dependencies
- Verify Stripe SDK version is `^14.0.0`

### "Checkout page doesn't load"
- Check price IDs in `.env.local`
- Verify Stripe keys are test mode
- Check browser console for errors

---

## Monitoring & Alerts

### Key Metrics
- Webhook success rate: Target >99%
- Checkout conversion: Target >70%
- Payment success rate: Target >95%
- Average processing time: <500ms

### Stripe Dashboard
- Monitor webhook deliveries
- Check failed payments
- Review subscription churn
- Track revenue metrics

### Application Monitoring
- Database query performance
- API endpoint response times
- Error rates on billing routes
- Memory usage patterns

---

## Maintenance

### Weekly
- Review failed webhook events
- Check for subscription sync issues
- Monitor error logs

### Monthly
- Audit subscription data integrity
- Review pricing and conversion rates
- Analyze customer feedback

### Quarterly
- Update pricing (if needed)
- Review and optimize queries
- Update Stripe SDK version

---

## Support Resources

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Documentation**: https://stripe.com/docs
- **Webhook Tester**: https://dashboard.stripe.com/test/webhooks
- **Complete Guide**: `/tmp/claude/STRIPE_COMPLETE_GUIDE.md`
- **Test Plan**: `/tmp/claude/STRIPE_INTEGRATION_TEST_PLAN.md`
- **Deployment Checklist**: `scripts/stripe/DEPLOYMENT_CHECKLIST.md`

---

## Emergency Procedures

### Webhook Failure
1. Check Stripe Dashboard → Recent Events
2. Verify signing secret
3. Check server logs
4. Test manually: `stripe trigger ...`
5. Re-create webhook if needed

### Payment Issues
1. Check Stripe Dashboard → Payments
2. Review decline reasons
3. Notify affected users
4. Verify card details updated

### Rollback
1. Disable billing page (rename file)
2. Archive Stripe products
3. Revert code changes
4. Keep database tables (data preservation)

---

## Future Enhancements

- [ ] Usage-based billing for messages
- [ ] Annual subscription discounts
- [ ] Team member seat management
- [ ] Custom Enterprise contracts
- [ ] Automated dunning emails
- [ ] Revenue analytics dashboard
- [ ] Referral program integration
- [ ] Tax calculation (Stripe Tax)

---

**Questions?** Refer to the comprehensive documentation in `/tmp/claude/` or Stripe's official docs.
