#!/usr/bin/env node

/**
 * Data Transformation Tool for AI Optimization
 * Migrates existing scraped data to AI-optimized format
 */

import { createClient } from '@supabase/supabase-js';
import { AIContentExtractor } from '../lib/ai-content-extractor';
import { ContentDeduplicator } from '../lib/content-deduplicator';
import { AIMetadataGenerator } from '../lib/ai-metadata-generator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

// Configuration
interface MigrationConfig {
  batchSize: number;
  dryRun: boolean;
  startFrom?: string; // URL or ID to start from
  maxPages?: number;
  outputDir: string;
  reportInterval: number;
  optimizationLevel: 'basic' | 'standard' | 'advanced';
  preserveOriginal: boolean;
}

// Progress tracking
interface MigrationProgress {
  totalPages: number;
  processedPages: number;
  successfulOptimizations: number;
  failedOptimizations: number;
  totalOriginalTokens: number;
  totalOptimizedTokens: number;
  averageReduction: number;
  startTime: Date;
  errors: Array<{ url: string; error: string }>;
}

// Result for each page
interface OptimizationResult {
  url: string;
  success: boolean;
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
  semanticChunks: number;
  metadataGenerated: boolean;
  deduplicationApplied: boolean;
  processingTime: number;
  error?: string;
}

class DataOptimizer {
  private supabase: any;
  private aiExtractor: AIContentExtractor;
  private deduplicator: ContentDeduplicator;
  private metadataGenerator: AIMetadataGenerator;
  private progress: MigrationProgress;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.aiExtractor = new AIContentExtractor();
    this.deduplicator = new ContentDeduplicator(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      process.env.REDIS_URL
    );
    this.metadataGenerator = new AIMetadataGenerator({
      openaiApiKey: process.env.OPENAI_API_KEY,
      cacheEnabled: true
    });

