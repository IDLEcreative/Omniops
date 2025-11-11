import chalk from 'chalk';
import { TestResult } from './types';
import {
  runOutOfBoundsTest,
  runContextAccumulationTest,
  runContextSwitchingTest,
  runIntentTrackingTest,
  runMetadataPersistenceTest,
  runMetadataUpdatesTest,
} from './tests';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { API_BASE_URL, TEST_DOMAIN } from './config';

export async function runMultiTurnSuite() {
  console.log('🚀 Multi-Turn Conversation E2E Tests (Tests 8-13)\n');
  console.log('Testing against:', API_BASE_URL);
  console.log('Domain:', TEST_DOMAIN);

  const testConversations: string[] = [];
  const results: TestResult[] = [];

  try {
    results.push(await runOutOfBoundsTest(testConversations));
    results.push(await runContextAccumulationTest(testConversations));
    results.push(await runContextSwitchingTest(testConversations));
    results.push(await runIntentTrackingTest(testConversations));
    results.push(await runMetadataPersistenceTest(testConversations));
    results.push(await runMetadataUpdatesTest(testConversations));

    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(70));

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const accuracy = (passed / total) * 100;

    results.forEach((result) => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
      console.log(`   ${result.reason}`);
      if (result.conversationId) {
        console.log(`   Conversation ID: ${result.conversationId}`);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log(`🎯 Tests Passing: ${passed}/${total} (${accuracy.toFixed(1)}%)`);

    const contextResult = results.find((r) => r.testName.includes('Test 9'));
    if (contextResult && 'accuracy' in contextResult) {
      console.log(`🔥 Conversation Accuracy: ${contextResult.accuracy}% (Target: >= 86%)`);
    }

    console.log('='.repeat(70));

    if (accuracy >= 100) {
      console.log('\n🎉 ALL TESTS PASSED! 86% accuracy claim validated!');
    } else if (passed >= 4) {
      console.log('\n⚠️  Most tests passed, but some issues detected.');
    } else {
      console.log('\n❌ CRITICAL: Multiple test failures detected.');
    }
  } finally {
    await cleanupConversations(testConversations);
  }
}

async function cleanupConversations(testConversations: string[]) {
  if (testConversations.length === 0) {
    return;
  }

  console.log(`\n🧹 Cleaning up ${testConversations.length} test conversations...`);
  const supabase = await createServiceRoleClient();
  await supabase.from('conversations').delete().in('id', testConversations);
  console.log('✅ Cleanup complete');
}
