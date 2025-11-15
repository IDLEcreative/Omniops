#!/usr/bin/env node

/**
 * Comprehensive Integration Test Suite - CLI Wrapper
 * Refactored: Business logic extracted to lib/scripts/comprehensive-test/
 */

import { createClient } from '@supabase/supabase-js';
import { runAllTests } from '../lib/scripts/comprehensive-test/validators.js';
import { printHeader, printSummary } from '../lib/scripts/comprehensive-test/reporters.js';

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

/**
 * Main execution
 */
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const config = {
    apiUrl: API_URL,
    supabase
  };

  printHeader();

  try {
    const results = await runAllTests(config);
    printSummary(results);

    // Exit with error code if tests failed
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`\x1b[31mTest suite failed to run: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
