import { describe, it, expect } from '@jest/globals';

describe('MCP Comparison – token usage helpers', () => {
  it('calculates token savings', () => {
    const traditional = { total: 1500 };
    const mcp = { total: 750 };
    const saved = traditional.total - mcp.total;
    const percent = (saved / traditional.total) * 100;

    expect(saved).toBe(750);
    expect(percent).toBe(50);
  });

  it('handles MCP using more tokens', () => {
    const traditional = { total: 500 };
    const mcp = { total: 800 };
    const saved = traditional.total - mcp.total;
    const percent = (saved / traditional.total) * 100;

    expect(saved).toBe(-300);
    expect(percent).toBe(-60);
  });

  it('handles zero traditional token usage safely', () => {
    const traditional = { total: 0 };
    const mcp = { total: 500 };
    const saved = traditional.total - mcp.total;
    const percent = traditional.total > 0 ? (saved / traditional.total) * 100 : 0;

    expect(percent).toBe(0);
  });
});
