/**
 * OpenAI Client Manager
 *
 * Handles lazy initialization and caching of the OpenAI client.
 * Uses singleton pattern to avoid recreating clients on each request.
 */

import OpenAI from 'openai';

// Singleton instance
let openaiInstance: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 *
 * Lazily initializes the OpenAI client on first use to avoid build-time errors.
 * Returns cached instance on subsequent calls for performance.
 *
 * @returns OpenAI client instance or null if API key is not configured
 */
export function getOpenAIClient(): OpenAI | null {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[Chat API] OpenAI API key is not configured');
      return null;
    }
    try {
      openaiInstance = new OpenAI({
        apiKey,
        timeout: 30 * 1000,    // 30 seconds (chat completions need 5-15s normally)
        maxRetries: 2,          // Retry failed requests twice
      });
    } catch (error) {
      console.error('[Chat API] Failed to initialize OpenAI client:', error);
      return null;
    }
  }
  return openaiInstance;
}

/**
 * Reset the OpenAI client instance (useful for testing)
 */
export function resetOpenAIClient(): void {
  openaiInstance = null;
}
