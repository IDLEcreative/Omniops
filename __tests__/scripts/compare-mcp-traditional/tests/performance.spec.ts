import { describe, it, expect } from '@jest/globals';

describe('MCP Comparison – performance metrics helpers', () => {
  it('identifies MCP as faster', () => {
    const traditional = { executionTime: 1000 };
    const mcp = { executionTime: 750 };
    const improvement = ((traditional.executionTime - mcp.executionTime) / traditional.executionTime) * 100;

    expect(improvement).toBe(25);
  });

  it('identifies MCP as slower', () => {
    const traditional = { executionTime: 800 };
    const mcp = { executionTime: 1000 };
    const improvement = ((traditional.executionTime - mcp.executionTime) / traditional.executionTime) * 100;

    expect(improvement).toBe(-25);
  });

  it('handles zero execution time safely', () => {
    const traditional = { executionTime: 0 };
    const mcp = { executionTime: 500 };
    const improvement = traditional.executionTime > 0 ? ((traditional.executionTime - mcp.executionTime) / traditional.executionTime) * 100 : 0;

    expect(improvement).toBe(0);
  });
});
