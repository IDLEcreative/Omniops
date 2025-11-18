/**
 * Tests for HTML Sanitization Utility
 *
 * Validates XSS prevention across all common attack vectors
 */

import { sanitizeHtml, sanitizeConfigHtml, containsDangerousHtml } from '@/lib/utils/sanitize-html';

describe('sanitizeHtml', () => {
  describe('XSS Attack Prevention', () => {
    it('should remove script tags', () => {
      const dirty = '<p>Hello</p><script>alert("XSS")</script>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('<p>Hello</p>');
      expect(clean).not.toContain('script');
    });

    it('should remove inline event handlers', () => {
      const attacks = [
        '<div onclick="alert(1)">Click</div>',
        '<img onerror="alert(1)" src="x">',
        '<body onload="alert(1)">',
        '<input onfocus="alert(1)">',
        '<select onchange="alert(1)">',
        '<form onsubmit="alert(1)">',
        '<button onmouseover="alert(1)">Hover</button>',
      ];

      attacks.forEach(attack => {
        const clean = sanitizeHtml(attack);
        expect(clean).not.toContain('onclick');
        expect(clean).not.toContain('onerror');
        expect(clean).not.toContain('onload');
        expect(clean).not.toContain('onfocus');
        expect(clean).not.toContain('onchange');
        expect(clean).not.toContain('onsubmit');
        expect(clean).not.toContain('onmouseover');
        expect(clean).not.toContain('alert');
      });
    });

    it('should remove javascript: protocol in links', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('alert');
    });

    it('should remove data: protocol in images', () => {
      const dirty = '<img src="data:text/html,<script>alert(1)</script>">';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('data:');
      expect(clean).not.toContain('script');
    });

    it('should remove iframe tags', () => {
      const dirty = '<p>Content</p><iframe src="evil.com"></iframe>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('<p>Content</p>');
      expect(clean).not.toContain('iframe');
    });

    it('should remove object and embed tags', () => {
      const attacks = [
        '<object data="evil.swf"></object>',
        '<embed src="evil.swf">',
      ];

      attacks.forEach(attack => {
        const clean = sanitizeHtml(attack);
        expect(clean).not.toContain('object');
        expect(clean).not.toContain('embed');
      });
    });

    it('should remove style tags and style attributes', () => {
      const dirty = '<style>body { display: none; }</style><p style="display:none">Hidden</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('style');
    });

    it('should prevent DOM clobbering attacks', () => {
      const attacks = [
        '<form name="getElementById"></form>',
        '<img name="body">',
        '<input name="location">',
      ];

      attacks.forEach(attack => {
        const clean = sanitizeHtml(attack);
        // Should not contain form or input tags
        expect(clean).not.toContain('form');
        expect(clean).not.toContain('input');
      });
    });

    it('should handle nested XSS attempts', () => {
      const dirty = '<div><script>alert(1)</script><p onclick="alert(2)">Text</p></div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('<div><p>Text</p></div>');
      expect(clean).not.toContain('script');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
    });

    it('should prevent SVG-based XSS', () => {
      const dirty = '<svg onload="alert(1)"><script>alert(2)</script></svg>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('svg');
      expect(clean).not.toContain('onload');
      expect(clean).not.toContain('script');
    });

    it('should block data attributes that could be used for attacks', () => {
      const dirty = '<div data-bind="alert(1)">Content</div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('data-bind');
    });
  });

  describe('Safe HTML Preservation', () => {
    it('should preserve safe text formatting tags', () => {
      const safe = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>';
      const clean = sanitizeHtml(safe);
      expect(clean).toBe(safe);
    });

    it('should preserve safe links with http/https protocols', () => {
      const safe = '<a href="https://example.com">Link</a>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('href="https://example.com"');
    });

    it('should preserve safe lists', () => {
      const safe = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('<ul>');
      expect(clean).toContain('<li>');
    });

    it('should preserve headings', () => {
      const safe = '<h1>Title</h1><h2>Subtitle</h2>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('<h1>');
      expect(clean).toContain('<h2>');
    });

    it('should preserve code blocks', () => {
      const safe = '<pre><code>const x = 42;</code></pre>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('<pre>');
      expect(clean).toContain('<code>');
    });

    it('should preserve search highlights with mark tags', () => {
      const safe = '<p>Found <mark>search term</mark> in content</p>';
      const clean = sanitizeHtml(safe);
      expect(clean).toBe(safe);
      expect(clean).toContain('<mark>');
    });

    it('should preserve safe class and id attributes', () => {
      const safe = '<div class="container" id="main">Content</div>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('class="container"');
      expect(clean).toContain('id="main"');
    });

    it('should preserve tables', () => {
      const safe = '<table><tr><td>Cell</td></tr></table>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('<table>');
      expect(clean).toContain('<tr>');
      expect(clean).toContain('<td>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const text = 'Just plain text';
      expect(sanitizeHtml(text)).toBe(text);
    });

    it('should handle malformed HTML gracefully', () => {
      const dirty = '<p>Unclosed tag<div>Content</p>';
      const clean = sanitizeHtml(dirty);
      // DOMPurify should fix malformed HTML without throwing
      expect(() => sanitizeHtml(dirty)).not.toThrow();
      expect(clean).toBeTruthy();
    });

    it('should handle very long strings', () => {
      const longString = '<p>' + 'a'.repeat(10000) + '</p>';
      const clean = sanitizeHtml(longString);
      expect(clean).toContain('<p>');
      expect(clean.length).toBeGreaterThan(10000);
    });

    it('should remove script tags and their content for security', () => {
      const dirty = '<p>Safe text</p><script>Dangerous code</script>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('Safe text');
      expect(clean).not.toContain('Dangerous code'); // Script content removed for security
      expect(clean).not.toContain('script'); // Tag removed
    });
  });

  describe('Real-World Search Highlight Scenarios', () => {
    it('should sanitize search highlights with user-generated queries', () => {
      // Simulating a malicious search query that got highlighted
      const malicious = '<p>Result: <mark><script>alert(1)</script></mark></p>';
      const clean = sanitizeHtml(malicious);
      expect(clean).toContain('<mark>');
      expect(clean).not.toContain('script');
      expect(clean).not.toContain('alert');
    });

    it('should handle multiple highlight marks safely', () => {
      const safe = '<p>First <mark>match</mark> and second <mark>match</mark></p>';
      const clean = sanitizeHtml(safe);
      expect(clean).toBe(safe);
    });

    it('should sanitize conversation content with mixed safe and dangerous HTML', () => {
      const mixed = `
        <p>User message with <strong>formatting</strong></p>
        <script>alert("XSS")</script>
        <p>More <mark>highlighted</mark> content</p>
      `;
      const clean = sanitizeHtml(mixed);
      expect(clean).toContain('<strong>');
      expect(clean).toContain('<mark>');
      expect(clean).not.toContain('script');
      expect(clean).not.toContain('alert');
    });
  });
});

