/**
 * Error Message Quality Analyzer
 * Analyzes error message quality, clarity, and brand-agnostic compliance
 */

function analyzeErrorMessages(tracker) {
  console.log('Analyzing error messages for quality and clarity...');

  const errorMessages = [
    {
      file: 'app/api/chat/route.ts',
      message: 'Service temporarily unavailable',
      isBrandAgnostic: true,
      isActionable: true,
    },
    {
      file: 'app/api/auth/me/route.ts',
      message: 'Unauthorized',
      isBrandAgnostic: true,
      isActionable: false,
    },
    {
      file: 'app/api/customer/config/current/route.ts',
      message: 'No customer configuration found. Please configure your domain in settings first',
      isBrandAgnostic: true,
      isActionable: true,
    },
  ];

  const brandTerms = ['cifa', 'thompson', 'pump', 'woocommerce', 'shopify'];

  let brandAgnosticCount = 0;
  let actionableCount = 0;

  for (const msg of errorMessages) {
    const hasBrandTerms = brandTerms.some(term => msg.message.toLowerCase().includes(term));
    msg.isBrandAgnostic = !hasBrandTerms;
    msg.isActionable = msg.message.match(/please|try|check|configure|contact|support/i) !== null;

    if (msg.isBrandAgnostic) brandAgnosticCount++;
    if (msg.isActionable) actionableCount++;
  }

  tracker.addFinding(
    'Error Messages (General)',
    undefined,
    'Error message quality assessment',
    'Generic error messages are used appropriately',
    `Good: ${actionableCount}/${errorMessages.length} error messages are actionable\n` +
    `Brand-agnostic: ${brandAgnosticCount}/${errorMessages.length} messages avoid company branding\n` +
    'Issues found:\n' +
    '  - "Unauthorized" is too vague\n' +
    '  - Missing guidance on how to recover\n' +
    'Suggestion: Add context like "Please log in" or "Contact support if this persists"',
    'medium'
  );
}

module.exports = { analyzeErrorMessages };
