import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Create mock vault instance
const mockVaultGet = jest.fn();
const mockVaultInstance = {
  get: mockVaultGet,
  store: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  rotate: jest.fn(),
  verify: jest.fn(),
  markStaleCredentialsForRotation: jest.fn(),
  getCredentialsRequiringRotation: jest.fn(),
};

// Import ShopifySetupAgent
import { ShopifySetupAgent } from '@/lib/autonomous/agents/shopify-setup-agent';

describe('ShopifySetupAgent.getCredentials', () => {
  const organizationId = 'org-123';
  const storeUrl = 'https://demo.myshopify.com';
  let agent: ShopifySetupAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    // Inject the mock vault instance into the agent
    agent = new ShopifySetupAgent(storeUrl, mockVaultInstance as any);
  });

  it('retrieves Shopify admin credentials from vault', async () => {
    mockVaultGet
      .mockResolvedValueOnce({ value: 'admin@test.com' })
      .mockResolvedValueOnce({ value: 'secure-password' });

    const credentials = await agent.getCredentials(organizationId);

    expect(mockVaultGet).toHaveBeenNthCalledWith(1, organizationId, 'shopify', 'admin_email');
    expect(mockVaultGet).toHaveBeenNthCalledWith(2, organizationId, 'shopify', 'admin_password');
    expect(credentials).toEqual({
      adminEmail: 'admin@test.com',
      adminPassword: 'secure-password',
      storeUrl,
    });
  });

  it('throws when email credential missing', async () => {
    mockVaultGet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ value: 'secure-password' });

    await expect(agent.getCredentials(organizationId)).rejects.toThrow(
      'Shopify admin credentials not found in vault'
    );
  });

  it('throws when password credential missing', async () => {
    mockVaultGet
      .mockResolvedValueOnce({ value: 'admin@test.com' })
      .mockResolvedValueOnce(null);

    await expect(agent.getCredentials(organizationId)).rejects.toThrow(
      'Shopify admin credentials not found in vault'
    );
  });

  it('surface vault connection errors', async () => {
    mockVaultGet.mockRejectedValue(new Error('Vault connection error'));

    await expect(agent.getCredentials(organizationId)).rejects.toThrow('Vault connection error');
  });
});
