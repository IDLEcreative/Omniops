import { createServiceRoleClient } from '@/lib/supabase-server';
import { TestMetrics } from './types';

export async function cleanupConversations(conversationIds: string[]) {
  const supabase = await createServiceRoleClient();
  for (const convId of conversationIds) {
    await supabase.from('messages').delete().eq('conversation_id', convId);
    await supabase.from('conversations').delete().eq('id', convId);
  }
}

export function printSummary(conversationCount: number, metrics: TestMetrics) {
  const avgExecutionTime =
    metrics.executionTimes.reduce((a, b) => a + b, 0) / metrics.executionTimes.length || 0;
  const correctionAccuracy =
    metrics.correctionTests > 0
      ? (metrics.correctionPassed / metrics.correctionTests) * 100
      : 0;
  const listAccuracy =
    metrics.listReferenceTests > 0
      ? (metrics.listReferencePassed / metrics.listReferenceTests) * 100
      : 0;

  console.log('\n' + '='.repeat(70));
  console.log('📊 AGENT 4 CORRECTION & LIST REFERENCE REPORT');
  console.log('='.repeat(70));
  console.log(`\n✅ Tests Implemented: 4/4`);
  console.log(`✅ Tests Passing: ${metrics.passedTests}/${metrics.totalTests}`);
  console.log(`\n🎯 Correction Detection Accuracy: ${correctionAccuracy.toFixed(1)}% (target: 95%)`);
  console.log(`   - Tests run: ${metrics.correctionTests}`);
  console.log(`   - Tests passed: ${metrics.correctionPassed}`);
  console.log(`\n🎯 List Reference Accuracy: ${listAccuracy.toFixed(1)}% (target: 90%)`);
  console.log(`   - Tests run: ${metrics.listReferenceTests}`);
  console.log(`   - Tests passed: ${metrics.listReferencePassed}`);
  console.log(`\n⏱️  Average Execution Time: ${avgExecutionTime.toFixed(0)}ms`);
  console.log(`\n🧹 Cleanup: ${conversationCount} conversations deleted\n`);
}
