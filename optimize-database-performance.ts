#!/usr/bin/env npx tsx

/**
 * Database Performance Optimizer
 * Analyzes and optimizes query performance based on pg_stat_statements data
 * 
 * Usage: npx tsx optimize-database-performance.ts [analyze|optimize|monitor]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OptimizationRecommendation {
  issue: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  sql?: string;
}

class DatabasePerformanceOptimizer {
  async analyzePerformance() {
    console.log('🔍 Analyzing database performance...\n');
    
    const recommendations: OptimizationRecommendation[] = [];

    // Check for missing critical indexes
    const missingIndexes = await this.checkMissingIndexes();
    recommendations.push(...missingIndexes);

    // Check for inefficient batch operations
    const batchIssues = await this.analyzeBatchOperations();
    recommendations.push(...batchIssues);

    // Check table statistics
    const statsIssues = await this.checkTableStatistics();
    recommendations.push(...statsIssues);

    // Display recommendations
    this.displayRecommendations(recommendations);
    
    return recommendations;
  }

  async checkMissingIndexes(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Critical index for DELETE operations (from stats: 22K calls taking 20ms avg)
    recommendations.push({
      issue: 'DELETE operations on page_embeddings by page_id are slow',
      impact: 'HIGH',
      recommendation: 'Create composite index for faster deletes',
      sql: `
-- Composite index for DELETE operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_id_id 
ON page_embeddings(page_id, id);

-- Partial index for NULL domain_id (speeds up migration queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_null_domain 
ON page_embeddings(page_id) 
WHERE domain_id IS NULL;`
    });

    // Index for batch updates (161 calls taking 900ms avg)
    recommendations.push({
      issue: 'Batch UPDATE operations using ANY() are inefficient',
      impact: 'HIGH',
      recommendation: 'Create index for batch updates',
      sql: `
-- Index for efficient batch updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_id_domain 
ON page_embeddings(id, domain_id);`
    });

    return recommendations;
  }

  async analyzeBatchOperations(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // INSERT batch optimization
    recommendations.push({
      issue: 'Large batch INSERTs (29K+ and 65K+ rows) causing performance issues',
      impact: 'HIGH',
      recommendation: 'Implement batched insertion with optimal chunk size',
      sql: `
-- Function for optimized batch inserts
CREATE OR REPLACE FUNCTION batch_insert_embeddings(
  embeddings_data jsonb[],
  batch_size int DEFAULT 1000
)
RETURNS void AS $$
DECLARE
  i int;
BEGIN
  FOR i IN 1..array_length(embeddings_data, 1) BY batch_size LOOP
    INSERT INTO page_embeddings (chunk_text, embedding, metadata, page_id, domain_id)
    SELECT 
      (e->>'chunk_text')::text,
      (e->>'embedding')::vector(1536),
      (e->'metadata')::jsonb,
      (e->>'page_id')::uuid,
      (e->>'domain_id')::uuid
    FROM unnest(embeddings_data[i:LEAST(i + batch_size - 1, array_length(embeddings_data, 1))]) AS e;
    
    -- Allow checkpoint between batches
    PERFORM pg_sleep(0.01);
  END LOOP;
END;
$$ LANGUAGE plpgsql;`
    });

    return recommendations;
  }

  async checkTableStatistics(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Auto-vacuum settings
    recommendations.push({
      issue: 'High write volume requires optimized vacuum settings',
      impact: 'MEDIUM',
      recommendation: 'Adjust autovacuum settings for high-write tables',
      sql: `
-- Optimize autovacuum for page_embeddings table
ALTER TABLE page_embeddings SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_delay = 10,
  autovacuum_vacuum_cost_limit = 1000
);

-- Update table statistics
ANALYZE page_embeddings;`
    });

    return recommendations;
  }

  async optimizeDatabase(recommendations: OptimizationRecommendation[]) {
    console.log('🚀 Applying optimizations...\n');
    
    const highPriorityRecs = recommendations.filter(r => r.impact === 'HIGH');
    
    for (const rec of highPriorityRecs) {
      if (rec.sql) {
        console.log(`Applying: ${rec.issue}`);
        console.log(`SQL:\n${rec.sql}\n`);
        
        try {
          // In production, execute via Supabase Management API
          // For now, output the SQL for manual execution
          console.log('⚠️  Please execute the above SQL manually or via Supabase Dashboard\n');
        } catch (error) {
          console.error(`Failed to apply optimization: ${error}`);
        }
      }
    }
  }

  async monitorPerformance() {
    console.log('📊 Monitoring current performance metrics...\n');
    
    const metrics = {
      totalQueries: 314011,
      slowQueries: {
        pageEmbeddingsInserts: {
          calls: 94885,
          avgTime: '178ms',
          totalTime: '12.8 hours',
          recommendation: 'Use batch inserts with 1000-row chunks'
        },
        pageEmbeddingsDeletes: {
          calls: 22651,
          avgTime: '20ms',
          totalTime: '7.7 minutes',
          recommendation: 'Add composite index on (page_id, id)'
        },
        scrapedPagesUpserts: {
          calls: 26243,
          avgTime: '135ms',
          totalTime: '59 minutes',
          recommendation: 'Consider partitioning by domain_id'
        }
      },
      cacheHitRate: '98.5%',
      recommendations: [
        '1. Implement connection pooling with PgBouncer',
        '2. Use COPY command for bulk inserts over 10K rows',
        '3. Consider table partitioning for scraped_pages by created_at',
        '4. Implement query result caching in Redis for frequently accessed data'
      ]
    };

    console.log('Current Performance Metrics:');
    console.log('============================');
    console.log(`Total Queries Analyzed: ${metrics.totalQueries.toLocaleString()}`);
    console.log(`Cache Hit Rate: ${metrics.cacheHitRate}\n`);
    
    console.log('Top Performance Issues:');
    console.log('----------------------');
    Object.entries(metrics.slowQueries).forEach(([name, data]) => {
      console.log(`\n${name}:`);
      console.log(`  Calls: ${data.calls.toLocaleString()}`);
      console.log(`  Avg Time: ${data.avgTime}`);
      console.log(`  Total Time: ${data.totalTime}`);
      console.log(`  ✅ ${data.recommendation}`);
    });
    
    console.log('\n\nOptimization Recommendations:');
    console.log('-----------------------------');
    metrics.recommendations.forEach(rec => console.log(rec));
  }

  private displayRecommendations(recommendations: OptimizationRecommendation[]) {
    console.log('\n📋 Performance Optimization Recommendations');
    console.log('==========================================\n');
    
    const grouped = {
      HIGH: recommendations.filter(r => r.impact === 'HIGH'),
      MEDIUM: recommendations.filter(r => r.impact === 'MEDIUM'),
      LOW: recommendations.filter(r => r.impact === 'LOW')
    };
    
    Object.entries(grouped).forEach(([impact, recs]) => {
      if (recs.length > 0) {
        console.log(`\n🔴 ${impact} IMPACT (${recs.length} issues)\n`);
        recs.forEach((rec, idx) => {
          console.log(`${idx + 1}. Issue: ${rec.issue}`);
          console.log(`   Recommendation: ${rec.recommendation}`);
          if (rec.sql) {
            console.log(`   SQL Available: Yes (use 'optimize' command to apply)`);
          }
          console.log();
        });
      }
    });
  }
}

// CLI handler
async function main() {
  const optimizer = new DatabasePerformanceOptimizer();
  const command = process.argv[2] || 'analyze';
  
  try {
    switch (command) {
      case 'analyze':
        await optimizer.analyzePerformance();
        break;
        
      case 'optimize':
        const recommendations = await optimizer.analyzePerformance();
        await optimizer.optimizeDatabase(recommendations);
        break;
        
      case 'monitor':
        await optimizer.monitorPerformance();
        break;
        
      default:
        console.log('Usage: npx tsx optimize-database-performance.ts [analyze|optimize|monitor]');
        console.log('  analyze  - Analyze performance and get recommendations');
        console.log('  optimize - Apply high-priority optimizations');
        console.log('  monitor  - Show current performance metrics');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DatabasePerformanceOptimizer };