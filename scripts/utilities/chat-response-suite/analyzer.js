import { ANALYSIS_PATTERNS } from './constants.js';
import { TARGET_DOMAIN } from './config.js';

export function analyzeResponse(message) {
  const analysis = {
    wordCount: message.split(/\s+/).length,
    charCount: message.length,
    externalLinks: [],
    currency: { usd: [], gbp: [] },
    productLinks: [],
    problematicPhrases: [],
    showsProducts: false,
    asksQuestionsFirst: false,
    isLengthy: false
  };

  analysis.isLengthy = analysis.wordCount > 150 || analysis.charCount > 800;

  Object.entries(ANALYSIS_PATTERNS.externalLinks).forEach(([type, pattern]) => {
    const matches = message.match(pattern);
    if (matches) {
      analysis.externalLinks.push(...matches.map(url => ({ type, url })));
    }
  });

  analysis.currency.usd = message.match(ANALYSIS_PATTERNS.currency.usd) || [];
  analysis.currency.gbp = message.match(ANALYSIS_PATTERNS.currency.gbp) || [];

  ANALYSIS_PATTERNS.problematicPhrases.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) {
      analysis.problematicPhrases.push(...matches);
    }
  });

  const productLinkPattern = new RegExp(`https?://${TARGET_DOMAIN}[^\\s)\\]]+`, 'gi');
  const productMatches = message.match(productLinkPattern);
  if (productMatches) {
    analysis.productLinks = productMatches;
    analysis.showsProducts = true;
  }

  analysis.asksQuestionsFirst = ANALYSIS_PATTERNS.questionPatterns.some(pattern => {
    const match = message.match(pattern);
    if (!match) return false;

    const questionIndex = message.indexOf(match[0]);
    const firstProductIndex = analysis.productLinks.length > 0 ? message.indexOf(analysis.productLinks[0]) : message.length;
    return questionIndex < firstProductIndex;
  });

  return analysis;
}
