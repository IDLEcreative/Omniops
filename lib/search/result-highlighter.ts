/**
 * Result highlighter for search results
 * Provides HTML-safe highlighting with support for multi-word queries
 */

export interface HighlightOptions {
  startTag?: string;
  endTag?: string;
  maxLength?: number;
  contextWords?: number;
  caseSensitive?: boolean;
}

const DEFAULT_OPTIONS: HighlightOptions = {
  startTag: '<mark>',
  endTag: '</mark>',
  maxLength: 200,
  contextWords: 10,
  caseSensitive: false
};

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Highlight matching terms in text
 */
export function highlightMatches(
  text: string,
  query: string,
  options: HighlightOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

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
    return escapeHtml(truncateText(text, opts.maxLength));
  }

  // Extract the most relevant excerpt
  const excerpt = extractExcerpt(text, matches, opts);

  // Apply highlights
  return applyHighlights(excerpt.text, excerpt.matches, opts, excerpt.offset);
}

/**
 * Parse query into individual search terms
 */
function parseQueryTerms(query: string): string[] {
  // Handle quoted phrases
  const quotedPhrases: string[] = [];
  const withoutQuotes = query.replace(/"([^"]+)"/g, (_, phrase) => {
    quotedPhrases.push(phrase);
    return '';
  });

  // Split remaining text into words
  const words = withoutQuotes
    .split(/\s+/)
    .filter(w => w.length > 0)
    .filter(w => !isStopWord(w));

  return [...quotedPhrases, ...words];
}

/**
 * Check if a word is a common stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by',
    'for', 'from', 'has', 'he', 'in', 'is', 'it',
    'its', 'of', 'on', 'that', 'the', 'to', 'was',
    'will', 'with', 'or', 'not'
  ]);
  return stopWords.has(word.toLowerCase());
}

interface Match {
  start: number;
  end: number;
  term: string;
}

/**
 * Find all matches in text
 */
function findMatches(
  text: string,
  terms: string[],
  caseSensitive: boolean = false
): Match[] {
  const matches: Match[] = [];
  const searchText = caseSensitive ? text : text.toLowerCase();

  for (const term of terms) {
    const searchTerm = caseSensitive ? term : term.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, 'g');

    let match;
    while ((match = regex.exec(searchText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        term: term
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  // Merge overlapping matches
  return mergeOverlappingMatches(matches);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Merge overlapping matches
 */
function mergeOverlappingMatches(matches: Match[]): Match[] {
  if (matches.length === 0) return matches;

  const merged: Match[] = [matches[0]];

  for (let i = 1; i < matches.length; i++) {
    const current = matches[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlapping or adjacent - merge
      last.end = Math.max(last.end, current.end);
      if (current.term.length > last.term.length) {
        last.term = current.term;
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}

interface Excerpt {
  text: string;
  matches: Match[];
  offset: number;
}

/**
 * Extract the most relevant excerpt containing matches
 */
function extractExcerpt(
  text: string,
  matches: Match[],
  options: HighlightOptions
): Excerpt {
  if (matches.length === 0) {
    return {
      text: truncateText(text, options.maxLength),
      matches: [],
      offset: 0
    };
  }

  // Find the densest cluster of matches
  const cluster = findBestCluster(matches, text.length, options.maxLength);

  // Calculate excerpt boundaries
  const contextChars = options.contextWords * 6; // Avg word length
  let start = Math.max(0, cluster.start - contextChars);
  let end = Math.min(text.length, cluster.end + contextChars);

  // Adjust to word boundaries
  if (start > 0) {
    const spaceIndex = text.lastIndexOf(' ', start);
    if (spaceIndex > start - 20) {
      start = spaceIndex + 1;
    }
  }

  if (end < text.length) {
    const spaceIndex = text.indexOf(' ', end);
    if (spaceIndex !== -1 && spaceIndex < end + 20) {
      end = spaceIndex;
    }
  }

  // Extract text
  let excerptText = text.substring(start, end);

  // Add ellipsis
  if (start > 0) {
    excerptText = '...' + excerptText;
    start -= 3;
  }
  if (end < text.length) {
    excerptText = excerptText + '...';
  }

  // Adjust match positions relative to excerpt
  const excerptMatches = matches
    .filter(m => m.start >= start && m.end <= end)
    .map(m => ({
      start: m.start - start,
      end: m.end - start,
      term: m.term
    }));

  return {
    text: excerptText,
    matches: excerptMatches,
    offset: start
  };
}

interface Cluster {
  start: number;
  end: number;
  density: number;
  count: number;
}

/**
 * Find the densest cluster of matches
 */
function findBestCluster(
  matches: Match[],
  textLength: number,
  maxLength: number
): Cluster {
  if (matches.length === 1) {
    return {
      start: matches[0].start,
      end: matches[0].end,
      density: 1,
      count: 1
    };
  }

  let bestCluster: Cluster = {
    start: matches[0].start,
    end: matches[0].end,
    density: 0,
    count: 1
  };

  // Try different window sizes
  for (let i = 0; i < matches.length; i++) {
    let clusterEnd = matches[i].end;
    let clusterCount = 1;

    for (let j = i + 1; j < matches.length; j++) {
      const potentialEnd = matches[j].end;
      const potentialLength = potentialEnd - matches[i].start;

      if (potentialLength > maxLength) {
        break;
      }

      clusterEnd = potentialEnd;
      clusterCount++;

      // Calculate density (matches per character)
      const density = clusterCount / potentialLength;

      if (density > bestCluster.density) {
        bestCluster = {
          start: matches[i].start,
          end: clusterEnd,
          density,
          count: clusterCount
        };
      }
    }
  }

  return bestCluster;
}

/**
 * Apply highlights to text
 */
function applyHighlights(
  text: string,
  matches: Match[],
  options: HighlightOptions,
  offset: number = 0
): string {
  if (matches.length === 0) {
    return escapeHtml(text);
  }

  let result = '';
  let lastEnd = 0;

  for (const match of matches) {
    // Add text before match
    result += escapeHtml(text.substring(lastEnd, match.start));

    // Add highlighted match
    result += options.startTag;
    result += escapeHtml(text.substring(match.start, match.end));
    result += options.endTag;

    lastEnd = match.end;
  }

  // Add remaining text
  result += escapeHtml(text.substring(lastEnd));

  return result;
}

/**
 * Truncate text to maximum length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Try to break at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
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

interface Sentence {
  start: number;
  end: number;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  const regex = /[.!?]+\s+/g;
  let lastEnd = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    sentences.push({
      start: lastEnd,
      end: match.index + match[0].length
    });
    lastEnd = match.index + match[0].length;
  }

  // Add remaining text as last sentence
  if (lastEnd < text.length) {
    sentences.push({
      start: lastEnd,
      end: text.length
    });
  }

  return sentences;
}