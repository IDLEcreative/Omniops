// Mock for @woocommerce/woocommerce-rest-api
class WooCommerceRestApi {
  constructor(config) {
    this.config = config;
    this.options = config;
    
    // Set up mock methods with proper return structure
    this.get = jest.fn().mockImplementation((endpoint, params) => {
      return Promise.resolve({ data: this.getMockData(endpoint, params) });
    });
    
    this.post = jest.fn().mockImplementation((endpoint, data) => {
      return Promise.resolve({ data: data || {} });
    });
    
    this.put = jest.fn().mockImplementation((endpoint, data) => {
      return Promise.resolve({ data: data || {} });
    });
    
    this.delete = jest.fn().mockImplementation((_endpoint) => {
      return Promise.resolve({ data: { deleted: true } });
    });
  }
  
  // Helper method to provide sensible mock data based on endpoint
  getMockData(endpoint, _params) {
    if (endpoint.startsWith('products/') && !endpoint.includes('categories')) {
      // Single product
      const productId = parseInt(endpoint.split('/')[1]);
      return {
        id: productId,
        name: `Product ${productId}`,
        slug: `product-${productId}`,
        permalink: `https://test-store.com/product/product-${productId}`,
        type: 'simple',
        status: 'publish',
        description: 'Product description',
        short_description: 'Short description',
        sku: `SKU-${productId}`,
        price: '19.99',
        regular_price: '19.99',
        sale_price: '',
        stock_quantity: 100,
        stock_status: 'instock',
        categories: [],
        images: [],
        attributes: []
      };
    }
    
    if (endpoint === 'products') {
      // Product list
      return [];
    }
    
    if (endpoint === 'products/categories') {
      // Categories
      return [];
    }
    
    if (endpoint.startsWith('orders/') && endpoint !== 'orders/abandoned') {
      // Single order
      const orderId = parseInt(endpoint.split('/')[1]);
      return {
        id: orderId,
        status: 'processing',
        currency: 'USD',
        total: '19.99',
        date_created: '2024-01-01T00:00:00',
        date_modified: '2024-01-01T00:00:00',
        customer_id: 1,
        billing: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890'
        },
        shipping: {
          first_name: 'John',
          last_name: 'Doe',
          address_1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postcode: '12345',
          country: 'US'
        },
        line_items: []
      };
    }
    
    if (endpoint === 'orders' || endpoint === 'orders/abandoned') {
      // Order list
      return [];
    }
    
    if (endpoint === 'customers') {
      // Customer list
      return [];
    }
    
    // Default empty response
    return [];
  }
}

// Create a mock constructor function that Jest can track
const MockedWooCommerceRestApi = jest.fn().mockImplementation((config) => {
  return new WooCommerceRestApi(config);
});

// Copy the actual class to the mock for instanceof checks
MockedWooCommerceRestApi.prototype = WooCommerceRestApi.prototype;

// Support both CommonJS and ES module imports
MockedWooCommerceRestApi.default = MockedWooCommerceRestApi;

export default MockedWooCommerceRestApi;
export { MockedWooCommerceRestApi as WooCommerceRestApi };