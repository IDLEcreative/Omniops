**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Billing Directory

**Purpose:** Billing and subscription management components
**Last Updated:** 2025-10-30
**Related:** [Dashboard Billing](/app/billing), [Stripe Integration](/lib/integrations)

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
