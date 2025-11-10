/**
 * Response Time Analyzer
 *
 * Calculates response time metrics from conversation messages including:
 * - Average, median, p95, p99 response times
 * - Fastest and slowest response times
 * - Total response count
 */

import { Message } from '@/types/database';
import { ResponseTimeMetrics } from '@/types/analytics';

export class ResponseTimeAnalyzer {
  /**
   * Calculate response time metrics from messages
   */
  public static calculate(messages: Message[]): ResponseTimeMetrics {
    const responseTimes: number[] = [];

    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];

      if (!prevMessage || !currentMessage) continue;

      // Calculate time between user message and assistant response
      if (prevMessage.role === 'user' && currentMessage.role === 'assistant') {
        const prevTime = new Date(prevMessage.created_at).getTime();
        const currentTime = new Date(currentMessage.created_at).getTime();
        const responseTimeMs = currentTime - prevTime;

        if (responseTimeMs > 0 && responseTimeMs < 300000) { // Cap at 5 minutes
          responseTimes.push(responseTimeMs);
        }
      }
    }

    if (responseTimes.length === 0) {
      return {
        average_ms: 0,
        median_ms: 0,
        p95_ms: 0,
        p99_ms: 0,
        slowest_ms: 0,
        fastest_ms: 0,
        total_responses: 0,
      };
    }

    const sorted = [...responseTimes].sort((a, b) => a - b);
    const sum = responseTimes.reduce((acc, time) => acc + time, 0);

    return {
      average_ms: Math.floor(sum / responseTimes.length),
      median_ms: Math.floor(sorted[Math.floor(sorted.length / 2)] ?? 0),
      p95_ms: Math.floor(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
      p99_ms: Math.floor(sorted[Math.floor(sorted.length * 0.99)] ?? 0),
      slowest_ms: Math.floor(sorted[sorted.length - 1] ?? 0),
      fastest_ms: Math.floor(sorted[0] ?? 0),
      total_responses: responseTimes.length,
    };
  }
}
