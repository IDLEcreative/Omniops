/**
 * Summary Generation
 * Functions for extracting and generating content summaries
 */

import { splitIntoSentences } from './text-processing';

/**
 * Generate extractive summary using key sentence identification
 */
export function generateExtractiveSummary(content: string): string {
  const sentences = splitIntoSentences(content);
  const scores = scoreSentences(sentences, content);
  const topSentences = selectTopSentences(sentences, scores, 50, 100);

  return topSentences.join(' ').trim();
}

/**
 * Generate fallback brief summary (first 15 words)
 */
export function generateFallbackBriefSummary(content: string): string {
  const words = content.split(/\s+/).slice(0, 15);
  return words.join(' ') + (content.split(/\s+/).length > 15 ? '...' : '');
}

/**
 * Score sentences for summary extraction
 */
function scoreSentences(sentences: string[], fullText: string): number[] {
  return sentences.map(sentence => {
    let score = 0;

    // Length factor (prefer medium-length sentences)
    const length = sentence.split(/\s+/).length;
    if (length >= 10 && length <= 25) score += 1;

    // Position factor (first and last sentences often important)
    const position = sentences.indexOf(sentence);
    if (position === 0 || position === sentences.length - 1) score += 0.5;

    // Keyword density
    const words = sentence.toLowerCase().split(/\W+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const contentWords = words.filter(word => !commonWords.includes(word));
    score += contentWords.length / words.length;

    return score;
  });
}

/**
 * Select top sentences for summary
 */
function selectTopSentences(sentences: string[], scores: number[], minWords: number, maxWords: number): string[] {
  const sentenceScorePairs = sentences.map((sentence, index) => ({
    sentence,
    score: scores[index]
  }));

  sentenceScorePairs.sort((a, b) => (b.score || 0) - (a.score || 0));

  const selected: string[] = [];
  let wordCount = 0;

  for (const pair of sentenceScorePairs) {
    const sentenceWords = pair.sentence.split(/\s+/).length;
    if (wordCount + sentenceWords <= maxWords) {
      selected.push(pair.sentence);
      wordCount += sentenceWords;

      if (wordCount >= minWords) break;
    }
  }

  return selected;
}
