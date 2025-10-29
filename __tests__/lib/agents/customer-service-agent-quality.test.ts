/**
 * Tests for Customer Service Agent - Quality & Safety Checks
 * CRITICAL: Validates safety checks and formatting requirements
 */

import { describe, it, expect } from '@jest/globals';
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';

describe('CustomerServiceAgent - Quality & Safety', () => {
  describe('instance methods', () => {
    it('should work as instance methods', () => {
      const agent = new CustomerServiceAgent();

      const prompt = agent.getEnhancedSystemPrompt('full', true);
      expect(prompt).toContain('verified this customer');

      const action = agent.getActionPrompt('test query');
      expect(action).toBeDefined();

      const formatted = agent.formatOrdersForAI([]);
      expect(formatted).toBe('No recent orders found.');

      const context = agent.buildCompleteContext('none', '', '', 'query');
      expect(context).toBeDefined();
    });

    it('should match static method outputs', () => {
      const agent = new CustomerServiceAgent();

      const instancePrompt = agent.getEnhancedSystemPrompt('full', true);
      const staticPrompt = CustomerServiceAgent.getEnhancedSystemPrompt('full', true);

      expect(instancePrompt).toBe(staticPrompt);
    });
  });

  describe('critical safety checks', () => {
    it('should never suggest making up prices', () => {
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const prompt = CustomerServiceAgent.getEnhancedSystemPrompt(level, false);
        expect(prompt).toContain('NEVER make up');
      });
    });

    it('should always require verification for personal data', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('email address or order number');
      expect(prompt).toContain('NOT verified');
    });

    it('should prohibit linking to external sites', () => {
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const prompt = CustomerServiceAgent.getEnhancedSystemPrompt(level, false);
        expect(prompt).toContain('Never recommend or link to external');
        expect(prompt).toContain('our own website');
      });
    });

    it('should always show available pumps first', () => {
      const levels = ['full', 'basic', 'none'];

      levels.forEach((level) => {
        const prompt = CustomerServiceAgent.getEnhancedSystemPrompt(level, false);
        expect(prompt).toContain('show what\'s available first');
        expect(prompt).toContain('NEVER ask "which type do you need?" before showing options');
      });
    });
  });

  describe('response formatting', () => {
    it('should enforce proper markdown link format', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('full', true);

      expect(prompt).toContain('COMPACT markdown links');
      expect(prompt).toContain('[Product Name](url)');
      expect(prompt).toContain('never show raw URLs');
    });

    it('should require double line breaks between bullets', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('basic', false);

      expect(prompt).toContain('DOUBLE line breaks');
      expect(prompt).toContain('separate line');
    });

    it('should enforce concise responses', () => {
      const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('none', false);

      expect(prompt).toContain('Keep responses concise');
      expect(prompt).toContain('scannable');
    });
  });
});
