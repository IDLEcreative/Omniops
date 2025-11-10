/**
 * Engagement Analyzer
 *
 * Calculates engagement metrics including:
 * - Engagement score (0-100) based on message patterns
 * - Message counts by role
 * - Average message length
 * - Time between messages
 * - Quick reply detection
 */

import { Message } from '@/types/database';
import { EngagementMetrics } from '@/types/analytics';

export class EngagementAnalyzer {
  /**
   * Calculate engagement score (0-100) based on multiple factors
   */
  public static calculateScore(messages: Message[]): number {
    if (messages.length === 0) return 0;

    // Factors that contribute to engagement:
    // 1. Message count (more messages = more engagement)
    // 2. Message depth (longer messages = more engagement)
    // 3. Response consistency (regular back-and-forth)
    // 4. Time spent (within reasonable limits)

    const messageCountScore = Math.min(messages.length * 5, 30); // Max 30 points
    const avgMessageLength = this.calculateAverageMessageLength(messages);
    const lengthScore = Math.min(avgMessageLength / 10, 20); // Max 20 points
    const depthScore = Math.min(messages.length / 2, 25); // Max 25 points
    const consistencyScore = this.calculateConsistencyScore(messages); // Max 25 points

    return Math.min(Math.floor(messageCountScore + lengthScore + depthScore + consistencyScore), 100);
  }

  /**
   * Calculate full engagement metrics
   */
  public static calculate(messages: Message[]): EngagementMetrics {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const timeBetweenMessages = this.calculateAverageTimeBetween(messages);
    const quickReplies = this.countQuickReplies(messages);

    return {
      score: this.calculateScore(messages),
      total_messages: messages.length,
      user_messages: userMessages.length,
      assistant_messages: assistantMessages.length,
      average_message_length: Math.floor(this.calculateAverageMessageLength(messages)),
      conversation_depth: messages.length,
      time_between_messages_avg_seconds: Math.floor(timeBetweenMessages),
      quick_replies_used: quickReplies,
    };
  }

  private static calculateAverageMessageLength(messages: Message[]): number {
    if (messages.length === 0) return 0;
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    return totalLength / messages.length;
  }

  private static calculateConsistencyScore(messages: Message[]): number {
    if (messages.length < 2) return 0;

    let backAndForthCount = 0;
    for (let i = 1; i < messages.length; i++) {
      const curr = messages[i];
      const prev = messages[i - 1];
      if (curr && prev && curr.role !== prev.role) {
        backAndForthCount++;
      }
    }

    const consistencyRatio = backAndForthCount / (messages.length - 1);
    return Math.floor(consistencyRatio * 25);
  }

  private static calculateAverageTimeBetween(messages: Message[]): number {
    if (messages.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];
      if (!prev || !curr) continue;
      const prevTime = new Date(prev.created_at).getTime();
      const currentTime = new Date(curr.created_at).getTime();
      totalTime += (currentTime - prevTime) / 1000;
    }

    return totalTime / (messages.length - 1);
  }

  private static countQuickReplies(messages: Message[]): number {
    let quickReplies = 0;

    for (let i = 1; i < messages.length; i++) {
      const prevMsg = messages[i - 1];
      const currMsg = messages[i];
      if (!prevMsg || !currMsg) continue;

      const prevTime = new Date(prevMsg.created_at).getTime();
      const currentTime = new Date(currMsg.created_at).getTime();
      const timeDiff = (currentTime - prevTime) / 1000;

      // Quick reply if response within 30 seconds
      if (timeDiff < 30 && currMsg.role === 'user') {
        quickReplies++;
      }
    }

    return quickReplies;
  }
}
