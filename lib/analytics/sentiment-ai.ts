/**
 * AI-powered sentiment analysis using OpenAI
 *
 * Provides higher accuracy sentiment classification compared to keyword-based approach.
 * Uses gpt-4o-mini for cost-effective analysis (~$0.63/month for 30k messages).
 */

import { getOpenAIClient } from '@/lib/chat/openai-client';
import { trackSentimentCost } from './cost-tracker';

export interface AISentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 (negative), 0 (neutral), 1 (positive)
  confidence: number; // 0-1 scale
}

const SENTIMENT_SYSTEM_PROMPT = `You are a sentiment classifier. Analyze the provided text and classify it as positive, neutral, or negative.

Return ONLY a JSON object with this exact structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 1 | 0 | -1,
  "confidence": <number between 0 and 1>
}

Guidelines:
- "positive" (score: 1): Expressions of satisfaction, gratitude, happiness, or approval
- "neutral" (score: 0): Factual questions, statements without emotion, or mixed sentiment
- "negative" (score: -1): Complaints, frustration, dissatisfaction, or problems
- "confidence": How certain you are (0.0 = very uncertain, 1.0 = very certain)

Examples:
"Thank you so much, this is perfect!" → {"sentiment": "positive", "score": 1, "confidence": 0.95}
"What are your opening hours?" → {"sentiment": "neutral", "score": 0, "confidence": 0.9}
"This doesn't work at all, very frustrated" → {"sentiment": "negative", "score": -1, "confidence": 0.98}`;

/**
 * Analyze sentiment of a single message using OpenAI
 *
 * @param content - The message content to analyze
 * @returns Sentiment result with confidence score, or null if analysis fails
 */
export async function analyzeSentimentWithAI(
  content: string
): Promise<AISentimentResult | null> {
  const client = getOpenAIClient();
  if (!client) {
    console.error('[Sentiment AI] OpenAI client not available');
    return null;
  }

  // Trim content to reasonable length (max 500 chars for sentiment analysis)
  const trimmedContent = content.slice(0, 500);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
        { role: 'user', content: trimmedContent },
      ],
      max_tokens: 50,
      temperature: 0.3, // Low temperature for consistent results
      response_format: { type: 'json_object' },
    });

    // Track cost for monitoring
    trackSentimentCost(1);

    const result = response.choices[0]?.message?.content;
    if (!result) {
      console.error('[Sentiment AI] No response from OpenAI');
      return null;
    }

    const parsed = JSON.parse(result) as AISentimentResult;

    // Validate response structure
    if (
      !parsed.sentiment ||
      !['positive', 'neutral', 'negative'].includes(parsed.sentiment) ||
      typeof parsed.score !== 'number' ||
      typeof parsed.confidence !== 'number'
    ) {
      console.error('[Sentiment AI] Invalid response structure:', parsed);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[Sentiment AI] Error analyzing sentiment:', error);
    return null;
  }
}

/**
 * Analyze sentiment for multiple messages in batch
 *
 * Processes up to 20 messages per API call for cost efficiency.
 * Uses parallel processing with Promise.all for speed.
 *
 * @param contents - Array of message contents to analyze
 * @returns Array of sentiment results (null for failed analyses)
 */
export async function analyzeSentimentBatch(
  contents: string[]
): Promise<(AISentimentResult | null)[]> {
  if (contents.length === 0) {
    return [];
  }

  // Process in chunks of 20 for optimal API usage
  const BATCH_SIZE = 20;
  const results: (AISentimentResult | null)[] = [];

  for (let i = 0; i < contents.length; i += BATCH_SIZE) {
    const batch = contents.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(content => analyzeSentimentWithAI(content))
    );

    results.push(...batchResults);

    // Rate limiting: small delay between batches to avoid hitting limits
    if (i + BATCH_SIZE < contents.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Convert AI sentiment result to numeric score for compatibility
 *
 * @param result - AI sentiment result
 * @returns Numeric score: -1 (negative), 0 (neutral), 1 (positive)
 */
export function sentimentToScore(result: AISentimentResult | null): -1 | 0 | 1 {
  if (!result) return 0;
  return result.score as -1 | 0 | 1;
}
