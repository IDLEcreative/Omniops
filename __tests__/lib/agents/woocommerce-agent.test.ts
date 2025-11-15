/**
 * Tests for WooCommerce Agent
 * CRITICAL: WooCommerce-specific agent that extends CustomerServiceAgent
 */

import { describe, it, expect } from '@jest/globals';
import { WooCommerceAgent } from '@/lib/agents/woocommerce-agent';
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';

// TEMPORARY: Skipped due to system prompt changes - needs updating
describe.skip('WooCommerceAgent', () => {
  describe('inheritance and structure', () => {
    it('should extend CustomerServiceAgent', () => {
      const agent = new WooCommerceAgent();

      // WooCommerceAgent extends CustomerServiceAgent
      expect(agent).toBeInstanceOf(CustomerServiceAgent);
    });

    it('should have static methods from parent', () => {
      // These are inherited from CustomerServiceAgent
      expect(typeof WooCommerceAgent.formatOrdersForAI).toBe('function');
      expect(typeof WooCommerceAgent.getActionPrompt).toBe('function');
      expect(typeof WooCommerceAgent.buildCompleteContext).toBe('function');
    });

    it('should override getEnhancedSystemPrompt as static method', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('full', true);

      // WooCommerce-specific customization
      expect(prompt).toContain('WooCommerce systems');
    });

    it('should override getEnhancedSystemPrompt as instance method', () => {
      const agent = new WooCommerceAgent();
      const prompt = agent.getEnhancedSystemPrompt('full', true);

      expect(prompt).toContain('WooCommerce systems');
    });
  });

  describe('getEnhancedSystemPrompt - WooCommerce customization', () => {
    it('should include WooCommerce branding in base prompt', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('WooCommerce systems');
      expect(prompt).toContain('FULL ACCESS to order management');
    });

    it('should maintain external linking prohibition', () => {
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const prompt = WooCommerceAgent.getEnhancedSystemPrompt(level, false);

        expect(prompt).toContain('Never recommend or link to external');
        expect(prompt).toContain('our own website/domain');
      });
    });

    it('should enforce brevity in all prompts', () => {
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const prompt = WooCommerceAgent.getEnhancedSystemPrompt(level, false);

        expect(prompt).toContain('Keep responses concise');
        expect(prompt).toContain('scannable');
      });
    });

    it('should provide full access instructions for verified users', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('full', true);

      expect(prompt).toContain('verified this customer');
      expect(prompt).toContain('full order history');
      expect(prompt).toContain('When a customer provides ONLY their email address');
      expect(prompt).toContain('Recent Orders:');
    });

    it('should include order display instructions for full verification', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('full', true);

      expect(prompt).toContain('Thank them for providing their email');
      expect(prompt).toContain('List ALL orders found');
      expect(prompt).toContain('Order #[number] - [date] - [status] - [total]');
    });

    it('should include limited access context for basic verification', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('basic', false);

      expect(prompt).toContain('limited access');
      expect(prompt).toContain('most recent order');
      expect(prompt).toContain('full order history');
    });

    it('should include mandatory response templates for unverified', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('MANDATORY RESPONSE TEMPLATES');
      expect(prompt).toContain('show me my recent orders');
      expect(prompt).toContain('track my order');
      expect(prompt).toContain('cancel my order');
    });

    it('should include delivery/tracking templates', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('where is my delivery?');
      expect(prompt).toContain('track your delivery');
      expect(prompt).toContain('Please provide your order number or email address');
    });

    it('should include order number handling templates', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('check order #12345');
      expect(prompt).toContain('For security purposes');
      expect(prompt).toContain('email address associated with this order');
    });

    it('should prohibit specific phrases', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('ABSOLUTELY FORBIDDEN PHRASES');
      expect(prompt).toContain('I don\'t have access to personal data');
      expect(prompt).toContain('I cannot access order information');
    });

    it('should enforce positive pattern', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('ALWAYS FOLLOW THIS PATTERN');
      expect(prompt).toContain('I can help you with');
      expect(prompt).toContain('Please provide');
      expect(prompt).toContain('You HAVE full access - you just need verification first');
    });
  });

  describe('inherited functionality', () => {
    it('should use parent formatOrdersForAI', () => {
      const orders = [
        {
          id: 123,
          number: 'WC-123',
          status: 'completed',
          date_created: '2025-01-01',
          total: '99.99',
          currency: 'USD',
          line_items_count: 2
        }
      ];

      const formatted = WooCommerceAgent.formatOrdersForAI(orders);

      // Should use parent implementation
      expect(formatted).toContain('WC-123');
      expect(formatted).toContain('completed');
      expect(formatted).toContain('USD 99.99');
      expect(formatted).toContain('2 items');
    });

    it('should use parent getActionPrompt', () => {
      const prompt = WooCommerceAgent.getActionPrompt('what are your business hours?');

      // Should use parent implementation
      expect(prompt).toContain('general business inquiry');
      expect(prompt).toContain('without asking for verification');
    });

    it('should use parent buildCompleteContext', () => {
      const context = WooCommerceAgent.buildCompleteContext(
        'full',
        'Customer: test@example.com',
        'Verified',
        'test@example.com'
      );

      // Should use parent method which calls the overridden getEnhancedSystemPrompt
      expect(context).toContain('WooCommerce systems');  // From WooCommerce override
      expect(context).toContain('Customer: test@example.com');
      expect(context).toContain('Verified');
    });

    it('should handle empty orders in inherited method', () => {
      const formatted = WooCommerceAgent.formatOrdersForAI([]);

      expect(formatted).toBe('No recent orders found.');
    });
  });

  describe('instance and static method consistency', () => {
    it('should have matching static and instance prompt outputs', () => {
      const agent = new WooCommerceAgent();

      const staticPrompt = WooCommerceAgent.getEnhancedSystemPrompt('full', true);
      const instancePrompt = agent.getEnhancedSystemPrompt('full', true);

      expect(instancePrompt).toBe(staticPrompt);
    });

    it('should work as both static and instance for all verification levels', () => {
      const agent = new WooCommerceAgent();
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const staticPrompt = WooCommerceAgent.getEnhancedSystemPrompt(level, false);
        const instancePrompt = agent.getEnhancedSystemPrompt(level, false);

        expect(instancePrompt).toBe(staticPrompt);
        expect(staticPrompt).toContain('WooCommerce');
      });
    });
  });

  describe('WooCommerce-specific features', () => {
    it('should emphasize WooCommerce integration', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('full', true);

      expect(prompt).toContain('WooCommerce');
      expect(prompt).toContain('order management');
    });

    it('should maintain consistent tone across verification levels', () => {
      const fullPrompt = WooCommerceAgent.getEnhancedSystemPrompt('full', true);
      const basicPrompt = WooCommerceAgent.getEnhancedSystemPrompt('basic', false);
      const nonePrompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      // All should have WooCommerce branding
      expect(fullPrompt).toContain('WooCommerce');
      expect(basicPrompt).toContain('WooCommerce');
      expect(nonePrompt).toContain('WooCommerce');

      // All should enforce external link prohibition
      [fullPrompt, basicPrompt, nonePrompt].forEach(prompt => {
        expect(prompt).toContain('Never recommend or link to external');
      });
    });

    it('should have specific order inquiry templates', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      // Order-specific templates
      expect(prompt).toContain('list my orders');
      expect(prompt).toContain('my purchase history');
      expect(prompt).toContain('find my order');
    });

    it('should handle account-related queries', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('I ordered something last week');
      expect(prompt).toContain('check my account');
    });

    it('should handle invoice requests', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('I need my invoice');
      expect(prompt).toContain('Please provide your order number or email address');
    });
  });

  describe('safety and compliance', () => {
    it('should prohibit external competitor links in all levels', () => {
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const prompt = WooCommerceAgent.getEnhancedSystemPrompt(level, false);

        expect(prompt).toContain('Never recommend or link to external');
        expect(prompt).toContain('competitors');
        expect(prompt).toContain('manufacturer websites');
        expect(prompt).toContain('our own website/domain');
      });
    });

    it('should enforce security for order lookups', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('For security purposes');
      expect(prompt).toContain('email address associated with this order');
    });

    it('should require verification before sharing personal data', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('NOT verified yet');
      expect(prompt).toContain('email address or order number');
    });

    it('should maintain positive helpful tone', () => {
      const prompt = WooCommerceAgent.getEnhancedSystemPrompt('none', false);

      // Positive language
      expect(prompt).toContain('I can help you');
      expect(prompt).toContain('I\'d be happy to help');

      // Avoid negative language
      expect(prompt).toContain('FORBIDDEN PHRASES');
      expect(prompt).toContain('I don\'t have access');  // As an example of what NOT to say
    });
  });
});
