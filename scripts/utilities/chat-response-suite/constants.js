export const ANALYSIS_PATTERNS = {
  externalLinks: {
    amazon: /amazon\.(co\.uk|com)/gi,
    manufacturers: /\b(caterpillar|kinshofer|cifa|teng|makita|dewalt|bosch)\.com/gi,
    genericExternal: /https?:\/\/(?!thompsonseparts\.co\.uk)[a-z0-9.-]+\.[a-z]{2,}/gi
  },
  currency: {
    usd: /\$\d+|\$|\bUSD\b/gi,
    gbp: /£\d+|£|\bGBP\b/gi
  },
  problematicPhrases: [
    /check.*amazon/gi,
    /available.*amazon/gi,
    /visit.*manufacturer/gi,
    /manufacturer.*website/gi,
    /official.*website/gi,
    /contact.*manufacturer/gi
  ],
  questionPatterns: [
    /what type/i,
    /which.*do you need/i,
    /can you.*specific/i,
    /more information.*which/i,
    /clarify.*which/i
  ]
};
