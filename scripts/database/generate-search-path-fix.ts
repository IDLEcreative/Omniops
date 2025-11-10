#!/usr/bin/env tsx
/**
 * Generate migration to fix mutable search_path on database functions
 * Security: Prevents schema manipulation attacks
 *
 * Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VulnerableFunction {
  schema_name: string;
  function_name: string;
  arguments: string;
  function_definition: string;
  status: string;
}

async function getVulnerableFunctions(): Promise<VulnerableFunction[]> {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments,
        pg_get_functiondef(p.oid) as function_definition,
        CASE
          WHEN p.proconfig IS NULL THEN 'MUTABLE'
          ELSE 'FIXED'
        END as status
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proconfig IS NULL
        AND p.proname LIKE ANY(ARRAY[
          'update_%',
          'cleanup_%',
          'get_%',
          'search_%',
          'calculate_%',
          'preview_%',
          'refresh_%',
          'backfill_%',
          'increment_%',
          'save_%'
        ])
      ORDER BY p.proname, p.proargtypes::text;
    `
  });

  if (error) {
    throw new Error(`Failed to fetch vulnerable functions: ${error.message}`);
  }

  return data as VulnerableFunction[];
}

function fixFunctionDefinition(definition: string): string {
  // Replace "LANGUAGE plpgsql;" with "LANGUAGE plpgsql SET search_path = public, pg_catalog;"
  // Handle both with and without SECURITY DEFINER

  let fixed = definition;

  // Pattern 1: LANGUAGE plpgsql; (end of definition)
  fixed = fixed.replace(
    /LANGUAGE plpgsql;$/gm,
    'LANGUAGE plpgsql\n SET search_path = public, pg_catalog;'
  );

  // Pattern 2: LANGUAGE plpgsql SECURITY DEFINER
  fixed = fixed.replace(
    /LANGUAGE plpgsql\s+SECURITY DEFINER$/gm,
    'LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path = public, pg_catalog;'
  );

  // Pattern 3: LANGUAGE plpgsql with STABLE/IMMUTABLE/VOLATILE
  fixed = fixed.replace(
    /LANGUAGE plpgsql\s+(STABLE|IMMUTABLE|VOLATILE)$/gm,
    'LANGUAGE plpgsql\n $1\n SET search_path = public, pg_catalog;'
  );

  // Pattern 4: LANGUAGE plpgsql with STABLE SECURITY DEFINER
  fixed = fixed.replace(
    /LANGUAGE plpgsql\s+(STABLE|IMMUTABLE|VOLATILE)\s+SECURITY DEFINER$/gm,
    'LANGUAGE plpgsql\n $1 SECURITY DEFINER\n SET search_path = public, pg_catalog;'
  );

  return fixed;
}

async function generateMigration() {
  console.log('🔍 Fetching vulnerable functions...');
  const functions = await getVulnerableFunctions();

  console.log(`📊 Found ${functions.length} vulnerable functions\n`);

  let migration = `-- Fix mutable search_path on ${functions.length} database functions
-- Security: Prevents schema manipulation attacks (SQL injection via schema manipulation)
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--
-- This migration adds "SET search_path = public, pg_catalog" to all functions
-- to prevent attackers from exploiting mutable search paths.

`;

  // Group functions by type
  const triggerFunctions = functions.filter(f => f.function_name.startsWith('update_'));
  const cleanupFunctions = functions.filter(f => f.function_name.startsWith('cleanup_'));
  const queryFunctions = functions.filter(f =>
    f.function_name.startsWith('get_') || f.function_name.startsWith('search_')
  );
  const businessFunctions = functions.filter(f =>
    f.function_name.startsWith('calculate_') ||
    f.function_name.startsWith('preview_') ||
    f.function_name.startsWith('refresh_') ||
    f.function_name.startsWith('backfill_') ||
    f.function_name.startsWith('increment_') ||
    f.function_name.startsWith('save_')
  );

  // Add trigger functions
  if (triggerFunctions.length > 0) {
    migration += `-- =====================================================\n`;
    migration += `-- TRIGGER FUNCTIONS (${triggerFunctions.length} functions)\n`;
    migration += `-- =====================================================\n\n`;

    for (const func of triggerFunctions) {
      migration += `-- ${func.function_name}(${func.arguments})\n`;
      migration += fixFunctionDefinition(func.function_definition);
      migration += '\n\n';
    }
  }

  // Add cleanup functions
  if (cleanupFunctions.length > 0) {
    migration += `-- =====================================================\n`;
    migration += `-- CLEANUP FUNCTIONS (${cleanupFunctions.length} functions)\n`;
    migration += `-- =====================================================\n\n`;

    for (const func of cleanupFunctions) {
      migration += `-- ${func.function_name}(${func.arguments})\n`;
      migration += fixFunctionDefinition(func.function_definition);
      migration += '\n\n';
    }
  }

  // Add query functions
  if (queryFunctions.length > 0) {
    migration += `-- =====================================================\n`;
    migration += `-- QUERY FUNCTIONS (${queryFunctions.length} functions)\n`;
    migration += `-- =====================================================\n\n`;

    for (const func of queryFunctions) {
      migration += `-- ${func.function_name}(${func.arguments})\n`;
      migration += fixFunctionDefinition(func.function_definition);
      migration += '\n\n';
    }
  }

  // Add business logic functions
  if (businessFunctions.length > 0) {
    migration += `-- =====================================================\n`;
    migration += `-- BUSINESS LOGIC FUNCTIONS (${businessFunctions.length} functions)\n`;
    migration += `-- =====================================================\n\n`;

    for (const func of businessFunctions) {
      migration += `-- ${func.function_name}(${func.arguments})\n`;
      migration += fixFunctionDefinition(func.function_definition);
      migration += '\n\n';
    }
  }

  migration += `-- Migration complete: ${functions.length} functions fixed\n`;

  console.log('✅ Migration generated successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - Trigger functions: ${triggerFunctions.length}`);
  console.log(`   - Cleanup functions: ${cleanupFunctions.length}`);
  console.log(`   - Query functions: ${queryFunctions.length}`);
  console.log(`   - Business functions: ${businessFunctions.length}`);
  console.log(`   - Total: ${functions.length}`);

  return migration;
}

// Run if called directly
if (require.main === module) {
  generateMigration()
    .then(migration => {
      console.log('\n📝 Migration SQL:\n');
      console.log(migration);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

export { generateMigration, fixFunctionDefinition };
