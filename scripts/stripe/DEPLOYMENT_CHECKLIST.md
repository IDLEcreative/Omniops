# Stripe Integration Deployment Checklist

This checklist guides you through deploying the Stripe billing integration from development to production.

---

## Phase 1: Development Setup ✅

### 1.1 Dependencies
- [x] Install Stripe SDK: `npm install` (COMPLETED)
- [x] Verify `stripe@^14.0.0` in package.json

### 1.2 Environment Variables
- [ ] Add test Stripe keys to `.env.local`:
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...` (from webhook setup)
  - `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...`
  - `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...`
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### 1.3 Database Migrations
- [x] Applied migration: `add_stripe_billing_to_organizations` (COMPLETED)
- [x] Applied migration: `create_billing_events_table` (COMPLETED)
- [x] Applied migration: `create_invoices_table` (COMPLETED)
- [ ] Verify columns exist in production database:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name LIKE '%stripe%';
  ```

### 1.4 Stripe Product Setup
- [ ] Run: `./scripts/stripe/create-products.sh`
- [ ] Copy price IDs to `.env.local`
- [ ] Verify products in Stripe Dashboard

### 1.5 Local Webhook Setup
- [ ] Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
- [ ] Authenticate: `stripe login`
- [ ] Start forwarding: `./scripts/stripe/setup-webhook.sh`
- [ ] Copy webhook secret to `.env.local`
- [ ] Restart dev server

---

## Phase 2: Local Testing 🧪

### 2.1 Basic Functionality
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to http://localhost:3000/billing
- [ ] Verify page loads without errors
- [ ] Check browser console for errors

### 2.2 Subscription Flow
- [ ] Click "Select Plan" on Starter
- [ ] Verify redirect to Stripe Checkout
- [ ] Complete payment with test card: `4242 4242 4242 4242`
- [ ] Verify redirect back to `/billing?success=true`
- [ ] Verify subscription appears with "Active" status
- [ ] Verify `checkout.session.completed` webhook received in CLI

### 2.3 Subscription Management
- [ ] Click "Manage Subscription" button
- [ ] Verify redirect to Stripe Customer Portal
- [ ] Update payment method
- [ ] Verify no errors

### 2.4 Cancellation Flow
- [ ] Click "Cancel" button
- [ ] Confirm cancellation
- [ ] Verify warning banner shows cancellation date
- [ ] Verify `cancel_at_period_end` set to true

### 2.5 Invoice History
- [ ] Trigger test invoice: `stripe trigger invoice.paid`
- [ ] Verify invoice appears in InvoiceHistory component
- [ ] Click "Download PDF" link
- [ ] Verify PDF downloads correctly

### 2.6 Multi-Organization
- [ ] Create second organization
- [ ] Navigate to `/billing`
- [ ] Verify organization dropdown appears
- [ ] Switch between organizations
- [ ] Verify correct data displays

### 2.7 Role-Based Access Control
- [ ] Add test user as "member" (not admin)
- [ ] Log in as that user
- [ ] Navigate to `/billing`
- [ ] Verify buttons are disabled
- [ ] Verify permission warning displays

### 2.8 Error Handling
- [ ] Use declined card: `4000 0000 0000 9995`
- [ ] Verify payment fails gracefully
- [ ] Check webhook logs for `invoice.payment_failed`

### 2.9 Automated Tests
- [ ] Run: `./scripts/stripe/test-integration.sh`
- [ ] Verify all checks pass

---

## Phase 3: Staging Deployment 🚀

### 3.1 Environment Setup
- [ ] Create staging environment in hosting provider
- [ ] Copy production database to staging
- [ ] Set up staging subdomain (e.g., staging.yourdomain.com)

### 3.2 Environment Variables (Staging)
- [ ] Add Stripe TEST keys to staging environment:
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
  - `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...`
  - `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...`
  - `NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com`

### 3.3 Staging Webhook Setup
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://staging.yourdomain.com/api/stripe/webhook`
- [ ] Select events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- [ ] Copy signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to staging environment
- [ ] Redeploy staging

### 3.4 Staging Tests
- [ ] Test complete checkout flow
- [ ] Test webhook delivery (check Stripe Dashboard → Webhooks → Recent Events)
- [ ] Test subscription management
- [ ] Test cancellation flow
- [ ] Verify all data persists correctly
- [ ] Load test: 10 concurrent checkouts
- [ ] Verify no memory leaks (monitor for 24 hours)

---

## Phase 4: Production Deployment 🎯

### 4.1 Stripe Live Mode Setup
**⚠️ IMPORTANT: Switch to LIVE mode in Stripe Dashboard**

- [ ] Re-create products in LIVE mode:
  ```bash
  # Switch to live mode in Stripe CLI
  stripe products create --name="Omniops Starter" --description="..." --api-key=sk_live_...
  stripe prices create --product=prod_XXX --unit-amount=2900 --currency=gbp --recurring[interval]=month --api-key=sk_live_...
  ```
- [ ] Get live API keys from Stripe Dashboard
- [ ] Get live price IDs

