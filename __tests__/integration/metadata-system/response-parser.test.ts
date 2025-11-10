/**
 * Response Parser Entity Extraction Test
 *
 * Tests ResponseParser for: correction detection, product references,
 * order references, and numbered list detection.
 */

import { ResponseParser } from '@/lib/chat/response-parser';
import { TestResult, logTest } from '../../utils/metadata/metadata-system-helpers';

export async function testResponseParser(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test 1: Correction detection
    const corrections1 = ResponseParser['detectCorrections' as keyof typeof ResponseParser](
      'I meant ZF4 not ZF5'
    ) as any;

    if (corrections1.length === 0 || corrections1[0].corrected !== 'ZF4' || corrections1[0].original !== 'ZF5') {
      throw new Error('Failed to detect "I meant X not Y" correction pattern');
    }

    // Test 2: Product reference extraction (simulating markdown links in AI response)
    const aiResponse = 'Here are some products:\n[Blue Widget](https://example.com/blue)\n[Red Widget](https://example.com/red)';
    const parsed = ResponseParser['parseResponse' as keyof typeof ResponseParser](
      'Show me widgets',
      aiResponse,
      1
    ) as any;

    if (parsed.entities.length === 0) {
      throw new Error('Failed to extract product references');
    }

    // Test 3: Order reference extraction
    const orderResponse = 'Your order #12345 has shipped and order #67890 is processing';
    const orderParsed = ResponseParser['parseResponse' as keyof typeof ResponseParser](
      'What about my orders?',
      orderResponse,
      2
    ) as any;

    if (!orderParsed.entities.some((e: any) => e.type === 'order')) {
      throw new Error('Failed to extract order references');
    }

    // Test 4: Numbered list detection
    const listResponse =
      '1. [First Item](https://example.com/1)\n2. [Second Item](https://example.com/2)\n3. [Third Item](https://example.com/3)';
    const listParsed = ResponseParser['parseResponse' as keyof typeof ResponseParser](
      'Show options',
      listResponse,
      3
    ) as any;

    if (listParsed.lists.length === 0) {
      throw new Error('Failed to detect numbered list');
    }

    return {
      name: 'ResponseParser Entity Extraction',
      passed: true,
      details: 'All patterns: corrections, products, orders, numbered lists',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'ResponseParser Entity Extraction',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

// Run if executed directly
if (require.main === module) {
  testResponseParser().then(result => {
    logTest(result);
    process.exit(result.passed ? 0 : 1);
  });
}
