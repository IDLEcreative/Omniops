// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js';
import { AIContentExtractor } from '../../../lib/ai-content-extractor';
import { ContentDeduplicator } from '../../../lib/content-deduplicator';
import { AIMetadataGenerator } from '../../../lib/ai-metadata-generator';
import { PageOptimizer } from './optimizer';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { MigrationConfig, MigrationProgress, OptimizationResult } from './types';

export { MigrationConfig, MigrationProgress, OptimizationResult } from './types';

export class DataOptimizer {
  private supabase: any;
  private optimizer: PageOptimizer;
  private progress: MigrationProgress;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const aiExtractor = new AIContentExtractor();
    const deduplicator = new ContentDeduplicator(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      process.env.REDIS_URL
    );
    const metadataGenerator = new AIMetadataGenerator({
      openaiApiKey: process.env.OPENAI_API_KEY,
      cacheEnabled: true
    });

    this.optimizer = new PageOptimizer(config, aiExtractor, deduplicator, metadataGenerator);

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

  async migrate(): Promise<void> {
    console.log('━'.repeat(60));
    console.log('━'.repeat(60));

    try {
      const { count } = await this.supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true });

      this.progress.totalPages = count || 0;

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

        if (this.progress.processedPages % this.config.reportInterval === 0) {
          this.reportProgress();
        }

        if (this.config.maxPages && this.progress.processedPages >= this.config.maxPages) {
          break;
        }
      }

      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

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

  private async processBatch(pages: any[]): Promise<void> {

    const results = await Promise.all(
      pages.map(page => this.optimizer.optimizePage(page))
    );

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

    if (this.progress.totalOriginalTokens > 0) {
      this.progress.averageReduction =
        ((this.progress.totalOriginalTokens - this.progress.totalOptimizedTokens) /
         this.progress.totalOriginalTokens) * 100;
    }

    if (!this.config.dryRun) {
      await this.saveBatchResults(pages, results);
    }
  }

  private async saveBatchResults(pages: any[], results: OptimizationResult[]): Promise<void> {
    const batchReport = {
      timestamp: new Date().toISOString(),
      pages: pages.map((p, i) => ({ url: p.url, optimization: results[i] }))
    };

    const filename = `batch_${Date.now()}.json`;
    const filepath = path.join(this.config.outputDir, filename);

    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(batchReport, null, 2));
  }

  private reportProgress(): void {
    const elapsed = (Date.now() - this.progress.startTime.getTime()) / 1000;
    const rate = this.progress.processedPages / elapsed;

    console.log('━'.repeat(40));
    console.log(`Average Reduction: ${this.progress.averageReduction.toFixed(1)}%`);
    console.log(`Processing Rate: ${rate.toFixed(1)} pages/sec`);
    console.log('━'.repeat(40));
  }

  private async generateFinalReport(): Promise<void> {
    const elapsed = (Date.now() - this.progress.startTime.getTime()) / 1000;

    const report = {
      summary: {
        totalPages: this.progress.totalPages,
        processedPages: this.progress.processedPages,
        successfulOptimizations: this.progress.successfulOptimizations,
        failedOptimizations: this.progress.failedOptimizations
      },
      timestamp: new Date().toISOString()
    };

    const reportPath = path.join(this.config.outputDir, 'migration_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('='.repeat(60));
  }
}
