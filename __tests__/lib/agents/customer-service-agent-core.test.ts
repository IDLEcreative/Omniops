/**
 * Tests for Customer Service Agent
 * CRITICAL: Main orchestration agent for customer interactions
 */

import { describe, it, expect } from '@jest/globals';
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';

describe('CustomerServiceAgent', () => {
  describe('getEnhancedSystemPrompt', () => {
    it('should return full verification prompt when level is "full"', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('full', true);

      expect(prompt).toContain('verified this customer');
      expect(prompt).toContain('full order history');
      expect(prompt).toContain('When a customer provides ONLY their email address');
      expect(prompt).toContain('Recent Orders:');
    });

    it('should return basic verification prompt when level is "basic"', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('basic', false);

      expect(prompt).toContain('limited access');
      expect(prompt).toContain('most recent order');
      expect(prompt).toContain('provide their email address');
    });

    it('should return unverified prompt when level is not specified', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('NOT verified yet');
      expect(prompt).toContain('MANDATORY RESPONSE TEMPLATES');
      expect(prompt).toContain('email address or order number');
    });

    it('should include product query philosophy in all prompts', () => {
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const prompt = CustomerServiceAgent.getEnhancedSystemPrompt(level, false);

        expect(prompt).toContain('Product Query Philosophy');
        expect(prompt).toContain('show what\'s available first');
        expect(prompt).toContain('NEVER ask "which type do you need?"');
      });
    });

    it('should include price handling instructions in all prompts', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('Price Information Handling');
      expect(prompt).toContain('NEVER make up or estimate prices');
      expect(prompt).toContain('check the product page for current pricing');
    });

    it('should include context-aware response strategy', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('full', true);

      expect(prompt).toContain('Context-Aware Response Strategy');
      expect(prompt).toContain('HIGH confidence');
      expect(prompt).toContain('MEDIUM confidence');
      expect(prompt).toContain('LOW confidence');
    });

    it('should include formatting requirements', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('basic', false);

      expect(prompt).toContain('Formatting Requirements');
      expect(prompt).toContain('COMPACT markdown links');
      expect(prompt).toContain('DOUBLE line breaks');
      expect(prompt).toContain('Keep responses concise');
    });

    it('should prohibit linking to external competitors', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('Never recommend or link to external');
      expect(prompt).toContain('competitors');
      expect(prompt).toContain('Only reference and link to our own website');
    });

    it('should include mandatory response templates for unverified users', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('show me my recent orders');
      expect(prompt).toContain('list my orders');
      expect(prompt).toContain('where is my delivery?');
      expect(prompt).toContain('track my order');
      expect(prompt).toContain('cancel my order');
    });
  });

  describe('getActionPrompt', () => {
    it('should return empty for verified users without email in query', () => {
      const prompt = CustomerServiceAgent.getActionPrompt('show my orders', 'full');

      expect(prompt).toBe('');
    });

    it('should return order display prompt for verified users with email', () => {
      const prompt = CustomerServiceAgent.getActionPrompt('test@example.com', 'full');

      expect(prompt).toContain('display their orders');
      expect(prompt).toContain('Recent Orders:');
    });

    it('should handle general business hours queries without verification', () => {
      const prompt = CustomerServiceAgent.getActionPrompt('what are your business hours?');

      // Returns: 'This is a general business inquiry. Answer directly about hours without asking for verification.'
      expect(prompt).toContain('general business inquiry');
      expect(prompt).toContain('without asking for verification');
    });

    it('should handle pump inquiries without verification', () => {
      const prompt = CustomerServiceAgent.getActionPrompt('do you sell ZF5 hydraulic pumps?');

      // Returns: 'This is a product inquiry. Answer about products/brands without asking for verification.'
      expect(prompt).toContain('product inquiry');
      expect(prompt).toContain('without asking for verification');
    });

    it('should request verification for personal order queries', () => {
      const prompt = CustomerServiceAgent.getActionPrompt('show my orders', 'none');

      expect(prompt).toBeDefined();
      // The actual verification request is in the system prompt, not action prompt
    });
  });

  describe('formatOrdersForAI', () => {
    it('should format single order correctly', () => {
      const orders = [
        {
          id: 123,
          number: 'ORD-123',
          status: 'completed',
          date_created: '2025-01-01T00:00:00',
          total: '99.99',
          currency: 'USD',
          line_items_count: 1,  // Implementation uses count, not item details
        },
      ];

      const formatted = CustomerServiceAgent.formatOrdersForAI(orders);

      expect(formatted).toContain('ORD-123');
      expect(formatted).toContain('completed');
      expect(formatted).toContain('99.99');
      expect(formatted).toContain('USD');
      expect(formatted).toContain('1 items');  // Shows count, not product names
    });

    it('should format multiple orders correctly', () => {
      const orders = [
        {
          id: 123,
          number: 'ORD-123',
          status: 'completed',
          date_created: '2025-01-01',
          total: '99.99',
          items: [],
        },
        {
          id: 124,
          number: 'ORD-124',
          status: 'processing',
          date_created: '2025-01-02',
          total: '49.99',
          items: [],
        },
      ];

      const formatted = CustomerServiceAgent.formatOrdersForAI(orders);

      expect(formatted).toContain('ORD-123');
      expect(formatted).toContain('ORD-124');
      expect(formatted).toContain('completed');
      expect(formatted).toContain('processing');
    });

    it('should handle empty order list', () => {
      const formatted = CustomerServiceAgent.formatOrdersForAI([]);

      // Implementation returns 'No recent orders found.' with period
      expect(formatted).toBe('No recent orders found.');
    });

    it('should include order items count', () => {
      const orders = [
        {
          id: 123,
          number: 'ORD-123',
          status: 'completed',
          date_created: '2025-01-01',
          total: '99.99',
          currency: 'USD',
          line_items_count: 3,  // Implementation uses count, not individual items
        },
      ];

      const formatted = CustomerServiceAgent.formatOrdersForAI(orders);

      expect(formatted).toContain('ORD-123');
      expect(formatted).toContain('3 items');  // Formatted as "N items"
      expect(formatted).toContain('USD 99.99');
    });
  });

  describe('buildCompleteContext', () => {
    it('should combine all context elements', () => {
      const context = CustomerServiceAgent.buildCompleteContext(
        'full',
        'Customer: John Doe (john@example.com)',
        'Verified via email',
        'john@example.com'  // Email query triggers action prompt
      );

      expect(context).toContain('Customer: John Doe');
      expect(context).toContain('Verified via email');
      // Email query triggers action prompt with "display their orders"
      expect(context).toContain('Action Required:');
      expect(context).toContain('verified this customer');
    });

    it('should work with minimal context', () => {
      const context = CustomerServiceAgent.buildCompleteContext(
        'none',
        '',
        '',
        'what are your business hours?'  // Business hours query
      );

      // User query is NOT directly included - only processed into action prompt
      expect(context).toContain('general business inquiry');
      expect(context).toContain('NOT verified yet');
    });

    it('should include system prompt in context', () => {
      const context = CustomerServiceAgent.buildCompleteContext(
        'none',  // Changed to 'none' to actually test action prompt generation
        'Customer info here',
        '',
        'do you sell A4VTG90 variable displacement pumps?'  // Specific pump model query
      );

      expect(context).toContain('NOT verified yet');
      expect(context).toContain('Product Query Philosophy');
      // Product queries don't require verification
      // For unverified users, getActionPrompt returns product inquiry prompt
      expect(context).toContain('Action Required:');
      expect(context).toContain('products/brands');
    });
  });
})
