/**
 * Completion Analyzer
 *
 * Determines conversation completion status using heuristics:
 * - Minimum message count threshold
 * - Last message sender (assistant indicates completed response)
 * - Resolution keyword detection
 */

import { Message } from '@/types/database';
import { CompletionMetrics } from '@/types/analytics';

export class CompletionAnalyzer {
  /**
   * Determine if conversation was completed successfully
   */
  public static calculate(messages: Message[]): CompletionMetrics {
    if (messages.length === 0) {
      return {
        completed: false,
        completion_rate: 0,
        resolution_achieved: false,
      };
    }

    const lastMessage = messages[messages.length - 1];
    const isAssistantLast = lastMessage?.role === 'assistant';

    // Heuristics for completion:
    // 1. Conversation has at least 3 messages
    // 2. Last message is from assistant (system responded)
    // 3. No long gap at the end (user didn't abandon)

    const hasMinimumMessages = messages.length >= 3;
    const hasGoodEnding = isAssistantLast;

    // Check for resolution keywords in last few messages
    const resolutionKeywords = ['thank', 'thanks', 'helped', 'resolved', 'perfect', 'great', 'appreciate'];
    const lastFewMessages = messages.slice(-3).map(m => m.content.toLowerCase());
    const hasResolutionKeyword = lastFewMessages.some(content =>
      resolutionKeywords.some(keyword => content.includes(keyword))
    );

    const completed = hasMinimumMessages && hasGoodEnding;
    const completionRate = completed ? 1.0 : messages.length >= 2 ? 0.5 : 0;

    return {
      completed,
      completion_rate: completionRate,
      abandonment_point: completed ? undefined : messages.length - 1,
      resolution_achieved: hasResolutionKeyword,
    };
  }
}
