/**
 * AI Quote Analysis Endpoint
 * POST /api/ai-quote/analyze
 * Analyzes a domain and returns pricing recommendation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  collectBusinessIntelligence,
  analyzeBusiness,
  getTierDisplayName,
  getTierFeatures,
  calculateSavings
} from '@/lib/ai-quote';
import { AIQuoteAnalysisRequest, AIQuoteAnalysisResponse } from '@/lib/ai-quote/types';

// Simple in-memory rate limiting
// In production, use Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest): Promise<NextResponse<AIQuoteAnalysisResponse>> {
  try {
    // Get client IP
    const ip = getClientIP(request);

    // Check rate limit (3 per hour)
    const rateLimitKey = ip;
    const now = Date.now();
    const existing = rateLimitMap.get(rateLimitKey);

    if (existing) {
      if (now < existing.resetTime) {
        if (existing.count >= 3) {
          return NextResponse.json(
            {
              success: false,
              error: 'Rate limit exceeded',
              details: 'Maximum 3 quotes per hour per IP'
            },
            { status: 429 }
          ) as any;
        }
        existing.count++;
      } else {
        // Reset window
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60 * 60 * 1000 });
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60 * 60 * 1000 });
    }

    // Parse request
    const body = (await request.json()) as AIQuoteAnalysisRequest;
    const { domain } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: 'Domain is required and must be a string'
        },
        { status: 400 }
      ) as any;
    }

    // Validate domain format
    if (!isValidDomain(domain)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid domain',
          details: 'Please provide a valid domain name'
        },
        { status: 400 }
      ) as any;
    }

    const startTime = Date.now();

    // Collect intelligence
    const intel = await collectBusinessIntelligence(domain);

    // AI analysis
    const recommendation = await analyzeBusiness(intel);

    const analysisTime = (Date.now() - startTime) / 1000;

    // Build response
    const response: AIQuoteAnalysisResponse = {
      success: true,
      quote: {
        tier: recommendation.tier,
        tierDisplayName: getTierDisplayName(recommendation.tier),
        monthlyPrice: recommendation.monthlyPrice,
        monthlyConversations: getTierFeatures(recommendation.tier).monthlyConversations,
        confidence: recommendation.confidence,
        estimatedCompletions: recommendation.estimatedCompletions,
        reasoning: recommendation.reasoning,
        signals: recommendation.signals,
        features: getTierFeatures(recommendation.tier),
        savings: calculateSavings(recommendation.monthlyPrice)
      },
      intelligence: {
        traffic: intel.traffic,
        company: {
          name: intel.company.name,
          employeeCount: intel.company.employeeCount,
          revenue: intel.company.revenue,
          industry: intel.company.industry
        },
        website: {
          totalPages: intel.website.totalPages,
          productCount: intel.website.productCount,
          hasBlog: intel.website.hasBlog,
          hasEcommerce: intel.website.hasEcommerce
        }
      },
      analysisTime
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Quote analysis error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: 'Analysis failed',
        details: errorMessage
      },
      { status: 500 }
    ) as any;
  }
}

function getClientIP(request: NextRequest): string {
  // Try to get client IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) return ip;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

function isValidDomain(domain: string): boolean {
  // Basic domain validation
  // Allow: example.com, sub.example.co.uk, localhost, etc.
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$|^localhost$/i;
  return domainRegex.test(domain);
}

export const config = {
  runtime: 'nodejs'
};
