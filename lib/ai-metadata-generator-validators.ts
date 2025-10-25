/**
 * AI Metadata Generator - Validators
 *
 * Contains quality scoring and validation logic for generated metadata.
 * Extracted from ai-metadata-generator.ts for modularity.
 */

import { AIMetadata, QualityScore, Question } from './ai-metadata-generator-types';
import { tokenize } from './ai-metadata-generator-strategies';

/**
 * Calculate quality score for generated metadata
 */
export function calculateQualityScore(content: string, metadata: {
  summary: string;
  entities: AIMetadata['entities'];
  questions: Question[];
  keywords: string[];
  topics: string[];
}): QualityScore {
  const summaryAccuracy = scoreSummaryAccuracy(content, metadata.summary);
  const entityAccuracy = scoreEntityAccuracy(content, metadata.entities);
  const questionQuality = scoreQuestionQuality(metadata.questions);
  const completeness = scoreCompleteness(metadata);

  const overall = (summaryAccuracy + entityAccuracy + questionQuality + completeness) / 4;

  return {
    overall,
    summaryAccuracy,
    entityAccuracy,
    questionQuality,
    completeness
  };
}

/**
 * Score summary accuracy by comparing word overlap
 */
function scoreSummaryAccuracy(content: string, summary: string): number {
  const contentWords = new Set(tokenize(content));
  const summaryWords = new Set(tokenize(summary));

  const intersection = new Set([...summaryWords].filter(word => contentWords.has(word)));
  const accuracy = intersection.size / summaryWords.size;

  return Math.min(accuracy * 1.2, 1.0); // Boost score slightly, cap at 1.0
}

/**
 * Score entity accuracy by checking if entities exist in content
 */
function scoreEntityAccuracy(content: string, entities: AIMetadata['entities']): number {
  let totalEntities = 0;
  let accurateEntities = 0;

  Object.values(entities).forEach(entityList => {
    entityList.forEach(entity => {
      totalEntities++;
      if (content.includes(entity)) {
        accurateEntities++;
      }
    });
  });

  return totalEntities > 0 ? accurateEntities / totalEntities : 1.0;
}

/**
 * Score question quality based on confidence, variety, and answer quality
 */
function scoreQuestionQuality(questions: Question[]): number {
  if (questions.length === 0) return 0.5;

  const avgConfidence = questions.reduce((sum, q) => sum + q.confidence, 0) / questions.length;
  const hasVariedTypes = new Set(questions.map(q => q.type)).size > 1;
  const hasGoodAnswers = questions.every(q => q.answer.length > 10);

  let score = avgConfidence * 0.6;
  if (hasVariedTypes) score += 0.2;
  if (hasGoodAnswers) score += 0.2;

  return Math.min(score, 1.0);
}

/**
 * Score completeness based on presence of metadata components
 */
function scoreCompleteness(metadata: {
  summary: string;
  topics?: string[];
  keywords?: string[];
  entities: AIMetadata['entities'];
  questions?: Question[];
}): number {
  let score = 0;
  const components = [
    metadata.summary,
    metadata.topics && metadata.topics.length > 0,
    metadata.keywords && metadata.keywords.length > 0,
    Object.values(metadata.entities).some((arr: string[]) => arr.length > 0),
    metadata.questions && metadata.questions.length > 0
  ];

  components.forEach(component => {
    if (component) score += 0.2;
  });

  return score;
}

/**
 * Utility function for cosine similarity
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += (a[i] || 0) * (b[i] || 0);
    normA += (a[i] || 0) * (a[i] || 0);
    normB += (b[i] || 0) * (b[i] || 0);
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
