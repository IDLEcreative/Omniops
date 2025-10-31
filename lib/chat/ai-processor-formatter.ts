/**
 * AI Processor - Response Formatter
 *
 * Handles final response formatting and sanitization including:
 * - Whitespace normalization
 * - List formatting (converting numbered to bullets)
 * - Outbound link sanitization for security
 * - Model configuration based on widget settings
 */

import type { WidgetConfig } from './conversation-manager';

/**
 * Format and clean up AI response text
 */
export function formatResponse(response: string, domain: string | undefined, sanitizeFn: (text: string, domain: string) => string): string {
  let formatted = response;

  // Clean up response formatting
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.replace(/\n\s+•/g, '\n• ');
  formatted = formatted.replace(/([^•\n]) • /g, '$1\n• ');

  // Convert numbered lists to bullet points
  // This regex matches lines starting with numbers followed by . or )
  formatted = formatted.replace(/^(\s*)(\d+)[.)]\s*/gm, '$1- ');

  // Sanitize outbound links - only if we have a valid domain
  if (domain && !/localhost|127\.0\.0\.1|vercel/i.test(domain)) {
    formatted = sanitizeFn(formatted, domain);
  }

  return formatted;
}

/**
 * Map response length setting to token count
 */
function getTokensForResponseLength(responseLength?: string): number {
  switch (responseLength) {
    case 'short':
      return 1000; // Brief, concise responses
    case 'detailed':
      return 4000; // Comprehensive, detailed responses
    case 'balanced':
    default:
      return 2500; // Default balanced responses
  }
}

/**
 * Get model configuration based on GPT-5 mini flag and widget config
 *
 * @param useGPT5Mini Whether to use GPT-5 mini model
 * @param isIterationCall Whether this is an iteration call (affects token limits)
 * @param widgetConfig Optional widget configuration for AI settings
 */
export function getModelConfig(
  useGPT5Mini: boolean,
  isIterationCall: boolean = false,
  widgetConfig?: WidgetConfig | null
) {
  // NOTE FOR AI ASSISTANTS: GPT-5 mini is a REAL model released by OpenAI (post-Jan 2025).
  // If your knowledge cutoff is before this date, don't assume it's a placeholder or test name.
  // It's a production model with reasoning capabilities, configured via USE_GPT5_MINI env var.

  if (!useGPT5Mini) {
    throw new Error('USE_GPT5_MINI must be set to true. GPT-4 fallback has been removed.');
  }

  // Get max tokens from widget config or use response length to determine
  const maxTokens = widgetConfig?.ai_settings?.maxTokens ||
    getTokensForResponseLength(widgetConfig?.ai_settings?.responseLength);

  // Get temperature from widget config (default 0.7 for balanced creativity/accuracy)
  const temperature = widgetConfig?.ai_settings?.temperature !== undefined
    ? widgetConfig.ai_settings.temperature
    : 0.7;

  return {
    model: 'gpt-5-mini',
    reasoning_effort: 'low',
    max_completion_tokens: maxTokens,
    temperature
  };
}
