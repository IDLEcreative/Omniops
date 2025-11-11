export interface MockWooCommerceOptions {
  orders?: any[];
  products?: any[];
  getOrderError?: Error | null;
  getProductsError?: Error | null;
}

/**
 * Create a mock WooCommerce client
 */
export function mockWooCommerceClient(options: MockWooCommerceOptions = {}) {
  const {
    orders = [],
    products = [],
    getOrderError = null,
    getProductsError = null,
  } = options;

  return {
    getOrder: jest.fn().mockImplementation((id: number) => {
      if (getOrderError) {
        return Promise.reject(getOrderError);
      }
      const order = orders.find((o) => o.id === id);
      return order ? Promise.resolve(order) : Promise.reject(new Error('Order not found'));
    }),
    getOrders: jest.fn().mockImplementation(() => {
      if (getOrderError) {
        return Promise.reject(getOrderError);
      }
      return Promise.resolve(orders);
    }),
    getProduct: jest.fn().mockImplementation((id: number) => {
      const product = products.find((p) => p.id === id);
      return product ? Promise.resolve(product) : Promise.reject(new Error('Product not found'));
    }),
    getProducts: jest.fn().mockImplementation(() => {
      if (getProductsError) {
        return Promise.reject(getProductsError);
      }
      return Promise.resolve(products);
    }),
  };
}

export interface MockCommerceProviderOptions {
  platform?: 'woocommerce' | 'shopify' | null;
  products?: any[];
  orders?: any[];
  searchProducts?: jest.Mock;
  lookupOrder?: jest.Mock;
  checkStock?: jest.Mock;
  getProductDetails?: jest.Mock;
}

/**
 * Create mock Commerce Provider that matches the unified interface
 */
export function mockCommerceProvider(options: MockCommerceProviderOptions = {}) {
  const {
    platform = 'woocommerce',
    products = [],
    orders = [],
    searchProducts,
    lookupOrder,
    checkStock,
    getProductDetails,
  } = options;

  if (platform === null) {
    return null;
  }

  return {
    platform,
    searchProducts: searchProducts || jest.fn().mockResolvedValue(products),
    lookupOrder:
      lookupOrder ||
      jest.fn().mockImplementation(async (orderId: string) => {
        const order = orders.find((o) => o.id.toString() === orderId || o.number === orderId);
        return order || null;
      }),
    checkStock:
      checkStock ||
      jest.fn().mockResolvedValue({
        productName: 'Test Product',
        sku: 'TEST-SKU',
        stockStatus: 'instock',
        stockQuantity: 100,
        manageStock: true,
        backorders: 'no',
      }),
    getProductDetails:
      getProductDetails ||
      jest.fn().mockImplementation(async (productId: string) => {
        const product = products.find((p) => p.id.toString() === productId || p.sku === productId);
        return product || null;
      }),
  };
}
