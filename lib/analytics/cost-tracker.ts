/**
 * Cost tracking for AI sentiment analysis
 *
 * Monitors OpenAI API usage and estimates monthly costs.
 * Provides warnings if costs exceed expected thresholds.
 */

interface CostStats {
  totalCalls: number;
  lastResetDate: string;
  estimatedMonthlyCost: number;
}

// In-memory cost tracking (resets on server restart)
// For production, consider storing in Redis or database
let costStats: CostStats = {
  totalCalls: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
  estimatedMonthlyCost: 0,
};

// Pricing constants for gpt-4o-mini (as of 2025)
// Input: $0.150 per 1M tokens, Output: $0.600 per 1M tokens
const COST_PER_1K_INPUT_TOKENS = 0.00015; // $0.15 per 1M tokens
const COST_PER_1K_OUTPUT_TOKENS = 0.0006; // $0.60 per 1M tokens

// Average tokens per sentiment analysis call
const AVG_INPUT_TOKENS_PER_CALL = 150; // System prompt + message (trimmed to 500 chars)
const AVG_OUTPUT_TOKENS_PER_CALL = 30; // JSON response with sentiment data

// Cost per single sentiment analysis
const COST_PER_CALL =
  (AVG_INPUT_TOKENS_PER_CALL / 1000) * COST_PER_1K_INPUT_TOKENS +
  (AVG_OUTPUT_TOKENS_PER_CALL / 1000) * COST_PER_1K_OUTPUT_TOKENS;

// Monthly cost threshold for warnings (default: $5)
const MONTHLY_COST_THRESHOLD = parseFloat(
  process.env.SENTIMENT_COST_THRESHOLD || '5.0'
);

/**
 * Track a sentiment analysis API call
 *
 * @param callCount - Number of API calls made (default: 1)
 */
export function trackSentimentCost(callCount: number = 1): void {
  const today = new Date().toISOString().slice(0, 10);

  // Reset stats if new month
  if (costStats.lastResetDate.slice(0, 7) !== today.slice(0, 7)) {
    console.log(
      `[Cost Tracker] Monthly reset - Previous month: ${costStats.totalCalls} calls, $${costStats.estimatedMonthlyCost.toFixed(4)}`
    );
    costStats = {
      totalCalls: 0,
      lastResetDate: today,
      estimatedMonthlyCost: 0,
    };
  }

  // Update stats
  costStats.totalCalls += callCount;
  costStats.estimatedMonthlyCost = costStats.totalCalls * COST_PER_CALL;

  // Log warning if threshold exceeded
  if (costStats.estimatedMonthlyCost > MONTHLY_COST_THRESHOLD) {
    console.warn(
      `[Cost Tracker] ⚠️ Monthly cost threshold exceeded: $${costStats.estimatedMonthlyCost.toFixed(2)} > $${MONTHLY_COST_THRESHOLD}`
    );
  }
}

/**
 * Get current cost statistics
 *
 * @returns Current cost stats including total calls and estimated monthly cost
 */
export function getCostStats(): CostStats {
  return { ...costStats };
}

/**
 * Reset cost statistics (useful for testing)
 */
export function resetCostStats(): void {
  costStats = {
    totalCalls: 0,
    lastResetDate: new Date().toISOString().slice(0, 10),
    estimatedMonthlyCost: 0,
  };
}

/**
 * Estimate monthly cost based on expected message volume
 *
 * @param messagesPerMonth - Expected number of messages per month
 * @returns Estimated monthly cost in USD
 */
export function estimateMonthlyCost(messagesPerMonth: number): number {
  return messagesPerMonth * COST_PER_CALL;
}

/**
 * Log cost summary to console
 *
 * Useful for monitoring and debugging cost usage.
 */
export function logCostSummary(): void {
  const stats = getCostStats();
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = new Date().getDate();
  const projectedMonthlyCalls = (stats.totalCalls / dayOfMonth) * daysInMonth;
  const projectedMonthlyCost = projectedMonthlyCalls * COST_PER_CALL;

  console.log(`Current monthly cost: $${stats.estimatedMonthlyCost.toFixed(4)}`);
  console.log(`Projected end-of-month cost: $${projectedMonthlyCost.toFixed(2)}`);
  console.log(`Cost per call: $${COST_PER_CALL.toFixed(6)}`);
}

/**
 * Example usage estimates for documentation
 *
 * Returns cost estimates for common usage scenarios.
 */
export function getUsageExamples(): Array<{ messages: number; cost: string }> {
  return [
    { messages: 1000, cost: estimateMonthlyCost(1000).toFixed(2) },
    { messages: 5000, cost: estimateMonthlyCost(5000).toFixed(2) },
    { messages: 10000, cost: estimateMonthlyCost(10000).toFixed(2) },
    { messages: 30000, cost: estimateMonthlyCost(30000).toFixed(2) },
    { messages: 50000, cost: estimateMonthlyCost(50000).toFixed(2) },
  ];
}
