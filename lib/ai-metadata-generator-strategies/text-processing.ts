/**
 * Text Processing Utilities
 * Core text manipulation functions for AI metadata generation
 */

/**
 * Tokenize text into words
 */
export function tokenize(text: string): string[] {
  const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'oil', 'sit', 'ago', 'big', 'cry', 'far', 'fun', 'let', 'own', 'say', 'too', 'try'];

  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word));
}

/**
 * Split text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  return text.match(/[^\.!?]+[\.!?]+/g) || [text];
}

/**
 * Get word counts
 */
export function getWordCounts(words: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  words.forEach(word => {
    counts[word] = (counts[word] || 0) + 1;
  });
  return counts;
}

/**
 * Calculate TF-IDF scores
 */
export function calculateTFIDF(words: string[], documents: string[][]): Record<string, number> {
  const tfidf: Record<string, number> = {};
  const docCount = documents.length;
  const wordCounts = getWordCounts(words);
  const totalWords = words.length;

  for (const [word, count] of Object.entries(wordCounts)) {
    const tf = count / totalWords;
    const df = documents.filter(doc => doc.includes(word)).length;
    const idf = Math.log(docCount / (df || 1));

    tfidf[word] = tf * idf;
  }

  return tfidf;
}

/**
 * Extract topics from TF-IDF scores
 */
export function extractTopicsFromTFIDF(tfidf: Record<string, number>): string[] {
  return Object.entries(tfidf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Extract topics using TF-IDF
 */
export function extractTopics(content: string): string[] {
  const words = tokenize(content);
  const tfidf = calculateTFIDF(words, [words]);
  return extractTopicsFromTFIDF(tfidf);
}

/**
 * Extract keywords using TF-IDF
 */
export function extractKeywords(content: string, maxKeywords: number): string[] {
  const words = tokenize(content);
  const tfidf = calculateTFIDF(words, [words]);
  return Object.entries(tfidf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}