describe('sanitizeConfigHtml', () => {
  it('should allow only code formatting tags', () => {
    const safe = '<pre><code>const x = 42;</code></pre>';
    const clean = sanitizeConfigHtml(safe);
    expect(clean).toContain('<pre>');
    expect(clean).toContain('<code>');
  });

  it('should remove all links from config', () => {
    const dirty = '<code>Visit <a href="evil.com">here</a></code>';
    const clean = sanitizeConfigHtml(dirty);
    expect(clean).not.toContain('<a');
    expect(clean).not.toContain('href');
    expect(clean).toContain('here'); // Text preserved
  });

  it('should remove scripts from config', () => {
    const dirty = '<pre>Config<script>alert(1)</script></pre>';
    const clean = sanitizeConfigHtml(dirty);
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('alert');
  });

  it('should be more restrictive than general sanitization', () => {
    const html = '<p>Text</p><code>Code</code>';
    const generalClean = sanitizeHtml(html);
    const configClean = sanitizeConfigHtml(html);

    expect(generalClean).toContain('<p>'); // General allows <p>
    expect(configClean).not.toContain('<p>'); // Config doesn't allow <p>
    expect(configClean).toContain('Text'); // But preserves text
    expect(configClean).toContain('<code>'); // Both allow <code>
  });
});

describe('containsDangerousHtml', () => {
  it('should detect dangerous scripts', () => {
    const dangerous = '<p>Text</p><script>alert(1)</script>';
    expect(containsDangerousHtml(dangerous)).toBe(true);
  });

  it('should detect inline event handlers', () => {
    const dangerous = '<div onclick="alert(1)">Click</div>';
    expect(containsDangerousHtml(dangerous)).toBe(true);
  });

  it('should not flag safe HTML', () => {
    const safe = '<p>This is <strong>safe</strong> HTML</p>';
    expect(containsDangerousHtml(safe)).toBe(false);
  });

  it('should not flag plain text', () => {
    const text = 'Just plain text';
    expect(containsDangerousHtml(text)).toBe(false);
  });

  it('should detect iframes', () => {
    const dangerous = '<p>Text</p><iframe src="evil.com"></iframe>';
    expect(containsDangerousHtml(dangerous)).toBe(true);
  });
});

describe('Integration Tests', () => {
  describe('ConversationPreview Use Case', () => {
    it('should safely render message highlights from search results', () => {
      const messageHighlight = 'User asked about <mark>product availability</mark>';
      const clean = sanitizeHtml(messageHighlight);

      expect(clean).toContain('<mark>');
      expect(clean).toContain('product availability');
    });

    it('should prevent XSS in malicious message content', () => {
      const maliciousMessage = 'Check out this <script>alert("steal cookies")</script> deal!';
      const clean = sanitizeHtml(maliciousMessage);

      expect(clean).not.toContain('script');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('deal!'); // Keeps text content
    });
  });

  describe('Widget Configuration Use Case', () => {
    it('should safely handle widget config with code blocks', () => {
      const config = '<pre><code>window.ChatWidgetConfig = {...}</code></pre>';
      const clean = sanitizeConfigHtml(config);

      expect(clean).toContain('<pre>');
      expect(clean).toContain('<code>');
      expect(clean).toContain('window.ChatWidgetConfig');
    });

    it('should prevent script injection in generated config', () => {
      const malicious = '<code>Good code</code><script>Bad code</script>';
      const clean = sanitizeConfigHtml(malicious);

      expect(clean).toContain('Good code');
      expect(clean).not.toContain('script');
    });
  });
});
