**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Billing Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Dashboard Billing](/home/user/Omniops/app/billing), [Stripe Integration](/home/user/Omniops/lib/integrations), [UI Components](/home/user/Omniops/components/ui/README.md)
**Estimated Read Time:** 2 minutes

## Purpose

Billing and subscription management components for handling subscriptions, invoices, payment methods, and plan upgrades/downgrades with Stripe integration.

## Quick Links

- [Main Components Directory](/home/user/Omniops/components/README.md)
- [Pricing Components](/home/user/Omniops/components/pricing/README.md)
- [Dashboard Components](/home/user/Omniops/components/dashboard/README.md)

---

## Keywords

billing, subscriptions, stripe, invoices, payment methods, plan upgrades

## Overview

Components for managing subscriptions, invoices, and billing information.

## Files

- **[BillingDashboard.tsx](BillingDashboard.tsx)** - Main billing dashboard view
- **[PlanSelector.tsx](PlanSelector.tsx)** - Subscription plan selection interface
- **[SubscriptionCard.tsx](SubscriptionCard.tsx)** - Current subscription display
- **[InvoiceHistory.tsx](InvoiceHistory.tsx)** - Past invoices and payment history

## Usage

```typescript
import { BillingDashboard } from '@/components/billing/BillingDashboard';

<BillingDashboard userId={user.id} />
```

## Features

- Stripe integration
- Plan upgrades/downgrades
- Invoice management
- Payment method updates
