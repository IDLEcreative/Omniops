/**
 * AI Query Interpreter
 * Uses AI to understand user intent and generate proper search terms
 * The AI acts as the "brain" that understands typos, context, and intent
 */

import OpenAI from 'openai';

export class AIQueryInterpreter {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        timeout: 30 * 1000,    // 30 seconds (chat completions need 5-15s normally)
        maxRetries: 2,          // Retry failed requests twice
      });
    }
  }

  /**
   * Let the AI interpret what the user actually wants to search for
   * This handles typos, understanding intent, and generating proper search terms
   */
  async interpretQuery(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{
    searchTerms: string[];
    intent: string;
    confidence: number;
  }> {
    if (!this.openai) {
      // Fallback if no AI available - just use the original query
      return {
        searchTerms: [userMessage],
        intent: 'unknown',
        confidence: 0.5
      };
    }

    try {
      // Build context from conversation
      const context = conversationHistory.length > 0 
        ? `Previous conversation:\n${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
        : '';

      const prompt = `You are a smart customer service agent. A customer just said: "${userMessage}"

${context}

Your job is to understand what they ACTUALLY want to search for in our product database.
- Fix any obvious typos (e.g., "hydaulics" → "hydraulics")
- Understand context from previous messages
- Generate the best search terms to find what they want

Respond with JSON only:
{
  "searchTerms": ["term1", "term2"],  // What to actually search for (corrected, relevant terms)
  "intent": "browse|specific|question|greeting",  // What they're trying to do
  "confidence": 0.9  // How confident you are (0-1)
}

For example:
- "do you sell equipment" → searchTerms: ["equipment", "products"]
- "its for agriculture" → searchTerms: ["agricultural", "agriculture equipment"]
- "show me products" → searchTerms: ["product", "products"]
- "hello" → searchTerms: [], intent: "greeting"`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',  // Fast model for quick interpretation
        messages: [
          { role: 'system', content: 'You are a query interpreter. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,  // Low temperature for consistent interpretation
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Parse the JSON response
      try {
        const result = JSON.parse(content);
        
        
        return {
          searchTerms: result.searchTerms || [userMessage],
          intent: result.intent || 'unknown',
          confidence: result.confidence || 0.7
        };
      } catch (parseError) {
        console.error('[AI Interpreter] Failed to parse response:', content);
        return {
          searchTerms: [userMessage],
          intent: 'unknown',
          confidence: 0.5
        };
      }

    } catch (error) {
      console.error('[AI Interpreter] Error:', error);
      // Fallback to original query
      return {
        searchTerms: [userMessage],
        intent: 'unknown',
        confidence: 0.5
      };
    }
  }

  /**
   * Quick check if a query needs product search at all
   */
  needsProductSearch(intent: string): boolean {
    const nonProductIntents = ['greeting', 'thanks', 'goodbye', 'policy', 'hours', 'contact'];
    return !nonProductIntents.includes(intent);
  }
}

export const queryInterpreter = new AIQueryInterpreter();