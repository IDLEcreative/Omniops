/**
 * Custom Funnel Metrics Calculator
 * Calculates funnel metrics using custom stages
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { CustomFunnel, FunnelStage } from './custom-funnels';

export async function calculateFunnelMetrics(
  organizationId: string,
  funnel: CustomFunnel,
  domainId?: string,
  timeRange?: { start: Date; end: Date }
): Promise<{
  funnel: CustomFunnel;
  stageMetrics: Array<{
    stage: FunnelStage;
    count: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
}> {
  const supabase = await createServiceRoleClient();

  // Get conversations with metadata
  let query = supabase
    .from('conversations')
    .select('id, metadata, created_at, domain')
    .eq('domain', domainId || '');

  if (timeRange) {
    query = query
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());
  }

  const { data: conversations } = await query;

  if (!conversations || conversations.length === 0) {
    return {
      funnel,
      stageMetrics: funnel.stages.map((stage) => ({
        stage,
        count: 0,
        conversionRate: 0,
        dropOffRate: 0,
      })),
    };
  }

  // Map conversations to stages
  const { mapConversationToStage } = await import('./custom-funnels');
  const stageCounts: Record<string, number> = {};
  funnel.stages.forEach((stage) => {
    stageCounts[stage.id] = 0;
  });

  conversations.forEach((conv) => {
    const stage = mapConversationToStage(conv.metadata, funnel);
    if (stage && stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }
  });

  // Calculate metrics
  const totalConversations = conversations.length;
  let previousCount = totalConversations;

  const stageMetrics = funnel.stages.map((stage, index) => {
    const count = stageCounts[stage.id] || 0;
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0;
    const dropOffRate = 100 - conversionRate;

    previousCount = count;

    return {
      stage,
      count,
      conversionRate: Math.round(conversionRate * 100) / 100,
      dropOffRate: Math.round(dropOffRate * 100) / 100,
    };
  });

  return {
    funnel,
    stageMetrics,
  };
}
