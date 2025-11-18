/**
 * Attribution Breakdown Analytics
 *
 * Detailed attribution analysis by method, confidence level, and time-to-conversion
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { AttributionBreakdown } from '@/types/purchase-attribution';
import { getEmptyAttributionBreakdown, roundToTwoDecimals } from './revenue-analytics-helpers';

/**
 * Get detailed attribution breakdown
 */
export async function getAttributionBreakdown(
  domain: string,
  timeRange: { start: Date; end: Date }
): Promise<AttributionBreakdown> {
  const supabase = await createServiceRoleClient();

  // Get domain_id
  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', domain)
    .single();

  if (!domainData) {
    return getEmptyAttributionBreakdown();
  }

  // Get attributions with conversation data
  const { data: attributions } = await supabase
    .from('purchase_attributions')
    .select(`
      *,
      conversations(domain_id, created_at)
    `)
    .gte('order_created_at', timeRange.start.toISOString())
    .lte('order_created_at', timeRange.end.toISOString());

  if (!attributions || attributions.length === 0) {
    return getEmptyAttributionBreakdown();
  }

  // Filter to domain
  const domainAttributions = attributions.filter(
    (a: any) => !a.conversations || a.conversations.domain_id === domainData.id
  );

  // Group by method
  const byMethod = {
    session_match: { count: 0, revenue: 0, totalConfidence: 0 },
    email_match: { count: 0, revenue: 0, totalConfidence: 0 },
    time_proximity: { count: 0, revenue: 0, totalConfidence: 0 },
    no_match: { count: 0, revenue: 0, totalConfidence: 0 },
  };

  domainAttributions.forEach((a: any) => {
    const method = a.attribution_method as keyof typeof byMethod;
    if (byMethod[method]) {
      byMethod[method].count++;
      byMethod[method].revenue += parseFloat(a.order_total || '0');
      byMethod[method].totalConfidence += parseFloat(a.attribution_confidence || '0');
    }
  });

  // Calculate averages
  const byMethodFormatted = Object.fromEntries(
    Object.entries(byMethod).map(([key, value]) => [key, {
      count: value.count, revenue: roundToTwoDecimals(value.revenue),
      avgConfidence: value.count > 0 ? roundToTwoDecimals(value.totalConfidence / value.count) : 0
    }])
  );

  // Group by confidence level
  const byConfidence = {
    high: { count: 0, revenue: 0, totalConfidence: 0 },
    medium: { count: 0, revenue: 0, totalConfidence: 0 },
    low: { count: 0, revenue: 0, totalConfidence: 0 },
  };

  domainAttributions.forEach((a: any) => {
    const conf = parseFloat(a.attribution_confidence);
    const bucket = conf >= 0.7 ? 'high' : conf >= 0.4 ? 'medium' : 'low';

    byConfidence[bucket].count++;
    byConfidence[bucket].revenue += parseFloat(a.order_total || '0');
    byConfidence[bucket].totalConfidence += conf;
  });

  const byConfidenceFormatted = Object.fromEntries(
    Object.entries(byConfidence).map(([key, value]) => [key, {
      count: value.count, revenue: roundToTwoDecimals(value.revenue),
      avgConfidence: value.count > 0 ? roundToTwoDecimals(value.totalConfidence / value.count) : 0
    }])
  );

  // Time to conversion analysis
  const conversionTimes: number[] = [];

  domainAttributions.forEach((a: any) => {
    if (a.conversation_id && a.conversations) {
      const conversationTime = new Date(a.conversations.created_at).getTime();
      const orderTime = new Date(a.order_created_at).getTime();
      const diffSeconds = (orderTime - conversationTime) / 1000;

      if (diffSeconds > 0) {
        conversionTimes.push(diffSeconds);
      }
    }
  });

  const avgSeconds = conversionTimes.length > 0
    ? conversionTimes.reduce((sum, t) => sum + t, 0) / conversionTimes.length
    : 0;

  const sortedTimes = [...conversionTimes].sort((a, b) => a - b);
  const medianSeconds = sortedTimes.length > 0
    ? sortedTimes[Math.floor(sortedTimes.length / 2)]
    : 0;

  // Distribution buckets
  const dist = [{ bucket: '0-1h', count: 0, revenue: 0 }, { bucket: '1-6h', count: 0, revenue: 0 },
    { bucket: '6-24h', count: 0, revenue: 0 }, { bucket: '1-7d', count: 0, revenue: 0 }, { bucket: '7d+', count: 0, revenue: 0 }];

  domainAttributions.forEach((a: any) => {
    if (a.conversation_id && a.conversations) {
      const convTime = new Date(a.conversations.created_at).getTime();
      const orderTime = new Date(a.order_created_at).getTime();
      const hours = (orderTime - convTime) / (1000 * 60 * 60);
      const rev = parseFloat(a.order_total || '0');
      const idx = hours <= 1 ? 0 : hours <= 6 ? 1 : hours <= 24 ? 2 : hours <= 168 ? 3 : 4;
      if (dist[idx]) {
        dist[idx].count++;
        dist[idx].revenue += rev;
      }
    }
  });

  return {
    byMethod: byMethodFormatted as any,
    byConfidence: byConfidenceFormatted as any,
    timeToConversion: {
      avgSeconds: Math.round(avgSeconds),
      medianSeconds: Math.round(medianSeconds ?? 0),
      distribution: dist.map(d => ({ ...d, revenue: roundToTwoDecimals(d.revenue) })),
    },
  };
}
