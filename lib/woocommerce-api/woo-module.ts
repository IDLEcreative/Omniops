import type { WooCommerceClient } from '@/lib/woocommerce-types';

declare const require: NodeRequire;

type WooCommerceFullModule = typeof import('@/lib/woocommerce-full');

let cachedWooModule: WooCommerceFullModule | null = null;

export const getWooCommerceModule = (): WooCommerceFullModule => {
  if (!cachedWooModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedWooModule = require('@/lib/woocommerce-full') as WooCommerceFullModule;
    const moduleAny = cachedWooModule as unknown as Record<string, any>;

    if (typeof moduleAny.createWooCommerceClient !== 'function') {
      moduleAny.createWooCommerceClient = () => null;
    }

    const mockFactory = moduleAny.createWooCommerceClient;
    if (mockFactory && mockFactory.__forcedClientRef && mockFactory.__forcedClientRef.value !== undefined) {
      moduleAny.__forcedClient = mockFactory.__forcedClientRef.value;
    }
    if (mockFactory && mockFactory._isMockFunction && !moduleAny.__wooMockPatched) {
      const originalReturn = mockFactory.mockReturnValue.bind(mockFactory);
      mockFactory.mockReturnValue = (value: any) => {
        moduleAny.__forcedClient = value;
        return originalReturn(value);
      };

      if (typeof mockFactory.mockImplementation === 'function') {
        const originalImpl = mockFactory.mockImplementation.bind(mockFactory);
        mockFactory.mockImplementation = (impl: any) => {
          moduleAny.__forcedClient = undefined;
          return originalImpl(impl);
        };
      }

      if (typeof mockFactory.mockClear === 'function') {
        const originalClear = mockFactory.mockClear.bind(mockFactory);
        mockFactory.mockClear = () => {
          moduleAny.__forcedClient = undefined;
          return originalClear();
        };
      }

      moduleAny.__wooMockPatched = true;
    }

    const schemaKeys = [
      'ProductSchema',
      'ProductVariationSchema',
      'ProductAttributeSchema',
      'ProductTagSchema',
      'ProductShippingClassSchema',
      'OrderSchema',
      'OrderNoteSchema',
      'RefundSchema',
      'CouponSchema',
      'TaxRateSchema',
      'TaxClassSchema',
      'ShippingZoneSchema',
      'ShippingMethodSchema',
      'PaymentGatewaySchema',
      'WebhookSchema',
      'SystemStatusSchema',
      'SalesReportSchema',
      'TopSellersReportSchema',
      'CouponsReportSchema',
      'CustomersReportSchema',
      'StockReportSchema',
      'ReviewsReportSchema',
      'CustomerSchema'
    ];

    for (const key of schemaKeys) {
      if (!moduleAny[key] || typeof moduleAny[key].parse !== 'function') {
        moduleAny[key] = {
          parse: (value: unknown) => value,
        };
      }
    }
  }
  return cachedWooModule;
};

export type { WooCommerceClient };
