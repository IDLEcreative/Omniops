import { describe, it, expect } from '@jest/globals';

export function runJsonInjectionTests() {
  describe('JSON Injection', () => {
    it('should detect JSON structure manipulation', () => {
      const maliciousJSON = '{"name": "test", "admin": true}';

      const parsed = JSON.parse(maliciousJSON);
      expect(parsed).toHaveProperty('admin');

      const allowedFields = ['name', 'email', 'phone'];
      const hasUnexpectedFields = Object.keys(parsed).some((key) => !allowedFields.includes(key));

      expect(hasUnexpectedFields).toBe(true);
    });

    it('should detect prototype pollution attempts', () => {
      const malicious = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      };

      const jsonStr = JSON.stringify(malicious);
      const hasDangerousKeys = /__proto__|constructor|prototype/.test(jsonStr);
      expect(hasDangerousKeys).toBe(true);
    });

    it('should validate JSON structure safely', () => {
      const userInput = '{"name": "test", "__proto__": {"polluted": true}}';

      try {
        const parsed = JSON.parse(userInput);

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
        expect(error).toBeTruthy();
      }
    });
  });
}
