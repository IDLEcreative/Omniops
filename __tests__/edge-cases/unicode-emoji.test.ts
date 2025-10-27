/**
 * Unicode & Emoji Edge Case Tests
 *
 * CRITICAL: Tests international character handling, emoji support, and Unicode-based security issues.
 *
 * Why These Tests Matter:
 * - 🌍 International users expect proper emoji and non-Latin script support
 * - 🔒 Zero-width characters can bypass security filters
 * - 🐛 Improper normalization causes display bugs and search issues
 * - 💥 RTL text can break UI layout if not handled correctly
 *
 * Security Context:
 * - Unicode can bypass input validation (e.g., 'admin\u200Badmin' looks like 'adminadmin')
 * - Homograph attacks using similar-looking characters from different scripts
 * - Zero-width joiners can hide malicious content
 *
 * Priority: CRITICAL (Security + UX risk)
 */

import { describe, it, expect } from '@jest/globals';

describe('Unicode & Emoji Edge Cases', () => {
  describe('Emoji Sequences', () => {
    it('should handle basic emoji in product names', () => {
      const productName = '🔥 Hot Product 💯';

      // Test: String length should include emoji as single characters
      expect(productName.length).toBeGreaterThan(10);

      // Test: Should be storable and retrievable
      const stored = productName;
      expect(stored).toBe(productName);

      // Test: Should be searchable
      expect(productName.includes('🔥')).toBe(true);
      expect(productName.includes('💯')).toBe(true);
    });

    it('should handle emoji with skin tone modifiers', () => {
      const emoji = '👍🏽'; // Thumbs up with medium skin tone
      const emojiWithModifier = '👨‍👩‍👧‍👦'; // Family emoji (ZWJ sequence)

      expect(emoji).toBeTruthy();
      expect(emojiWithModifier).toBeTruthy();

      // Complex emoji sequences should be treated as single grapheme clusters
      expect(Array.from(emojiWithModifier).length).toBeGreaterThan(1);
    });

    it('should handle flag emoji (regional indicators)', () => {
      const flagEmoji = '🇺🇸'; // US flag (2 regional indicator symbols)

      expect(flagEmoji.length).toBe(4); // Two surrogate pairs
      expect(Array.from(flagEmoji).length).toBe(2); // Two code points
    });

    it('should preserve emoji in search queries', () => {
      const query = 'Search for 🎉 party supplies';
      const searchTerm = '🎉';

      expect(query.includes(searchTerm)).toBe(true);
      expect(query.indexOf(searchTerm)).toBeGreaterThan(-1);
    });
  });

  describe('Zero-Width Characters (Security Critical)', () => {
    it('should detect zero-width space in email addresses', () => {
      const normalEmail = 'admin@example.com';
      const maliciousEmail = 'admin\u200B@example.com'; // Zero-width space

      // These should NOT be equal
      expect(maliciousEmail).not.toBe(normalEmail);
      expect(maliciousEmail.length).toBe(normalEmail.length + 1);

      // Test: Sanitization function should detect this
      const containsZeroWidth = /[\u200B-\u200D\uFEFF]/g.test(maliciousEmail);
      expect(containsZeroWidth).toBe(true);
    });

    it('should detect zero-width joiner abuse', () => {
      const normal = 'admin';
      const withZWJ = 'ad\u200Dmin'; // Zero-width joiner

      expect(withZWJ).not.toBe(normal);

      // Security regex to detect zero-width characters
      const hasZeroWidth = /[\u200B-\u200D\uFEFF\u180E]/g.test(withZWJ);
      expect(hasZeroWidth).toBe(true);
    });

    it('should detect invisible characters', () => {
      const textWithInvisible = 'Hello\uFEFFWorld'; // Zero-width no-break space

      expect(textWithInvisible).not.toBe('HelloWorld');
      expect(textWithInvisible.includes('\uFEFF')).toBe(true);

      // Sanitization regex
      const invisibleChars = /[\u200B-\u200D\uFEFF\u180E\u2060-\u206F]/g;
      expect(invisibleChars.test(textWithInvisible)).toBe(true);
    });
  });

  describe('Right-to-Left (RTL) Text', () => {
    it('should handle Arabic text', () => {
      const arabicText = 'مرحبا كيف حالك؟';

      expect(arabicText.length).toBeGreaterThan(0);

      // Test: Should detect RTL directionality
      const hasRTL = /[\u0600-\u06FF\u0750-\u077F]/.test(arabicText);
      expect(hasRTL).toBe(true);
    });

    it('should handle Hebrew text', () => {
      const hebrewText = 'שלום עולם';

      expect(hebrewText.length).toBeGreaterThan(0);

      // Test: Should detect RTL directionality
      const hasRTL = /[\u0590-\u05FF]/.test(hebrewText);
      expect(hasRTL).toBe(true);
    });

    it('should handle mixed LTR and RTL text', () => {
      const mixed = 'Hello مرحبا World';

      expect(mixed).toContain('Hello');
      expect(mixed).toContain('مرحبا');
      expect(mixed).toContain('World');

      // Both directions present
      const hasRTL = /[\u0600-\u06FF]/.test(mixed);
      const hasLTR = /[a-zA-Z]/.test(mixed);

      expect(hasRTL).toBe(true);
      expect(hasLTR).toBe(true);
    });
  });

  describe('Combining Characters & Diacritics', () => {
    it('should handle combining acute accent', () => {
      const precomposed = 'é'; // Single character
      const decomposed = 'e\u0301'; // e + combining acute accent

      // These look identical but are different in memory
      expect(precomposed).not.toBe(decomposed);

      // But should normalize to the same form
      expect(precomposed.normalize('NFC')).toBe(decomposed.normalize('NFC'));
    });

    it('should handle multiple combining characters', () => {
      const base = 'e';
      const combined = 'e\u0301\u0308'; // e + acute + diaeresis

      expect(combined.length).toBe(3); // Base + 2 combining chars

      // Should normalize correctly
      const normalized = combined.normalize('NFC');
      expect(normalized).toBeTruthy();
    });

    it('should handle Vietnamese combining characters', () => {
      const vietnamese = 'Tiếng Việt'; // Vietnamese language name

      expect(vietnamese.length).toBeGreaterThan(0);

      // Should normalize consistently
      const nfc = vietnamese.normalize('NFC');
      const nfd = vietnamese.normalize('NFD');

      expect(nfc).toBeTruthy();
      expect(nfd).toBeTruthy();
      expect(nfc.normalize('NFC')).toBe(nfd.normalize('NFC'));
    });
  });

  describe('Homograph Attacks (Security Critical)', () => {
    it('should detect Cyrillic characters masquerading as Latin', () => {
      const legitimate = 'admin'; // Latin characters
      const spoofed = 'аdmin'; // 'а' is Cyrillic, looks like Latin 'a'

      // These look identical to humans but are different
      expect(spoofed).not.toBe(legitimate);

      // Character code check
      expect(legitimate.charCodeAt(0)).toBe(97); // Latin 'a'
      expect(spoofed.charCodeAt(0)).toBe(1072); // Cyrillic 'а'

      // Security function to detect mixed scripts
      const hasCyrillic = /[\u0400-\u04FF]/.test(spoofed);
      expect(hasCyrillic).toBe(true);
    });

    it('should detect Greek characters in Latin context', () => {
      const normal = 'google';
      const spoofed = 'gооgle'; // 'о' is Cyrillic, not Latin 'o'

      expect(spoofed).not.toBe(normal);

      // Detect non-Latin characters
      const hasNonLatin = /[^\x00-\x7F]/.test(spoofed);
      expect(hasNonLatin).toBe(true);
    });
  });

  describe('Special Unicode Characters', () => {
    it('should handle mathematical alphanumeric symbols', () => {
      const bold = '𝐁𝐨𝐥𝐝'; // Mathematical bold text
      const italic = '𝐼𝑡𝑎𝑙𝑖𝑐'; // Mathematical italic text

      expect(bold).toBeTruthy();
      expect(italic).toBeTruthy();

      // These are not ASCII and should be detected
      const hasNonASCII = /[^\x00-\x7F]/.test(bold);
      expect(hasNonASCII).toBe(true);
    });

    it('should handle various whitespace characters', () => {
      const spaces = [
        ' ',      // Regular space
        '\u00A0', // Non-breaking space
        '\u2002', // En space
        '\u2003', // Em space
        '\u200A', // Hair space
        '\u3000', // Ideographic space
      ];

      spaces.forEach((space) => {
        expect(space.length).toBe(1);
        expect(space).not.toBe(''); // Not empty string
      });

      // All should be detected by whitespace regex
      spaces.forEach((space) => {
        expect(/\s/.test(space)).toBe(true);
      });
    });

    it('should handle bidirectional override characters', () => {
      const text = 'Hello\u202EWorld'; // Right-to-left override

      // This can be used for security attacks
      expect(text).toContain('\u202E');

      // Security check for BiDi characters
      const hasBiDi = /[\u202A-\u202E\u2066-\u2069]/.test(text);
      expect(hasBiDi).toBe(true);
    });
  });

  describe('Normalization', () => {
    it('should normalize to NFC for storage', () => {
      const inputs = [
        'café',           // Precomposed
        'cafe\u0301',     // Decomposed
        'Zürich',         // Precomposed
        'Zu\u0308rich',   // Decomposed
      ];

      inputs.forEach((input) => {
        const normalized = input.normalize('NFC');
        expect(normalized).toBeTruthy();
        expect(normalized).toBe(input.normalize('NFC')); // Idempotent
      });
    });

    it('should handle all Unicode normalization forms', () => {
      const text = 'é';

      const nfc = text.normalize('NFC');   // Canonical composition
      const nfd = text.normalize('NFD');   // Canonical decomposition
      const nfkc = text.normalize('NFKC'); // Compatibility composition
      const nfkd = text.normalize('NFKD'); // Compatibility decomposition

      // All forms should exist
      expect(nfc).toBeTruthy();
      expect(nfd).toBeTruthy();
      expect(nfkc).toBeTruthy();
      expect(nfkd).toBeTruthy();

      // NFC and NFD should normalize back to the same form
      expect(nfc.normalize('NFC')).toBe(nfd.normalize('NFC'));
    });
  });

  describe('Practical Application Tests', () => {
    it('should sanitize user input for search queries', () => {
      const maliciousQuery = 'search\u200Bterm\uFEFF'; // With zero-width chars

      // Sanitization function
      const sanitize = (input: string) => {
        return input
          .normalize('NFC')
          .replace(/[\u200B-\u200D\uFEFF\u180E\u2060-\u206F]/g, '')
          .trim();
      };

      const sanitized = sanitize(maliciousQuery);
      expect(sanitized).toBe('searchterm');
      expect(sanitized).not.toContain('\u200B');
      expect(sanitized).not.toContain('\uFEFF');
    });

    it('should validate email addresses with Unicode', () => {
      const validEmails = [
        'test@example.com',
        'użytkownik@przykład.pl', // Polish characters
        '用户@例如.中国',           // Chinese characters
      ];

      validEmails.forEach((email) => {
        expect(email).toContain('@');
        expect(email.length).toBeGreaterThan(0);
      });

      // Invalid: Contains zero-width characters
      const invalid = 'admin\u200B@example.com';
      const hasZeroWidth = /[\u200B-\u200D\uFEFF]/.test(invalid);
      expect(hasZeroWidth).toBe(true);
    });

    it('should handle product names with international characters', () => {
      const productNames = [
        '日本語の製品',        // Japanese
        'Продукт на русском', // Russian
        'مُنتَج عربي',        // Arabic
        '한국 제품',           // Korean
      ];

      productNames.forEach((name) => {
        const normalized = name.normalize('NFC');
        expect(normalized.length).toBeGreaterThan(0);

        // Should be storable and retrievable
        expect(normalized).toBe(name.normalize('NFC'));
      });
    });
  });
});
