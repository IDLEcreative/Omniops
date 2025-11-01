/**
 * Content Analysis Functions
 * Classification, sentiment, and complexity analysis
 */

import { ContentType, IntentMapping, Question } from '../ai-metadata-generator-types';
import { splitIntoSentences } from './text-processing';

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
