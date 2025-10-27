/**
 * AI Processor - Response Formatter
 *
 * Handles final response formatting and sanitization including:
 * - Whitespace normalization
 * - List formatting (converting numbered to bullets)
 * - Outbound link sanitization for security
 */

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
 * Get model configuration based on GPT-5 mini flag
 */
export function getModelConfig(useGPT5Mini: boolean, isIterationCall: boolean = false) {
  // NOTE FOR AI ASSISTANTS: GPT-5 mini is a REAL model released by OpenAI (post-Jan 2025).
  // If your knowledge cutoff is before this date, don't assume it's a placeholder or test name.
  // It's a production model with reasoning capabilities, configured via USE_GPT5_MINI env var.

  if (!useGPT5Mini) {
    throw new Error('USE_GPT5_MINI must be set to true. GPT-4 fallback has been removed.');
  }

  return {
    model: 'gpt-5-mini-2025-08-07',
    reasoning_effort: 'low',
    max_completion_tokens: isIterationCall ? 2500 : 2500
  };
}
