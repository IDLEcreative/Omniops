/**
 * Pronoun Resolution Test Cases
 * Target: 85% accuracy
 */

import { TestCase } from './types';
import { ConversationTester } from './conversation-tester';

export const pronounResolutionTestCases: TestCase[] = [
  {
    name: 'Pronoun: "it" refers to mentioned product',
    category: 'pronoun',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "Do you have the A4VTG90 pump?",
        "Yes, we have the [A4VTG90 pump](https://example.com/pump) in stock."
      );

      await tester.sendMessage(
        "How much does it cost?",
        "The A4VTG90 pump costs $1,499."
      );

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("it");

      return resolved !== null && resolved.value.includes('A4VTG90');
    }
  },

  {
    name: 'Pronoun chain: "it" persists across multiple turns',
    category: 'pronoun',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "Show me the ZF4 pump",
        "Here's the [ZF4 pump](https://example.com/zf4)."
      );

      await tester.sendMessage(
        "How much does it cost?",
        "The ZF4 pump costs $899."
      );

      await tester.sendMessage(
        "Is it in stock?",
        "Yes, the ZF4 pump is in stock."
      );

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("it");

      return resolved !== null && resolved.value.includes('ZF4');
    }
  },

  {
    name: 'Pronoun: "that" refers to recent entity',
    category: 'pronoun',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "I need the hydraulic mixer",
        "I can help you with the [hydraulic mixer](https://example.com/mixer)."
      );

      await tester.sendMessage(
        "What are the specs for that?",
        "The hydraulic mixer specifications are..."
      );

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("that");

      return resolved !== null && resolved.value.includes('hydraulic mixer');
    }
  },

  {
    name: 'Pronoun: "one" after alternatives',
    category: 'pronoun',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "Do you have the A4VTG90?",
        "Yes, we have the [A4VTG90](https://example.com/a4vtg90)."
      );

      await tester.sendMessage(
        "Do you have alternatives to it?",
        "Alternatives include [A4VTG95](https://example.com/a4vtg95) and [A4VTG100](https://example.com/a4vtg100)."
      );

      await tester.sendMessage(
        "Which one would you recommend?",
        "I'd recommend the A4VTG95 as a good balance."
      );

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("one");

      // Should resolve to one of the mentioned products
      return resolved !== null && (
        resolved.value.includes('A4VTG90') ||
        resolved.value.includes('A4VTG95') ||
        resolved.value.includes('A4VTG100')
      );
    }
  },

  {
    name: 'Order reference: "my order"',
    category: 'pronoun',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "Check order #12345",
        "I found your order #12345. Status: Processing."
      );

      await tester.sendMessage(
        "When will my order arrive?",
        "Your order #12345 will arrive in 3-5 business days."
      );

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("my order");

      return resolved !== null && resolved.value === '12345';
    }
  },

  {
    name: 'Pronoun with context switching',
    category: 'pronoun',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      // First product
      await tester.sendMessage(
        "Show me Product A",
        "Here's [Product A](https://example.com/a)."
      );

      await tester.sendMessage(
        "What's the price of it?",
        "Product A costs $100."
      );

      // Switch to new product
      await tester.sendMessage(
        "Now show me Product B",
        "Here's [Product B](https://example.com/b)."
      );

      // "it" should now refer to Product B (most recent)
      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("it");

      return resolved !== null && resolved.value.includes('Product B');
    }
  },
];
