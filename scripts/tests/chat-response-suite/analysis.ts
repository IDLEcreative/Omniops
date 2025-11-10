import type { TestScenario } from './scenarios';

export interface ResponseAnalysis {
  wordCount: number;
  characterCount: number;
  bulletPoints: number;
  externalLinks: string[];
  internalLinks: string[];
  currency: {
    gbp: number;
    usd: number;
    euro: number;
  };
  productCount: number;
  questionsAsked: number;
  immediateProductShow: boolean;
  responseTime: number;
}

export function analyzeResponse(response: string, responseTime: number): ResponseAnalysis {
  const analysis: ResponseAnalysis = {
    wordCount: response.split(/\s+/).filter(word => word.length > 0).length,
    characterCount: response.length,
    bulletPoints: (response.match(/[•\*\-]\s/g) || []).length,
    externalLinks: [],
    internalLinks: [],
    currency: {
      gbp: (response.match(/£\d+/g) || []).length,
      usd: (response.match(/\$\d+/g) || []).length,
      euro: (response.match(/€\d+/g) || []).length
    },
    productCount: 0,
    questionsAsked: (response.match(/\?/g) || []).length,
    immediateProductShow: false,
    responseTime
  };

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(response)) !== null) {
    const url = match[2];
    if (url.includes('thompsonseparts.co.uk') || url.startsWith('/')) {
      analysis.internalLinks.push(url);
    } else {
      analysis.externalLinks.push(url);
    }
  }

  analysis.productCount = analysis.internalLinks.filter(link =>
    link.includes('product') ||
    link.includes('part') ||
    link.includes('pump') ||
    link.includes('tool') ||
    link.includes('kit')
  ).length;

  analysis.immediateProductShow = response.substring(0, 200).includes('](');

  return analysis;
}

export function detectConcerns(
  scenario: TestScenario,
  analysis: ResponseAnalysis,
  response: string
): string[] {
  const concerns: string[] = [];

  if (analysis.externalLinks.length > 0) {
    concerns.push(`External links found: ${analysis.externalLinks.join(', ')}`);
  }

  if (analysis.wordCount > 150) {
    concerns.push(`Response too verbose: ${analysis.wordCount} words`);
  }

  if (analysis.currency.usd > 0 && analysis.currency.gbp === 0) {
    concerns.push('USD currency found instead of GBP');
  }

  if (analysis.questionsAsked > 2 && analysis.productCount === 0) {
    concerns.push(`Too many questions (${analysis.questionsAsked}) without showing products`);
  }

  switch (scenario.id) {
    case 'cifa_mixer_pump':
      if (analysis.productCount <= 1) {
        concerns.push(`Limited products shown (${analysis.productCount}), expected multiple Cifa pumps`);
      }
      break;
    case 'sku_recognition':
      if (!response.toLowerCase().includes('dc66') && analysis.productCount === 0) {
        concerns.push('SKU not recognized - no specific product shown');
      }
      break;
    case 'sheet_roller_bar':
      if (!analysis.immediateProductShow && analysis.questionsAsked > 0) {
        concerns.push('Asked questions before showing available products');
      }
      break;
  }

  return concerns;
}
