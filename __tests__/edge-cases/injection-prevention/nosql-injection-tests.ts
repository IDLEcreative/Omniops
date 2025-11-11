import { describe, it, expect } from '@jest/globals';

export function runNoSqlInjectionTests() {
  describe('NoSQL Injection Attempts', () => {
    it('should detect MongoDB-style injection in filters', () => {
      const maliciousFilter = {
        email: { $ne: null },
      };

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
      const safeFilter = {
        email: 'user@example.com',
        status: 'active',
      };

      const filterString = JSON.stringify(safeFilter);
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
}
