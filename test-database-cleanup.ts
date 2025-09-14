#!/usr/bin/env npx tsx
import { DatabaseCleaner } from './lib/database-cleaner';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testCleanup() {
  console.log('🧪 Testing Database Cleanup Functionality\n');
  
  const cleaner = new DatabaseCleaner();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'stats';
  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  
  try {
    if (command === 'stats' || dryRun) {
      console.log('📊 Current Database Statistics:');
      console.log('================================\n');
      
      const stats = await cleaner.getScrapingStats(domain);
      
      if (stats) {
        console.log(`📄 Scraped Pages: ${stats.scraped_pages}`);
        console.log(`📝 Website Content: ${stats.website_content}`);
        console.log(`🔢 Embeddings: ${stats.embeddings}`);
        console.log(`🏗️ Structured Extractions: ${stats.structured_extractions}`);
        
        if (stats.storage) {
          console.log(`\n💾 Storage Usage:`);
          console.log(`   Content Size: ${stats.storage.content_size || 'N/A'}`);
          console.log(`   HTML Size: ${stats.storage.html_size || 'N/A'}`);
        }
      }
      
      if (dryRun) {
        console.log('\n⚠️  DRY RUN MODE - No data will be deleted');
        console.log('Remove --dry-run flag to perform actual cleanup\n');
      }
      
    } else if (command === 'clean') {
      console.log('⚠️  WARNING: This will delete all scraped data!');
      
      if (domain) {
        console.log(`🎯 Target domain: ${domain}`);
      } else {
        console.log('🌍 Target: ALL DOMAINS');
      }
      
      console.log('\n🕐 Starting cleanup in 3 seconds... (Ctrl+C to cancel)\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = await cleaner.cleanAllScrapedData({
        domain,
        includeJobs: true,
        includeCache: true,
        preserveConfigs: true
      });
      
      if (result.success) {
        console.log('\n✅ Cleanup Summary:');
        console.log('==================');
        console.log(`Deleted ${result.deletedCounts.pages || 0} scraped pages`);
        console.log(`Deleted ${result.deletedCounts.content || 0} content entries`);
        console.log(`Deleted ${result.deletedCounts.embeddings || 0} embeddings`);
        console.log(`Deleted ${result.deletedCounts.extractions || 0} structured extractions`);
        console.log(`Deleted ${result.deletedCounts.jobs || 0} scrape jobs`);
        console.log(`Deleted ${result.deletedCounts.cache || 0} cached queries`);
        
        if (result.deletedCounts.conversations) {
          console.log(`Deleted ${result.deletedCounts.conversations} conversations`);
        }
        
        console.log('\n🎉 Database is now clean and ready for fresh scraping!');
      } else {
        console.error('\n❌ Cleanup failed:', result.error);
      }
      
    } else if (command === 'help') {
      showHelp();
    } else {
      console.log(`Unknown command: ${command}\n`);
      showHelp();
    }
    
  } catch (error) {
    console.error('❌ Error during operation:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Database Cleanup Tool
=====================

Usage: npx tsx test-database-cleanup.ts [command] [options]

Commands:
  stats    Show current database statistics (default)
  clean    Delete all scraped data
  help     Show this help message

Options:
  --domain=<domain>  Target specific domain (e.g., --domain=example.com)
  --dry-run         Show what would be deleted without actually deleting

Examples:
  npx tsx test-database-cleanup.ts stats
  npx tsx test-database-cleanup.ts stats --domain=example.com
  npx tsx test-database-cleanup.ts clean --dry-run
  npx tsx test-database-cleanup.ts clean --domain=example.com
  npx tsx test-database-cleanup.ts clean  # Clean ALL domains

⚠️  WARNING: The 'clean' command will permanently delete data!
  `);
}

// Run the test
testCleanup().catch(console.error);