    this.progress = {
      totalPages: 0,
      processedPages: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      totalOriginalTokens: 0,
      totalOptimizedTokens: 0,
      averageReduction: 0,
      startTime: new Date(),
      errors: []
    };
  }

  /**
   * Main migration entry point
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting AI Optimization Migration');
    console.log('━'.repeat(60));
    console.log(`Configuration:`);
    console.log(`  - Batch Size: ${this.config.batchSize}`);
    console.log(`  - Dry Run: ${this.config.dryRun}`);
    console.log(`  - Optimization Level: ${this.config.optimizationLevel}`);
    console.log(`  - Preserve Original: ${this.config.preserveOriginal}`);
    console.log('━'.repeat(60));

    try {
      // Get total count
      const { count } = await this.supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true });
      
      this.progress.totalPages = count || 0;
      console.log(`\n📊 Found ${this.progress.totalPages} pages to process\n`);

      // Process in batches
      let offset = 0;
      let hasMore = true;

      while (hasMore && (!this.config.maxPages || this.progress.processedPages < this.config.maxPages)) {
        const batch = await this.fetchBatch(offset);
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        await this.processBatch(batch);
        offset += this.config.batchSize;

        // Report progress
        if (this.progress.processedPages % this.config.reportInterval === 0) {
          this.reportProgress();
        }

        // Check if we've reached max pages
        if (this.config.maxPages && this.progress.processedPages >= this.config.maxPages) {
          break;
        }
      }

      // Final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Fetch a batch of pages to process
   */
  private async fetchBatch(offset: number): Promise<any[]> {
    const limit = Math.min(
      this.config.batchSize,
      this.config.maxPages ? this.config.maxPages - this.progress.processedPages : this.config.batchSize
    );

    const { data, error } = await this.supabase
      .from('scraped_pages')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching batch:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Process a batch of pages
   */
  private async processBatch(pages: any[]): Promise<void> {
    console.log(`\n🔄 Processing batch of ${pages.length} pages...`);

    const results = await Promise.all(
      pages.map(page => this.optimizePage(page))
    );

    // Update progress
    for (const result of results) {
      this.progress.processedPages++;
      
      if (result.success) {
        this.progress.successfulOptimizations++;
        this.progress.totalOriginalTokens += result.originalTokens;
        this.progress.totalOptimizedTokens += result.optimizedTokens;
      } else {
        this.progress.failedOptimizations++;
        if (result.error) {
          this.progress.errors.push({ url: result.url, error: result.error });
        }
      }
    }

    // Calculate average reduction
    if (this.progress.totalOriginalTokens > 0) {
      this.progress.averageReduction = 
        ((this.progress.totalOriginalTokens - this.progress.totalOptimizedTokens) / 
         this.progress.totalOriginalTokens) * 100;
    }

    // Save batch results if not dry run
    if (!this.config.dryRun) {
      await this.saveBatchResults(pages, results);
    }
  }

  /**
   * Optimize a single page
   */
  private async optimizePage(page: any): Promise<OptimizationResult> {
    const startTime = Date.now();
    const result: OptimizationResult = {
      url: page.url,
      success: false,
      originalTokens: 0,
      optimizedTokens: 0,
      reductionPercent: 0,
      semanticChunks: 0,
      metadataGenerated: false,
      deduplicationApplied: false,
      processingTime: 0
    };

    try {
      // Estimate original tokens
      const originalContent = page.content || page.text_content || '';
      result.originalTokens = this.estimateTokens(originalContent);

      // Apply AI optimization based on level
      let optimizedContent: any;
      
      switch (this.config.optimizationLevel) {
        case 'advanced':
          // Full optimization pipeline
          optimizedContent = await this.aiExtractor.extract(
            page.html || originalContent,
            page.url
          );
          
          // Apply deduplication
          const dedupResult = await this.deduplicator.processContent(
            optimizedContent.content,
            page.url
          );
          result.deduplicationApplied = dedupResult.isDuplicate;

          // Generate metadata
          const metadata = await this.metadataGenerator.generateMetadata(
            optimizedContent.content,
            {
              includeEmbeddings: true,
              generateQuestions: true
            }
          );
          result.metadataGenerated = true;
          
          // Combine results
          optimizedContent = {
            ...optimizedContent,
            deduplication: dedupResult,
            aiMetadata: metadata
          };
          break;

        case 'standard':
          // Medium optimization
          optimizedContent = await this.aiExtractor.extract(
            page.html || originalContent,
            page.url
          );
          
          // Generate basic metadata
          const basicMetadata = await this.metadataGenerator.generateMetadata(
            optimizedContent.content,
            {
              includeEmbeddings: false,
              generateQuestions: false
            }
          );
          optimizedContent.aiMetadata = basicMetadata;
          result.metadataGenerated = true;
          break;

        case 'basic':
        default:
          // Basic optimization only
          optimizedContent = await this.aiExtractor.extract(
            page.html || originalContent,
            page.url
          );
          break;
      }

      // Calculate results
      result.optimizedTokens = this.estimateTokens(optimizedContent.content);
      result.reductionPercent = ((result.originalTokens - result.optimizedTokens) / result.originalTokens) * 100;
      result.semanticChunks = optimizedContent.semanticChunks?.length || 0;
      result.success = true;
      result.processingTime = Date.now() - startTime;

      // Store optimized version
      if (!this.config.dryRun) {
        await this.storeOptimizedContent(page.id, optimizedContent);
      }

    } catch (error: any) {
      result.error = error.message;
      result.processingTime = Date.now() - startTime;
      console.error(`❌ Failed to optimize ${page.url}:`, error.message);
    }

    return result;
  }

  /**
   * Estimate token count (simplified)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 0.75 tokens per word
    const words = text.split(/\s+/).length;
    return Math.round(words * 0.75);
  }

  /**
   * Store optimized content
   */
  private async storeOptimizedContent(pageId: string, optimizedContent: any): Promise<void> {
    const optimizedData = {
      page_id: pageId,
      optimized_content: optimizedContent.content,
      semantic_chunks: optimizedContent.semanticChunks,
      ai_metadata: optimizedContent.aiMetadata,
      deduplication_data: optimizedContent.deduplication,
      optimization_metrics: {
        originalTokens: optimizedContent.originalTokens,
        optimizedTokens: optimizedContent.optimizedTokens,
        reductionPercent: optimizedContent.reductionPercent
      },
      optimized_at: new Date().toISOString()
    };

    // Store in a new table or update existing
    const { error } = await this.supabase
      .from('ai_optimized_content')
      .upsert(optimizedData);

    if (error) {
      console.error('Error storing optimized content:', error);
    }
  }

  /**
   * Save batch results to file
   */
  private async saveBatchResults(pages: any[], results: OptimizationResult[]): Promise<void> {
    const batchReport = {
      timestamp: new Date().toISOString(),
      pages: pages.map((p, i) => ({
        url: p.url,
        optimization: results[i]
      }))
    };

    const filename = `batch_${Date.now()}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    
    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(batchReport, null, 2));
  }

  /**
   * Report current progress
   */
  private reportProgress(): void {
    const elapsed = (Date.now() - this.progress.startTime.getTime()) / 1000;
    const rate = this.progress.processedPages / elapsed;
    const remaining = (this.progress.totalPages - this.progress.processedPages) / rate;

    console.log('\n📊 Progress Report');
    console.log('━'.repeat(40));
    console.log(`Processed: ${this.progress.processedPages}/${this.progress.totalPages} (${(this.progress.processedPages / this.progress.totalPages * 100).toFixed(1)}%)`);
    console.log(`Successful: ${this.progress.successfulOptimizations}`);
    console.log(`Failed: ${this.progress.failedOptimizations}`);
    console.log(`Average Reduction: ${this.progress.averageReduction.toFixed(1)}%`);
    console.log(`Processing Rate: ${rate.toFixed(1)} pages/sec`);
    console.log(`Time Remaining: ${Math.round(remaining / 60)} minutes`);
    console.log('━'.repeat(40));
  }

  /**
   * Generate final report
   */
  private async generateFinalReport(): Promise<void> {
    const elapsed = (Date.now() - this.progress.startTime.getTime()) / 1000;
    
    const report = {
      summary: {
        totalPages: this.progress.totalPages,
        processedPages: this.progress.processedPages,
        successfulOptimizations: this.progress.successfulOptimizations,
        failedOptimizations: this.progress.failedOptimizations,
        successRate: (this.progress.successfulOptimizations / this.progress.processedPages * 100).toFixed(1) + '%'
      },
      tokenReduction: {
        totalOriginalTokens: this.progress.totalOriginalTokens,
        totalOptimizedTokens: this.progress.totalOptimizedTokens,
        totalSaved: this.progress.totalOriginalTokens - this.progress.totalOptimizedTokens,
        averageReduction: this.progress.averageReduction.toFixed(1) + '%'
      },
      performance: {
        totalTime: elapsed,
        averageTimePerPage: (elapsed / this.progress.processedPages).toFixed(2) + ' seconds',
        pagesPerMinute: (this.progress.processedPages / (elapsed / 60)).toFixed(1)
      },
      errors: this.progress.errors,
      timestamp: new Date().toISOString()
    };

    // Save report
    const reportPath = path.join(this.config.outputDir, 'migration_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ AI OPTIMIZATION MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Final Results:');
    console.log(`  ✅ Successfully optimized: ${this.progress.successfulOptimizations} pages`);
    console.log(`  ❌ Failed: ${this.progress.failedOptimizations} pages`);
    console.log(`  📉 Average token reduction: ${this.progress.averageReduction.toFixed(1)}%`);
    console.log(`  💰 Tokens saved: ${this.progress.totalOriginalTokens - this.progress.totalOptimizedTokens}`);
    console.log(`  ⏱️  Total time: ${(elapsed / 60).toFixed(1)} minutes`);
    console.log(`\n📁 Report saved to: ${reportPath}`);

    // Cost savings estimate (using GPT-4 pricing as example)
    const tokensSaved = this.progress.totalOriginalTokens - this.progress.totalOptimizedTokens;
    const costSaved = (tokensSaved / 1000) * 0.03; // $0.03 per 1K tokens
    console.log(`\n💵 Estimated cost savings: $${costSaved.toFixed(2)} per query`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: MigrationConfig = {
    batchSize: parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '10'),
    dryRun: args.includes('--dry-run'),
    maxPages: args.find(a => a.startsWith('--max=')) ? 
      parseInt(args.find(a => a.startsWith('--max='))!.split('=')[1]) : undefined,
    outputDir: args.find(a => a.startsWith('--output='))?.split('=')[1] || './optimization-reports',
    reportInterval: parseInt(args.find(a => a.startsWith('--report='))?.split('=')[1] || '100'),
    optimizationLevel: (args.find(a => a.startsWith('--level='))?.split('=')[1] || 'standard') as any,
    preserveOriginal: !args.includes('--no-preserve')
  };

  // Show help
  if (args.includes('--help')) {
    console.log(`
AI Content Optimization Migration Tool

Usage: npm run optimize-data [options]

Options:
  --batch=N          Process N pages per batch (default: 10)
  --dry-run          Test without saving changes
  --max=N            Process maximum N pages
  --output=DIR       Output directory for reports (default: ./optimization-reports)
  --report=N         Report progress every N pages (default: 100)
  --level=LEVEL      Optimization level: basic|standard|advanced (default: standard)
  --no-preserve      Don't preserve original content
  --help             Show this help message

Examples:
  npm run optimize-data --dry-run --max=10
  npm run optimize-data --batch=50 --level=advanced
  npm run optimize-data --output=./reports --report=500
    `);
    process.exit(0);
  }

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
  }

  // Run migration
  try {
    const optimizer = new DataOptimizer(config);
    await optimizer.migrate();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DataOptimizer, MigrationConfig, OptimizationResult };