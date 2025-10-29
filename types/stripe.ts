export interface SubscriptionDetails {
  subscriptionId: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  planType: 'starter' | 'professional' | 'enterprise';
}

export interface BillingEvent {
  id: string;
  organizationId: string;
  stripeEventId: string;
  eventType: string;
  eventData: Record<string, any>;
  processedAt: Date;
}

export interface Invoice {
  id: string;
  organizationId: string;
  stripeInvoiceId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  periodStart?: Date;
  periodEnd?: Date;
}
