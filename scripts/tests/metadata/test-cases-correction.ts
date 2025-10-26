/**
 * Correction Tracking Test Cases
 * Target: 90% accuracy
 */

import { TestCase } from './types';
import { ConversationTester } from './conversation-tester';

export const correctionTestCases: TestCase[] = [
  {
    name: 'Basic correction: "I meant X not Y"',
    category: 'correction',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "I need parts for ZF5 pump",
        "I can help you find ZF5 pump parts. What specific components do you need?"
      );

      await tester.sendMessage(
        "Sorry, I meant ZF4 not ZF5",
        "Got it! I understand you need ZF4 pump parts, not ZF5. Let me find those for you."
      );

      const context = tester.getContextSummary();
      return context.includes('ZF4') &&
             context.includes('ZF5') &&
             context.includes('corrected');
    }
  },

  {
    name: 'Correction with arrow notation: "X → Y"',
    category: 'correction',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "Show me A4VTG90 pump",
        "Here are the A4VTG90 pump options..."
      );

      await tester.sendMessage(
        "A4VTG90 → A4VTG95",
        "Understood, switching from A4VTG90 to A4VTG95."
      );

      const context = tester.getContextSummary();
      return context.includes('A4VTG95') &&
             context.includes('A4VTG90') &&
             context.includes('corrected');
    }
  },

  {
    name: 'Correction: "not Y but X"',
    category: 'correction',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage(
        "I need mixer parts",
        "What type of mixer parts?"
      );

      await tester.sendMessage(
        "not mixer but pump",
        "Got it, you need pump parts, not mixer parts."
      );

      const context = tester.getContextSummary();
      return context.includes('pump') &&
             context.includes('mixer') &&
             context.includes('corrected');
    }
  },

  {
    name: 'Multiple corrections in one conversation',
    category: 'correction',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      await tester.sendMessage("Show me ZF5", "Here's ZF5...");
      await tester.sendMessage("I meant ZF4 not ZF5", "Got it, ZF4 instead.");
      await tester.sendMessage("And A100 pump", "Showing A100...");
      await tester.sendMessage("Actually A200 not A100", "Switching to A200.");

      const context = tester.getContextSummary();
      const correctionsCount = (context.match(/corrected/gi) || []).length;
      return correctionsCount >= 2;
    }
  },
];
