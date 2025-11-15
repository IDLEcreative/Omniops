/**
 * Tests for Shopify Setup Agent credential extraction
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifySetupAgent } from '@/lib/autonomous/agents/shopify-setup-agent';
import { setupMocks, createMockLocator, createMockPage } from './setup';

jest.mock('@/lib/autonomous/core/workflow-registry');
jest.mock('@/lib/autonomous/security/credential-vault-helpers');
jest.mock('@/lib/autonomous/security/credential-vault');
jest.mock('@/lib/supabase/server');

describe('ShopifySetupAgent - Extraction', () => {
  let agent: ShopifySetupAgent;
  let mockPage: any;
  const mockStoreUrl = 'https://teststore.myshopify.com';

  beforeEach(() => {
    setupMocks();
    agent = new ShopifySetupAgent(mockStoreUrl);
    mockPage = createMockPage();
  });

  it('should extract access token from readonly input', async () => {
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
