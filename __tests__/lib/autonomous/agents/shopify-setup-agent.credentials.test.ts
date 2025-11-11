import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifySetupAgent } from '@/lib/autonomous/agents/shopify-setup-agent';
import * as vaultModule from '@/lib/autonomous/security/credential-vault';

jest.mock('@/lib/autonomous/security/credential-vault', () => ({
  getCredential: jest.fn(),
}));

const mockGetCredential = vaultModule.getCredential as jest.Mock;

describe('ShopifySetupAgent.getCredentials', () => {
  const organizationId = 'org-123';
  const storeUrl = 'https://demo.myshopify.com';
  let agent: ShopifySetupAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new ShopifySetupAgent(storeUrl);
  });

  it('retrieves Shopify admin credentials from vault', async () => {
    mockGetCredential
      .mockResolvedValueOnce({ value: 'admin@test.com' })
      .mockResolvedValueOnce({ value: 'secure-password' });

    const credentials = await agent.getCredentials(organizationId);

    expect(mockGetCredential).toHaveBeenNthCalledWith(1, organizationId, 'shopify', 'admin_email');
    expect(mockGetCredential).toHaveBeenNthCalledWith(2, organizationId, 'shopify', 'admin_password');
    expect(credentials).toEqual({
      adminEmail: 'admin@test.com',
      adminPassword: 'secure-password',
      storeUrl,
    });
  });

  it('throws when email credential missing', async () => {
    mockGetCredential
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ value: 'secure-password' });

    await expect(agent.getCredentials(organizationId)).rejects.toThrow(
      'Shopify admin credentials not found in vault'
    );
  });

  it('throws when password credential missing', async () => {
    mockGetCredential
      .mockResolvedValueOnce({ value: 'admin@test.com' })
      .mockResolvedValueOnce(null);

    await expect(agent.getCredentials(organizationId)).rejects.toThrow(
      'Shopify admin credentials not found in vault'
    );
  });

  it('surface vault connection errors', async () => {
    mockGetCredential.mockRejectedValue(new Error('Vault connection error'));

    await expect(agent.getCredentials(organizationId)).rejects.toThrow('Vault connection error');
  });
});
