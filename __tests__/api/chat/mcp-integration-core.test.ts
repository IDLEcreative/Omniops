/**
 * MCP Integration - Core Functionality Tests
 *
 * Tests environment configuration, code detection, extraction,
 * and context building for MCP integration.
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

describe('MCP Integration - Core', () => {
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
      expect(prompt.length).toBeLessThan(2000);
    });

    it('should include essential MCP instructions', () => {
      const prompt = getMCPSystemPrompt();

      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('./servers/');
      expect(prompt).toContain('import');
      expect(prompt).toContain('Tools');
      expect(prompt).toContain('Usage Pattern');
    });

    it('should mention available server categories', () => {
      const prompt = getMCPSystemPrompt();

      expect(prompt).toContain('search');
      expect(prompt).toContain('commerce');
      expect(prompt).toContain('content');
    });

    it('should include usage guidelines', () => {
      const prompt = getMCPSystemPrompt();

      expect(prompt).toContain('Usage Pattern');
      expect(prompt).toContain('searchProducts');
      expect(prompt).toContain('lookupOrder');
      expect(prompt).toContain('getProductDetails');
    });
  });
});
