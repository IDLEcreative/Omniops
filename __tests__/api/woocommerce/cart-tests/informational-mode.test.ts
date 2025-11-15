/**
 * POST /api/woocommerce/cart-test - Informational Mode Tests
 * Tests when Store API is disabled (informational mode)
 */

import { POST } from '@/app/api/woocommerce/cart-test/route';
import {
  resetAllMocks,
  createPostRequest,
} from '@/__tests__/utils/woocommerce/cart-test-fixtures';

describe('POST /api/woocommerce/cart-test - Informational Mode', () => {
  beforeEach(() => {
    process.env.WOOCOMMERCE_STORE_API_ENABLED = 'false';
    resetAllMocks();
  });

  it('should return informational mode message when Store API is disabled', async () => {
    const response = await POST(createPostRequest({
      domain: 'test.com',
      action: 'add',
      productId: 123,
      quantity: 2,
    }));
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.mode).toBe('informational');
    expect(data.message).toContain('not enabled');
  });
});
