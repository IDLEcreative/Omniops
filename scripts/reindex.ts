#!/usr/bin/env npx tsx
/**
 * CLI script for reindexing embeddings
 * 
 * Usage:
 *   npm run reindex -- --domain=<domain-id>
 *   npm run reindex -- --domain=<domain-id> --chunk-size=1500
 *   npm run reindex -- --domain=<domain-id> --dry-run
 *   npm run reindex -- --all --chunk-size=1000
 */

import { EmbeddingReindexer, ReindexOptions } from '../lib/reindex-embeddings';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
const options: any = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

async function main() {
  console.log('🔄 EMBEDDING REINDEX SYSTEM');
  console.log('=' + '='.repeat(60));
  
  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!supabaseUrl || !supabaseKey || !openaiKey) {
    console.error('❌ Missing environment variables. Please check .env.local');
    process.exit(1);
  }
  
  // Handle different command options
  if (options.help) {
    console.log(`
Usage:
  npm run reindex -- --domain=<domain-id>         Reindex specific domain
  npm run reindex -- --all                        Reindex all domains
  npm run reindex -- --chunk-size=1500           Set chunk size
  npm run reindex -- --dry-run                    Preview without changes
  npm run reindex -- --no-clear                   Keep existing embeddings
  npm run reindex -- --list                       List available domains
  npm run reindex -- --help                       Show this help
    `);
    return;
  }
  
  // List domains if requested
  if (options.list) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: domains } = await supabase
      .from('customer_configs')
      .select('id, domain')
      .order('domain');
    
    console.log('\n📋 Available domains:');
    domains?.forEach((d: any) => {
      console.log(`  ${d.id} - ${d.domain}`);
    });
    return;
  }
  
  // Determine domain to reindex
  let domainId: string | undefined;
  
  if (options.domain && options.domain !== 'all') {
    domainId = options.domain;
    console.log(`\n🎯 Reindexing domain: ${domainId}`);
  } else if (options.all) {
    console.log('\n⚠️  Reindexing ALL domains');
    const confirm = await askConfirmation('Are you sure you want to reindex all domains?');
    if (!confirm) {
      console.log('Cancelled.');
      return;
    }
  } else {
    // Default to thompsonseparts.co.uk for now
    domainId = '8dccd788-1ec1-43c2-af56-78aa3366bad3';
    console.log(`\n🎯 Reindexing default domain: ${domainId}`);
  }
  
  // Configure reindex options
  const reindexOptions: ReindexOptions = {
    domainId,
    chunkSize: options['chunk-size'] ? parseInt(options['chunk-size']) : 1500,
    clearExisting: !options['no-clear'],
    validateResults: !options['dry-run'],
    dryRun: options['dry-run'] === true,
    onProgress: (progress) => {
      // Clear line and show progress
      process.stdout.write('\r\x1b[K');
      process.stdout.write(
        `[${progress.phase.toUpperCase()}] ${progress.percentage}% - ${progress.message}`
      );
      
      // Show errors if any
      if (progress.errors && progress.errors.length > 0) {
        console.log('\n⚠️  Errors:', progress.errors.slice(-3).join('\n'));
      }
    }
  };
  
  // Show configuration
  console.log('\n📋 Configuration:');
  console.log(`  Chunk Size: ${reindexOptions.chunkSize} chars`);
  console.log(`  Clear Existing: ${reindexOptions.clearExisting}`);
  console.log(`  Validate Results: ${reindexOptions.validateResults}`);
  console.log(`  Dry Run: ${reindexOptions.dryRun}`);
  
  if (!options['dry-run']) {
    const confirm = await askConfirmation('\nProceed with reindex?');
    if (!confirm) {
      console.log('Cancelled.');
      return;
    }
  }
  
  // Create reindexer instance
  const reindexer = new EmbeddingReindexer(supabaseUrl, supabaseKey, openaiKey);
  
  console.log('\n🚀 Starting reindex...\n');
  const startTime = Date.now();
  
  try {
    // Run the reindex
    const result = await reindexer.reindex(reindexOptions);
    
    // Clear progress line
    process.stdout.write('\r\x1b[K');
    
    // Show results
    console.log('\n' + '='.repeat(60));
    console.log('📊 REINDEX RESULTS');
    console.log('=' + '='.repeat(60));
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Pages Processed: ${result.pagesProcessed}`);
    console.log(`Chunks Created: ${result.chunksCreated}`);
    console.log(`Embeddings Generated: ${result.embeddingsGenerated}`);
    console.log(`Average Chunk Size: ${result.averageChunkSize} chars`);
    console.log(`Max Chunk Size: ${result.maxChunkSize} chars`);
    console.log(`Duration: ${formatDuration(result.duration)}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.slice(0, 10).forEach(err => {
        console.log(`  - ${err}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more`);
      }
    }
    
    // Performance metrics
    if (result.pagesProcessed > 0) {
      const pagesPerMinute = Math.round((result.pagesProcessed / result.duration) * 60000);
      const chunksPerPage = Math.round(result.chunksCreated / result.pagesProcessed);
      
      console.log('\n📈 Performance:');
      console.log(`  Pages per minute: ${pagesPerMinute}`);
      console.log(`  Chunks per page: ${chunksPerPage}`);
      console.log(`  Embeddings per second: ${(result.embeddingsGenerated / (result.duration / 1000)).toFixed(1)}`);
    }
    
    if (result.success) {
      console.log('\n✨ Reindex completed successfully!');
    } else {
      console.log('\n❌ Reindex completed with errors.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Helper function to ask for confirmation
function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(question + ' (y/n) ', (answer: string) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Helper function to format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});