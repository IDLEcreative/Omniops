/**
 * Tests for Shopify Setup Agent initialization
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifySetupAgent, createShopifySetupAgent } from '@/lib/autonomous/agents/shopify-setup-agent';
import { setupMocks } from './setup';

// Mock dependencies
jest.mock('@/lib/autonomous/core/workflow-registry', () => ({
  WorkflowRegistry: { get: jest.fn() }
}));

jest.mock('@/lib/autonomous/security/credential-vault-helpers', () => ({
  getCredential: jest.fn(),
  storeCredential: jest.fn(),
  deleteCredential: jest.fn()
}));

jest.mock('@/lib/autonomous/security/credential-vault', () => ({
  ...jest.requireMock('@/lib/autonomous/security/credential-vault-helpers'),
  CredentialVault: jest.fn(),
  getCredentialVault: jest.fn()
}));

jest.mock('@/lib/supabase/server', () => {
  const mockClient = {
    from: jest.fn(() => ({
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      eq: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.png' } }))
      }))
    }
  };

  return {
    createServerClient: jest.fn(() => mockClient),
    createServiceRoleClientSync: jest.fn(() => mockClient),
    createClient: jest.fn(() => mockClient),
    createServiceRoleClient: jest.fn(() => mockClient),
    requireClient: jest.fn(() => mockClient),
    requireServiceRoleClient: jest.fn(() => mockClient),
    validateSupabaseEnv: jest.fn(() => true)
  };
});

describe('ShopifySetupAgent - Initialization', () => {
  let agent: ShopifySetupAgent;
  const mockStoreUrl = 'https://teststore.myshopify.com';

  beforeEach(() => {
    setupMocks();
    agent = new ShopifySetupAgent(mockStoreUrl);
  });

  describe('constructor', () => {
    it('should create agent with normalized store URL', () => {
      expect(agent).toBeInstanceOf(ShopifySetupAgent);
    });

    it('should normalize store name to myshopify.com URL', () => {
      const agent1 = new ShopifySetupAgent('teststore');
      expect(agent1['storeUrl']).toBe('https://teststore.myshopify.com');
    });

    it('should normalize URL with protocol', () => {
      const agent2 = new ShopifySetupAgent('http://teststore.myshopify.com');
      expect(agent2['storeUrl']).toBe('https://teststore.myshopify.com');
    });

    it('should normalize URL with trailing slash', () => {
      const agent3 = new ShopifySetupAgent('https://teststore.myshopify.com/');
      expect(agent3['storeUrl']).toBe('https://teststore.myshopify.com');
    });

    it('should handle custom domains', () => {
      const agent4 = new ShopifySetupAgent('https://shop.example.com');
      expect(agent4['storeUrl']).toBe('https://shop.example.com');
    });
  });

  describe('factory function', () => {
    it('should create ShopifySetupAgent via factory', () => {
      const agent = createShopifySetupAgent('teststore');

      expect(agent).toBeInstanceOf(ShopifySetupAgent);
      expect(agent['storeUrl']).toBe('https://teststore.myshopify.com');
    });

    it('should accept various store URL formats', () => {
      const agent1 = createShopifySetupAgent('mystore');
      const agent2 = createShopifySetupAgent('https://mystore.myshopify.com');
      const agent3 = createShopifySetupAgent('shop.example.com');

      expect(agent1['storeUrl']).toBe('https://mystore.myshopify.com');
      expect(agent2['storeUrl']).toBe('https://mystore.myshopify.com');
      expect(agent3['storeUrl']).toBe('https://shop.example.com');
    });
  });
});
