import { ChatClient } from './chat-client';
import { DELAY_BETWEEN_TESTS } from './config';
import { OperationTest, TestResult } from './types';

export async function runOperation(
  client: ChatClient,
  test: OperationTest
): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${test.operation}`);
  console.log(`   Query: "${test.query}"`);

  try {
    const { response, duration } = await client.send(test.query);
    const toolUsed = response.searchMetadata?.searchLog?.[0]?.tool || 'unknown';
    const usedWooCommerce = response.searchMetadata?.searchLog?.some(
      (log: any) => log.source === 'woocommerce-api'
    );

    if (!response.message || response.message.length === 0) {
      console.log(`❌ FAIL (${duration}ms): Empty response`);
      return {
        category: test.category,
        operation: test.operation,
        query: test.query,
        status: 'FAIL',
        duration,
        error: 'Empty response message',
        toolUsed,
      };
    }

    console.log(`✅ PASS (${duration}ms)`);
    console.log(`   Tool: ${toolUsed}`);
    console.log(`   WooCommerce: ${usedWooCommerce ? 'Yes' : 'No'}`);
    console.log(`   Response: ${response.message.substring(0, 150)}...`);

    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_TESTS));

    return {
      category: test.category,
      operation: test.operation,
      query: test.query,
      status: 'PASS',
      duration,
      response: response.message,
      toolUsed,
    };
  } catch (err: any) {
    const duration = err.duration || 0;
    const errorMsg = err.error?.message || err.message || JSON.stringify(err) || String(err);

    console.log(`❌ FAIL (${duration}ms): ${errorMsg}`);

    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_TESTS));

    return {
      category: test.category,
      operation: test.operation,
      query: test.query,
      status: 'FAIL',
      duration,
      error: errorMsg,
    };
  }
}
