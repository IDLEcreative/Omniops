/**
 * Shopify API Operations Tests
 * Tests Shopify Admin API operations (products, orders, customers, inventory)
 *
 * Note: File kept under 300 LOC per project guidelines
 */

import { ShopifyAPIOperations } from '@/lib/shopify-api-operations';
import type { ShopifyProduct, ShopifyOrder, ShopifyCustomer } from '@/lib/shopify-api-types';

describe('ShopifyAPIOperations', () => {
  let operations: ShopifyAPIOperations;
  let fetchSpy: jest.SpyInstance;

  const mockConfig = {
    shop: 'test-store.myshopify.com',
    accessToken: 'shpat_test_token',
    apiVersion: '2025-01',
  };

  beforeEach(() => {
    operations = new ShopifyAPIOperations(mockConfig);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Products API', () => {
    it('should fetch products with default parameters', async () => {
      const mockProducts: ShopifyProduct[] = [{
        id: 1, title: 'Test Product', vendor: 'Acme', product_type: 'Widget',
        created_at: '2025-01-01', updated_at: '2025-01-01', published_at: '2025-01-01',
        status: 'active', variants: [], images: [], options: [],
      } as ShopifyProduct];

      fetchSpy.mockResolvedValueOnce({
        ok: true, json: async () => ({ products: mockProducts })
      } as any);

      const result = await operations.getProducts();
      expect(result).toEqual(mockProducts);
    });

    it('should fetch products with filters', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ products: [] }) } as any);

      await operations.getProducts({ limit: 20, status: 'active' });
      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('limit=20');
      expect(url).toContain('status=active');
    });

    it('should fetch single product by ID', async () => {
      const mockProduct = { id: 123, title: 'Product' } as ShopifyProduct;
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ product: mockProduct }) } as any);

      const result = await operations.getProduct(123);
      expect(result).toEqual(mockProduct);
    });

    it('should search products by title', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ products: [] }) } as any);

      await operations.searchProducts('Widget', 25);
      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('title=Widget');
      expect(url).toContain('limit=25');
    });

    it('should handle product API errors', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 404, text: async () => 'Not found' } as any);

      await expect(operations.getProduct(999)).rejects.toThrow('Shopify API Error (404)');
    });
  });

  describe('Orders API', () => {
    it('should fetch orders with parameters', async () => {
      const mockOrders: ShopifyOrder[] = [{
        id: 1001, name: '#1001', email: 'test@example.com', created_at: '2025-01-01',
        updated_at: '2025-01-01', total_price: '99.99', currency: 'USD',
        financial_status: 'paid', fulfillment_status: 'shipped', line_items: [], order_number: 1001,
      } as ShopifyOrder];

      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ orders: mockOrders }) } as any);

      const result = await operations.getOrders({ status: 'open' });
      expect(result).toEqual(mockOrders);
      expect(fetchSpy.mock.calls[0][0]).toContain('status=open');
    });

    it('should fetch single order by ID', async () => {
      const mockOrder = { id: 1001, name: '#1001' } as ShopifyOrder;
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ order: mockOrder }) } as any);

      const result = await operations.getOrder(1001);
      expect(result).toEqual(mockOrder);
    });

    it('should filter orders by financial status', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [] }) } as any);

      await operations.getOrders({ financial_status: 'paid', fulfillment_status: 'shipped' });
      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('financial_status=paid');
      expect(url).toContain('fulfillment_status=shipped');
    });
  });

  describe('Customers API', () => {
    it('should fetch customers', async () => {
      const mockCustomers: ShopifyCustomer[] = [{
        id: 501, email: 'customer@example.com', first_name: 'John', last_name: 'Doe',
        created_at: '2025-01-01', updated_at: '2025-01-01', orders_count: 5, total_spent: '499.95',
      } as ShopifyCustomer];

      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ customers: mockCustomers }) } as any);

      const result = await operations.getCustomers({ limit: 100 });
      expect(result).toEqual(mockCustomers);
    });

    it('should fetch single customer', async () => {
      const mockCustomer = { id: 501, email: 'test@example.com' } as ShopifyCustomer;
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ customer: mockCustomer }) } as any);

      const result = await operations.getCustomer(501);
      expect(result).toEqual(mockCustomer);
    });

    it('should search customers', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ customers: [] }) } as any);

      await operations.searchCustomers('john@example.com');
      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('/customers/search.json');
      expect(url).toContain('query=john');
    });
  });

  describe('Inventory API', () => {
    it('should fetch inventory levels', async () => {
      const mockInventory = [{ inventory_item_id: 1, location_id: 1, available: 100, updated_at: '2025-01-01' }];
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ inventory_levels: mockInventory }) } as any);

      const result = await operations.getInventoryLevel({ inventory_item_ids: '1,2,3' });
      expect(result).toEqual(mockInventory);
    });

    it('should filter by location', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ inventory_levels: [] }) } as any);

      await operations.getInventoryLevel({ inventory_item_ids: '1', location_ids: '100,200' });
      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('inventory_item_ids=1');
      expect(url).toContain('location_ids=100%2C200');
    });
  });

  describe('Error Handling', () => {
    it('should propagate network errors', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network failure'));
      await expect(operations.getProducts()).rejects.toThrow('Network failure');
    });

    it('should handle 429 rate limiting', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 429, text: async () => 'Rate limit' } as any);
      await expect(operations.getOrders()).rejects.toThrow('Shopify API Error (429)');
    });

    it('should handle 401 authentication errors', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' } as any);
      await expect(operations.getCustomers()).rejects.toThrow('Shopify API Error (401)');
    });
  });
});
