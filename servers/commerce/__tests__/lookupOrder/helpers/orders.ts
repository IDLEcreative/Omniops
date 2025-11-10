import { OrderInfo } from '@/lib/agents/commerce-provider';

export const mockWooCommerceOrder: OrderInfo = {
  id: 12345,
  number: '12345',
  status: 'processing',
  date: '2025-11-05T10:30:00Z',
  total: '149.99',
  currency: '£',
  items: [
    { name: 'Hydraulic Pump A4VTG90', quantity: 1, total: '99.99' },
    { name: 'Seal Kit BP-001', quantity: 2, total: '50.00' },
  ],
  billing: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  },
  trackingNumber: 'TRACK123456',
  permalink: 'https://thompsonseparts.co.uk/order/12345',
};

export const mockShopifyOrder: OrderInfo = {
  id: 67890,
  number: 'SP-67890',
  status: 'fulfilled',
  date: '2025-11-04T14:20:00Z',
  total: '299.50',
  currency: '$',
  items: [{ name: 'Premium Pump Kit', quantity: 1, total: '299.50' }],
  billing: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
  trackingNumber: 'SHIP789456',
  permalink: 'https://shop.example.com/orders/67890',
};

export function orderWith(overrides: Partial<OrderInfo>): OrderInfo {
  return { ...mockWooCommerceOrder, ...overrides };
}
