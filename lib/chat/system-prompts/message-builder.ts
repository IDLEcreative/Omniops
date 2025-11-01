/**
 * Message builder utilities for OpenAI API
 */

/**
 * Build conversation messages array for OpenAI API
 *
 * @param systemPrompt - The system prompt to use
 * @param historyMessages - Previous conversation messages
 * @param currentMessage - The current user message
 * @returns Array of formatted messages for OpenAI
 */
export function buildConversationMessages(
  systemPrompt: string,
  historyMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentMessage: string
): Array<any> {
  return [
    {
      role: 'system' as const,
      content: systemPrompt
    },
    ...historyMessages.map((msg) => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: 'user' as const,
      content: currentMessage
    }
  ];
}
