/**
 * POST /api/woocommerce/cart-test - Validation & Error Tests
 * Tests parameter validation and error handling
 */

import { POST } from '@/app/api/woocommerce/cart-test/route';
import {
  mockStoreAPIInstance,
  mockSessionManager,
  resetAllMocks,
  createPostRequest,
  mockSupabaseNoConfig,
} from '@/__tests__/utils/woocommerce/cart-test-fixtures';

describe('POST /api/woocommerce/cart-test - Validation & Errors', () => {
  beforeEach(() => {
    process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';
    resetAllMocks();
  });

  it('should handle Store API not available', async () => {
    mockStoreAPIInstance.isAvailable.mockResolvedValue(false);

    const response = await POST(createPostRequest({
      domain: 'test.com',
      action: 'add',
      productId: 123,
    }));
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.message).toContain('Store API is not responding');
  });

  it('should handle Store API client initialization failure', async () => {
    mockSupabaseNoConfig();

    const response = await POST(createPostRequest({
      domain: 'test.com',
      action: 'add',
      productId: 123,
    }));
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.message).toContain('could not be initialized');
  });

  it('should validate required parameters for add action', async () => {
    const response = await POST(createPostRequest({
      domain: 'test.com',
      action: 'add',
      // Missing productId
    }));
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.message).toContain('Product ID is required');
  });

  it('should handle validation errors', async () => {
    const response = await POST(createPostRequest({
      action: 'invalid_action',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Invalid request parameters');
    expect(data.errors).toBeDefined();
  });

  it('should handle unknown action', async () => {
    const response = await POST(createPostRequest({
      domain: 'test.com',
      action: 'unknown_action' as any,
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should handle Store API errors gracefully', async () => {
    mockStoreAPIInstance.addItem.mockResolvedValue({
      success: false,
      error: { message: 'Product out of stock' },
    });

    const response = await POST(createPostRequest({
      domain: 'test.com',
      action: 'add',
      productId: 123,
      quantity: 1,
    }));
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.message).toContain('Product out of stock');
  });

  it('should handle unexpected errors', async () => {
    mockSessionManager.getSession.mockRejectedValue(new Error('Network error'));

    const response = await POST(createPostRequest({
      domain: 'test.com',
      action: 'add',
      productId: 123,
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Network error');
  });
});
