import { describe, it, expect } from '@jest/globals';

export function runPathTraversalTests() {
  describe('Path Traversal Attempts', () => {
    it('should detect directory traversal patterns', () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'file:///../etc/hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f',
      ];

      traversalAttempts.forEach((input) => {
        const hasTraversal = /\.\.+[\/\\]|%2e|%5c/i.test(input);
        expect(hasTraversal).toBe(true);
      });
    });

    it('should detect absolute path attempts', () => {
      const absolutePaths = ['/etc/passwd', 'C:\\Windows\\System32', 'file:///etc/passwd'];

      absolutePaths.forEach((input) => {
        const isAbsolute = /^[A-Z]:\\|^\/|^file:/i.test(input);
        expect(isAbsolute).toBe(true);
      });
    });

    it('should validate safe relative paths', () => {
      const safePaths = ['documents/file.pdf', 'images/photo.jpg', 'products/product-123.json'];

      safePaths.forEach((path) => {
        const isSafe = !/^\/|\.\./.test(path);
        expect(isSafe).toBe(true);
      });
    });
  });
}
