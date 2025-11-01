/**
 * Database schema validation test handler
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { TestResult } from '../types';

export async function runSchemaTest(): Promise<TestResult> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database connection unavailable',
    };
  }

  try {
    const tables = [
      'conversations',
      'messages',
      'customer_verifications',
      'customer_access_logs',
      'customer_data_cache',
    ];

    const tableCheck: Record<string, boolean> = {};
    const tableErrors: Record<string, string> = {};

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0);

      tableCheck[table] = !error;
      if (error) {
        tableErrors[table] = error.message;
      }
    }

    const allTablesExist = Object.values(tableCheck).every((v) => v === true);

    return {
      success: allTablesExist,
      tables: tableCheck,
      errors: Object.keys(tableErrors).length > 0 ? tableErrors : undefined,
      message: 'Database schema check complete',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
