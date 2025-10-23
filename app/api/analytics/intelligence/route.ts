import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  domain: z.string().optional(),
  metric: z.enum([
    'journey',
    'content-gaps',
    'peak-usage',
    'conversion-funnel',
    'all'
  ]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.string().optional().transform(val => val ? parseInt(val, 10) : 7),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = QuerySchema.parse({
      domain: searchParams.get('domain') || undefined,
      metric: searchParams.get('metric') || 'all',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      days: searchParams.get('days') || undefined,
    });

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const bi = BusinessIntelligence.getInstance();

    // Calculate time range
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(Date.now() - params.days * 24 * 60 * 60 * 1000);

    const timeRange = { start: startDate, end: endDate };

    // Fetch requested metrics
    const results: Record<string, any> = {
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    if (params.metric === 'journey' || params.metric === 'all') {
      results.customerJourney = await bi.analyzeCustomerJourney(
        params.domain || 'all',
        timeRange
      );
    }

    if (params.metric === 'content-gaps' || params.metric === 'all') {
      results.contentGaps = await bi.analyzeContentGaps(
        params.domain || 'all',
        0.7 // confidence threshold
      );
    }

    if (params.metric === 'peak-usage' || params.metric === 'all') {
      results.peakUsage = await bi.analyzePeakUsage(
        params.domain || 'all',
        params.days // number of days
      );
    }

    if (params.metric === 'conversion-funnel' || params.metric === 'all') {
      results.conversionFunnel = await bi.analyzeConversionFunnel(
        params.domain || 'all',
        ['initial_contact', 'product_inquiry', 'price_check', 'order_lookup', 'purchase'] // funnel definition
      );
    }

    // Add summary insights
    if (params.metric === 'all') {
      results.summary = generateSummaryInsights(results);
    }

    return NextResponse.json(results);

  } catch (error) {
    logger.error('Business intelligence API error', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function generateSummaryInsights(data: any): any {
  const insights = [];

  // Journey insights
  if (data.customerJourney) {
    const { conversionRate, avgSessionsBeforeConversion } = data.customerJourney;
    if (conversionRate < 0.2) {
      insights.push({
        type: 'warning',
        metric: 'conversion',
        message: `Low conversion rate (${(conversionRate * 100).toFixed(1)}%). Consider optimizing user flow.`,
        priority: 'high'
      });
    }
    if (avgSessionsBeforeConversion > 5) {
      insights.push({
        type: 'info',
        metric: 'journey',
        message: `Users take ${avgSessionsBeforeConversion.toFixed(1)} sessions before converting. Consider engagement strategies.`,
        priority: 'medium'
      });
    }
  }

  // Content gap insights
  if (data.contentGaps && data.contentGaps.unansweredQueries) {
    const criticalGaps = data.contentGaps.unansweredQueries.filter((g: any) => g.frequency > 10);
    if (criticalGaps.length > 0) {
      insights.push({
        type: 'warning',
        metric: 'content',
        message: `${criticalGaps.length} critical content gaps detected. Prioritize knowledge base updates.`,
        priority: 'high',
        details: criticalGaps.slice(0, 3)
      });
    }
  }

  // Peak usage insights
  if (data.peakUsage && data.peakUsage.hourlyDistribution) {
    const avgMessages = data.peakUsage.hourlyDistribution
      .reduce((acc: number, h: any) => acc + (h.avgMessages || 0), 0) / 24;
    const peakHours = data.peakUsage.hourlyDistribution
      .filter((h: any) => (h.avgMessages || 0) > avgMessages * 1.5)
      .map((h: any) => h.hour);

    if (peakHours.length > 0) {
      insights.push({
        type: 'info',
        metric: 'usage',
        message: `Peak usage hours: ${peakHours.join(', ')}:00. Ensure resources are scaled appropriately.`,
        priority: 'medium'
      });
    }
  }

  // Funnel insights
  if (data.conversionFunnel && data.conversionFunnel.stages) {
    const biggestDrop = data.conversionFunnel.stages.reduce((max: any, stage: any, i: number, arr: any[]) => {
      if (i === 0) return max;
      const dropRate = (arr[i-1].completedCount - stage.completedCount) / arr[i-1].completedCount;
      return dropRate > max.rate ? { stage: stage.name, rate: dropRate } : max;
    }, { stage: null, rate: 0 });

    if (biggestDrop.rate > 0.3) {
      insights.push({
        type: 'warning',
        metric: 'funnel',
        message: `${(biggestDrop.rate * 100).toFixed(1)}% drop-off at "${biggestDrop.stage}" stage. Critical optimization needed.`,
        priority: 'critical'
      });
    }
  }

  return {
    totalInsights: insights.length,
    criticalCount: insights.filter(i => i.priority === 'critical').length,
    highCount: insights.filter(i => i.priority === 'high').length,
    insights: insights.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    })
  };
}