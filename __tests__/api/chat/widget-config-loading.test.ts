/**
 * Widget Configuration - Database Loading Tests
 *
 * Tests for loading widget configuration from database
 */

import { describe, test, expect, jest } from '@jest/globals';
import { loadWidgetConfig, WidgetConfig } from '@/lib/chat/conversation-manager';

describe('Widget Config - Database Loading', () => {
  test('should load widget config from database via domain ID', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    // Mock domain lookup
    (mockSupabase.single as jest.Mock)
      .mockResolvedValueOnce({
        data: { customer_config_id: 'test-customer-config-id' },
        error: null
      })
      // Mock widget config lookup
      .mockResolvedValueOnce({
        data: {
          config_data: {
            ai_settings: {
              personality: 'friendly',
              responseLength: 'balanced',
              language: 'en'
            }
          }
        },
        error: null
      });

    const config = await loadWidgetConfig('test-domain-id', mockSupabase);

    expect(config).not.toBeNull();
    expect(config?.ai_settings?.personality).toBe('friendly');
    expect(config?.ai_settings?.responseLength).toBe('balanced');
  });

  test('should return null if no domain found', async () => {
    const config = await loadWidgetConfig(null, {} as any);
    expect(config).toBeNull();
  });

  test('should handle database errors gracefully', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Database error'))
    };

    const config = await loadWidgetConfig('test-domain-id', mockSupabase);
    expect(config).toBeNull();
  });

  test('should have correct TypeScript types', () => {
    const config: WidgetConfig = {
      theme_settings: {
        primaryColor: '#007bff',
        darkMode: true
      },
      ai_settings: {
        personality: 'professional',
        responseLength: 'balanced',
        language: 'en',
        temperature: 0.7,
        maxTokens: 2500
      },
      behavior_settings: {
        botName: 'Assistant',
        welcomeMessage: 'Hello!',
        showAvatar: true
      },
      integration_settings: {
        enableWooCommerce: true,
        enableWebSearch: false,
        enableKnowledgeBase: true,
        dataSourcePriority: ['woocommerce', 'knowledge_base']
      }
    };

    // Type checking - should compile without errors
    expect(config.ai_settings?.personality).toBe('professional');
    expect(config.ai_settings?.responseLength).toBe('balanced');
    expect(config.integration_settings?.enableWebSearch).toBe(false);
  });
});
