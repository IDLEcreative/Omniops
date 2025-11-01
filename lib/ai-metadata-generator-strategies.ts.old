/**
 * AI Metadata Generator - Strategies
 *
 * Contains generation strategies, entity extraction, text processing, and TF-IDF logic.
 * Extracted from ai-metadata-generator.ts for modularity.
 */

import { ContentType, IntentMapping, Question } from './ai-metadata-generator-types';

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
 * Extract entities from content
 */
export function extractEntities(content: string): {
  people: string[];
  organizations: string[];
  locations: string[];
  products: string[];
  dates: string[];
} {
  return {
    people: extractPeople(content),
    organizations: extractOrganizations(content),
    locations: extractLocations(content),
    products: extractProducts(content),
    dates: extractDates(content)
  };
}

/**
 * Extract people names using pattern matching
 */
function extractPeople(content: string): string[] {
  const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const matches = content.match(namePattern) || [];
  return [...new Set(matches)];
}

/**
 * Extract organization names
 */
function extractOrganizations(content: string): string[] {
  const orgPattern = /\b(?:[A-Z][a-z]+ )*(?:Inc|Corp|LLC|Ltd|Company|Organization|University|College|Institute)\b/g;
  const matches = content.match(orgPattern) || [];
  return [...new Set(matches)];
}

/**
 * Extract location names
 */
function extractLocations(content: string): string[] {
  const locationPattern = /\b[A-Z][a-z]+(?:, [A-Z][a-z]+)*\b/g;
  const matches = content.match(locationPattern) || [];
  return [...new Set(matches)].filter(loc => loc.length > 3);
}

/**
 * Extract product names
 */
function extractProducts(content: string): string[] {
  const productPatterns = [
    /\b[A-Z][a-zA-Z]+ \d+(?:\.\d+)*\b/, // Product v1.0
    /\b[A-Z][a-zA-Z]*(?:-[A-Z][a-zA-Z]*)*\b/, // Product-Name
    /\b(?:API|SDK|Service|Platform|Tool|App|Software)\b/gi
  ];

  const products = new Set<string>();
  productPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => products.add(match));
  });

  return Array.from(products);
}

/**
 * Extract dates
 */
function extractDates(content: string): string[] {
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
    /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b/gi
  ];

  const dates = new Set<string>();
  datePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => dates.add(match));
  });

  return Array.from(dates);
}

/**
 * Extract FAQ questions from formatted content
 */
export function extractFAQQuestions(content: string): Question[] {
  const questions: Question[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';
    if (line.match(/^(?:Q:|Question:|FAQ:|\d+\.)\s*(.+\?)\s*$/)) {
      const question = line.replace(/^(?:Q:|Question:|FAQ:|\d+\.)\s*/, '').trim();
      const answerLines: string[] = [];

      // Look for answer in next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j]?.trim() || '';
        if (nextLine.match(/^(?:A:|Answer:|\d+\.)/)) {
          answerLines.push(nextLine.replace(/^(?:A:|Answer:|\d+\.)\s*/, ''));
        } else if (nextLine.length > 0 && !nextLine.match(/^(?:Q:|Question:|FAQ:)/)) {
          answerLines.push(nextLine);
        } else {
          break;
        }
      }

      if (answerLines.length > 0) {
        questions.push({
          question,
          answer: answerLines.join(' ').trim(),
          confidence: 0.9,
          source: `FAQ section (line ${i + 1})`,
          type: 'factual'
        });
      }
    }
  }

  return questions;
}

/**
 * Classify content type based on patterns
 */
export function classifyContentType(content: string): ContentType {
  const indicators = {
    faq: /(?:frequently asked questions|faq|q&a|questions and answers)/i,
    documentation: /(?:documentation|docs|manual|guide|reference)/i,
    product_info: /(?:product|features|specifications|pricing)/i,
    support_article: /(?:support|help|how to|tutorial|troubleshoot)/i,
    policy: /(?:policy|terms|conditions|agreement|legal)/i,
    troubleshooting: /(?:error|issue|problem|fix|solve|troubleshoot)/i
  };

  for (const [type, pattern] of Object.entries(indicators)) {
    if (pattern.test(content)) {
      return type as ContentType;
    }
  }

  return 'general';
}

/**
 * Analyze sentiment
 */
export function analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'satisfied'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'wrong', 'error'];

  const words = content.toLowerCase().split(/\W+/);
  const positive = words.filter(word => positiveWords.includes(word)).length;
  const negative = words.filter(word => negativeWords.includes(word)).length;

  if (positive > negative) return 'positive';
  else if (negative > positive) return 'negative';
  else return 'neutral';
}

/**
 * Assess complexity
 */
export function assessComplexity(content: string): 'simple' | 'moderate' | 'complex' {
  const sentences = splitIntoSentences(content);
  const avgWordsPerSentence = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
  const technicalTerms = content.match(/\b[A-Z]{2,}\b|\b\w+(?:API|SDK|URL|HTTP|JSON|XML)\b/g)?.length || 0;

  if (avgWordsPerSentence > 25 || technicalTerms > 10) {
    return 'complex';
  } else if (avgWordsPerSentence > 15 || technicalTerms > 5) {
    return 'moderate';
  } else {
    return 'simple';
  }
}

/**
 * Generate intent mappings
 */
export function generateIntentMappings(content: string): IntentMapping[] {
  const mappings: IntentMapping[] = [];

  const intentPatterns = {
    'get_help': { patterns: ['help', 'support', 'assist'], confidence: 0.8 },
    'find_information': { patterns: ['what', 'how', 'where', 'when'], confidence: 0.7 },
    'report_issue': { patterns: ['problem', 'error', 'issue', 'bug'], confidence: 0.9 },
    'request_feature': { patterns: ['want', 'need', 'request', 'feature'], confidence: 0.6 },
    'get_pricing': { patterns: ['price', 'cost', 'pricing', 'fee'], confidence: 0.8 }
  };

  for (const [intent, config] of Object.entries(intentPatterns)) {
    const pattern = config.patterns.join('|');
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      mappings.push({
        pattern,
        intent,
        confidence: config.confidence,
        examples: matches.slice(0, 3)
      });
    }
  }

  return mappings;
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
 * Calculate TF-IDF scores
 */
function calculateTFIDF(words: string[], documents: string[][]): Record<string, number> {
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
 * Get word counts
 */
function getWordCounts(words: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  words.forEach(word => {
    counts[word] = (counts[word] || 0) + 1;
  });
  return counts;
}

/**
 * Extract topics from TF-IDF scores
 */
function extractTopicsFromTFIDF(tfidf: Record<string, number>): string[] {
  return Object.entries(tfidf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  return text.match(/[^\.!?]+[\.!?]+/g) || [text];
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
