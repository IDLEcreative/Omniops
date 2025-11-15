#!/usr/bin/env node
/**
 * Fix Remaining RLS Issues
 *
 * Targets business-related tables with optimized RLS policies.
 */

import { executeSQL } from './supabase-config.js';
import { fixSteps } from '../lib/scripts/fix-remaining-rls/steps.js';
import { executeAllSteps, printSummary } from '../lib/scripts/fix-remaining-rls/executor.js';

async function fixRemainingRLS() {
  console.log('🔧 Fixing Remaining RLS Issues');
  console.log('='.repeat(60));
  console.log('Targeting business-related tables with improved approach...\n');

  const result = await executeAllSteps(fixSteps, executeSQL);
  printSummary(result);
}

// Run the fixes
fixRemainingRLS().catch(console.error);
