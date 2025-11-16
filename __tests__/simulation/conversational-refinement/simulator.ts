/**
 * Conversational Refinement Simulator
 *
 * Simulates AI-guided progressive narrowing of broad product queries
 */

import { getConversationalRefinementPrompt } from '@/lib/chat/system-prompts/sections/conversational-refinement';
import { MockProduct } from './types';
import {
  formatCategoryGroupResponse,
  formatPriceRangeResponse,
  formatStockAvailabilityResponse,
  formatMatchQualityResponse,
  formatRankingBasedResponse,
  formatFinalResults,
  groupByCategory,
  areResultsSimilar,
} from './formatters';

export { MockProduct };

export class ConversationalRefinementSimulator {
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = getConversationalRefinementPrompt();
  }

  simulateBroadQueryResponse(
    query: string,
    products: MockProduct[]
  ): { shouldRefine: boolean; response: string; groupings?: any } {
    const isBroad =
      query.toLowerCase().includes('show me products') ||
      query.toLowerCase().includes('i need') ||
      products.length > 8;

    if (!isBroad || products.length < 5) {
      return { shouldRefine: false, response: 'Direct results' };
    }

    const categoryGroups = groupByCategory(products);
    const response = formatCategoryGroupResponse(
      query,
      categoryGroups,
      products.length
    );

    return { shouldRefine: true, response, groupings: categoryGroups };
  }

  simulateCategoryGrouping(products: MockProduct[]): {
    groups: Map<string, MockProduct[]>;
    response: string;
  } {
    const groups = groupByCategory(products);
    const response = formatCategoryGroupResponse(
      'product query',
      groups,
      products.length
    );
    return { groups, response };
  }

  simulatePriceRangeGrouping(
    products: MockProduct[],
    maxPrice?: number
  ): {
    groups: { budget: MockProduct[]; midRange: MockProduct[]; premium: MockProduct[] };
    response: string;
  } {
    const budget = products.filter(p => p.price < 50);
    const midRange = products.filter(p => p.price >= 50 && p.price <= 150);
    const premium = products.filter(p => p.price > 150);

    const response = formatPriceRangeResponse(
      budget.length,
      midRange.length,
      premium.length
    );

    return { groups: { budget, midRange, premium }, response };
  }

  simulateStockAvailabilityGrouping(products: MockProduct[]): {
    groups: {
      inStock: MockProduct[];
      backorder: MockProduct[];
      outOfStock: MockProduct[];
    };
    response: string;
  } {
    const inStock = products.filter(p => p.stock_status === 'instock');
    const backorder = products.filter(p => p.stock_status === 'onbackorder');
    const outOfStock = products.filter(p => p.stock_status === 'outofstock');

    const response = formatStockAvailabilityResponse(
      inStock.length,
      backorder.length,
      outOfStock.length
    );

    return { groups: { inStock, backorder, outOfStock }, response };
  }

  simulateMatchQualityGrouping(products: MockProduct[]): {
    groups: {
      excellent: MockProduct[];
      good: MockProduct[];
      moderate: MockProduct[];
    };
    response: string;
  } {
    const excellent = products.filter(p => p.similarity_score >= 0.9);
    const good = products.filter(
      p => p.similarity_score >= 0.75 && p.similarity_score < 0.9
    );
    const moderate = products.filter(
      p => p.similarity_score >= 0.6 && p.similarity_score < 0.75
    );

    const response = formatMatchQualityResponse(
      excellent.length,
      good.length,
      moderate.length
    );

    return { groups: { excellent, good, moderate }, response };
  }

  simulateProgressiveNarrowing(
    initialQuery: string,
    allProducts: MockProduct[]
  ): {
    turns: Array<{ query: string; response: string; products: MockProduct[] }>;
  } {
    const turns: Array<{
      query: string;
      response: string;
      products: MockProduct[];
    }> = [];

    const turn1Response = this.simulateBroadQueryResponse(
      initialQuery,
      allProducts
    );
    turns.push({
      query: initialQuery,
      response: turn1Response.response,
      products: allProducts,
    });

    const categoryGroups = groupByCategory(allProducts);
    const firstCategory = Array.from(categoryGroups.keys())[0];
    const categoryProducts = categoryGroups.get(firstCategory) || [];

    turns.push({
      query: firstCategory,
      response: `Great! I found ${categoryProducts.length} ${firstCategory} options. Would you like to see budget options, mid-range options, or all options ranked by popularity?`,
      products: categoryProducts,
    });

    const budgetProducts = categoryProducts.filter(p => p.price < 50);
    turns.push({
      query: 'Budget options',
      response: formatFinalResults(budgetProducts),
      products: budgetProducts,
    });

    return { turns };
  }

  shouldNotRefine(query: string, products: MockProduct[]): boolean {
    if (
      query.match(/^[A-Z0-9\-]+$/) ||
      query.toLowerCase().includes('specific') ||
      query.toLowerCase().includes('exact')
    ) {
      return true;
    }

    if (products.length < 5) {
      return true;
    }

    if (areResultsSimilar(products)) {
      return true;
    }

    if (
      query.toLowerCase().includes('show me everything') ||
      query.toLowerCase().includes('all products')
    ) {
      return true;
    }

    return false;
  }

  simulateRankingDataResponse(products: MockProduct[]): {
    response: string;
    topMatches: MockProduct[];
    explanation: string;
  } {
    const topMatches = products
      .filter(p => p.rankingScore && p.rankingScore > 0.8)
      .sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));

    const explanation = `The top matches (90%+ similarity) are ranked by multi-signal scoring including semantic match, stock availability, price match, popularity, and recency.`;

    const response = formatRankingBasedResponse(topMatches, products);

    return { response, topMatches, explanation };
  }

  verifyConversationalTone(response: string): {
    isConversational: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    const conversationalPhrases = [
      'I found',
      'Would you like',
      'Based on your search',
      'Which type',
      'Great!',
      'Perfect!',
      'let me help',
    ];
    const hasConversational = conversationalPhrases.some(phrase =>
      response.includes(phrase)
    );

    if (!hasConversational) {
      issues.push('Missing conversational phrases');
    }

    const roboticPhrases = [
      'Initiating',
      'protocol',
      'Please select',
      'parameter',
      'Results filtered',
    ];
    const hasRobotic = roboticPhrases.some(phrase => response.includes(phrase));

    if (hasRobotic) {
      issues.push('Contains robotic language');
    }

    return {
      isConversational: hasConversational && !hasRobotic,
      issues,
    };
  }

  formatFinalResults(products: MockProduct[]): string {
    return formatFinalResults(products);
  }
}
