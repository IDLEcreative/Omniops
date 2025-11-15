/**
 * GET /api/woocommerce/cart-test - Status Endpoint Tests
 * Tests the GET endpoint for checking Store API status
 */

import { GET } from '@/app/api/woocommerce/cart-test/route';
import {
  resetAllMocks,
  createGetRequest,
} from '@/__tests__/utils/woocommerce/cart-test-fixtures';

describe('GET /api/woocommerce/cart-test - Status Endpoint', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should return disabled status when Store API is not enabled', async () => {
    const response = await GET(createGetRequest());
    const data = await response.json();

    expect(data.enabled).toBe(false);
    expect(data.mode).toBe('informational');
    expect(data.message).toContain('disabled');
    expect(data.instructions).toBeDefined();
  });

  it('should return enabled status when Store API is enabled', async () => {
    process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';

    const response = await GET(createGetRequest());
    const data = await response.json();

    expect(data.enabled).toBe(true);
    expect(data.mode).toBe('transactional');
    expect(data.message).toContain('enabled');
  });
});
