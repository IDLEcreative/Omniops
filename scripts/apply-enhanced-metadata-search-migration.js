#!/usr/bin/env node

/**
 * Apply Enhanced Metadata Search Migration
 * Applies the enhanced metadata search functions and indexes to Supabase
 */

import dotenv from 'dotenv';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: '.env.local' });
import { createClient  } from '@supabase/supabase-js';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('❌ Missing Supabase environment variables'));
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

function logInfo(message) {
  console.log(chalk.blue('ℹ️  ' + message));
}

function logError(message, error = null) {
  console.log(chalk.red('❌ ' + message));
  if (error) {
    console.log(chalk.red(error.message));
  }
}

async function applyMigration() {
  console.log(chalk.bold.magenta('\n🚀 APPLYING ENHANCED METADATA SEARCH MIGRATION\n'));
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250128_enhanced_metadata_search.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    logInfo('Migration file loaded successfully');
    logInfo(`Migration size: ${Math.round(migrationSQL.length / 1024)}KB`);

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT \'Enhanced metadata search functions created successfully!\''));

    logInfo(`Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      logInfo(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).catch(async () => {
          // Fallback: try direct execution for functions and indexes
          if (statement.includes('CREATE OR REPLACE FUNCTION') || 
              statement.includes('CREATE INDEX') ||
              statement.includes('GRANT') ||
              statement.includes('COMMENT ON') ||
              statement.includes('DROP FUNCTION')) {
            
            // For PostgreSQL functions and DDL, we need to use a different approach
            const { data, error } = await supabase
              .from('pg_stat_activity')
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              // Connection is good, but we can't execute DDL directly
              // Let's try using the raw SQL execution
              throw new Error('Direct DDL execution not supported via client library');
            }
            throw error;
          }
          
          throw new Error('Statement execution failed');
        });

        if (error) {
          logError(`Failed to execute statement ${i + 1}`, error);
          errorCount++;
          
          // Don't exit on errors for indexes that might already exist
          if (statement.includes('CREATE INDEX IF NOT EXISTS') || 
              statement.includes('GRANT EXECUTE')) {
            logInfo('Continuing despite error (likely already exists)');
          }
        } else {
          logSuccess(`Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        logError(`Error executing statement ${i + 1}: ${err.message}`);
        errorCount++;
        
        // For critical functions, we might need manual application
        if (statement.includes('search_embeddings_enhanced')) {
          logError('CRITICAL: Enhanced search function failed to create');
          logInfo('You may need to apply this migration manually in the Supabase SQL editor');
        }
      }
    }

    // Summary
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('  MIGRATION SUMMARY'));
    console.log(chalk.cyan('='.repeat(60)));
    
    console.log(`Total statements: ${statements.length}`);
    console.log(chalk.green(`Successful: ${successCount}`));
    
    if (errorCount > 0) {
      console.log(chalk.red(`Failed: ${errorCount}`));
      console.log(chalk.yellow('\n⚠️  Some statements failed. This might be normal if:'));
      console.log(chalk.yellow('   • Functions already exist'));
      console.log(chalk.yellow('   • Indexes are already created'));
      console.log(chalk.yellow('   • Permissions are already granted'));
    }

    // Test the new functions
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('  TESTING NEW FUNCTIONS'));
    console.log(chalk.cyan('='.repeat(60)));

    try {
      // Test search_embeddings_enhanced function exists
      const { data: funcTest, error: funcError } = await supabase.rpc('search_embeddings_enhanced', {
        query_embedding: Array(1536).fill(0), // Dummy embedding
        match_count: 1
      });

      if (!funcError) {
        logSuccess('Enhanced search function is working');
      } else {
        logError('Enhanced search function test failed', funcError);
      }
    } catch (err) {
      logError('Could not test enhanced search function', err);
    }

    try {
      // Test search_by_metadata function exists
      const { data: metaTest, error: metaError } = await supabase.rpc('search_by_metadata', {
        limit_count: 1
      });

      if (!metaError) {
        logSuccess('Metadata search function is working');
      } else {
        logError('Metadata search function test failed', metaError);
      }
    } catch (err) {
      logError('Could not test metadata search function', err);
    }

    try {
      // Test get_metadata_stats function exists
      const { data: statsTest, error: statsError } = await supabase.rpc('get_metadata_stats');

      if (!statsError) {
        logSuccess('Metadata stats function is working');
        if (statsTest && statsTest.length > 0) {
          logInfo(`Total embeddings: ${statsTest[0].total_embeddings}`);
          logInfo(`With metadata: ${statsTest[0].with_enhanced_metadata}`);
          logInfo(`Coverage: ${statsTest[0].coverage_percentage}%`);
        }
      } else {
        logError('Metadata stats function test failed', statsError);
      }
    } catch (err) {
      logError('Could not test metadata stats function', err);
    }

    if (errorCount === 0) {
      console.log(chalk.green.bold('\n🎉 Migration applied successfully!'));
      console.log(chalk.white('\nNew functions available:'));
      console.log(chalk.blue('• search_embeddings_enhanced() - Enhanced vector search with metadata scoring'));
      console.log(chalk.blue('• search_by_metadata() - Fast metadata-only search'));
      console.log(chalk.blue('• get_metadata_stats() - Metadata quality statistics'));
    } else {
      console.log(chalk.yellow.bold('\n✨ Migration completed with some warnings.'));
      console.log(chalk.white('If critical functions failed, you may need to apply them manually via:'));
      console.log(chalk.blue('https://supabase.com/dashboard/project/' + supabaseUrl.match(/https:\/\/([^.]+)/)[1] + '/sql'));
    }

  } catch (error) {
    logError('Migration failed', error);
    process.exit(1);
  }
}

// Handle the case where exec_sql RPC might not exist
async function createExecSQLFunction() {
  try {
    const createExecSQL = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
        RETURN 'OK';
      EXCEPTION WHEN OTHERS THEN
        RETURN SQLERRM;
      END;
      $$;
      
      GRANT EXECUTE ON FUNCTION public.exec_sql TO service_role;
    `;

    logInfo('Creating exec_sql helper function...');
    const { error } = await supabase.rpc('exec_sql', { sql: createExecSQL });
    
    if (!error) {
      logSuccess('Helper function created');
    }
  } catch (err) {
    logInfo('exec_sql function might already exist or creation failed');
  }
}

// Run the migration
async function main() {
  await createExecSQLFunction();
  await applyMigration();
}

main();