// Manual mock for shopify-dynamic
// We create the mock implementation here and export it
// Tests can then call .mockResolvedValue() on these

console.log('[MANUAL MOCK] Loading shopify-dynamic manual mock');
console.log('[MANUAL MOCK] typeof jest:', typeof jest);
console.log('[MANUAL MOCK] jest.fn:', typeof jest?.fn);

const getDynamicShopifyClientMock = jest.fn().mockResolvedValue(null);
const searchProductsDynamicMock = jest.fn().mockResolvedValue([]);

console.log('[MANUAL MOCK] Created mocks, getDynamicShopifyClientMock type:', typeof getDynamicShopifyClientMock);
console.log('[MANUAL MOCK] has mockResolvedValue?', 'mockResolvedValue' in getDynamicShopifyClientMock);

export { getDynamicShopifyClientMock as getDynamicShopifyClient };
export { searchProductsDynamicMock as searchProductsDynamic };
