/**
 * Purchase Attribution Logic Tests
 */

import { attributePurchaseToConversation } from '@/lib/attribution/purchase-attributor';
import * as attributionDb from '@/lib/attribution/attribution-db';
import type { AttributionContext } from '@/types/purchase-attribution';

// Mock the database module
jest.mock('@/lib/attribution/attribution-db');

describe('Purchase Attribution', () => {
  const mockContext: AttributionContext = {
    customerEmail: 'customer@example.com',
    orderId: 'WC-12345',
    orderNumber: 'WC-12345',
    orderTotal: 199.99,
    orderTimestamp: new Date('2025-01-09T14:00:00Z'),
    platform: 'woocommerce',
    domain: 'example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Match Strategy', () => {
    it('should attribute with high confidence when active session found', async () => {
      // Mock active session
      (attributionDb.getActiveSessionByEmail as jest.Mock).mockResolvedValue({
        sessionId: 'sess_123',
        conversationId: 'conv_123',
        lastActivity: new Date('2025-01-09T13:30:00Z'), // 30 min ago
      });

      (attributionDb.savePurchaseAttribution as jest.Mock).mockResolvedValue({ id: 'attr_1' });

      const result = await attributePurchaseToConversation(mockContext);

      expect(result.conversationId).toBe('conv_123');
      expect(result.confidence).toBeGreaterThanOrEqual(0.90);
      expect(result.method).toBe('session_match');
      expect(attributionDb.savePurchaseAttribution).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv_123',
          attributionMethod: 'session_match',
          attributionConfidence: expect.any(Number),
        })
      );
    });

    it('should not use session match if session is too old', async () => {
      (attributionDb.getActiveSessionByEmail as jest.Mock).mockResolvedValue(null);
      (attributionDb.getRecentConversationsByEmail as jest.Mock).mockResolvedValue([]);
      (attributionDb.savePurchaseAttribution as jest.Mock).mockResolvedValue({ id: 'attr_1' });

      const result = await attributePurchaseToConversation(mockContext);

      expect(result.method).not.toBe('session_match');
    });
  });

  describe('Time Proximity Strategy', () => {
    it('should attribute with medium-high confidence for recent conversation', async () => {
      (attributionDb.getActiveSessionByEmail as jest.Mock).mockResolvedValue(null);

      (attributionDb.getRecentConversationsByEmail as jest.Mock).mockResolvedValue([
        {
          id: 'conv_456',
          session_id: 'sess_456',
          lastMessageAt: '2025-01-09T13:00:00Z', // 1 hour before order
          messageCount: 5,
          metadata: { product_inquiry: true },
        },
      ]);

      (attributionDb.savePurchaseAttribution as jest.Mock).mockResolvedValue({ id: 'attr_2' });

      const result = await attributePurchaseToConversation(mockContext);

      expect(result.conversationId).toBe('conv_456');
      expect(result.confidence).toBeGreaterThanOrEqual(0.70);
      expect(result.confidence).toBeLessThan(0.95);
      expect(result.method).toBe('time_proximity');
    });

    it('should boost confidence for engaged conversations', async () => {
      (attributionDb.getActiveSessionByEmail as jest.Mock).mockResolvedValue(null);

      (attributionDb.getRecentConversationsByEmail as jest.Mock).mockResolvedValue([
        {
          id: 'conv_789',
          session_id: 'sess_789',
          lastMessageAt: '2025-01-09T13:30:00Z',
          messageCount: 10, // High engagement
          metadata: { product_inquiry: true, price_check: true },
        },
      ]);

      (attributionDb.savePurchaseAttribution as jest.Mock).mockResolvedValue({ id: 'attr_3' });

      const result = await attributePurchaseToConversation(mockContext);

      expect(result.confidence).toBeGreaterThan(0.80);
    });
  });

  describe('Email Match Strategy', () => {
    it('should attribute with low-medium confidence for older conversation', async () => {
      (attributionDb.getActiveSessionByEmail as jest.Mock).mockResolvedValue(null);

      // Conversation more than 24h ago, but within 7 days
      (attributionDb.getRecentConversationsByEmail as jest.Mock).mockResolvedValue([
        {
          id: 'conv_old',
          session_id: 'sess_old',
          lastMessageAt: null,
          created_at: '2025-01-07T10:00:00Z', // 2 days ago
          messageCount: 3,
        },
      ]);

      (attributionDb.savePurchaseAttribution as jest.Mock).mockResolvedValue({ id: 'attr_4' });

      const result = await attributePurchaseToConversation(mockContext);

      expect(result.conversationId).toBe('conv_old');
      expect(result.confidence).toBeGreaterThanOrEqual(0.50);
      expect(result.confidence).toBeLessThan(0.70);
      expect(result.method).toBe('email_match');
    });
  });

  describe('No Match Strategy', () => {
    it('should create unattributed record when no conversation found', async () => {
      (attributionDb.getActiveSessionByEmail as jest.Mock).mockResolvedValue(null);
      (attributionDb.getRecentConversationsByEmail as jest.Mock).mockResolvedValue([]);
      (attributionDb.savePurchaseAttribution as jest.Mock).mockResolvedValue({ id: 'attr_5' });

      const result = await attributePurchaseToConversation(mockContext);

      expect(result.conversationId).toBeNull();
      expect(result.confidence).toBe(0.0);
      expect(result.method).toBe('no_match');
      expect(attributionDb.savePurchaseAttribution).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: null,
          attributionConfidence: 0.0,
          attributionMethod: 'no_match',
        })
      );
    });
  });
});
