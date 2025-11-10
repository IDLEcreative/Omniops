/**
 * Test Fixtures for useWidgetConfig Hook Tests
 */

import type { ChatWidgetConfig } from '@/components/ChatWidget/hooks/useChatState';

export const createSuccessResponse = (config: any) => ({
  ok: true,
  status: 200,
  json: async () => ({
    success: true,
    config,
  }),
} as Response);

export const createErrorResponse = (status: number) => ({
  ok: false,
  status,
  json: async () => ({}),
} as Response);

export const mockDemoConfig: ChatWidgetConfig = {
  domain: 'demo-shop.com',
  features: {
    woocommerce: { enabled: true },
  },
};

export const mockApiConfig = {
  woocommerce_enabled: true,
  domain: 'test.com',
};
