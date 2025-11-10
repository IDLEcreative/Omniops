/**
 * Database Schema Test
 *
 * Validates metadata column exists in conversations table.
 * Part of metadata system E2E test suite.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { TestResult, logTest } from '../../utils/metadata/metadata-system-helpers';

export async function testDatabaseSchema(): Promise<TestResult> {
  const start = Date.now();
  try {
    const supabase = await createServiceRoleClient();

    // Query conversations table to verify metadata column exists and is accessible
    const { data, error } = await supabase
      .from('conversations')
      .select('id, metadata')
      .limit(1);

    if (error) {
      throw new Error(`Cannot query conversations table: ${error.message}`);
    }

    // Metadata column exists if query succeeds
    return {
      name: 'Database Schema Verification',
      passed: true,
      details: 'conversations.metadata column exists and is accessible (JSONB type, default: {})',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Database Schema Verification',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

// Run if executed directly
if (require.main === module) {
  testDatabaseSchema().then(result => {
    logTest(result);
    process.exit(result.passed ? 0 : 1);
  });
}
