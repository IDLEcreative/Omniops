// Mock for @woocommerce/woocommerce-rest-api
const WooCommerceRestApi = jest.fn().mockImplementation((config) => {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    options: config,
  };
});

// Support both default and named exports
WooCommerceRestApi.default = WooCommerceRestApi;

module.exports = WooCommerceRestApi;