/**
 * Complete Agent Flow - E2E Integration Tests (Commerce Providers)
 *
 * Tests WooCommerce and Shopify provider integration
 *
 * Priority: CRITICAL (Week 1 - Must Have)
 */

process.env.E2E_TEST = 'true';

if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const path = require('path');
  const dotenv = require('dotenv');

  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });
  }
}

jest.unmock('@supabase/supabase-js');

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceRoleClientSync } from '@/lib/supabase/server';

async function getSupabaseClient() {
  const supabase = createServiceRoleClientSync();
  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }
  return supabase;
}

async function createTestOrganizationAndConfig(
  testName: string,
  extraFields: Record<string, any> = {}
) {
  const supabase = await getSupabaseClient();
  const testDomain = `test-${testName}-${Date.now()}.example.com`;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: `Test Org - ${testName}`,
      slug: `test-org-${testName}-${Date.now()}`
    })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(`Failed to create test organization: ${JSON.stringify(orgError)}`);
  }

  const { data: customerConfig, error: configError } = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      business_name: `${testName} Test`,
      organization_id: org.id,
      ...extraFields
    })
    .select()
    .single();

  return { org, customerConfig, configError, testDomain, supabase };
}

describe('Complete Agent Flow - E2E (Commerce Providers)', () => {
  beforeAll(async () => {
    const supabase = await getSupabaseClient();
    await supabase
      .from('customer_configs')
      .delete()
      .like('domain', 'test-%');
  });

  afterAll(async () => {
    const supabase = await getSupabaseClient();
    await supabase
      .from('customer_configs')
      .delete()
      .like('domain', 'test-%');
  });

  describe('Commerce Provider Integration', () => {
    it('should route to WooCommerce when enabled', async () => {
      const { org, customerConfig, configError, testDomain, supabase } = await createTestOrganizationAndConfig('woocommerce', {
        woocommerce_url: 'https://test-woo-store.com',
        woocommerce_consumer_key: 'ck_test_key_12345',
        woocommerce_consumer_secret: 'cs_test_secret_67890'
      });

      expect(configError).toBeNull();
      expect(customerConfig).toBeTruthy();
      expect(customerConfig!.woocommerce_url).toBe('https://test-woo-store.com');

      try {
        const { getCommerceProvider } = await import('@/lib/agents/commerce-provider');
        const { clearCommerceProviderCache } = await import('@/lib/agents/commerce-provider');
        clearCommerceProviderCache();

        const provider = await getCommerceProvider(testDomain);

        expect(provider).toBeTruthy();
        expect(provider?.platform).toBe('woocommerce');

        console.log('[Test] WooCommerce provider routing verified:', {
          platform: provider?.platform,
          domain: testDomain,
          hasProvider: !!provider
        });

      } finally {
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 30000);

    it('should route to Shopify when enabled', async () => {
      const { org, customerConfig, configError, testDomain, supabase } = await createTestOrganizationAndConfig('shopify', {
        shopify_shop: 'test-shop.myshopify.com',
        shopify_access_token: 'shpat_test_token_12345'
      });

      expect(configError).toBeNull();
      expect(customerConfig).toBeTruthy();
      expect(customerConfig!.shopify_shop).toBe('test-shop.myshopify.com');

      try {
        const { getCommerceProvider } = await import('@/lib/agents/commerce-provider');
        const { clearCommerceProviderCache } = await import('@/lib/agents/commerce-provider');
        clearCommerceProviderCache();

        const provider = await getCommerceProvider(testDomain);

        expect(provider).toBeTruthy();
        expect(provider?.platform).toBe('shopify');

        console.log('[Test] Shopify provider routing verified:', {
          platform: provider?.platform,
          domain: testDomain,
          hasProvider: !!provider
        });

      } finally {
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 30000);
  });
});
