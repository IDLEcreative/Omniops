/**
 * Test Data Creation for Funnel System E2E Tests
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { recordChatStage } from '../../../lib/analytics/funnel-analytics';

export interface TestCustomer {
  email: string;
  conversationId: string;
  sessionId: string;
  scenario: string;
}

export async function createTestCustomers(
  supabase: SupabaseClient,
  testDomain: string
): Promise<TestCustomer[]> {
  const customers: TestCustomer[] = [
    // Scenario 1: Chat only (drop-off at chat stage)
    { email: 'chat-only@test.local', conversationId: '', sessionId: 'session-1', scenario: 'Chat Only' },
    { email: 'chat-only-2@test.local', conversationId: '', sessionId: 'session-2', scenario: 'Chat Only' },

    // Scenario 2: Chat + Cart (drop-off at cart stage)
    { email: 'cart-abandoned@test.local', conversationId: '', sessionId: 'session-3', scenario: 'Cart Abandoned' },
    { email: 'cart-abandoned-high@test.local', conversationId: '', sessionId: 'session-4', scenario: 'High-Value Cart Abandoned' },

    // Scenario 3: Complete journey (chat → cart → purchase)
    { email: 'complete-journey@test.local', conversationId: '', sessionId: 'session-5', scenario: 'Complete Purchase' },
    { email: 'complete-journey-2@test.local', conversationId: '', sessionId: 'session-6', scenario: 'Complete Purchase' },
    { email: 'complete-journey-3@test.local', conversationId: '', sessionId: 'session-7', scenario: 'Complete Purchase' },
  ];

  // Get or create test domain
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', testDomain)
    .single();

  let domainId = domain?.id;

  if (!domainId) {
    const { data: newDomain } = await supabase
      .from('domains')
      .insert({ domain: testDomain })
      .select('id')
      .single();
    domainId = newDomain?.id;
  }

  // Create customer sessions
  for (const customer of customers) {
    await supabase
      .from('customer_sessions')
      .insert({
        session_id: customer.sessionId,
        customer_email: customer.email,
        domain: testDomain,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      });
  }

  // Create conversations
  for (const customer of customers) {
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        session_id: customer.sessionId,
        domain_id: domainId,
        metadata: { test: true, scenario: customer.scenario },
      })
      .select('id')
      .single();

    customer.conversationId = conversation?.id || '';

    // Record chat stage in funnel
    await recordChatStage(customer.conversationId, customer.email, testDomain);
  }

  return customers;
}
