import { describe, it, expect } from '@jest/globals';
import { stripHtml, groupByConversation } from '@/lib/exports/pdf-utils';
import type { SearchResult } from '@/lib/search/conversation-search';

/**
 * PDF Utilities Test Suite
 * Tests HTML stripping and conversation grouping utilities
 */

describe('PDF Utils', () => {
  describe('stripHtml', () => {
    it('should remove HTML tags from string', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = stripHtml(input);
      expect(result).toBe('Hello world');
    });

    it('should handle self-closing tags', () => {
      const input = 'Line 1<br/>Line 2<hr/>Line 3';
      const result = stripHtml(input);
      expect(result).toBe('Line 1Line 2Line 3');
    });

    it('should handle nested tags', () => {
      const input = '<div><span><strong>Nested</strong> content</span></div>';
      const result = stripHtml(input);
      expect(result).toBe('Nested content');
    });

    it('should handle empty string', () => {
      const result = stripHtml('');
      expect(result).toBe('');
    });

    it('should handle string with no HTML', () => {
      const input = 'Plain text content';
      const result = stripHtml(input);
      expect(result).toBe('Plain text content');
    });

    it('should handle malformed HTML gracefully', () => {
      const input = '<div>Unclosed tag';
      const result = stripHtml(input);
      expect(result).toBe('Unclosed tag');
    });
  });

  describe('groupByConversation', () => {
    const mockResults: SearchResult[] = [
      {
        conversationId: 'conv-1',
        content: 'Message 1',
        role: 'user',
        createdAt: '2024-01-01T10:00:00Z',
        relevanceScore: 0.9,
        highlight: null,
        customerEmail: 'test@example.com',
        domainName: 'example.com',
        sentiment: 'neutral'
      },
      {
        conversationId: 'conv-1',
        content: 'Message 2',
        role: 'assistant',
        createdAt: '2024-01-01T10:01:00Z',
        relevanceScore: 0.8,
        highlight: null,
        customerEmail: 'test@example.com',
        domainName: 'example.com',
        sentiment: 'positive'
      },
      {
        conversationId: 'conv-2',
        content: 'Message 3',
        role: 'user',
        createdAt: '2024-01-01T11:00:00Z',
        relevanceScore: 0.7,
        highlight: null,
        customerEmail: 'user2@example.com',
        domainName: 'example.com',
        sentiment: 'neutral'
      }
    ];

    it('should group messages by conversation ID', () => {
      const grouped = groupByConversation(mockResults);

      expect(grouped.size).toBe(2);
      expect(grouped.has('conv-1')).toBe(true);
      expect(grouped.has('conv-2')).toBe(true);
    });

    it('should preserve all messages in each conversation', () => {
      const grouped = groupByConversation(mockResults);

      const conv1Messages = grouped.get('conv-1');
      const conv2Messages = grouped.get('conv-2');

      expect(conv1Messages).toHaveLength(2);
      expect(conv2Messages).toHaveLength(1);
    });

    it('should sort messages chronologically within conversations', () => {
      // Create unsorted messages
      const unsortedResults: SearchResult[] = [
        {
          conversationId: 'conv-1',
          content: 'Message 3',
          role: 'assistant',
          createdAt: '2024-01-01T10:03:00Z',
          relevanceScore: 0.7,
          highlight: null,
          customerEmail: 'test@example.com',
          domainName: 'example.com',
          sentiment: 'neutral'
        },
        {
          conversationId: 'conv-1',
          content: 'Message 1',
          role: 'user',
          createdAt: '2024-01-01T10:01:00Z',
          relevanceScore: 0.9,
          highlight: null,
          customerEmail: 'test@example.com',
          domainName: 'example.com',
          sentiment: 'neutral'
        },
        {
          conversationId: 'conv-1',
          content: 'Message 2',
          role: 'assistant',
          createdAt: '2024-01-01T10:02:00Z',
          relevanceScore: 0.8,
          highlight: null,
          customerEmail: 'test@example.com',
          domainName: 'example.com',
          sentiment: 'neutral'
        }
      ];

      const grouped = groupByConversation(unsortedResults);
      const messages = grouped.get('conv-1')!;

      expect(messages[0].content).toBe('Message 1');
      expect(messages[1].content).toBe('Message 2');
      expect(messages[2].content).toBe('Message 3');
    });

    it('should handle empty results array', () => {
      const grouped = groupByConversation([]);
      expect(grouped.size).toBe(0);
    });

    it('should handle single message', () => {
      const singleResult = [mockResults[0]];
      const grouped = groupByConversation(singleResult);

      expect(grouped.size).toBe(1);
      expect(grouped.get('conv-1')).toHaveLength(1);
    });

    it('should preserve all message properties', () => {
      const grouped = groupByConversation(mockResults);
      const firstMessage = grouped.get('conv-1')![0];

      expect(firstMessage.conversationId).toBe('conv-1');
      expect(firstMessage.content).toBe('Message 1');
      expect(firstMessage.role).toBe('user');
      expect(firstMessage.relevanceScore).toBe(0.9);
      expect(firstMessage.customerEmail).toBe('test@example.com');
      expect(firstMessage.domainName).toBe('example.com');
    });
  });
});
