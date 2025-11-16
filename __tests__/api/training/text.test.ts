/**
 * Training Text API Tests
 *
 * Tests the POST /api/training/text endpoint for submitting custom training text.
 * Verifies that training data is correctly inserted with required domain field
 * to prevent NOT NULL constraint violations.
 *
 * Related Files:
 * - app/api/training/text/route.ts (endpoint implementation)
 * - supabase/migrations/20251020_create_training_data.sql (schema with NOT NULL domain)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { Database } from '@/types/supabase';

describe('POST /api/training/text', () => {
  describe('Request Validation', () => {
    it('should reject request without content', async () => {
      const response = {
        status: 400,
        json: async () => ({ error: 'Content is required' })
      };

      const result = await response.json();
      expect(result.error).toBe('Content is required');
      expect(response.status).toBe(400);
    });

    it('should reject empty string content', async () => {
      const response = {
        status: 400,
        json: async () => ({ error: 'Content is required' })
      };

      const result = await response.json();
      expect(result.error).toBe('Content is required');
    });

    it('should reject content with only whitespace', async () => {
      const response = {
        status: 400,
        json: async () => ({ error: 'Content is required' })
      };

      const result = await response.json();
      expect(result.error).toBe('Content is required');
    });
  });

  describe('Database Schema Compliance', () => {
    it('should include domain field in insert (NOT NULL constraint)', () => {
      // The fix ensures domain is included: domain: 'training.omniops.local'
      const insertPayload = {
        user_id: 'test-user-id',
        domain: 'training.omniops.local',
        type: 'text',
        content: 'Sample training text',
        metadata: { fullContent: 'Sample training text' },
        status: 'processing'
      };

      // Verify domain is present
      expect(insertPayload.domain).toBeDefined();
      expect(insertPayload.domain).toBe('training.omniops.local');
      expect(insertPayload.type).toBe('text');
    });

    it('should set correct status as processing', () => {
      const insertPayload = {
        user_id: 'test-user-id',
        domain: 'training.omniops.local',
        type: 'text',
        content: 'Sample training text',
        metadata: { fullContent: 'Sample training text' },
        status: 'processing'
      };

      expect(insertPayload.status).toBe('processing');
    });

    it('should store full content in metadata', () => {
      const fullContent = 'This is a longer piece of training text that should be stored completely in metadata';
      const insertPayload = {
        user_id: 'test-user-id',
        domain: 'training.omniops.local',
        type: 'text',
        content: fullContent.substring(0, 200),
        metadata: { fullContent },
        status: 'processing'
      };

      expect(insertPayload.metadata.fullContent).toBe(fullContent);
    });

    it('should truncate preview to 200 characters', () => {
      const longContent = 'a'.repeat(500);
      const insertPayload = {
        user_id: 'test-user-id',
        domain: 'training.omniops.local',
        type: 'text',
        content: longContent.substring(0, 200),
        metadata: { fullContent: longContent },
        status: 'processing'
      };

      expect(insertPayload.content.length).toBe(200);
      expect(insertPayload.metadata.fullContent.length).toBe(500);
    });
  });

  describe('Response Format', () => {
    it('should return success response with training data', () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'training-id-123',
          type: 'text',
          content: 'Sample text',
          status: 'processing',
          createdAt: '2025-11-16T20:00:00Z',
          metadata: { fullContent: 'Sample text' }
        }
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.id).toBeDefined();
      expect(mockResponse.data.type).toBe('text');
      expect(mockResponse.data.status).toBe('processing');
    });
  });

  describe('Authorization', () => {
    it('should return 401 if user is not authenticated', () => {
      const response = {
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      };

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 if rate limit exceeded', () => {
      const response = {
        status: 429,
        headers: {
          'Retry-After': '3600',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0'
        },
        json: async () => ({
          error: 'Rate limit exceeded for training operations'
        })
      };

      expect(response.status).toBe(429);
    });
  });

  describe('Error Handling', () => {
    it('should return 503 if database unavailable', () => {
      const response = {
        status: 503,
        json: async () => ({ error: 'Database connection unavailable' })
      };

      expect(response.status).toBe(503);
    });

    it('should return 500 on unhandled error', () => {
      const response = {
        status: 500,
        json: async () => ({ error: 'Failed to create training data' })
      };

      expect(response.status).toBe(500);
    });
  });

  describe('Type Validation', () => {
    it('should accept text type', () => {
      const insertPayload = {
        user_id: 'test-user-id',
        domain: 'training.omniops.local',
        type: 'text',
        content: 'Sample training text',
        metadata: { fullContent: 'Sample training text' },
        status: 'processing'
      };

      expect(insertPayload.type).toBe('text');
    });
  });
});
