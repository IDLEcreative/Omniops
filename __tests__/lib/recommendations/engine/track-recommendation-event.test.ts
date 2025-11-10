/**
 * trackRecommendationEvent Function Tests
 *
 * Tests recommendation event tracking for clicks, purchases, and error handling.
 */

// Setup mocks BEFORE importing code under test
import './setup-mocks';

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { trackRecommendationEvent } from '@/lib/recommendations/engine';
import { createMockSupabaseClient } from '__tests__/utils/recommendations/mock-setup';

describe('trackRecommendationEvent', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  it('should track click events', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: 'event-123' },
      error: null,
    });
    mockSupabase.update.mockResolvedValue({ error: null });

    await trackRecommendationEvent(
      'prod-1',
      'click',
      'session-123',
      undefined,
      mockSupabase
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('recommendation_events');
    expect(mockSupabase.eq).toHaveBeenCalledWith('product_id', 'prod-1');
    expect(mockSupabase.update).toHaveBeenCalledWith({ clicked: true });
  });

  it('should track purchase events', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: 'event-123' },
      error: null,
    });
    mockSupabase.update.mockResolvedValue({ error: null });

    await trackRecommendationEvent(
      'prod-1',
      'purchase',
      'session-123',
      undefined,
      mockSupabase
    );

    expect(mockSupabase.update).toHaveBeenCalledWith({
      clicked: true,
      purchased: true,
    });
  });

  it('should handle missing event gracefully', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    });

    await trackRecommendationEvent(
      'prod-1',
      'click',
      'session-123',
      undefined,
      mockSupabase
    );

    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it('should handle update errors gracefully', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: 'event-123' },
      error: null,
    });
    mockSupabase.update.mockResolvedValue({ error: new Error('Update failed') });

    await trackRecommendationEvent(
      'prod-1',
      'click',
      'session-123',
      undefined,
      mockSupabase
    );

    // Should not throw
    expect(mockSupabase.update).toHaveBeenCalled();
  });
});
