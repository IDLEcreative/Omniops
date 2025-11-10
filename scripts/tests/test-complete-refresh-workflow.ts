/**
 * Phase 8: Comprehensive End-to-End Test
 *
 * Tests ALL phases of the content refresh fix:
 * - Phase 1: Crawl-processor is read-only monitor
 * - Phase 2: Bulk RPC functions work
 * - Phase 3: Domain lock prevents concurrent refreshes
 * - Phase 4: Deletion errors are fatal with retry
 * - Phase 5: forceRescrape flag propagates correctly
 * - Phase 6: 404 detection and cleanup works
 * - Phase 7: Atomic transactions work
 *
 * This must pass before deploying to production!
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { TestResult } from './modules/refresh-test-types';
import {
  testPhase1_ReadOnlyMonitor,
  testPhase2_BulkRPCFunctions,
  testPhase4_DeletionRetry,
  testPhase5_ForceRescrapePropagation,
  testPhase6_404Detection,
  testPhase7_AtomicTransactions
} from './modules/refresh-test-phases';
import { testPhase3_DomainLock } from './modules/refresh-test-domain-lock';
import { generateReport } from './modules/refresh-test-reporter';

const results: TestResult[] = [];

function logTest(phase: string, test: string, passed: boolean, message: string, details?: any) {
  results.push({ phase, test, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${phase} - ${test}: ${message}`);
  if (details) {
    console.log(`   Details:`, details);
  }
}

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       PHASE 8: COMPREHENSIVE END-TO-END TESTING          ║');
  console.log('║                                                           ║');
  console.log('║  Testing ALL 7 phases of the content refresh fix         ║');
  console.log('║  This validates the complete system is working correctly ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const supabase = await createServiceRoleClient();

  await testPhase1_ReadOnlyMonitor(logTest);
  await testPhase2_BulkRPCFunctions(supabase, logTest);
  await testPhase3_DomainLock(logTest);
  await testPhase4_DeletionRetry(logTest);
  await testPhase5_ForceRescrapePropagation(logTest);
  await testPhase6_404Detection(logTest);
  await testPhase7_AtomicTransactions(supabase, logTest);

  await generateReport(results);
}

runAllTests().catch(console.error);
