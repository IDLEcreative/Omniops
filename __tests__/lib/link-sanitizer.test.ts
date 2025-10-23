import { describe, it, expect } from '@jest/globals'
import { sanitizeOutboundLinks } from '@/lib/link-sanitizer'

describe('Link Sanitizer - Subdomain Security', () => {
  describe('isAllowedHost logic', () => {
    it('should allow exact domain match', () => {
      const message = 'Check out [our site](https://example.com/page)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).toContain('https://example.com/page')
    })

    it('should allow valid subdomain', () => {
      const message = 'Check out [shop](https://shop.example.com/page)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).toContain('https://shop.example.com/page')
    })

    it('should allow multi-level subdomain', () => {
      const message = 'Visit [api](https://api.v2.example.com/docs)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).toContain('https://api.v2.example.com/docs')
    })

    it('should block malicious suffix match (evil-example.com)', () => {
      const message = 'Click [here](https://evil-example.com/phishing)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      // Should strip the URL, leaving only the link text
      expect(result).not.toContain('https://evil-example.com')
      expect(result).toContain('here')
    })

    it('should block different domain entirely', () => {
      const message = 'Visit [competitor](https://competitor.com/page)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).not.toContain('https://competitor.com')
      expect(result).toContain('competitor')
    })

    it('should handle www prefix correctly', () => {
      const message = 'See [main site](https://www.example.com/page)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).toContain('https://www.example.com/page')
    })

    it('should strip bare external URLs', () => {
      const message = 'Check https://external.com/page for details'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).not.toContain('https://external.com')
    })

    it('should preserve bare same-domain URLs', () => {
      const message = 'Visit https://example.com/page today'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).toContain('https://example.com/page')
    })

    it('should handle case-insensitive domain matching', () => {
      const message = 'Go to [Shop](https://SHOP.EXAMPLE.COM/page)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).toContain('https://SHOP.EXAMPLE.COM/page')
    })

    it('should block partial suffix matches (notexample.com)', () => {
      const message = 'Visit [fake](https://notexample.com/scam)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).not.toContain('https://notexample.com')
      expect(result).toContain('fake')
    })

    it('should handle mixed content (allowed + blocked)', () => {
      const message = `
        Visit [our shop](https://shop.example.com/products)
        But avoid [this](https://evil-example.com/scam)
        And check https://example.com/about
      `
      const result = sanitizeOutboundLinks(message, 'example.com')

      // Allowed links should remain
      expect(result).toContain('https://shop.example.com/products')
      expect(result).toContain('https://example.com/about')

      // Blocked links should be stripped
      expect(result).not.toContain('https://evil-example.com')
      expect(result).toContain('this') // Link text preserved
    })
  })

  describe('edge cases', () => {
    it('should handle null domain gracefully', () => {
      const message = 'Visit [site](https://example.com/page)'
      const result = sanitizeOutboundLinks(message, null)
      // No domain = no sanitization
      expect(result).toBe(message)
    })

    it('should handle empty message', () => {
      const result = sanitizeOutboundLinks('', 'example.com')
      expect(result).toBe('')
    })

    it('should preserve message without links', () => {
      const message = 'This is just plain text without any URLs'
      const result = sanitizeOutboundLinks(message, 'example.com')
      expect(result).toBe(message)
    })

    it('should handle malformed URLs gracefully', () => {
      const message = 'Click [here](not-a-valid-url)'
      const result = sanitizeOutboundLinks(message, 'example.com')
      // Malformed URLs without http/https are not matched by the regex, so they pass through
      expect(result).toContain('here')
      // This is acceptable as relative links don't pose external redirect risk
    })

    it('should clean up excessive whitespace', () => {
      const message = 'Text   with    many     spaces\n\n\n\nmultiple newlines'
      const result = sanitizeOutboundLinks(message, 'example.com')
      // Should replace multiple non-newline spaces with single space
      expect(result).not.toMatch(/[^\S\n]{2,}/)  // No multiple spaces (except newlines)
      // Should limit consecutive newlines to max 2
      expect(result).not.toMatch(/\n{3,}/)  // Max 2 newlines
    })
  })

  describe('security regression tests', () => {
    it('should prevent evil-example.com bypass (CVE-2024-XXXXX)', () => {
      const maliciousPayloads = [
        'https://evil-example.com/phishing',
        'https://malicious-example.com/steal',
        'https://fake-example.com/scam',
        'https://notexample.com/bad',
      ]

      maliciousPayloads.forEach(url => {
        const message = `Click [here](${url})`
        const result = sanitizeOutboundLinks(message, 'example.com')
        expect(result).not.toContain(url)
      })
    })

    it('should allow legitimate subdomains (no false positives)', () => {
      const legitimateUrls = [
        'https://shop.example.com/products',
        'https://api.example.com/v1',
        'https://cdn.example.com/assets',
        'https://blog.example.com/post',
      ]

      legitimateUrls.forEach(url => {
        const message = `Visit [link](${url})`
        const result = sanitizeOutboundLinks(message, 'example.com')
        expect(result).toContain(url)
      })
    })
  })
})
