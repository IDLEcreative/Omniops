/**
 * Follow-up Prioritization Tests
 *
 * Tests for prioritizeFollowUps function covering:
 * - Sorting by priority levels
 * - Maintaining order for same priority
 * - Empty array handling
 */

import { describe, it, expect } from '@jest/globals';
import { prioritizeFollowUps, type FollowUpCandidate } from '@/lib/follow-ups/detector';

describe('prioritizeFollowUps', () => {
  it('should sort candidates by priority (high to low)', () => {
    const candidates: FollowUpCandidate[] = [
      {
        conversation_id: 'conv-1',
        session_id: 'session-1',
        reason: 'abandoned_conversation',
        priority: 'low',
        metadata: {
          last_message_at: '2024-01-01T10:00:00Z',
          message_count: 2,
        },
      },
      {
        conversation_id: 'conv-2',
        session_id: 'session-2',
        reason: 'cart_abandonment',
        priority: 'high',
        metadata: {
          last_message_at: '2024-01-01T10:00:00Z',
          message_count: 3,
          has_cart_activity: true,
        },
      },
      {
        conversation_id: 'conv-3',
        session_id: 'session-3',
        reason: 'low_satisfaction',
        priority: 'medium',
        metadata: {
          last_message_at: '2024-01-01T10:00:00Z',
          message_count: 4,
          sentiment_score: 30,
        },
      },
    ];

    const prioritized = prioritizeFollowUps(candidates);

    expect(prioritized[0].priority).toBe('high');
    expect(prioritized[1].priority).toBe('medium');
    expect(prioritized[2].priority).toBe('low');
  });

  it('should maintain order for same priority levels', () => {
    const candidates: FollowUpCandidate[] = [
      {
        conversation_id: 'conv-1',
        session_id: 'session-1',
        reason: 'abandoned_conversation',
        priority: 'medium',
        metadata: {
          last_message_at: '2024-01-01T10:00:00Z',
          message_count: 2,
        },
      },
      {
        conversation_id: 'conv-2',
        session_id: 'session-2',
        reason: 'unresolved_issue',
        priority: 'medium',
        metadata: {
          last_message_at: '2024-01-01T11:00:00Z',
          message_count: 3,
        },
      },
    ];

    const prioritized = prioritizeFollowUps(candidates);

    expect(prioritized[0].conversation_id).toBe('conv-1');
    expect(prioritized[1].conversation_id).toBe('conv-2');
  });

  it('should handle empty array', () => {
    const prioritized = prioritizeFollowUps([]);
    expect(prioritized).toEqual([]);
  });
});
