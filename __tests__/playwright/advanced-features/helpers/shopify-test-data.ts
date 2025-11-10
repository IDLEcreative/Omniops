import { ShopifyProduct } from './shopify-api-mocks';
import { ShopifyCredentials } from './shopify-page-actions';

export const testCredentials: ShopifyCredentials = {
  shop_domain: 'test-store.myshopify.com',
  access_token: 'test_access_token_12345',
  api_key: 'test_api_key',
  api_secret: 'test_api_secret'
};

export const invalidCredentials: ShopifyCredentials = {
  shop_domain: 'test-store.myshopify.com',
  access_token: 'invalid_token',
  api_key: 'invalid_key',
  api_secret: 'invalid_secret'
};

export const mockProducts: ShopifyProduct[] = [
  {
    id: 'shopify-prod-1',
    title: 'Awesome Gadget',
    handle: 'awesome-gadget',
    variants: [
      {
        id: 'variant-1',
        price: '79.99',
        inventory_quantity: 100
      }
    ],
    images: [{ src: 'https://via.placeholder.com/300' }]
  },
  {
    id: 'shopify-prod-2',
    title: 'Cool Device',
    handle: 'cool-device',
    variants: [
      {
        id: 'variant-2',
        price: '129.99',
        inventory_quantity: 50
      }
    ],
    images: [{ src: 'https://via.placeholder.com/300' }]
  }
];
