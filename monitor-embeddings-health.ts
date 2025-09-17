#!/usr/bin/env npx tsx
/**
 * Embeddings Health Monitor
 * 
 * Monitors and reports on the health and performance of the embeddings system
 * including index efficiency, query performance, and data quality metrics.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface HealthMetrics {
  timestamp: string;
  embeddings: {
    totalCount: number;
    withoutEmbedding: number;
    orphanedRecords: number;
    avgChunkSize: number;
    duplicateChunks: number;
  };
  performance: {
    avgSearchTime: number;
    cacheHitRate: number;
    indexBloat: number;
    deadTuples: number;
  };
  storage: {
    tableSize: string;
    indexSize: string;
    totalSize: string;
  };
  recommendations: string[];
}

class EmbeddingsHealthMonitor {
  async checkHealth(): Promise<HealthMetrics> {
    console.log('🔍 Starting embeddings health check...\n');
    
    const metrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      embeddings: await this.checkEmbeddingsData(),
      performance: await this.checkPerformance(),
      storage: await this.checkStorage(),
      recommendations: []
    };

    metrics.recommendations = this.generateRecommendations(metrics);
    return metrics;
  }

  private async checkEmbeddingsData() {
    // Total embeddings count
    const { count: totalCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });

    // Embeddings without vector
    const { count: withoutEmbedding } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .is('embedding', null);

    // Orphaned embeddings (no parent page)
    const { data: orphanedData } = await supabase.rpc('execute_sql', {
      query: `
        SELECT COUNT(*) as count
        FROM page_embeddings pe
        LEFT JOIN scraped_pages sp ON pe.page_id = sp.id
        WHERE sp.id IS NULL
      `
    });

    // Average chunk size
    const { data: avgSizeData } = await supabase.rpc('execute_sql', {
      query: `
        SELECT AVG(length(chunk_text)) as avg_size
        FROM page_embeddings
        WHERE chunk_text IS NOT NULL
      `
    });

    // Duplicate chunks detection
    const { data: duplicatesData } = await supabase.rpc('execute_sql', {
      query: `
        SELECT COUNT(*) as count FROM (
          SELECT chunk_text, page_id, COUNT(*) 
          FROM page_embeddings 
          WHERE chunk_text IS NOT NULL
          GROUP BY chunk_text, page_id 
          HAVING COUNT(*) > 1
        ) duplicates
      `
    });

    return {
      totalCount: totalCount || 0,
      withoutEmbedding: withoutEmbedding || 0,
      orphanedRecords: parseInt(orphanedData?.[0]?.count || '0'),
      avgChunkSize: Math.round(parseFloat(avgSizeData?.[0]?.avg_size || '0')),
      duplicateChunks: parseInt(duplicatesData?.[0]?.count || '0')
    };
  }

  private async checkPerformance() {
    // Get query performance stats
    const { data: perfData } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          AVG(mean_time) as avg_search_time,
          AVG(cache_hit_rate::numeric) as cache_hit_rate
        FROM pg_stat_statements
        WHERE query LIKE '%search_embeddings%'
          AND calls > 10
      `
    });

    // Check index bloat
    const { data: bloatData } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          n_dead_tup,
          n_live_tup,
          ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) as bloat_ratio
        FROM pg_stat_user_tables
        WHERE tablename = 'page_embeddings'
      `
    });

    return {
      avgSearchTime: parseFloat(perfData?.[0]?.avg_search_time || '0'),
      cacheHitRate: parseFloat(perfData?.[0]?.cache_hit_rate || '0'),
      indexBloat: parseFloat(bloatData?.[0]?.bloat_ratio || '0'),
      deadTuples: parseInt(bloatData?.[0]?.n_dead_tup || '0')
    };
  }

  private async checkStorage() {
    const { data: storageData } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          pg_size_pretty(pg_table_size('page_embeddings')) as table_size,
          pg_size_pretty(pg_indexes_size('page_embeddings')) as index_size,
          pg_size_pretty(pg_total_relation_size('page_embeddings')) as total_size
      `
    });

    return {
      tableSize: storageData?.[0]?.table_size || 'Unknown',
      indexSize: storageData?.[0]?.index_size || 'Unknown',
      totalSize: storageData?.[0]?.total_size || 'Unknown'
    };
  }

  private generateRecommendations(metrics: HealthMetrics): string[] {
    const recommendations: string[] = [];

    // Check for missing embeddings
    const missingPct = (metrics.embeddings.withoutEmbedding / metrics.embeddings.totalCount) * 100;
    if (missingPct > 5) {
      recommendations.push(
        `⚠️ ${missingPct.toFixed(1)}% of chunks missing embeddings. Run: npm run embeddings:generate`
      );
    }

    // Check for orphaned records
    if (metrics.embeddings.orphanedRecords > 100) {
      recommendations.push(
        `🗑️ Found ${metrics.embeddings.orphanedRecords} orphaned embeddings. Run cleanup: npm run embeddings:cleanup`
      );
    }

    // Check for duplicates
    if (metrics.embeddings.duplicateChunks > 50) {
      recommendations.push(
        `📋 ${metrics.embeddings.duplicateChunks} duplicate chunks detected. Consider deduplication.`
      );
    }

    // Check cache hit rate
    if (metrics.performance.cacheHitRate < 95) {
      recommendations.push(
        `🎯 Cache hit rate is ${metrics.performance.cacheHitRate.toFixed(1)}%. Consider: VACUUM ANALYZE page_embeddings;`
      );
    }

    // Check index bloat
    if (metrics.performance.indexBloat > 20) {
      recommendations.push(
        `🔧 Index bloat at ${metrics.performance.indexBloat}%. Run: REINDEX TABLE page_embeddings;`
      );
    }

    // Check dead tuples
    if (metrics.performance.deadTuples > 10000) {
      recommendations.push(
        `♻️ ${metrics.performance.deadTuples} dead tuples. Run: VACUUM FULL page_embeddings;`
      );
    }

    // Check average chunk size
    if (metrics.embeddings.avgChunkSize < 100 || metrics.embeddings.avgChunkSize > 2000) {
      recommendations.push(
        `📏 Average chunk size is ${metrics.embeddings.avgChunkSize} chars. Optimal range is 200-1500.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All health checks passed! System is running optimally.');
    }

    return recommendations;
  }

  async runMaintenanceCheck() {
    const metrics = await this.checkHealth();
    
    console.log('📊 EMBEDDINGS HEALTH REPORT');
    console.log('=' .repeat(50));
    console.log(`📅 Timestamp: ${new Date(metrics.timestamp).toLocaleString()}\n`);
    
    console.log('📈 DATA METRICS:');
    console.log(`  • Total Embeddings: ${metrics.embeddings.totalCount.toLocaleString()}`);
    console.log(`  • Missing Vectors: ${metrics.embeddings.withoutEmbedding.toLocaleString()}`);
    console.log(`  • Orphaned Records: ${metrics.embeddings.orphanedRecords.toLocaleString()}`);
    console.log(`  • Average Chunk Size: ${metrics.embeddings.avgChunkSize} chars`);
    console.log(`  • Duplicate Chunks: ${metrics.embeddings.duplicateChunks}\n`);
    
    console.log('⚡ PERFORMANCE METRICS:');
    console.log(`  • Avg Search Time: ${metrics.performance.avgSearchTime.toFixed(2)}ms`);
    console.log(`  • Cache Hit Rate: ${metrics.performance.cacheHitRate.toFixed(1)}%`);
    console.log(`  • Index Bloat: ${metrics.performance.indexBloat}%`);
    console.log(`  • Dead Tuples: ${metrics.performance.deadTuples.toLocaleString()}\n`);
    
    console.log('💾 STORAGE METRICS:');
    console.log(`  • Table Size: ${metrics.storage.tableSize}`);
    console.log(`  • Index Size: ${metrics.storage.indexSize}`);
    console.log(`  • Total Size: ${metrics.storage.totalSize}\n`);
    
    console.log('🎯 RECOMMENDATIONS:');
    metrics.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
    
    console.log('\n' + '=' .repeat(50));
    
    // Write to log file
    const logEntry = {
      ...metrics,
      healthScore: this.calculateHealthScore(metrics)
    };
    
    console.log(`\n💯 Overall Health Score: ${logEntry.healthScore}/100\n`);
    
    return metrics;
  }

  private calculateHealthScore(metrics: HealthMetrics): number {
    let score = 100;
    
    // Deduct for missing embeddings
    const missingPct = (metrics.embeddings.withoutEmbedding / metrics.embeddings.totalCount) * 100;
    score -= Math.min(missingPct * 2, 20);
    
    // Deduct for orphaned records
    score -= Math.min(metrics.embeddings.orphanedRecords / 100, 10);
    
    // Deduct for poor cache hit rate
    score -= Math.max(0, (100 - metrics.performance.cacheHitRate) / 2);
    
    // Deduct for index bloat
    score -= Math.min(metrics.performance.indexBloat / 2, 15);
    
    // Deduct for duplicates
    score -= Math.min(metrics.embeddings.duplicateChunks / 50, 10);
    
    return Math.max(0, Math.round(score));
  }

  async performAutoMaintenance() {
    console.log('🔧 Running auto-maintenance tasks...\n');
    
    const metrics = await this.checkHealth();
    
    // Auto-vacuum if needed
    if (metrics.performance.deadTuples > 10000 || metrics.performance.indexBloat > 20) {
      console.log('♻️ Running VACUUM ANALYZE...');
      await supabase.rpc('execute_sql', {
        query: 'VACUUM ANALYZE page_embeddings;'
      });
      console.log('✅ Vacuum completed\n');
    }
    
    // Clean orphaned records if too many
    if (metrics.embeddings.orphanedRecords > 1000) {
      console.log('🗑️ Cleaning orphaned embeddings...');
      const { data } = await supabase.rpc('execute_sql', {
        query: `
          DELETE FROM page_embeddings
          WHERE page_id NOT IN (SELECT id FROM scraped_pages)
          RETURNING id
        `
      });
      console.log(`✅ Cleaned ${data?.length || 0} orphaned records\n`);
    }
    
    console.log('✨ Auto-maintenance completed!\n');
  }
}

// CLI Interface
async function main() {
  const monitor = new EmbeddingsHealthMonitor();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'check':
        await monitor.runMaintenanceCheck();
        break;
      
      case 'auto':
        await monitor.performAutoMaintenance();
        await monitor.runMaintenanceCheck();
        break;
      
      case 'watch':
        console.log('👁️ Starting continuous monitoring (Ctrl+C to stop)...\n');
        await monitor.runMaintenanceCheck();
        setInterval(async () => {
          console.log('\n' + '='.repeat(50) + '\n');
          await monitor.runMaintenanceCheck();
        }, 60000); // Check every minute
        break;
      
      default:
        console.log('📚 Embeddings Health Monitor\n');
        console.log('Usage:');
        console.log('  npx tsx monitor-embeddings-health.ts check   - Run health check');
        console.log('  npx tsx monitor-embeddings-health.ts auto    - Run auto-maintenance');
        console.log('  npx tsx monitor-embeddings-health.ts watch   - Continuous monitoring');
        process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { EmbeddingsHealthMonitor };