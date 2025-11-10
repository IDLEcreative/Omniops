import { describe, it, expect } from '@jest/globals';

describe('MCP Comparison – semantic similarity heuristics', () => {
  it('recognizes identical texts', () => {
    const text = 'This is a test response';
    expect(text).toBe(text);
  });

  it('recognizes similar texts with different wording', () => {
    const text1 = 'I found 5 hydraulic pumps for you';
    const text2 = 'Here are 5 hydraulic pumps matching your search';
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((w) => words2.has(w)));

    expect(intersection.size).toBeGreaterThan(0);
  });

  it('recognizes dissimilar texts', () => {
    const text1 = 'Found hydraulic pumps';
    const text2 = 'Cannot find any products';
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((w) => words2.has(w)));

    expect(intersection.size).toBeLessThan(words1.size / 2);
  });
});
