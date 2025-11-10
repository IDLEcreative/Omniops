import { describe, it, expect } from '@jest/globals';
import { parseQueryTerms, isStopWord } from '@/lib/search/highlighter/query-parser';

/**
 * Query Parser Test Suite
 * Tests search term extraction with quoted phrases and stop word filtering
 */

describe('Query Parser', () => {
  describe('parseQueryTerms', () => {
    it('should parse simple single word query', () => {
      const terms = parseQueryTerms('hello');
      expect(terms).toEqual(['hello']);
    });

    it('should parse multiple words', () => {
      const terms = parseQueryTerms('hello world');
      expect(terms).toEqual(['hello', 'world']);
    });

    it('should filter out stop words', () => {
      const terms = parseQueryTerms('the quick brown fox');
      expect(terms).toEqual(['quick', 'brown', 'fox']);
      expect(terms).not.toContain('the');
    });

    it('should handle quoted phrases', () => {
      const terms = parseQueryTerms('"hello world" test');
      expect(terms).toContain('hello world');
      expect(terms).toContain('test');
    });

    it('should preserve quoted phrases with stop words', () => {
      const terms = parseQueryTerms('"the quick brown fox"');
      expect(terms).toEqual(['the quick brown fox']);
    });

    it('should handle multiple quoted phrases', () => {
      const terms = parseQueryTerms('"first phrase" middle "second phrase"');
      expect(terms).toContain('first phrase');
      expect(terms).toContain('second phrase');
      expect(terms).toContain('middle');
    });

    it('should handle empty query', () => {
      const terms = parseQueryTerms('');
      expect(terms).toEqual([]);
    });

    it('should handle query with only stop words', () => {
      const terms = parseQueryTerms('the and or');
      expect(terms).toEqual([]);
    });

    it('should trim whitespace', () => {
      const terms = parseQueryTerms('  hello   world  ');
      expect(terms).toEqual(['hello', 'world']);
    });

    it('should handle mixed case', () => {
      const terms = parseQueryTerms('Hello WORLD Test');
      expect(terms).toEqual(['Hello', 'WORLD', 'Test']);
    });

    it('should filter stop words case-insensitively', () => {
      const terms = parseQueryTerms('The And Or test');
      expect(terms).toEqual(['test']);
    });

    it('should handle special characters in quotes', () => {
      const terms = parseQueryTerms('"hello@world.com" test');
      expect(terms).toContain('hello@world.com');
    });

    it('should handle unclosed quotes gracefully', () => {
      const terms = parseQueryTerms('"unclosed quote test');
      // Should treat as regular words
      expect(terms).toContain('unclosed');
      expect(terms).toContain('quote');
      expect(terms).toContain('test');
    });

    it('should handle empty quoted phrases', () => {
      const terms = parseQueryTerms('"" test');
      expect(terms).toContain('test');
      // Empty phrases should be filtered out
      expect(terms).not.toContain('');
    });

    it('should handle complex query with all features', () => {
      const terms = parseQueryTerms('"exact match" the word1 and "another phrase" word2');
      expect(terms).toContain('exact match');
      expect(terms).toContain('another phrase');
      expect(terms).toContain('word1');
      expect(terms).toContain('word2');
      expect(terms).not.toContain('the');
      expect(terms).not.toContain('and');
    });
  });

  describe('isStopWord', () => {
    const commonStopWords = [
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by',
      'for', 'from', 'has', 'he', 'in', 'is', 'it',
      'its', 'of', 'on', 'that', 'the', 'to', 'was',
      'will', 'with', 'or', 'not'
    ];

    it.each(commonStopWords)('should identify "%s" as a stop word', (word) => {
      expect(isStopWord(word)).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isStopWord('THE')).toBe(true);
      expect(isStopWord('The')).toBe(true);
      expect(isStopWord('the')).toBe(true);
    });

    const contentWords = ['hello', 'world', 'test', 'search', 'query'];

    it.each(contentWords)('should identify "%s" as NOT a stop word', (word) => {
      expect(isStopWord(word)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isStopWord('')).toBe(false);
    });

    it('should handle numbers as not stop words', () => {
      expect(isStopWord('123')).toBe(false);
      expect(isStopWord('42')).toBe(false);
    });

    it('should handle special characters as not stop words', () => {
      expect(isStopWord('@#$')).toBe(false);
      expect(isStopWord('test@example.com')).toBe(false);
    });
  });
});
