/**
 * Shopify Setup Agent Tests
 * Tests for autonomous Shopify API credential generation
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies - must come before imports
jest.mock('@/lib/autonomous/core/workflow-registry', () => ({
  WorkflowRegistry: {
    get: jest.fn()
  }
}));

// Create mock vault instance
const mockVaultInstance = {
  store: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  rotate: jest.fn(),
  listCredentials: jest.fn()
};

// Create mocks as global variables that test can access
const mockGetCredentialFn = jest.fn();
const mockStoreCredentialFn = jest.fn();
const mockDeleteCredentialFn = jest.fn();

// Mock dependencies
jest.mock('@/lib/autonomous/core/workflow-registry', () => ({
  WorkflowRegistry: {
    get: jest.fn()
  }
}));

// Mock the vault helpers first (where getCredential is actually defined)
jest.mock('@/lib/autonomous/security/credential-vault-helpers', () => ({
  getCredential: mockGetCredentialFn,
  storeCredential: mockStoreCredentialFn,
  deleteCredential: mockDeleteCredentialFn
}));

// Mock the vault which re-exports from vault-helpers
jest.mock('@/lib/autonomous/security/credential-vault', () => ({
  ...jest.requireActual('@/lib/autonomous/security/credential-vault-helpers'),
  CredentialVault: jest.fn(),
  getCredentialVault: jest.fn()
}));

// Import after mocking
import { ShopifySetupAgent, createShopifySetupAgent, ShopifySetupResult } from '@/lib/autonomous/agents/shopify-setup-agent';
import { WorkflowRegistry } from '@/lib/autonomous/core/workflow-registry';
import * as credentialVault from '@/lib/autonomous/security/credential-vault';
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

describe('ShopifySetupAgent', () => {
  let agent: ShopifySetupAgent;
  const mockStoreUrl = 'https://teststore.myshopify.com';
  const mockOrganizationId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('getWorkflow', () => {
    beforeEach(() => {
      // Reset the WorkflowRegistry mock
      jest.clearAllMocks();
    });

    it('should retrieve workflow from knowledge base', async () => {
      const mockWorkflow = [
        {
          order: 1,
          intent: 'Navigate to Shopify admin',
          action: 'goto',
          target: `${mockStoreUrl}/admin`,
          expectedResult: 'Login page loads'
        }
      ];

      // Access the mock directly - it should be a jest.fn() from our mock
      (WorkflowRegistry.get as any) = jest.fn().mockReturnValue(mockWorkflow);

      const workflow = await agent.getWorkflow();

      expect(WorkflowRegistry.get).toHaveBeenCalledWith('should-complete-shopify-api-credential-generation');
      expect(workflow).toEqual(mockWorkflow);
    });

    it('should use fallback workflow when knowledge base unavailable', async () => {
      (WorkflowRegistry.get as any) = jest.fn().mockImplementation(() => {
        throw new Error('Workflow not found');
      });

      const workflow = await agent.getWorkflow();

      expect(workflow).toBeDefined();
      expect(Array.isArray(workflow)).toBe(true);
      expect(workflow.length).toBeGreaterThan(0);
      expect(workflow[0]).toHaveProperty('intent');
      expect(workflow[0]).toHaveProperty('action');
    });

    it('should have complete fallback workflow steps', async () => {
      const mockGet = WorkflowRegistry.get as jest.MockedFunction<typeof WorkflowRegistry.get>;
      mockGet.mockImplementation(() => {
        throw new Error('Workflow not found');
      });

      const workflow = await agent.getWorkflow();

      // Verify key steps exist
      const intents = workflow.map(step => step.intent);
      expect(intents).toContain('Navigate to Shopify admin login');
      expect(intents).toContain('Enter admin email');
      expect(intents).toContain('Enter admin password');
      expect(intents).toContain('Click Create an app button');
      expect(intents).toContain('Install app to generate credentials');
    });
  });

  describe('getCredentials', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should retrieve Shopify admin credentials from vault', async () => {
      const mockEmail = { value: 'admin@teststore.com' };
      const mockPassword = { value: 'secure-password' };

      mockGetCredentialFn
        .mockResolvedValueOnce(mockEmail as any)
        .mockResolvedValueOnce(mockPassword as any);

      const credentials = await agent.getCredentials(mockOrganizationId);

      expect(mockGetCredentialFn).toHaveBeenCalledWith(
        mockOrganizationId,
        'shopify',
        'admin_email'
      );
      expect(mockGetCredentialFn).toHaveBeenCalledWith(
        mockOrganizationId,
        'shopify',
        'admin_password'
      );

      expect(credentials).toEqual({
        adminEmail: 'admin@teststore.com',
        adminPassword: 'secure-password',
        storeUrl: mockStoreUrl
      });
    });

    it('should throw error when email credential not found', async () => {
      mockGetCredentialFn
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ value: 'password' } as any);

      await expect(agent.getCredentials(mockOrganizationId)).rejects.toThrow(
        'Shopify admin credentials not found in vault'
      );
    });

    it('should throw error when password credential not found', async () => {
      mockGetCredentialFn
        .mockResolvedValueOnce({ value: 'email@test.com' } as any)
        .mockResolvedValueOnce(null);

      await expect(agent.getCredentials(mockOrganizationId)).rejects.toThrow(
        'Shopify admin credentials not found in vault'
      );
    });

    it('should handle vault errors gracefully', async () => {
      mockGetCredentialFn.mockRejectedValue(
        new Error('Vault connection error')
      );

      await expect(agent.getCredentials(mockOrganizationId)).rejects.toThrow(
        'Vault connection error'
      );
    });
  });

  describe('extractResult', () => {
    let mockPage: any;

    // Helper function to create a mock locator with default behaviors
    const createMockLocator = (overrides: any = {}) => {
      const mockLocator: any = {
        first: jest.fn(),
        inputValue: jest.fn().mockRejectedValue(new Error('Not found')),
        textContent: jest.fn().mockRejectedValue(new Error('Not found')),
        all: jest.fn().mockResolvedValue([]),
        allTextContents: jest.fn().mockResolvedValue([]),
        getAttribute: jest.fn(),
        ...overrides
      };

      // Make first() return the same object for chaining
      mockLocator.first.mockReturnValue(mockLocator);

      return mockLocator;
    };

    beforeEach(() => {
      // Create a flexible mock that returns appropriate methods
      mockPage = {
        locator: jest.fn((selector: string) => createMockLocator())
      };
    });

    it('should extract access token from readonly input', async () => {
      // Override the mock for this specific test
      mockPage.locator.mockImplementation((selector: string) => {
        const mockLocator: any = {
          first: jest.fn(),
          inputValue: jest.fn(),
          textContent: jest.fn(),
          all: jest.fn().mockResolvedValue([]),
          allTextContents: jest.fn().mockResolvedValue([]),
          getAttribute: jest.fn()
        };

        mockLocator.first.mockReturnValue(mockLocator);

        // Match the selector for the readonly input with shpat_ value
        if (selector.includes('shpat_')) {
          mockLocator.inputValue.mockResolvedValue('shpat_1234567890abcdef');
        } else {
          mockLocator.inputValue.mockRejectedValue(new Error('Not found'));
          mockLocator.textContent.mockRejectedValue(new Error('Not found'));
        }

        return mockLocator;
      });

      const result = await agent.extractResult(mockPage);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('shpat_1234567890abcdef');
      expect(result.storeUrl).toBe(mockStoreUrl);
    });

    it('should extract access token from code block', async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('code')) {
          return createMockLocator({
            textContent: jest.fn().mockResolvedValue('Your access token: shpat_abcdef123456')
          });
        }
        return createMockLocator();
      });

      const result = await agent.extractResult(mockPage);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('shpat_abcdef123456');
    });

    it('should extract API key and secret for older apps', async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('32')) {
          return createMockLocator({
            inputValue: jest.fn().mockResolvedValue('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')
          });
        } else if (selector.includes('password')) {
          return createMockLocator({
            inputValue: jest.fn().mockResolvedValue('secret_key_value')
          });
        }
        return createMockLocator();
      });

      const result = await agent.extractResult(mockPage);

      expect(result.success).toBe(true);
      expect(result.apiKey).toBe('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
      expect(result.apiSecret).toBe('secret_key_value');
    });

    it('should extract configured scopes', async () => {
      const mockScopeElements = [
        { getAttribute: jest.fn().mockResolvedValue('read_products') },
        { getAttribute: jest.fn().mockResolvedValue('write_products') },
        { getAttribute: jest.fn().mockResolvedValue('read_orders') }
      ];

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('shpat_')) {
          return createMockLocator({
            inputValue: jest.fn().mockResolvedValue('shpat_token123')
          });
        } else if (selector.includes('checkbox')) {
          return createMockLocator({
            all: jest.fn().mockResolvedValue(mockScopeElements)
          });
        }
        return createMockLocator();
      });

      const result = await agent.extractResult(mockPage);

      expect(result.success).toBe(true);
      expect(result.scopes).toEqual(['read_products', 'write_products', 'read_orders']);
    });

    it('should extract scopes from text when checkboxes not found', async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('shpat_')) {
          return createMockLocator({
            inputValue: jest.fn().mockResolvedValue('shpat_token123')
          });
        } else if (selector.includes('read_|write_')) {
          return createMockLocator({
            allTextContents: jest.fn().mockResolvedValue([
              'Permissions: read_products write_products read_orders'
            ])
          });
        }
        return createMockLocator();
      });

      const result = await agent.extractResult(mockPage);

      expect(result.success).toBe(true);
      expect(result.scopes).toEqual(['read_products', 'write_products', 'read_orders']);
    });

    it('should handle extraction errors gracefully', async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error('Page locator failed');
      });

      const result = await agent.extractResult(mockPage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Page locator failed');
    });

    it('should warn when no credentials found', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock returns nothing/errors for all selectors
      mockPage.locator.mockImplementation(() => createMockLocator());

      const result = await agent.extractResult(mockPage);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not extract API credentials')
      );

      consoleWarnSpy.mockRestore();
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

  describe('integration scenarios', () => {
    it('should have workflow compatible with base agent executor', async () => {
      const mockWorkflow = [
        {
          order: 1,
          intent: 'Test step',
          action: 'goto',
          target: mockStoreUrl,
          expectedResult: 'Success'
        }
      ];

      const mockGet = WorkflowRegistry.get as jest.MockedFunction<typeof WorkflowRegistry.get>;
      mockGet.mockReturnValue(mockWorkflow);

      const workflow = await agent.getWorkflow();

      // Verify workflow structure matches base agent expectations
      workflow.forEach(step => {
        expect(step).toHaveProperty('order');
        expect(step).toHaveProperty('intent');
        expect(step).toHaveProperty('action');
        expect(step).toHaveProperty('expectedResult');
      });
    });

    it('should provide complete workflow for credential generation', async () => {
      const mockGet = WorkflowRegistry.get as jest.MockedFunction<typeof WorkflowRegistry.get>;
      mockGet.mockImplementation(() => {
        throw new Error('Use fallback');
      });

      const workflow = await agent.getWorkflow();

      // Verify complete workflow coverage
      expect(workflow.length).toBeGreaterThanOrEqual(10); // Minimum steps for complete flow

      const actions = workflow.map(step => step.action);
      expect(actions).toContain('goto');   // Navigation
      expect(actions).toContain('fill');   // Form input
      expect(actions).toContain('click');  // Button clicks
    });
  });
});
