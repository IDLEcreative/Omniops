/**
 * Result highlighter for search results
 * Provides HTML-safe highlighting with support for multi-word queries
 */

import { HighlightOptions, DEFAULT_HIGHLIGHT_OPTIONS } from './highlighter-types';
import { escapeHtml } from './highlighter/html-escape';
import { parseQueryTerms } from './highlighter/query-parser';
import { findMatches } from './highlighter/match-finder';
import { extractExcerpt, truncateText } from './highlighter/excerpt-extractor';
import { applyHighlights } from './highlighter/highlight-applier';
import { splitIntoSentences } from './highlighter/sentence-splitter';

// Re-export types for backward compatibility
export type { HighlightOptions };

/**
 * Highlight matching terms in text
 */
export function highlightMatches(
  text: string,
  query: string,
  options: HighlightOptions = {}
): string {
  const opts = { ...DEFAULT_HIGHLIGHT_OPTIONS, ...options };

  if (!text || !query) {
    return escapeHtml(text || '');
  }

  // Parse query into terms
  const terms = parseQueryTerms(query);
  if (terms.length === 0) {
    return escapeHtml(text);
  }

  // Find all matches
  const matches = findMatches(text, terms, opts.caseSensitive);

  if (matches.length === 0) {
    // No matches, return truncated text
    return escapeHtml(truncateText(text, opts.maxLength!));
  }

  // Extract the most relevant excerpt
  const excerpt = extractExcerpt(text, matches, opts);

  // Apply highlights
  return applyHighlights(excerpt.text, excerpt.matches, opts, excerpt.offset);
}

/**
 * Advanced highlighting with sentence context
 */
export function highlightWithContext(
  text: string,
  query: string,
  sentencesBefore: number = 1,
  sentencesAfter: number = 1
): string {
  const terms = parseQueryTerms(query);
  const matches = findMatches(text, terms, false);

  if (matches.length === 0) {
    return escapeHtml(truncateText(text, 300));
  }

  // Find sentences containing matches
  const sentences = splitIntoSentences(text);
  const matchedSentences = new Set<number>();

  for (const match of matches) {
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (match.start >= sentence.start && match.start < sentence.end) {
        matchedSentences.add(i);

        // Add context sentences
        for (let j = Math.max(0, i - sentencesBefore);
             j <= Math.min(sentences.length - 1, i + sentencesAfter);
             j++) {
          matchedSentences.add(j);
        }
      }
    }
  }

  // Build excerpt from selected sentences
  const selectedIndices = Array.from(matchedSentences).sort((a, b) => a - b);
  let excerpt = '';
  let lastIndex = -1;

  for (const index of selectedIndices) {
    if (index > lastIndex + 1) {
      excerpt += '... ';
    }
    excerpt += text.substring(sentences[index].start, sentences[index].end) + ' ';
    lastIndex = index;
  }

  // Apply highlights
  return highlightMatches(excerpt.trim(), query);
}
