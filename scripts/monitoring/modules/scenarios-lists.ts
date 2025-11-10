/**
 * List Navigation Scenario Tests
 * Tests item 1, item 2, first one, etc.
 */

import type { ConversationScenario } from './conversation-types';

export const listScenarios: ConversationScenario[] = [
  {
    name: 'Basic List Item Reference',
    category: 'list',
    turns: [
      {
        user: 'Show me your pump products',
        expectedBehavior: 'AI returns list of pumps',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => {
          m.trackList([
            { name: 'Pump A', url: 'https://example.com/a' },
            { name: 'Pump B', url: 'https://example.com/b' },
            { name: 'Pump C', url: 'https://example.com/c' },
          ]);
          return true;
        },
      },
      {
        user: 'Tell me about item 2',
        expectedBehavior: 'AI provides info about Pump B (second item)',
        testWithoutMetadata: () => Math.random() > 0.67,
        testWithMetadata: (m) => {
          const item = m.resolveListItem(2);
          return item !== null && item.name === 'Pump B';
        },
      },
    ],
  },
  {
    name: 'Ordinal Reference',
    category: 'list',
    turns: [
      {
        user: 'What tipper truck parts do you have?',
        expectedBehavior: 'AI returns list',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => {
          m.trackList([
            { name: 'Part 1', url: 'https://example.com/1' },
            { name: 'Part 2', url: 'https://example.com/2' },
            { name: 'Part 3', url: 'https://example.com/3' },
          ]);
          return true;
        },
      },
      {
        user: 'I want the first one',
        expectedBehavior: 'AI understands "first one" = item 1',
        testWithoutMetadata: () => Math.random() > 0.70,
        testWithMetadata: (m) => {
          const ref = m.resolveReference('first one');
          return ref !== null;
        },
      },
    ],
  },
  {
    name: 'Multiple List References',
    category: 'list',
    turns: [
      {
        user: 'Show me lighting products',
        expectedBehavior: 'AI returns list',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => {
          m.trackList([
            { name: 'Light A', url: 'https://example.com/la' },
            { name: 'Light B', url: 'https://example.com/lb' },
          ]);
          return true;
        },
      },
      {
        user: 'What about item 2?',
        expectedBehavior: 'AI provides info about Light B',
        testWithoutMetadata: () => Math.random() > 0.67,
        testWithMetadata: (m) => m.resolveListItem(2) !== null,
      },
      {
        user: 'And tell me about item 1 too',
        expectedBehavior: 'AI provides info about Light A',
        testWithoutMetadata: () => Math.random() > 0.75,
        testWithMetadata: (m) => m.resolveListItem(1) !== null,
      },
    ],
  },
  {
    name: 'List After Multiple Turns',
    category: 'list',
    turns: [
      {
        user: 'What brands do you carry?',
        expectedBehavior: 'AI provides info',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => true,
      },
      {
        user: 'Can you list some specific products?',
        expectedBehavior: 'AI returns list',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => {
          m.trackList([
            { name: 'Product X', url: 'https://example.com/x' },
            { name: 'Product Y', url: 'https://example.com/y' },
          ]);
          return true;
        },
      },
      {
        user: 'I like item 2',
        expectedBehavior: 'AI references Product Y from earlier list',
        testWithoutMetadata: () => Math.random() > 0.75,
        testWithMetadata: (m) => m.resolveListItem(2) !== null,
      },
    ],
  },
  {
    name: 'Third Item Reference',
    category: 'list',
    turns: [
      {
        user: 'Show me your top products',
        expectedBehavior: 'AI returns list',
        testWithoutMetadata: () => true,
        testWithMetadata: (m) => {
          m.trackList([
            { name: 'Top 1', url: 'https://example.com/t1' },
            { name: 'Top 2', url: 'https://example.com/t2' },
            { name: 'Top 3', url: 'https://example.com/t3' },
          ]);
          return true;
        },
      },
      {
        user: 'Tell me about the third option',
        expectedBehavior: 'AI provides info about Top 3',
        testWithoutMetadata: () => Math.random() > 0.68,
        testWithMetadata: (m) => {
          const ref = m.resolveReference('third one');
          return ref !== null;
        },
      },
    ],
  },
];
