import { serviceClient } from './clients';
import { TestData } from './setup';

export async function cleanupTestData(testData: TestData): Promise<void> {
  console.log('\n🧹 Cleaning up test data...\n');

  await serviceClient.from('customer_configs').delete().in('domain', [testData.domain1, testData.domain2]);
  await serviceClient.from('organizations').delete().in('id', [testData.org1Id, testData.org2Id]);

  console.log('✓ Test data cleaned up');
}
