import { createServiceRoleClientSync } from '@/lib/supabase/server';

export interface LookupFailure {
  query: string;
  queryType: 'sku' | 'product_name' | 'order_id' | 'unknown';
  errorType: 'not_found' | 'api_error' | 'timeout' | 'invalid_input';
  platform: string; // 'woocommerce' | 'shopify' | 'semantic'
  suggestions?: string[];
  timestamp: Date;
  domainId?: string;
  sessionId?: string;
}

/**
 * Track failed product/order lookups for analysis
 */
export async function trackLookupFailure(failure: LookupFailure): Promise<void> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) return;

    await supabase.from('lookup_failures').insert({
      query: failure.query,
      query_type: failure.queryType,
      error_type: failure.errorType,
      platform: failure.platform,
      suggestions: failure.suggestions || [],
      timestamp: failure.timestamp.toISOString(),
      domain_id: failure.domainId,
      session_id: failure.sessionId,
    });
  } catch (error) {
    console.error('[Telemetry] Failed to track lookup failure:', error);
    // Don't throw - telemetry failures shouldn't break main flow
  }
}

/**
 * Get lookup failure statistics
 */
export async function getLookupFailureStats(domainId?: string, days: number = 7) {
  const supabase = createServiceRoleClientSync();
  if (!supabase) return null;

  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from('lookup_failures')
    .select('*')
    .gte('timestamp', since.toISOString());

  if (domainId) {
    query = query.eq('domain_id', domainId);
  }

  const { data, error } = await query;
  if (error || !data) return null;

  // Aggregate statistics
  const stats = {
    totalFailures: data.length,
    byErrorType: {} as Record<string, number>,
    byPlatform: {} as Record<string, number>,
    topFailedQueries: [] as Array<{ query: string; count: number }>,
    commonPatterns: [] as string[],
  };

  // Count by error type
  data.forEach(f => {
    stats.byErrorType[f.error_type] = (stats.byErrorType[f.error_type] || 0) + 1;
    stats.byPlatform[f.platform] = (stats.byPlatform[f.platform] || 0) + 1;
  });

  // Find top failed queries
  const queryCounts = new Map<string, number>();
  data.forEach(f => {
    queryCounts.set(f.query, (queryCounts.get(f.query) || 0) + 1);
  });

  stats.topFailedQueries = Array.from(queryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Identify patterns (SKUs, product names, etc.)
  const skuPattern = /^[A-Z0-9-]{6,}$/i;
  const skuFailures = data.filter(f => skuPattern.test(f.query));
  if (skuFailures.length > data.length * 0.5) {
    stats.commonPatterns.push('High SKU failure rate');
  }

  return stats;
}
