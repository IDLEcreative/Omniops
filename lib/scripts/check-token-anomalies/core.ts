// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js';

export interface AnomalyResult {
  type: 'spike' | 'unusual_pattern' | 'outlier' | 'normal';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details: any;
}

export interface TokenMetrics {
  avgTokensPerMessage: number;
  maxTokens: number;
  minTokens: number;
  stdDev: number;
  total: number;
}

export class TokenAnomalyDetector {
  private supabase: any;
  private thresholds = {
    spikeMultiplier: 3,
    outlierMultiplier: 2.5,
    minSampleSize: 10
  };

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async analyzeTokenUsage(domain?: string, hours: number = 24): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    try {
      let query = this.supabase
        .from('messages')
        .select('id, domain_id, tokens_used, created_at, role')
        .gte('created_at', since)
        .not('tokens_used', 'is', null);

      if (domain) {
        query = query.eq('domain_id', domain);
      }

      const { data: messages, error } = await query;

      if (error) throw error;
      if (!messages || messages.length < this.thresholds.minSampleSize) {
        return [{
          type: 'normal',
          severity: 'info',
          message: `Insufficient data: only ${messages?.length || 0} messages found`,
          details: { messages: messages?.length || 0 }
        }];
      }

      const metrics = this.calculateMetrics(messages);
      anomalies.push(...this.detectSpikes(messages, metrics));
      anomalies.push(...this.detectOutliers(messages, metrics));
      anomalies.push(...this.detectUnusualPatterns(messages, metrics));

      if (anomalies.length === 0) {
        anomalies.push({
          type: 'normal',
          severity: 'info',
          message: 'No anomalies detected',
          details: metrics
        });
      }

      return anomalies;
    } catch (error: any) {
      return [{
        type: 'unusual_pattern',
        severity: 'critical',
        message: `Error analyzing tokens: ${error.message}`,
        details: { error: error.message }
      }];
    }
  }

  private calculateMetrics(messages: any[]): TokenMetrics {
    const tokenCounts = messages.map(m => m.tokens_used);
    const sum = tokenCounts.reduce((a, b) => a + b, 0);
    const avg = sum / tokenCounts.length;

    const squaredDiffs = tokenCounts.map(count => Math.pow(count - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / tokenCounts.length;
    const stdDev = Math.sqrt(variance);

    return {
      avgTokensPerMessage: avg,
      maxTokens: Math.max(...tokenCounts),
      minTokens: Math.min(...tokenCounts),
      stdDev,
      total: sum
    };
  }

  private detectSpikes(messages: any[], metrics: TokenMetrics): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const spikeThreshold = metrics.avgTokensPerMessage * this.thresholds.spikeMultiplier;

    const spikes = messages.filter(m => m.tokens_used > spikeThreshold);

    if (spikes.length > 0) {
      anomalies.push({
        type: 'spike',
        severity: spikes.length > 5 ? 'critical' : 'warning',
        message: `Detected ${spikes.length} token usage spikes`,
        details: {
          threshold: spikeThreshold,
          spikes: spikes.map(s => ({
            id: s.id,
            tokens: s.tokens_used,
            created_at: s.created_at
          }))
        }
      });
    }

    return anomalies;
  }

  private detectOutliers(messages: any[], metrics: TokenMetrics): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const upperBound = metrics.avgTokensPerMessage + (metrics.stdDev * this.thresholds.outlierMultiplier);
    const lowerBound = Math.max(0, metrics.avgTokensPerMessage - (metrics.stdDev * this.thresholds.outlierMultiplier));

    const outliers = messages.filter(m =>
      m.tokens_used > upperBound || m.tokens_used < lowerBound
    );

    if (outliers.length > messages.length * 0.1) {
      anomalies.push({
        type: 'outlier',
        severity: 'warning',
        message: `High number of outliers: ${outliers.length} (${((outliers.length / messages.length) * 100).toFixed(1)}%)`,
        details: {
          upperBound,
          lowerBound,
          outlierCount: outliers.length,
          outlierPercentage: (outliers.length / messages.length) * 100
        }
      });
    }

    return anomalies;
  }

  private detectUnusualPatterns(messages: any[], metrics: TokenMetrics): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    const byHour = this.groupByHour(messages);
    const hourlyAverages = Object.values(byHour).map((msgs: any) =>
      msgs.reduce((sum: number, m: any) => sum + m.tokens_used, 0) / msgs.length
    );

    if (hourlyAverages.length > 1) {
      const hourlyMax = Math.max(...hourlyAverages);
      const hourlyMin = Math.min(...hourlyAverages);

      if (hourlyMax > hourlyMin * 5) {
        anomalies.push({
          type: 'unusual_pattern',
          severity: 'warning',
          message: 'Significant hourly variation in token usage detected',
          details: {
            maxHourlyAvg: hourlyMax,
            minHourlyAvg: hourlyMin,
            ratio: hourlyMax / hourlyMin
          }
        });
      }
    }

    return anomalies;
  }

  private groupByHour(messages: any[]): Record<string, any[]> {
    return messages.reduce((groups, msg) => {
      const hour = new Date(msg.created_at).getHours();
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(msg);
      return groups;
    }, {} as Record<string, any[]>);
  }
}
