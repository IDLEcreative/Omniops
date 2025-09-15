#!/usr/bin/env node

/**
 * Copy Enhanced Metadata Search Migration to Clipboard
 * Prepares the migration SQL for manual application in Supabase dashboard
 */

import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

function logInfo(message) {
  console.log(chalk.blue('ℹ️  ' + message));
}

function logError(message) {
  console.log(chalk.red('❌ ' + message));
}

async function prepareMigration() {
  console.log(chalk.bold.magenta('\n🚀 PREPARING ENHANCED METADATA SEARCH MIGRATION\n'));
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250128_enhanced_metadata_search.sql');
    
    if (!fs.existsSync(migrationPath)) {
      logError('Migration file not found at: ' + migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    logSuccess('Migration file loaded successfully');
    logInfo(`Migration size: ${Math.round(migrationSQL.length / 1024)}KB`);
    
    // Create a clean version for dashboard application
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('-- Success message'))
      .join('\n');
    
    // Write to a temp file for easy copying
    const outputPath = path.join(__dirname, '..', 'enhanced_metadata_migration_ready.sql');
    fs.writeFileSync(outputPath, cleanedSQL);
    
    logSuccess('Clean migration file created at: enhanced_metadata_migration_ready.sql');
    
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('  MANUAL APPLICATION INSTRUCTIONS'));
    console.log(chalk.cyan('='.repeat(60)));
    
    console.log(chalk.white('\n1. Open Supabase Dashboard:'));
    console.log(chalk.blue('   https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql'));
    
    console.log(chalk.white('\n2. Copy migration content:'));
    console.log(chalk.yellow('   cat enhanced_metadata_migration_ready.sql | pbcopy  # macOS'));
    console.log(chalk.yellow('   cat enhanced_metadata_migration_ready.sql | xclip -selection clipboard  # Linux'));
    
    console.log(chalk.white('\n3. In the Supabase SQL Editor:'));
    console.log(chalk.white('   • Paste the SQL into a new query'));
    console.log(chalk.white('   • Click "Run" to execute'));
    
    console.log(chalk.white('\n4. Verify installation:'));
    console.log(chalk.yellow('   SELECT search_embeddings_enhanced(ARRAY[0]::vector(1536), match_count => 1);'));
    
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('  MIGRATION PREVIEW (FIRST 20 LINES)'));
    console.log(chalk.cyan('='.repeat(60)));
    
    const previewLines = cleanedSQL.split('\n').slice(0, 20);
    previewLines.forEach((line, i) => {
      console.log(chalk.gray(`${String(i + 1).padStart(3)}: ${line}`));
    });
    
    if (cleanedSQL.split('\n').length > 20) {
      console.log(chalk.gray(`... and ${cleanedSQL.split('\n').length - 20} more lines`));
    }
    
    console.log(chalk.green.bold('\n🎯 Migration is ready for manual application!'));
    console.log(chalk.white('File created: enhanced_metadata_migration_ready.sql'));
    
  } catch (error) {
    logError('Failed to prepare migration', error);
    process.exit(1);
  }
}

prepareMigration();