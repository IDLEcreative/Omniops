/**
 * Customer Config API Security Tests - RLS Policy Verification
 *
 * Tests Row Level Security (RLS) policy enforcement at the database level
 * Verifies:
 * - RLS blocks unauthorized access to configs
 * - RLS allows access to user's organization configs
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { initializeTestData, cleanupTestData, TEST_PASSWORD } from '@/__tests__/utils/customer-config/test-setup';
import { getAuthTokenFor, signOutUser } from '@/__tests__/utils/customer-config/auth-helpers';
import type { TestDataContext } from '@/__tests__/utils/customer-config/test-setup';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('RLS Policy Verification', () => {
  let context: TestDataContext;

  beforeAll(async () => {
    context = await initializeTestData();
  });

  afterAll(async () => {
    await cleanupTestData(context);
  });

  it('should enforce RLS at database level', async () => {
    // Create authenticated client as user1
    const user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await user1Client.auth.signInWithPassword({
      email: context.user1Email,
      password: TEST_PASSWORD
    });

    // Try to query config from org2
    const { data, error } = await user1Client
      .from('customer_configs')
      .select('*')
      .eq('id', context.config2Id)
      .single();

    // RLS should block this
    expect(error).toBeTruthy();
    expect(data).toBeNull();

    await user1Client.auth.signOut();
  });

  it('should allow access to own organization configs via RLS', async () => {
    // Create authenticated client as user1
    const user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await user1Client.auth.signInWithPassword({
      email: context.user1Email,
      password: TEST_PASSWORD
    });

    // Query config from org1
    const { data, error } = await user1Client
      .from('customer_configs')
      .select('*')
      .eq('id', context.config1Id)
      .single();

    // RLS should allow this
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.id).toBe(context.config1Id);

    await user1Client.auth.signOut();
  });
});