### 4.2 Production Environment Variables
- [ ] Add LIVE Stripe keys to production:
  - `STRIPE_SECRET_KEY=sk_live_...` ⚠️ LIVE KEY
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` ⚠️ LIVE KEY
  - `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...` (live)
  - `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...` (live)
  - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

### 4.3 Production Webhook Setup
- [ ] Go to Stripe Dashboard → Developers → Webhooks (LIVE MODE)
- [ ] Add endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select same events as staging
- [ ] Copy LIVE signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to production environment
- [ ] Redeploy production

### 4.4 Production Database
- [ ] Verify all 3 migrations applied:
  ```bash
  # Check via Supabase Dashboard or CLI
  npx supabase migration list
  ```
- [ ] Verify RLS policies active on `billing_events` and `invoices`
- [ ] Test database backup/restore

### 4.5 Pre-Launch Checklist
- [ ] Test checkout with REAL card (refund immediately)
- [ ] Verify webhook delivery in production
- [ ] Verify subscription activates correctly
- [ ] Test invoice generation
- [ ] Verify email notifications (if implemented)
- [ ] Test customer portal access
- [ ] Verify cancellation works
- [ ] Test all API endpoints return expected responses

### 4.6 Monitoring Setup
- [ ] Set up Stripe webhook monitoring alerts
- [ ] Set up error tracking (Sentry, etc.) for billing routes
- [ ] Monitor webhook success rate (should be >99%)
- [ ] Set up billing anomaly alerts (unusual subscription patterns)
- [ ] Monitor database for failed transactions

### 4.7 Launch 🎉
- [ ] Deploy to production
- [ ] Announce billing feature to users
- [ ] Monitor for first 24 hours
- [ ] Verify first real subscription processes correctly

---

## Phase 5: Post-Deployment 📊

### 5.1 Week 1 Monitoring
- [ ] Check webhook success rate daily (Stripe Dashboard)
- [ ] Monitor error logs for billing-related issues
- [ ] Verify all subscriptions are syncing correctly
- [ ] Check for any database anomalies
- [ ] Review customer feedback

### 5.2 Week 2 Optimization
- [ ] Analyze checkout conversion rate
- [ ] Review webhook processing times (should be <500ms)
- [ ] Optimize slow database queries (if any)
- [ ] Review and fix any edge cases found

### 5.3 Ongoing Maintenance
- [ ] Weekly: Review failed webhook events
- [ ] Monthly: Audit subscription data integrity
- [ ] Quarterly: Review and update pricing
- [ ] As needed: Handle refund requests
- [ ] As needed: Respond to payment disputes

---

## Emergency Procedures 🚨

### Webhook Issues
If webhooks stop working:
1. Check Stripe Dashboard → Webhooks → Recent Events
2. Verify signing secret matches environment variable
3. Check server logs for errors in `/api/stripe/webhook`
4. Test webhook manually: `stripe trigger customer.subscription.created`
5. If needed, re-create webhook endpoint

### Subscription Sync Issues
If subscriptions are out of sync:
1. Check `billing_events` table for duplicate processing
2. Manually fetch subscription from Stripe:
   ```bash
   stripe subscriptions retrieve sub_XXX
   ```
3. Update database manually if needed
4. Investigate webhook failure cause

### Payment Failures
If multiple payments are failing:
1. Check Stripe Dashboard → Payments → Failed
2. Review common decline reasons
3. Send email notifications to affected users
4. Verify card information is up to date

### Database Issues
If billing tables have issues:
1. Check Supabase Dashboard → Table Editor
2. Verify RLS policies are active
3. Check foreign key constraints
4. Review migration history
5. Restore from backup if needed

---

## Rollback Plan 🔄

If critical issues arise:

1. **Immediate**: Disable billing page
   - Rename `/app/billing/page.tsx` to `page.tsx.disabled`
   - Deploy immediately

2. **Short-term**: Pause new subscriptions
   - Archive Stripe products (makes them unavailable)
   - Existing subscriptions continue normally

3. **Emergency**: Revert all changes
   ```bash
   git revert <commit-hash>
   git push
   # Redeploy
   ```

4. **Database**: Keep billing tables
   - DO NOT drop tables (data loss!)
   - Existing subscriptions can still be managed via Stripe Dashboard

---

## Support & Documentation 📚

### Resources
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Docs**: https://stripe.com/docs
- **Integration Documentation**: `/tmp/claude/STRIPE_COMPLETE_GUIDE.md`
- **Test Plan**: `/tmp/claude/STRIPE_INTEGRATION_TEST_PLAN.md`

### Contact Points
- Stripe Support: https://support.stripe.com
- Webhook issues: Check Recent Events in Dashboard
- Integration questions: Refer to implementation documentation

---

## Success Metrics 📈

Track these KPIs post-launch:

- **Webhook Success Rate**: Target >99%
- **Checkout Conversion**: Target >70% (industry average: 68%)
- **Payment Success Rate**: Target >95%
- **Subscription Churn**: Monitor monthly
- **Customer Portal Usage**: Track self-service rate
- **Support Tickets**: Monitor billing-related issues

---

## Compliance Checklist ✅

- [ ] PCI Compliance: Using Stripe Checkout (Stripe handles PCI)
- [ ] Data Privacy: Customer payment data NOT stored locally
- [ ] GDPR: Webhook events contain minimal PII
- [ ] Audit Trail: `billing_events` table logs all transactions
- [ ] Security: Webhook signatures verified
- [ ] Backups: Database includes billing tables

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Production URL**: _____________
**Stripe Account**: _____________

---

✅ **READY FOR PRODUCTION WHEN ALL CHECKBOXES ARE COMPLETE**
