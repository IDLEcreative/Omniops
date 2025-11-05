/**
 * MCP Integration Tests
 *
 * Tests the MCP code execution integration in the chat API route
 */

import {
  detectMCPCodeExecution,
  extractMCPCode,
  buildMCPExecutionContext,
  isMCPExecutionEnabled,
  isMCPProgressiveDisclosureEnabled,
  calculateTokenSavings,
  getMCPSystemPrompt
} from '@/lib/chat/mcp-integration';
import { ExecutionContext } from '@/lib/mcp/types';

describe('MCP Integration', () => {
  describe('Environment Configuration', () => {
    beforeEach(() => {
      // Reset environment variables
      delete process.env.MCP_EXECUTION_ENABLED;
      delete process.env.MCP_PROGRESSIVE_DISCLOSURE;
    });

    it('should detect MCP execution is disabled by default', () => {
      expect(isMCPExecutionEnabled()).toBe(false);
    });

    it('should detect MCP execution when enabled', () => {
      process.env.MCP_EXECUTION_ENABLED = 'true';
      expect(isMCPExecutionEnabled()).toBe(true);
    });

    it('should detect progressive disclosure is disabled by default', () => {
      expect(isMCPProgressiveDisclosureEnabled()).toBe(false);
    });

    it('should detect progressive disclosure when enabled', () => {
      process.env.MCP_PROGRESSIVE_DISCLOSURE = 'true';
      expect(isMCPProgressiveDisclosureEnabled()).toBe(true);
    });
  });

  describe('Code Detection', () => {
    it('should detect TypeScript code blocks', () => {
      const message = `
Let me search for that:

\`\`\`typescript
import { searchProducts } from './servers/search/searchProducts';
const results = await searchProducts({ query: "pumps" }, getContext());
console.log(JSON.stringify(results));
\`\`\`
`;

      expect(detectMCPCodeExecution(message)).toBe(true);
    });

    it('should not detect regular text as code', () => {
      const message = 'Let me search for that product for you.';
      expect(detectMCPCodeExecution(message)).toBe(false);
    });

    it('should not detect code blocks in other languages', () => {
      const message = `
\`\`\`javascript
console.log("hello");
\`\`\`
`;

      expect(detectMCPCodeExecution(message)).toBe(false);
    });

    it('should not detect inline code as executable', () => {
      const message = 'Use the `searchProducts` function.';
      expect(detectMCPCodeExecution(message)).toBe(false);
    });
  });

  describe('Code Extraction', () => {
    it('should extract TypeScript code from markdown block', () => {
      const message = `
\`\`\`typescript
import { searchProducts } from './servers/search/searchProducts';
const results = await searchProducts({ query: "pumps" }, getContext());
console.log(JSON.stringify(results));
\`\`\`
`;

      const code = extractMCPCode(message);
      expect(code).not.toBeNull();
      expect(code).toContain('import { searchProducts }');
      expect(code).toContain('await searchProducts');
      expect(code).toContain('console.log');
    });

    it('should return null for messages without code blocks', () => {
      const message = 'Let me search for that.';
      expect(extractMCPCode(message)).toBeNull();
    });

    it('should extract only TypeScript code, not other languages', () => {
      const message = `
\`\`\`javascript
console.log("not typescript");
\`\`\`

\`\`\`typescript
console.log("typescript");
\`\`\`
`;

      const code = extractMCPCode(message);
      expect(code).toBe('console.log("typescript");');
    });

    it('should handle multiline code with proper indentation', () => {
      const message = `
\`\`\`typescript
import { searchProducts } from './servers/search/searchProducts';

const results = await searchProducts({
  query: "hydraulic pumps",
  limit: 10
}, getContext());

console.log(JSON.stringify(results));
\`\`\`
`;

      const code = extractMCPCode(message);
      expect(code).not.toBeNull();
      expect(code).toContain('query: "hydraulic pumps"');
      expect(code).toContain('limit: 10');
    });
  });

  describe('Execution Context Building', () => {
    it('should build complete execution context with all fields', () => {
      const context = buildMCPExecutionContext(
        'example.com',
        'cust_123',
        'conv_456',
        'user_789',
        'woocommerce'
      );

      expect(context).toMatchObject({
        customerId: 'cust_123',
        domain: 'example.com',
        conversationId: 'conv_456',
        userId: 'user_789',
        platform: 'woocommerce'
      });

      expect(context.traceId).toBeDefined();
      expect(context.metadata).toMatchObject({
        source: 'chat-api',
        mcpEnabled: true
      });
      expect(context.metadata?.timestamp).toBeDefined();
    });

    it('should handle missing optional fields with defaults', () => {
      const context = buildMCPExecutionContext(
        'example.com',
        undefined,
        null,
        undefined
      );

      expect(context).toMatchObject({
        customerId: 'unknown',
        domain: 'example.com',
        conversationId: undefined,
        userId: undefined,
        platform: 'generic'
      });
    });

    it('should generate unique trace IDs', () => {
      const context1 = buildMCPExecutionContext('example.com', 'cust_123', 'conv_1');
      const context2 = buildMCPExecutionContext('example.com', 'cust_123', 'conv_1');

      expect(context1.traceId).not.toBe(context2.traceId);
    });

    it('should handle empty domain gracefully', () => {
      const context = buildMCPExecutionContext('', 'cust_123', null);

      expect(context.domain).toBe('unknown');
    });
  });

  describe('Token Savings', () => {
    it('should calculate correct token savings', () => {
      const savings = calculateTokenSavings(5200, 200);
      expect(savings).toBe(5000);
    });

    it('should use default values when not provided', () => {
      const savings = calculateTokenSavings();
      expect(savings).toBe(5000); // 5200 - 200
    });

    it('should handle custom prompt sizes', () => {
      const savings = calculateTokenSavings(10000, 500);
      expect(savings).toBe(9500);
    });
  });

  describe('MCP System Prompt', () => {
    it('should return a concise prompt', () => {
      const prompt = getMCPSystemPrompt();

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeLessThan(2000); // Much smaller than 5,200 token traditional prompt
    });

    it('should include essential MCP instructions', () => {
      const prompt = getMCPSystemPrompt();

      expect(prompt).toContain('MCP servers');
      expect(prompt).toContain('./servers/search/');
      expect(prompt).toContain('import');
      expect(prompt).toContain('getContext()');
      expect(prompt).toContain('console.log');
    });

    it('should mention available server categories', () => {
      const prompt = getMCPSystemPrompt();

      expect(prompt).toContain('search');
      expect(prompt).toContain('commerce');
      expect(prompt).toContain('analytics');
    });

    it('should include usage guidelines', () => {
      const prompt = getMCPSystemPrompt();

      expect(prompt).toContain('search before asking');
      expect(prompt).toContain('SKU');
      expect(prompt).toContain('errors');
      expect(prompt).toContain('conversation context');
    });
  });

  describe('Integration Flow', () => {
    it('should follow correct detection → extraction → execution flow', () => {
      const message = `
\`\`\`typescript
import { searchProducts } from './servers/search/searchProducts';
const results = await searchProducts({ query: "test" }, getContext());
console.log(JSON.stringify(results));
\`\`\`
`;

      // Step 1: Detect code
      expect(detectMCPCodeExecution(message)).toBe(true);

      // Step 2: Extract code
      const code = extractMCPCode(message);
      expect(code).not.toBeNull();
      expect(code).toContain('searchProducts');

      // Step 3: Build context
      const context = buildMCPExecutionContext('example.com', 'cust_123', 'conv_456');
      expect(context.domain).toBe('example.com');

      // Step 4: Would execute (tested in executor.test.ts)
      // expect(await executeCode(code, context)).toBeDefined();
    });

    it('should skip execution when MCP is disabled', () => {
      process.env.MCP_EXECUTION_ENABLED = 'false';

      const message = `
\`\`\`typescript
console.log("test");
\`\`\`
`;

      // Detection works but execution check fails
      expect(detectMCPCodeExecution(message)).toBe(true);
      expect(isMCPExecutionEnabled()).toBe(false);
      // In route.ts, this would skip the execution branch
    });

    it('should handle multiple code blocks (extracts first TypeScript)', () => {
      const message = `
\`\`\`python
print("not this")
\`\`\`

\`\`\`typescript
console.log("extract this");
\`\`\`

\`\`\`typescript
console.log("not this");
\`\`\`
`;

      const code = extractMCPCode(message);
      expect(code).toBe('console.log("extract this");');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed code blocks gracefully', () => {
      const message = '```typescript\n' + 'incomplete code block';

      // Detection still works
      expect(detectMCPCodeExecution(message)).toBe(false);
    });

    it('should handle empty code blocks', () => {
      const message = '```typescript\n\n```';

      const code = extractMCPCode(message);
      // Empty code blocks return null (regex requires at least one char)
      expect(code).toBeNull();
    });

    it('should handle special characters in code', () => {
      const message = `
\`\`\`typescript
const query = "test with \\"quotes\\" and 'apostrophes'";
const regex = /[a-z]+/gi;
console.log(JSON.stringify({ query, regex }));
\`\`\`
`;

      const code = extractMCPCode(message);
      expect(code).not.toBeNull();
      expect(code).toContain('quotes');
      expect(code).toContain('apostrophes');
      expect(code).toContain('/[a-z]+/gi');
    });
  });

  describe('Backward Compatibility', () => {
    it('should not interfere with traditional tool calling when disabled', () => {
      process.env.MCP_EXECUTION_ENABLED = 'false';

      // Traditional tool call format
      const traditionalMessage = 'Let me search for products...';

      // Should not trigger MCP
      expect(detectMCPCodeExecution(traditionalMessage)).toBe(false);
      expect(isMCPExecutionEnabled()).toBe(false);
    });

    it('should support gradual rollout via environment flag', () => {
      // Initially disabled
      expect(isMCPExecutionEnabled()).toBe(false);

      // Enable for testing
      process.env.MCP_EXECUTION_ENABLED = 'true';
      expect(isMCPExecutionEnabled()).toBe(true);

      // Can disable again
      process.env.MCP_EXECUTION_ENABLED = 'false';
      expect(isMCPExecutionEnabled()).toBe(false);
    });
  });
});
