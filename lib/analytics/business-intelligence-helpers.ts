/**
 * Helper utilities for Business Intelligence Analytics
 * Pure helper functions for message categorization and analysis
 */

import type { MessageData, UnansweredQuery, ContentSuggestion } from './business-intelligence-types';

/**
 * Categorize a message into a journey stage
 */
export function categorizeMessage(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('order') || lower.includes('track')) return 'order_inquiry';
  if (lower.includes('price') || lower.includes('cost')) return 'price_inquiry';
  if (lower.includes('product') || lower.includes('item')) return 'product_inquiry';
  if (lower.includes('help') || lower.includes('support')) return 'support_request';
  if (lower.includes('contact') || lower.includes('email')) return 'contact_request';
  return 'general_inquiry';
}

/**
 * Check if a message indicates conversion
 */
export function isConversionMessage(content: string): boolean {
  const conversionKeywords = ['order', 'buy', 'purchase', 'contact', 'email', 'phone'];
  return conversionKeywords.some(keyword =>
    content.toLowerCase().includes(keyword)
  );
}

/**
 * Calculate time to conversion in minutes
 */
export function calculateTimeToConversion(messages: MessageData[]): number {
  if (messages.length < 2) return 0;
  const first = new Date(messages[0]!.created_at);
  const last = new Date(messages[messages.length - 1]!.created_at);
  return (last.getTime() - first.getTime()) / 60000; // minutes
}

/**
 * Extract topics from a query
 */
export function extractTopics(query: string): string[] {
  // Simple topic extraction - would use NLP in production
  const words = query.split(/\s+/);
  return words.filter(w => w.length > 4);
}

/**
 * Determine suggested content type from queries
 */
export function determineSuggestedType(queries: string[]): 'faq' | 'guide' | 'product_info' {
  const faqKeywords = ['what', 'how', 'why', 'when', 'where'];
  const guideKeywords = ['setup', 'install', 'configure', 'use'];
  const productKeywords = ['product', 'item', 'price', 'stock'];

  const text = queries.join(' ').toLowerCase();

  if (guideKeywords.some(k => text.includes(k))) return 'guide';
  if (productKeywords.some(k => text.includes(k))) return 'product_info';
  return 'faq';
}

/**
 * Generate content suggestions from unanswered queries and topics
 */
export function generateContentSuggestions(
  unansweredQueries: UnansweredQuery[],
  topics: string[]
): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];

  // Group similar queries
  const topicGroups = new Map<string, string[]>();
  for (const query of unansweredQueries) {
    const topic = topics.find(t => query.query.includes(t)) || 'general';
    const group = topicGroups.get(topic) || [];
    group.push(query.query);
    topicGroups.set(topic, group);
  }

  // Generate suggestions
  for (const [topic, queries] of topicGroups.entries()) {
    suggestions.push({
      topic,
      demandScore: queries.length * 10,
      suggestedType: determineSuggestedType(queries),
      relatedQueries: queries.slice(0, 5)
    });
  }

  return suggestions.sort((a, b) => b.demandScore - a.demandScore).slice(0, 10);
}
