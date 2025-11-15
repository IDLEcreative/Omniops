/**
 * OpenAI client management with lazy loading
 */

import OpenAI from 'openai';

let openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({
      apiKey,
      timeout: 20 * 1000,    // 20 seconds (embeddings need 1-5s normally)
      maxRetries: 2,          // Retry failed requests twice
    });
  }
  return openai;
}
