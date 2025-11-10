/**
 * Context Analyzer
 *
 * Extracts product intent, mentions, and preferences
 * from chat conversation context.
 *
 * @module recommendations/context-analyzer
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContextAnalysis {
  detectedIntent?: string;
  mentionedProducts?: string[];
  categories?: string[];
  tags?: string[];
  priceRange?: { min?: number; max?: number };
  urgency?: 'low' | 'medium' | 'high';
}

/**
 * Analyze chat context to extract product intent
 */
export async function analyzeContext(
  context: string,
  domainId: string
): Promise<ContextAnalysis> {
  try {
    // Use GPT-4 to extract structured intent
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are analyzing customer chat messages to extract product intent.
Extract:
- User's intent/need in plain language
- Mentioned product names/types
- Product categories of interest
- Relevant tags/attributes
- Price range if mentioned
- Urgency level (low/medium/high)

Return JSON only, no explanation.`,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(
      response.choices[0]?.message?.content || '{}'
    );

    return {
      detectedIntent: analysis.intent || undefined,
      mentionedProducts: analysis.products || [],
      categories: analysis.categories || [],
      tags: analysis.tags || [],
      priceRange: analysis.priceRange,
      urgency: analysis.urgency || 'medium',
    };
  } catch (error) {
    console.error('[ContextAnalyzer] Error:', error);

    // Fallback to simple keyword extraction
    return extractKeywords(context);
  }
}

/**
 * Simple keyword extraction as fallback
 */
function extractKeywords(text: string): ContextAnalysis {
  const lowerText = text.toLowerCase();

  // Extract potential product mentions
  const productKeywords = extractProductKeywords(lowerText);

  // Extract price range
  const priceRange = extractPriceRange(lowerText);

  // Determine urgency
  const urgency = determineUrgency(lowerText);

  return {
    detectedIntent: text.substring(0, 200), // First 200 chars as intent
    mentionedProducts: productKeywords,
    categories: [],
    tags: [],
    priceRange,
    urgency,
  };
}

/**
 * Extract product-related keywords
 */
function extractProductKeywords(text: string): string[] {
  const keywords: string[] = [];

  // Common product-related patterns
  const patterns = [
    /(?:looking for|need|want|interested in)\s+([a-z\s]{3,30})/gi,
    /([a-z\s]{3,20})\s+(?:product|item|part)/gi,
  ];

  patterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        keywords.push(match[1].trim());
      }
    }
  });

  return keywords;
}

/**
 * Extract price range from text
 */
function extractPriceRange(text: string): { min?: number; max?: number } | undefined {
  const range: { min?: number; max?: number } = {};

  // Match patterns like "$100 to $500", "under $200", "between $50 and $100"
  const patterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s+to\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /between\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s+and\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /under\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /less than\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /over\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /more than\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num1 = parseFloat(match[1].replace(/,/g, ''));
      const num2 = match[2] ? parseFloat(match[2].replace(/,/g, '')) : undefined;

      if (pattern.source.includes('under') || pattern.source.includes('less')) {
        range.max = num1;
      } else if (pattern.source.includes('over') || pattern.source.includes('more')) {
        range.min = num1;
      } else if (num2) {
        range.min = num1;
        range.max = num2;
      }
      break;
    }
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

/**
 * Determine purchase urgency from text
 */
function determineUrgency(text: string): 'low' | 'medium' | 'high' {
  // High urgency indicators
  const highUrgency = [
    'urgent',
    'asap',
    'immediately',
    'right now',
    'emergency',
    'today',
  ];

  // Low urgency indicators
  const lowUrgency = [
    'maybe',
    'thinking about',
    'considering',
    'browsing',
    'just looking',
  ];

  for (const keyword of highUrgency) {
    if (text.includes(keyword)) return 'high';
  }

  for (const keyword of lowUrgency) {
    if (text.includes(keyword)) return 'low';
  }

  return 'medium';
}
