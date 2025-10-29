/**
 * Tests for Intelligent Customer Service Agent
 * FOCUS: Natural language approach with trust in AI capabilities
 */

import { describe, it, expect } from '@jest/globals';
import { IntelligentCustomerServiceAgent } from '@/lib/agents/customer-service-agent-intelligent';

describe('IntelligentCustomerServiceAgent', () => {
  describe('buildSystemPrompt', () => {
    it('should create base prompt with core values', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt();

      expect(prompt).toContain('intelligent customer service assistant');
      expect(prompt).toContain('genuinely helpful');
      expect(prompt).toContain('authentic empathy');
      expect(prompt).toContain('Admit uncertainty when appropriate');
    });

    it('should include full access context for verified customers', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt('full');

      expect(prompt).toContain('full order history and account details');
      expect(prompt).toContain('personalized, helpful responses');
      expect(prompt).toContain('Reference specific order numbers');
    });

    it('should include limited access context for basic verification', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt('basic');

      expect(prompt).toContain('most recent order');
      expect(prompt).toContain('additional verification');
      expect(prompt).toContain('Limited Access');
    });

    it('should include verification request for unverified users', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt('none');

      expect(prompt).toContain('isn\'t verified yet');
      expect(prompt).toContain('email or order number');
      expect(prompt).toContain('Be understanding');
    });

    it('should use natural, warm language tone', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt();

      // Check for natural language indicators
      expect(prompt).toContain('natural, warm language');
      expect(prompt).toContain('conversational');
      expect(prompt).not.toContain('MANDATORY');
      expect(prompt).not.toContain('FORBIDDEN');
    });

    it('should have product handling guidelines', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt();

      expect(prompt).toContain('When customers mention products');
      expect(prompt).toContain('help them find what they need');
    });

    it('should have formatting guidance', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt();

      expect(prompt).toContain('Format product listings clearly');
      expect(prompt).toContain('Keep responses concise but complete');
    });
  });

  describe('formatCustomerData', () => {
    it('should return empty string for null data', () => {
      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(null);
      expect(formatted).toBe('');
    });

    it('should return empty string for undefined data', () => {
      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(undefined);
      expect(formatted).toBe('');
    });

    it('should format email if present', () => {
      const data = {
        email: 'customer@example.com'
      };

      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(data);

      expect(formatted).toContain('Customer Information');
      expect(formatted).toContain('Email: customer@example.com');
    });

    it('should format single order correctly', () => {
      const data = {
        email: 'test@example.com',
        orders: [
          {
            number: '12345',
            date: '2025-01-15',
            status: 'completed',
            total: '$99.99'
          }
        ]
      };

      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(data);

      expect(formatted).toContain('Recent Orders');
      expect(formatted).toContain('Order #12345');
      expect(formatted).toContain('2025-01-15');
      expect(formatted).toContain('completed');
      expect(formatted).toContain('$99.99');
    });

    it('should format multiple orders correctly', () => {
      const data = {
        orders: [
          { number: '001', date: '2025-01-01', status: 'shipped', total: '$50' },
          { number: '002', date: '2025-01-10', status: 'delivered', total: '$75' },
          { number: '003', date: '2025-01-20', status: 'processing', total: '$100' }
        ]
      };

      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(data);

      expect(formatted).toContain('Order #001');
      expect(formatted).toContain('Order #002');
      expect(formatted).toContain('Order #003');
      expect(formatted).toContain('shipped');
      expect(formatted).toContain('delivered');
      expect(formatted).toContain('processing');
    });

    it('should include notes if present', () => {
      const data = {
        email: 'test@example.com',
        notes: 'VIP customer - priority support'
      };

      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(data);

      expect(formatted).toContain('Notes: VIP customer - priority support');
    });

    it('should handle data with all fields', () => {
      const data = {
        email: 'premium@example.com',
        orders: [
          { number: 'VIP-001', date: '2025-01-01', status: 'express', total: '$500' }
        ],
        notes: 'Premium member since 2020'
      };

      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(data);

      expect(formatted).toContain('premium@example.com');
      expect(formatted).toContain('VIP-001');
      expect(formatted).toContain('Premium member since 2020');
    });

    it('should handle empty orders array', () => {
      const data = {
        email: 'new@example.com',
        orders: []
      };

      const formatted = IntelligentCustomerServiceAgent.formatCustomerData(data);

      expect(formatted).toContain('Email:');  // Capital E in formatted output
      expect(formatted).not.toContain('Recent Orders');
    });
  });

  describe('buildCompleteContext', () => {
    it('should combine system prompt, customer data, and query', () => {
      const customerData = {
        email: 'john@example.com',
        orders: [
          { number: '123', date: '2025-01-01', status: 'shipped', total: '$99' }
        ]
      };

      const context = IntelligentCustomerServiceAgent.buildCompleteContext(
        'full',
        customerData,
        'Where is my order?'
      );

      expect(context).toContain('full order history');
      expect(context).toContain('john@example.com');
      expect(context).toContain('Order #123');
      expect(context).toContain('Customer Query: "Where is my order?"');
    });

    it('should work with minimal customer data', () => {
      const context = IntelligentCustomerServiceAgent.buildCompleteContext(
        'none',
        null,
        'Do you sell A4VTG90 hydraulic pumps?'
      );

      expect(context).toContain('isn\'t verified yet');
      expect(context).toContain('Customer Query: "Do you sell A4VTG90 hydraulic pumps?"');
    });

    it('should include verification context for unverified users', () => {
      const context = IntelligentCustomerServiceAgent.buildCompleteContext(
        'none',
        null,
        'Show me my orders'
      );

      expect(context).toContain('Verification Needed');
      expect(context).toContain('email or order number');
    });

    it('should handle basic verification level', () => {
      const customerData = {
        email: 'limited@example.com',
        orders: [
          { number: 'LATEST', date: '2025-01-20', status: 'processing', total: '$50' }
        ]
      };

      const context = IntelligentCustomerServiceAgent.buildCompleteContext(
        'basic',
        customerData,
        'What is my order status?'
      );

      expect(context).toContain('Limited Access');
      expect(context).toContain('most recent order');
      expect(context).toContain('LATEST');
    });

    it('should properly structure the complete context', () => {
      const context = IntelligentCustomerServiceAgent.buildCompleteContext(
        'full',
        { email: 'test@example.com' },
        'Test query'
      );

      // Should have three main sections
      expect(context).toContain('customer service assistant');  // System prompt
      expect(context).toContain('Customer Information');         // Customer data
      expect(context).toContain('Customer Query:');              // User query
    });
  });

  describe('philosophy and approach', () => {
    it('should emphasize natural conversation over templates', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt('none');

      // Should use natural language
      expect(prompt).toContain('Naturally ask for');
      expect(prompt).toContain('Be understanding');

      // Should NOT have rigid templates
      expect(prompt).not.toContain('MANDATORY RESPONSE TEMPLATES');
      expect(prompt).not.toContain('EXACTLY');
    });

    it('should encourage empathy and understanding', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt();

      expect(prompt).toContain('empathy');
      expect(prompt).toContain('understanding');
      expect(prompt).toContain('warm');
    });

    it('should allow for uncertainty and honesty', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt();

      expect(prompt).toContain('Admit uncertainty when appropriate');
      expect(prompt).toContain('accurate information');
    });

    it('should prioritize helpfulness over strict rules', () => {
      const prompt = IntelligentCustomerServiceAgent.buildSystemPrompt();

      expect(prompt).toContain('genuinely helpful');
      expect(prompt).toContain('conversational');

      // Verify it's less prescriptive than the standard agent
      expect(prompt).not.toContain('FORBIDDEN');
      expect(prompt).not.toContain('CRITICAL:');
    });
  });
});
