/**
 * Sentence splitting utilities for context-aware highlighting
 */

export interface Sentence {
  start: number;
  end: number;
}

/**
 * Split text into sentences based on punctuation
 */
export function splitIntoSentences(text: string): Sentence[] {
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
