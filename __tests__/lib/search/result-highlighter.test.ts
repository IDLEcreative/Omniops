import { highlightMatches, highlightWithContext } from '@/lib/search/result-highlighter';

describe('Result Highlighter', () => {
  describe('highlightMatches', () => {
    it('should highlight single word matches', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const query = 'fox';

      const result = highlightMatches(text, query);

      expect(result).toContain('<mark>fox</mark>');
      expect(result).not.toContain('<mark>brown</mark>');
    });

    it('should highlight multiple word matches', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const query = 'quick lazy';

      const result = highlightMatches(text, query);

      expect(result).toContain('<mark>quick</mark>');
      expect(result).toContain('<mark>lazy</mark>');
    });

    it('should handle case-insensitive matching by default', () => {
      const text = 'The QUICK brown FOX';
      const query = 'quick fox';

      const result = highlightMatches(text, query);

      expect(result).toContain('<mark>QUICK</mark>');
      expect(result).toContain('<mark>FOX</mark>');
    });

    it('should handle case-sensitive matching when specified', () => {
      const text = 'The QUICK brown fox';
      const query = 'quick';

      const result = highlightMatches(text, query, { caseSensitive: true });

      expect(result).not.toContain('<mark>');
      expect(result).toContain('QUICK'); // Not highlighted
    });

    it('should escape HTML to prevent XSS', () => {
      const text = '<script>alert("XSS")</script> Some content';
      const query = 'content';

      const result = highlightMatches(text, query);

      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
      expect(result).toContain('<mark>content</mark>');
    });

    it('should handle quoted phrases', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const query = '"brown fox"';

      const result = highlightMatches(text, query);

      expect(result).toContain('<mark>brown fox</mark>');
    });

    it('should skip stop words', () => {
      const text = 'The product is available in the store';
      const query = 'the product is in';

      const result = highlightMatches(text, query);

      expect(result).toContain('<mark>product</mark>');
      expect(result).not.toContain('<mark>the</mark>');
      expect(result).not.toContain('<mark>is</mark>');
      expect(result).not.toContain('<mark>in</mark>');
    });

    it('should truncate long text with ellipsis', () => {
      const longText = 'a '.repeat(200) + 'match here' + ' b'.repeat(200);
      const query = 'match';

      const result = highlightMatches(text, query, { maxLength: 100 });

      expect(result).toContain('...');
      expect(result).toContain('<mark>match</mark>');
      expect(result.length).toBeLessThan(300); // Much shorter than original
    });

    it('should extract excerpt around first match', () => {
      const text = 'Beginning text that is not relevant. The important match is here. More irrelevant text at the end.';
      const query = 'important match';

      const result = highlightMatches(text, query, { contextWords: 3 });

      expect(result).toContain('<mark>important</mark>');
      expect(result).toContain('<mark>match</mark>');
      expect(result).toContain('...');
    });

    it('should handle empty text gracefully', () => {
      const result = highlightMatches('', 'query');
      expect(result).toBe('');
    });

    it('should handle empty query gracefully', () => {
      const text = 'Some text';
      const result = highlightMatches(text, '');
      expect(result).toBe('Some text');
    });

    it('should merge overlapping matches', () => {
      const text = 'The quick brown quick fox';
      const query = 'quick brown';

      const result = highlightMatches(text, query);

      // Should merge adjacent matches
      const markCount = (result.match(/<mark>/g) || []).length;
      expect(markCount).toBeLessThanOrEqual(2);
    });

    it('should use custom tags when specified', () => {
      const text = 'Highlight this text';
      const query = 'highlight';

      const result = highlightMatches(text, query, {
        startTag: '<span class="highlight">',
        endTag: '</span>'
      });

      expect(result).toContain('<span class="highlight">');
      expect(result).toContain('</span>');
      expect(result).not.toContain('<mark>');
    });
  });

  describe('highlightWithContext', () => {
    it('should include surrounding sentences', () => {
      const text = 'First sentence here. The match is in this sentence. Third sentence follows. Fourth sentence at end.';
      const query = 'match';

      const result = highlightWithContext(text, query, 1, 1);

      expect(result).toContain('First sentence');
      expect(result).toContain('<mark>match</mark>');
      expect(result).toContain('Third sentence');
    });

    it('should handle multiple matches across sentences', () => {
      const text = 'First match here. No match in middle. Second match there. End of text.';
      const query = 'match';

      const result = highlightWithContext(text, query, 0, 0);

      expect(result).toContain('First <mark>match</mark>');
      expect(result).toContain('Second <mark>match</mark>');
    });

    it('should add ellipsis between non-adjacent sentences', () => {
      const text = 'Start. Sentence two. Match here. Sentence four. Sentence five. Another match. End.';
      const query = 'match';

      const result = highlightWithContext(text, query, 0, 0);

      expect(result).toContain('<mark>match</mark>');
      expect(result).toContain('...');
    });

    it('should handle text without sentence endings', () => {
      const text = 'This is text without proper sentence endings containing a match word';
      const query = 'match';

      const result = highlightWithContext(text, query, 1, 1);

      expect(result).toContain('<mark>match</mark>');
      expect(result).toContain('This is text');
    });

    it('should handle no matches gracefully', () => {
      const text = 'This text does not contain the search term.';
      const query = 'missing';

      const result = highlightWithContext(text, query);

      expect(result).not.toContain('<mark>');
      expect(result.length).toBeLessThanOrEqual(300);
    });
  });

  describe('Performance', () => {
    it('should handle large texts efficiently', () => {
      const largeText = 'Lorem ipsum '.repeat(10000);
      const query = 'ipsum';

      const startTime = performance.now();
      const result = highlightMatches(largeText, query);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
      expect(result).toContain('<mark>ipsum</mark>');
    });

    it('should handle complex queries efficiently', () => {
      const text = 'The quick brown fox jumps over the lazy dog'.repeat(100);
      const query = '"quick brown" lazy fox dog "jumps over"';

      const startTime = performance.now();
      const result = highlightMatches(text, query);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete in < 50ms
      expect(result).toContain('<mark>');
    });
  });

  describe('Edge cases', () => {
    it('should handle special regex characters in query', () => {
      const text = 'Price is $99.99 (on sale)';
      const query = '$99.99 (on sale)';

      const result = highlightMatches(text, query);

      // Should escape special characters and still match
      expect(result).toContain('$99.99');
    });

    it('should handle word boundaries correctly', () => {
      const text = 'Testing subtest and test cases';
      const query = 'test';

      const result = highlightMatches(text, query);

      // Should only match whole word "test", not "subtest"
      expect(result.match(/<mark>test</mark>/gi)).toBeTruthy();
      expect(result).not.toContain('sub<mark>test</mark>');
    });

    it('should handle Unicode characters', () => {
      const text = 'Café résumé naïve 日本語';
      const query = 'résumé';

      const result = highlightMatches(text, query);

      expect(result).toContain('<mark>résumé</mark>');
    });

    it('should handle very long words', () => {
      const longWord = 'a'.repeat(1000);
      const text = `Start ${longWord} end`;
      const query = longWord;

      const result = highlightMatches(text, query, { maxLength: 200 });

      expect(result).toContain('<mark>');
      expect(result.length).toBeLessThan(300);
    });
  });
});