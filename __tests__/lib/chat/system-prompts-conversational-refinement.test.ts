/**
 * Integration Tests for Conversational Refinement System Prompt
 * Tests Priority 6 (Phase 2 Enhancements) - Conversational Refinement Prompt
 */

import { describe, test, expect } from '@jest/globals';
import { getConversationalRefinementPrompt } from '@/lib/chat/system-prompts/sections/conversational-refinement';
import { getCustomerServicePrompt } from '@/lib/chat/system-prompts';

describe('Conversational Refinement System Prompt', () => {
  describe('Prompt Content Validation', () => {
    test('should return non-empty prompt', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should include main section header', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('CONVERSATIONAL REFINEMENT');
      expect(prompt).toContain('HANDLING BROAD QUERIES');
    });

    test('should include when to offer refinement section', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('When to Offer Refinement');
      expect(prompt).toContain('Query is very broad');
      expect(prompt).toContain('Many results (>8 products)');
      expect(prompt).toContain('Results span multiple categories');
      expect(prompt).toContain('varying similarity scores');
    });

    test('should include how to offer refinement section', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('How to Offer Refinement');
      expect(prompt).toContain('Group Results by Natural Categories');
      expect(prompt).toContain('Present Groups with Context');
      expect(prompt).toContain('Progressive Narrowing');
    });

    test('should include all refinement strategies', () => {
      const prompt = getConversationalRefinementPrompt();

      // All 4 refinement strategies should be documented
      expect(prompt).toContain('By Category');
      expect(prompt).toContain('By Price Range');
      expect(prompt).toContain('By Availability');
      expect(prompt).toContain('By Match Quality');
    });

    test('should include when NOT to offer refinement section', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('When NOT to Offer Refinement');
      expect(prompt).toContain('Query is already specific');
      expect(prompt).toContain('Few results (<5 products)');
      expect(prompt).toContain('All results very similar');
      expect(prompt).toContain('User explicitly requested all results');
    });

    test('should include ranking information usage guidance', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('Use Ranking Information');
      expect(prompt).toContain('rankingScore');
      expect(prompt).toContain('rankingSignals');
      expect(prompt).toContain('rankingExplanation');
    });

    test('should include tone and language guidelines', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('Tone and Language');
      expect(prompt).toContain('conversational and helpful');
      expect(prompt).toContain('Not robotic');
      expect(prompt).toContain('proactive but not pushy');
    });

    test('should include context tracking guidance', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('Remember Context');
      expect(prompt).toContain('Track what user has already refined');
      expect(prompt).toContain('Don\'t offer same refinement twice');
      expect(prompt).toContain('Build on previous choices');
      expect(prompt).toContain('Allow user to backtrack');
    });

    test('should include final result presentation guidance', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('Final Result Presentation');
      expect(prompt).toContain('manageable set (<5 products)');
      expect(prompt).toContain('Full product details');
      expect(prompt).toContain('Ranking explanation');
      expect(prompt).toContain('Similarity scores');
    });
  });

  describe('Example Validation', () => {
    test('should include good vs bad examples', () => {
      const prompt = getConversationalRefinementPrompt();

      // Should have explicit good/bad examples
      expect(prompt).toContain('Good Example');
      expect(prompt).toContain('Not:');
    });

    test('should include progressive narrowing example flow', () => {
      const prompt = getConversationalRefinementPrompt();

      // Should demonstrate multi-turn refinement
      expect(prompt).toContain('Example Flow');
      expect(prompt).toContain('User: I need gloves');
      expect(prompt).toContain('User: Work gloves');
      expect(prompt).toContain('User: Budget options');
    });

    test('should include final presentation example', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('Example Final Presentation');
      expect(prompt).toContain('Perfect!');
      expect(prompt).toContain('Heavy Duty Work Gloves');
      expect(prompt).toContain('Excellent semantic match');
      expect(prompt).toContain('In stock');
    });
  });

  describe('Grouping Strategies Validation', () => {
    test('should document category grouping strategy', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('By Category');
      expect(prompt).toContain('product categories');
      expect(prompt).toContain('Pumps (12), Parts (8), Accessories (5)');
    });

    test('should document price range grouping strategy', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('By Price Range');
      expect(prompt).toContain('Budget (under £50)');
      expect(prompt).toContain('Mid-range (£50-£150)');
      expect(prompt).toContain('Premium (over £150)');
    });

    test('should document availability grouping strategy', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('By Availability');
      expect(prompt).toContain('In stock');
      expect(prompt).toContain('On backorder');
      expect(prompt).toContain('Out of stock');
    });

    test('should document match quality grouping strategy', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('By Match Quality');
      expect(prompt).toContain('Excellent match (90-100%)');
      expect(prompt).toContain('Good match (75-89%)');
      expect(prompt).toContain('Moderate match (60-74%)');
    });
  });

  describe('Integration with Base Prompt', () => {
    test('should be included in base customer service prompt', () => {
      const basePrompt = getCustomerServicePrompt();
      const refinementPrompt = getConversationalRefinementPrompt();

      expect(basePrompt).toContain(refinementPrompt);
    });

    test('should appear after response formatting section', () => {
      const basePrompt = getCustomerServicePrompt();

      // Find positions of key sections
      const responseFormattingPos = basePrompt.indexOf('RESPONSE FORMATTING');
      const conversationalRefinementPos = basePrompt.indexOf('CONVERSATIONAL REFINEMENT');
      const wooCommerceWorkflowPos = basePrompt.indexOf('WOOCOMMERCE OPERATIONS');

      // Conversational refinement should be between response formatting and WooCommerce operations section
      expect(conversationalRefinementPos).toBeGreaterThan(responseFormattingPos);
      expect(conversationalRefinementPos).toBeLessThan(wooCommerceWorkflowPos);
    });

    test('should not have duplicate sections in base prompt', () => {
      const basePrompt = getCustomerServicePrompt();

      // Count occurrences of the section header
      const matches = basePrompt.match(/CONVERSATIONAL REFINEMENT/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(1);
    });

    test('should maintain proper formatting with surrounding sections', () => {
      const basePrompt = getCustomerServicePrompt();

      // Should have proper newline separation
      expect(basePrompt).toContain('\n\n');

      // Should not have excessive newlines (formatting issue)
      expect(basePrompt).not.toContain('\n\n\n\n\n');
    });
  });

  describe('Prompt Quality Standards', () => {
    test('should use consistent emoji markers', () => {
      const prompt = getConversationalRefinementPrompt();

      expect(prompt).toContain('🔍'); // Search/refinement emoji
      expect(prompt).toContain('✅'); // Positive examples
      expect(prompt).toContain('❌'); // Negative examples
    });

    test('should use clear section hierarchy', () => {
      const prompt = getConversationalRefinementPrompt();

      // Main sections use ##
      expect(prompt).toContain('## When to Offer Refinement');
      expect(prompt).toContain('## How to Offer Refinement');
      expect(prompt).toContain('## Refinement Strategies');

      // Subsections use ###
      expect(prompt).toContain('### 1. Group Results');
      expect(prompt).toContain('### By Category');
    });

    test('should be under reasonable size (<10KB)', () => {
      const prompt = getConversationalRefinementPrompt();
      const sizeInKB = new Blob([prompt]).size / 1024;

      // Section prompts should be compact
      expect(sizeInKB).toBeLessThan(10);
    });

    test('should use consistent terminology', () => {
      const prompt = getConversationalRefinementPrompt();

      // Should consistently use "refinement" not "filtering" or "narrowing"
      const refinementCount = (prompt.match(/refinement/gi) || []).length;
      expect(refinementCount).toBeGreaterThan(5);

      // Should use "products" consistently
      const productsCount = (prompt.match(/products/gi) || []).length;
      expect(productsCount).toBeGreaterThan(10);
    });
  });

  describe('Conversational Guidance Validation', () => {
    test('should provide complete conversational guidance (tone, approach, context)', () => {
      const prompt = getConversationalRefinementPrompt();

      // Conversational tone
      expect(prompt).toContain('I found several options');
      expect(prompt).toContain('let me help you narrow it down');
      expect(prompt).toContain('Would you like to see');
      expect(prompt).toContain('Not robotic');

      // Proactive but not pushy
      expect(prompt).toContain('proactive but not pushy');
      expect(prompt).toContain('You must choose');

      // Context tracking
      expect(prompt).toContain('Track what user has already refined');
      expect(prompt).toContain('Don\'t offer same refinement twice');
      expect(prompt).toContain('Build on previous choices progressively');
    });
  });

  describe('Ranking Integration Validation', () => {
    test('should explain ranking data usage with examples', () => {
      const prompt = getConversationalRefinementPrompt();

      // Ranking data explanation
      expect(prompt).toContain('rankingScore');
      expect(prompt).toContain('Final combined score (0-1)');
      expect(prompt).toContain('rankingSignals');
      expect(prompt).toContain('semantic, stock, price, popularity, recency');
      expect(prompt).toContain('rankingExplanation');

      // Ranking-based refinement examples
      expect(prompt).toContain('top matches (90%+ similarity)');
      expect(prompt).toContain('hydraulic pumps (8 products)');
      expect(prompt).toContain('centrifugal pumps (5 products, 75% match)');
    });
  });
});
