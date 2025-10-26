/**
 * Numbered List Reference Test Cases
 * Target: 85% accuracy
 */

import { TestCase } from './types';
import { ConversationTester, extractNumberedList } from './conversation-tester';

export const listReferenceTestCases: TestCase[] = [
  {
    name: 'List reference: "item 2"',
    category: 'list_reference',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      const listResponse = `Here are the available pumps:

1. [Cifa Mixer Pump](https://example.com/pump1)
2. [ZF4 Hydraulic Pump](https://example.com/pump2)
3. [A4VTG90 Pump](https://example.com/pump3)`;

      await tester.sendMessage("Show me pumps", listResponse);

      const items = extractNumberedList(listResponse);
      const item2Name = items[1]?.name || '';

      await tester.sendMessage(
        "Tell me about item 2",
        `Item 2 is the ${item2Name}. It's a high-performance hydraulic pump.`
      );

      const manager = tester.getMetadataManager();
      const resolvedItem = manager.resolveListItem(2);

      return resolvedItem !== null && resolvedItem.name === item2Name;
    }
  },

  {
    name: 'List reference: "the first one"',
    category: 'list_reference',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      const listResponse = `Available options:

1. [Product A](https://example.com/a)
2. [Product B](https://example.com/b)
3. [Product C](https://example.com/c)`;

      await tester.sendMessage("Show me options", listResponse);

      const items = extractNumberedList(listResponse);
      const firstItemName = items[0]?.name || '';

      await tester.sendMessage(
        "Tell me about the first one",
        `The first one is ${firstItemName}.`
      );

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("the first one");

      return resolved !== null && resolved.value === firstItemName;
    }
  },

  {
    name: 'List reference: "the second one"',
    category: 'list_reference',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      const listResponse = `Here are your choices:

1. [Choice A](https://example.com/a)
2. [Choice B](https://example.com/b)`;

      await tester.sendMessage("What are my choices?", listResponse);

      await tester.sendMessage(
        "Tell me more about the second one",
        "The second one is Choice B..."
      );

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveReference("the second one");

      return resolved !== null && resolved.value === 'Choice B';
    }
  },

  {
    name: 'List reference: "item 3"',
    category: 'list_reference',
    setup: async () => {},
    execute: async () => {
      const tester = new ConversationTester();

      const listResponse = `Available models:

1. [Model X](https://example.com/x)
2. [Model Y](https://example.com/y)
3. [Model Z](https://example.com/z)`;

      await tester.sendMessage("Show models", listResponse);

      const manager = tester.getMetadataManager();
      const resolved = manager.resolveListItem(3);

      return resolved !== null && resolved.name === 'Model Z';
    }
  },
];
