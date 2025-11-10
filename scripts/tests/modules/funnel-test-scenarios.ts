/**
 * Test Scenario Execution for Funnel System E2E Tests
 */

import type { TestCustomer } from './funnel-test-data';
import { recordCartStage, recordPurchaseStage } from '../../../lib/analytics/funnel-analytics';
import type { CartPriority } from '../../../types/purchase-attribution';

export async function simulateCartAbandonment(customers: TestCustomer[]): Promise<void> {
  const cartCustomers = customers.filter(c =>
    c.scenario.includes('Cart') || c.scenario.includes('Purchase')
  );

  for (const customer of cartCustomers) {
    const isHighValue = customer.scenario.includes('High-Value');
    const cartValue = isHighValue ? 150.0 : customer.scenario.includes('Purchase') ? 75.0 : 45.0;
    const itemCount = isHighValue ? 3 : 2;
    const priority: CartPriority = cartValue > 100 ? 'high' : cartValue > 50 ? 'medium' : 'low';

    await recordCartStage(
      customer.conversationId,
      customer.email,
      `order-${customer.sessionId}`,
      cartValue,
      itemCount,
      priority
    );

    // Small delay to simulate realistic timing
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export async function simulatePurchases(customers: TestCustomer[]): Promise<void> {
  const purchaseCustomers = customers.filter(c => c.scenario.includes('Purchase'));

  for (const customer of purchaseCustomers) {
    const purchaseValue = 75.0;

    await recordPurchaseStage(
      customer.conversationId,
      customer.email,
      `purchase-${customer.sessionId}`,
      purchaseValue,
      0.95, // High confidence
      'session_match'
    );

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
