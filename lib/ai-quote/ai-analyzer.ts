/**
 * AI Quote Analyzer
 * Uses GPT-4o-mini to analyze business intelligence and recommend pricing tier
 */

import OpenAI from 'openai';
import {
  BusinessIntelligence,
  PricingRecommendation,
  PricingSignals
} from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TIER_PRICING = {
  small_business: 500,
  sme: 1000,
  mid_market: 5000,
  enterprise: 10000
};

export async function analyzeBusiness(
  intel: BusinessIntelligence
): Promise<PricingRecommendation> {
  const prompt = buildAnalysisPrompt(intel);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature = more consistent
      max_tokens: 1000
    });

    const message = response.choices[0]?.message;
    if (!message || !message.content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(message.content);

    // Build complete recommendation
    return {
      tier: analysis.tier as PricingRecommendation['tier'],
      monthlyPrice: getTierPrice(analysis.tier),
      confidence: analysis.confidence,
      estimatedCompletions: analysis.estimatedCompletions,
      reasoning: analysis.reasoning,
      signals: analysis.signals,
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw new Error(`Failed to analyze business: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function buildAnalysisPrompt(intel: BusinessIntelligence): string {
  return `You are a B2B SaaS pricing expert for an AI customer service platform. Analyze this business and recommend the optimal pricing tier.

## Business Intelligence

**Domain:** ${intel.domain}
**Monthly Traffic:** ${intel.traffic.monthlyVisitors.toLocaleString()} visitors (${intel.traffic.confidence}% confidence, source: ${intel.traffic.source})

**Website Analysis:**
- Total Pages: ${intel.website.totalPages}
- Products: ${intel.website.productCount}
- Blog Posts: ${intel.website.blogPostCount}
- E-commerce Platform: ${intel.website.technologies.ecommercePlatform || 'None'}
- Has Blog: ${intel.website.hasBlog ? 'Yes' : 'No'}
- Languages Supported: ${intel.website.languages.join(', ')}
- Categories: ${intel.website.categories.join(', ')}

**Company Information:**
- Name: ${intel.company.name}
- Employees: ${intel.company.employeeCount || 'Unknown'}
- Annual Revenue: £${intel.company.revenue?.toLocaleString() || 'Unknown'}
- Industry: ${intel.company.industry || 'Unknown'}
- Founded: ${intel.company.foundedYear || 'Unknown'}
- Status: ${intel.company.companyStatus}
- Location: ${intel.company.location || 'Unknown'}

**Domain Age:** ${intel.domainInfo.domainAge} years
**Registrar:** ${intel.domainInfo.registrar || 'Unknown'}

## Available Pricing Tiers

1. **Small Business** - £500/month
   - Includes: 2,500 completed conversations/month
   - Target: 20k-100k visitors/month, 5-15 employees, £500k-£2M revenue
   - Replaces: 1 part-time CS rep (£1,677/month cost)
   - Typical: Growing online shops, local businesses

2. **SME** - £1,000/month
   - Includes: 5,000 completed conversations/month
   - Target: 100k-500k visitors/month, 15-50 employees, £2M-£10M revenue
   - Replaces: 1.5-2 full-time CS reps (£6,708/month cost)
   - Typical: Established e-commerce, B2B businesses

3. **Mid-Market** - £5,000/month
   - Includes: 25,000 completed conversations/month
   - Target: 500k-2M visitors/month, 50-250 employees, £10M-£50M revenue
   - Replaces: 5-10 full-time CS reps (£16,770/month cost)
   - Typical: Large e-commerce, multi-brand retailers

4. **Enterprise** - £10,000/month
   - Includes: 100,000 completed conversations/month
   - Target: 2M+ visitors/month, 250+ employees, £50M+ revenue
   - Replaces: 15-30 full-time CS reps (£33,540/month cost)
   - Typical: Enterprise e-commerce, multi-nationals

## Analysis Guidelines

**Conversation Estimation:**
- Assume 5% of website visitors engage with chat widget
- Assume 90% of chats result in completed conversations
- Formula: monthlyVisitors × 0.05 × 0.90 = estimatedCompletions

**Tier Selection Logic:**
1. Prioritize traffic data (most reliable signal)
2. Consider employee count (indicates CS team size)
3. Consider revenue (ability to pay)
4. Consider website complexity (support needs)
5. Consider domain age and business maturity
6. If data is missing, estimate conservatively

**Confidence Score:**
- High confidence (80-100): Strong signals across multiple dimensions
- Medium confidence (60-79): Some missing data but clear indicators
- Low confidence (40-59): Limited data, recommend starting tier

**Signals (provide as object with traffic, employee, revenue, content, domainAge keys, each being "high", "medium", or "low"):**

## Required Output

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):

{
  "tier": "sme",
  "confidence": 85,
  "estimatedCompletions": 2250,
  "reasoning": [
    "50k monthly visitors suggests ~2,250 conversations/month (5% engagement × 90% completion)",
    "15 employees indicates small CS team that could be replaced",
    "WooCommerce store = active customer inquiries",
    "£3M revenue shows ability to invest in automation"
  ],
  "signals": {
    "trafficSignal": "high",
    "employeeSignal": "medium",
    "revenueSignal": "medium",
    "contentSignal": "extensive",
    "domainAgeSignal": "established"
  }
}

Provide your analysis now:`;
}

function getTierPrice(tier: string): number {
  return TIER_PRICING[tier as keyof typeof TIER_PRICING] || 1000;
}

export function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    small_business: 'Small Business',
    sme: 'SME',
    mid_market: 'Mid-Market',
    enterprise: 'Enterprise'
  };
  return names[tier] || 'SME';
}

export function getTierFeatures(tier: string) {
  const features: Record<string, any> = {
    small_business: {
      unlimitedSeats: true,
      unlimitedScraping: true,
      woocommerce: true,
      shopify: false,
      prioritySupport: false,
      advancedAnalytics: false,
      slaUptime: '99%',
      monthlyConversations: 2500
    },
    sme: {
      unlimitedSeats: true,
      unlimitedScraping: true,
      woocommerce: true,
      shopify: true,
      prioritySupport: true,
      advancedAnalytics: false,
      slaUptime: '99.5%',
      monthlyConversations: 5000
    },
    mid_market: {
      unlimitedSeats: true,
      unlimitedScraping: true,
      woocommerce: true,
      shopify: true,
      prioritySupport: true,
      advancedAnalytics: true,
      slaUptime: '99.9%',
      monthlyConversations: 25000
    },
    enterprise: {
      unlimitedSeats: true,
      unlimitedScraping: true,
      woocommerce: true,
      shopify: true,
      prioritySupport: true,
      advancedAnalytics: true,
      slaUptime: '99.99%',
      monthlyConversations: 100000
    }
  };

  return features[tier] || features['sme'];
}

export function calculateSavings(monthlyPrice: number) {
  // Typical CS team costs
  const csRepCostPerMonth = 3000; // Average cost of one full-time CS rep in UK
  const avgTeamSize = 2; // Most SMEs have 1-3 CS reps

  const totalCSSavings = csRepCostPerMonth * avgTeamSize;
  const percentageSavings = Math.round((1 - monthlyPrice / totalCSSavings) * 100);

  return {
    vsCSTeam: Math.max(0, totalCSSavings - monthlyPrice),
    percentageSavings: Math.max(0, percentageSavings)
  };
}
