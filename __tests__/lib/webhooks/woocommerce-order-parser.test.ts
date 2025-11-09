/**
 * WooCommerce Order Parser Tests
 */

import {
  parseWooCommerceOrder,
  shouldTrackWooCommerceOrder,
} from '@/lib/webhooks/woocommerce-order-parser';
import type { WooCommerceOrderWebhook } from '@/types/purchase-attribution';

describe('WooCommerce Order Parser', () => {
  const validOrder: WooCommerceOrderWebhook = {
    id: 12345,
    number: 'WC-12345',
    status: 'completed',
    currency: 'USD',
    total: '199.99',
    billing: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'customer@example.com',
      phone: '+1234567890',
    },
    line_items: [
      {
        id: 1,
        name: 'Test Product',
        product_id: 100,
        quantity: 2,
        total: '199.99',
      },
    ],
    date_created: '2025-01-09T12:00:00',
    date_created_gmt: '2025-01-09T12:00:00Z',
    meta_data: [
      { key: 'session_id', value: 'sess_123' },
    ],
  };

  describe('parseWooCommerceOrder', () => {
    it('should parse valid order', () => {
      const parsed = parseWooCommerceOrder(validOrder);

      expect(parsed.orderId).toBe('12345');
      expect(parsed.orderNumber).toBe('WC-12345');
      expect(parsed.customerEmail).toBe('customer@example.com');
      expect(parsed.total).toBe(199.99);
      expect(parsed.currency).toBe('USD');
      expect(parsed.lineItems).toHaveLength(1);
      expect(parsed.lineItems[0].name).toBe('Test Product');
      expect(parsed.metadata.status).toBe('completed');
    });

    it('should throw error on missing order ID', () => {
      const invalidOrder = { ...validOrder, id: undefined as any };

      expect(() => parseWooCommerceOrder(invalidOrder)).toThrow('Missing required field: id');
    });

    it('should throw error on missing customer email', () => {
      const invalidOrder = {
        ...validOrder,
        billing: { first_name: 'John', last_name: 'Doe' } as any,
      };

      expect(() => parseWooCommerceOrder(invalidOrder)).toThrow(
        'Missing required field: billing.email'
      );
    });

    it('should throw error on invalid total', () => {
      const invalidOrder = { ...validOrder, total: 'invalid' };

      expect(() => parseWooCommerceOrder(invalidOrder)).toThrow('Invalid total value');
    });

    it('should normalize email to lowercase', () => {
      const orderWithUppercaseEmail = {
        ...validOrder,
        billing: { ...validOrder.billing, email: 'CUSTOMER@EXAMPLE.COM' },
      };

      const parsed = parseWooCommerceOrder(orderWithUppercaseEmail);

      expect(parsed.customerEmail).toBe('customer@example.com');
    });
  });

  describe('shouldTrackWooCommerceOrder', () => {
    it('should track completed orders', () => {
      expect(shouldTrackWooCommerceOrder(validOrder)).toBe(true);
    });

    it('should track processing orders', () => {
      const processingOrder = { ...validOrder, status: 'processing' };
      expect(shouldTrackWooCommerceOrder(processingOrder)).toBe(true);
    });

    it('should track on-hold orders', () => {
      const onHoldOrder = { ...validOrder, status: 'on-hold' };
      expect(shouldTrackWooCommerceOrder(onHoldOrder)).toBe(true);
    });

    it('should NOT track pending orders', () => {
      const pendingOrder = { ...validOrder, status: 'pending' };
      expect(shouldTrackWooCommerceOrder(pendingOrder)).toBe(false);
    });

    it('should NOT track failed orders', () => {
      const failedOrder = { ...validOrder, status: 'failed' };
      expect(shouldTrackWooCommerceOrder(failedOrder)).toBe(false);
    });

    it('should NOT track $0 orders', () => {
      const zeroOrder = { ...validOrder, total: '0.00' };
      expect(shouldTrackWooCommerceOrder(zeroOrder)).toBe(false);
    });

    it('should NOT track test orders', () => {
      const testOrder = {
        ...validOrder,
        billing: { ...validOrder.billing, email: 'test@example.com' },
      };
      expect(shouldTrackWooCommerceOrder(testOrder)).toBe(false);
    });
  });
});
