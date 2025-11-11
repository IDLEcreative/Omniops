import { describe, it, expect } from '@jest/globals';

export function runXssTests() {
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
      const eventHandlers = ['onerror=alert(1)', 'onload=fetch("evil.com")', 'onclick=doEvil()', 'onmouseover=alert(1)'];

      eventHandlers.forEach((input) => {
        const hasEventHandler = /on\w+\s*=/i.test(input);
        expect(hasEventHandler).toBe(true);
      });
    });

    it('should sanitize HTML input properly', () => {
      const userInput = '<script>alert("xss")</script>Normal text';

      const sanitize = (input: string) => {
        return input.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]+>/g, '');
      };

      const sanitized = sanitize(userInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('Normal text');
    });

    it('should detect encoded XSS attempts', () => {
      const encodedXSS = ['&lt;script&gt;alert(1)&lt;/script&gt;', '%3Cscript%3Ealert(1)%3C%2Fscript%3E', '&#60;script&#62;'];

      encodedXSS.forEach((input) => {
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
}
