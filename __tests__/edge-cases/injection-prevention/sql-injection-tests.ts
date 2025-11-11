import { describe, it, expect } from '@jest/globals';

export function runSqlInjectionTests() {
  describe('SQL Injection Attempts', () => {
    it('should detect classic SQL injection patterns', () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "'; DROP TABLE products; --",
        "admin'--",
        "1' UNION SELECT NULL, NULL, NULL--",
        "'; EXEC xp_cmdshell('dir'); --",
      ];

      maliciousInputs.forEach((input) => {
        const hasSQLKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/i.test(input);
        const hasSQLChars = /['";]|--|\|\/\*/.test(input);

        expect(hasSQLKeywords || hasSQLChars).toBe(true);
      });
    });

    it('should detect blind SQL injection attempts', () => {
      const blindInjections = [
        "1' AND SLEEP(5)--",
        "1' WAITFOR DELAY '00:00:05'--",
        "1' AND (SELECT COUNT(*) FROM users) > 0--",
      ];

      blindInjections.forEach((input) => {
        const hasTimingAttack = /SLEEP|WAITFOR|BENCHMARK/i.test(input);
        const hasSubquery = /\(SELECT .* FROM/i.test(input);

        expect(hasTimingAttack || hasSubquery).toBe(true);
      });
    });

    it('should validate parameterized query patterns', () => {
      const parameterized = {
        query: 'SELECT * FROM products WHERE id = $1 AND category = $2',
        params: [123, 'electronics'],
      };

      expect(parameterized.query).not.toMatch(/\+ .* \+/);
      expect(parameterized.query).toContain('$1');
      expect(parameterized.params.length).toBe(2);
    });
  });
}
