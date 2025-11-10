import { describe, it, expect } from '@jest/globals';
import { escapeHtml, escapeRegex } from '@/lib/search/highlighter/html-escape';

/**
 * HTML Escape Utilities Test Suite
 * Tests XSS prevention and regex escaping
 */

describe('HTML Escape Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      const result = escapeHtml('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape less than signs', () => {
      const result = escapeHtml('5 < 10');
      expect(result).toBe('5 &lt; 10');
    });

    it('should escape greater than signs', () => {
      const result = escapeHtml('10 > 5');
      expect(result).toBe('10 &gt; 5');
    });

    it('should escape double quotes', () => {
      const result = escapeHtml('He said "Hello"');
      expect(result).toBe('He said &quot;Hello&quot;');
    });

    it('should escape single quotes', () => {
      const result = escapeHtml("It's a test");
      expect(result).toBe('It&#039;s a test');
    });

    it('should escape all special characters together', () => {
      const result = escapeHtml('<script>alert("XSS & injection")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS &amp; injection&quot;)&lt;/script&gt;');
    });

    it('should handle plain text without special characters', () => {
      const result = escapeHtml('Hello world');
      expect(result).toBe('Hello world');
    });

    it('should handle empty string', () => {
      const result = escapeHtml('');
      expect(result).toBe('');
    });

    it('should prevent XSS injection attempts', () => {
      const malicious = '<img src=x onerror="alert(\'XSS\')"/>';
      const result = escapeHtml(malicious);
      expect(result).toBe('&lt;img src=x onerror=&quot;alert(&#039;XSS&#039;)&quot;/&gt;');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('onerror="'); // Full attribute should be escaped
    });

    it('should handle multiple consecutive special characters', () => {
      const result = escapeHtml('<<<&&&>>>');
      expect(result).toBe('&lt;&lt;&lt;&amp;&amp;&amp;&gt;&gt;&gt;');
    });

    it('should preserve whitespace', () => {
      const result = escapeHtml('  Hello   World  ');
      expect(result).toBe('  Hello   World  ');
    });

    it('should handle numbers and letters', () => {
      const result = escapeHtml('abc123XYZ');
      expect(result).toBe('abc123XYZ');
    });

    it('should escape in mixed content', () => {
      const result = escapeHtml('Price: $19.99 <span class="sale">50% off!</span>');
      expect(result).toBe('Price: $19.99 &lt;span class=&quot;sale&quot;&gt;50% off!&lt;/span&gt;');
    });
  });

  describe('escapeRegex', () => {
    it('should escape dot', () => {
      const result = escapeRegex('.');
      expect(result).toBe('\\.');
    });

    it('should escape asterisk', () => {
      const result = escapeRegex('*');
      expect(result).toBe('\\*');
    });

    it('should escape plus', () => {
      const result = escapeRegex('+');
      expect(result).toBe('\\+');
    });

    it('should escape question mark', () => {
      const result = escapeRegex('?');
      expect(result).toBe('\\?');
    });

    it('should escape caret', () => {
      const result = escapeRegex('^');
      expect(result).toBe('\\^');
    });

    it('should escape dollar sign', () => {
      const result = escapeRegex('$');
      expect(result).toBe('\\$');
    });

    it('should escape curly braces', () => {
      const result = escapeRegex('{}');
      expect(result).toBe('\\{\\}');
    });

    it('should escape parentheses', () => {
      const result = escapeRegex('()');
      expect(result).toBe('\\(\\)');
    });

    it('should escape square brackets', () => {
      const result = escapeRegex('[]');
      expect(result).toBe('\\[\\]');
    });

    it('should escape backslash', () => {
      const result = escapeRegex('\\');
      expect(result).toBe('\\\\');
    });

    it('should escape pipe', () => {
      const result = escapeRegex('|');
      expect(result).toBe('\\|');
    });

    it('should escape all regex special characters', () => {
      const result = escapeRegex('.*+?^${}()|[]\\');
      expect(result).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('should handle price format', () => {
      const result = escapeRegex('$19.99');
      expect(result).toBe('\\$19\\.99');
    });

    it('should handle email format', () => {
      const result = escapeRegex('test@example.com');
      expect(result).toBe('test@example\\.com');
    });

    it('should handle plain text', () => {
      const result = escapeRegex('hello');
      expect(result).toBe('hello');
    });

    it('should handle empty string', () => {
      const result = escapeRegex('');
      expect(result).toBe('');
    });

    it('should make safe for regex use', () => {
      const escaped = escapeRegex('.*test?');
      const regex = new RegExp(escaped);
      const text = '.*test? exactly';

      expect(text.match(regex)).toBeTruthy();
      expect(text.match(regex)![0]).toBe('.*test?');
    });

    it('should handle complex search terms', () => {
      const term = 'price: $19.99 (50% off!)';
      const escaped = escapeRegex(term);
      const regex = new RegExp(escaped);

      expect(term.match(regex)).toBeTruthy();
    });
  });
});
