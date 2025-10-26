/**
 * Report generation for Business Intelligence Analytics
 * Handles conversion funnel analysis and related reporting
 */

import type {
  ConversationData,
  MessageData,
  FunnelStage,
  Bottleneck
} from './business-intelligence-types';

/**
 * Categorize message for funnel analysis
 */
export function categorizeMessageForFunnel(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('checkout') || lower.includes('purchase') || lower.includes('buy')) {
    return 'checkout';
  }
  if (lower.includes('cart') || lower.includes('add to cart')) {
    return 'cart';
  }
  if (lower.includes('product') || lower.includes('show') || lower.includes('browse')) {
    return 'product';
  }
  return 'visit';
}

/**
 * Get stage index for a category
 */
export function getStageIndexForCategory(category: string, stages: string[]): number {
  const categoryToStage: { [key: string]: string } = {
    'visit': 'Visit',
    'product': 'Product Inquiry',
    'cart': 'Add to Cart',
    'checkout': 'Checkout'
  };

  const stageName = categoryToStage[category];
  if (!stageName) return 0;

  return stages.indexOf(stageName);
}

/**
 * Analyze drop-off reasons for a stage
 */
export function analyzeDropOffReasons(stageName: string, conversations: ConversationData[]): string[] {
  // Simple drop-off reason analysis based on stage
  const reasons: { [key: string]: string[] } = {
    'Visit': ['No engagement', 'Quick exit'],
    'Product Inquiry': ['No relevant products', 'Unclear response'],
    'Add to Cart': ['Price concerns', 'Out of stock'],
    'Checkout': ['Payment issues', 'Shipping concerns'],
    'Purchase': ['Technical error', 'Changed mind']
  };

  return reasons[stageName] || ['Unknown'];
}

/**
 * Process conversations to track funnel progression
 */
export function trackFunnelProgression(
  conversations: ConversationData[],
  stagesDefinition: string[]
): {
  stageCounts: Map<string, number>;
  stageCompletions: Map<string, number>;
  stageDurations: Map<string, number[]>;
} {
  const stageCounts = new Map<string, number>();
  const stageCompletions = new Map<string, number>();
  const stageDurations = new Map<string, number[]>();

  // Initialize stage tracking
  for (const stageName of stagesDefinition) {
    stageCounts.set(stageName, 0);
    stageCompletions.set(stageName, 0);
    stageDurations.set(stageName, []);
  }

  // Analyze each conversation
  for (const conversation of conversations) {
    const messages = conversation.messages || [];
    if (messages.length === 0) continue;

    // Every session starts with 'Visit'
    stageCounts.set('Visit', (stageCounts.get('Visit') || 0) + 1);

    const userMessages = messages.filter(m => m.role === 'user');
    let currentStageIndex = 0;
    let stageStartTime = new Date(messages[0]!.created_at);

    // Categorize messages to determine stage progression
    for (const message of userMessages) {
      const category = categorizeMessageForFunnel(message.content);
      const stageIndex = getStageIndexForCategory(category, stagesDefinition);

      // Track stage entry
      if (stageIndex >= 0 && stageIndex < stagesDefinition.length) {
        const stageName = stagesDefinition[stageIndex]!;
        stageCounts.set(stageName, (stageCounts.get(stageName) || 0) + 1);

        // Calculate duration in previous stage
        if (currentStageIndex < stageIndex) {
          const prevStageName = stagesDefinition[currentStageIndex]!;
          const duration = (new Date(message.created_at).getTime() - stageStartTime.getTime()) / 1000;
          const durations = stageDurations.get(prevStageName) || [];
          durations.push(duration);
          stageDurations.set(prevStageName, durations);

          // Mark previous stage as completed
          stageCompletions.set(prevStageName, (stageCompletions.get(prevStageName) || 0) + 1);

          currentStageIndex = stageIndex;
          stageStartTime = new Date(message.created_at);
        }
      }
    }
  }

  return { stageCounts, stageCompletions, stageDurations };
}

/**
 * Build funnel stages from tracking data
 */
export function buildFunnelStages(
  stagesDefinition: string[],
  stageCounts: Map<string, number>,
  stageCompletions: Map<string, number>,
  stageDurations: Map<string, number[]>,
  conversations: ConversationData[]
): FunnelStage[] {
  return stagesDefinition.map((stageName) => {
    const entered = stageCounts.get(stageName) || 0;
    const completed = stageCompletions.get(stageName) || 0;
    const durations = stageDurations.get(stageName) || [];
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    return {
      name: stageName,
      enteredCount: entered,
      completedCount: completed,
      conversionRate: entered > 0 ? (completed / entered) : 0,
      avgDuration,
      dropOffReasons: analyzeDropOffReasons(stageName, conversations)
    };
  });
}

/**
 * Identify bottlenecks in the funnel
 */
export function identifyBottlenecks(stages: FunnelStage[]): Bottleneck[] {
  return stages
    .filter(s => s.conversionRate < 0.5 && s.enteredCount > 0)
    .map(s => ({
      stage: s.name,
      severity: (s.conversionRate < 0.3 ? 'high' : s.conversionRate < 0.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      impact: (1 - s.conversionRate) * s.enteredCount,
      recommendation: `Improve ${s.name} stage - ${Math.round((1 - s.conversionRate) * 100)}% drop-off rate detected`
    }))
    .sort((a, b) => b.impact - a.impact);
}
