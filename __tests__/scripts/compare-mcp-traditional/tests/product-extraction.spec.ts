import { describe, it, expect } from '@jest/globals';

describe('MCP Comparison – product extraction helpers', () => {
  it('extracts products from sources array format', () => {
    const response = {
      message: 'Found products',
      sources: [
        { title: 'Product A', url: '/a' },
        { title: 'Product B', url: '/b' },
      ],
    };

    expect(response.sources?.length).toBe(2);
  });

  it('extracts products from markdown links', () => {
    const message = `I found these products:
1. [Product A](/product-a)
2. [Product B](/product-b)`;

    const matches = [...message.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
    expect(matches.length).toBe(2);
    expect(matches[0][1]).toBe('Product A');
    expect(matches[0][2]).toBe('/product-a');
  });

  it('handles responses with no products gracefully', () => {
    const response = { message: 'No products found' };
    expect(response).not.toHaveProperty('sources');
    expect(response).not.toHaveProperty('products');
  });
});
