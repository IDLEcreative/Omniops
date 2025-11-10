export function showHelp() {
  console.log(`
Hallucination Prevention Test Suite - Detect and prevent AI hallucinations

USAGE:
  npx tsx test-hallucination-prevention.ts [options]

OPTIONS:
  --domain=<domain>    Test specific domain (default: thompsonseparts.co.uk)
  --verbose            Show full responses
  --category=<name>    Run only specific category tests
  help                 Show this help message

EXAMPLES:
  # Run all tests with default domain
  npx tsx test-hallucination-prevention.ts

  # Test specific domain
  npx tsx test-hallucination-prevention.ts --domain=example.com

  # Verbose output with full responses
  npx tsx test-hallucination-prevention.ts --verbose

  # Test only pricing-related queries
  npx tsx test-hallucination-prevention.ts --category=pricing

PREREQUISITES:
  1. Start development server: npm run dev
  2. Ensure server is running on http://localhost:3000
  3. Valid Supabase and OpenAI credentials configured

TEST CATEGORIES:
  specs          - Technical specifications
  compatibility  - Product compatibility
  stock          - Stock availability
  delivery       - Delivery times
  pricing        - Price comparisons and bulk discounts
  installation   - Installation instructions
  warranty       - Warranty information
  origin         - Product origin/manufacturing
  alternatives   - Alternative products

EXPECTED BEHAVIOR:
  ✅ AI admits uncertainty when information is missing
  ✅ Directs to customer service for specific details
  ✅ Does NOT invent specifications or claims
  ✅ Does NOT provide specific numbers without data
  ✅ Does NOT make compatibility claims without evidence
  ✅ Does NOT suggest products that don't exist

For more information, see: docs/02-FEATURES/chat-system/hallucination-prevention.md
`);
}
