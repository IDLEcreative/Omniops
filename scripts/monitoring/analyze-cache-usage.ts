#!/usr/bin/env tsx

/**
 * Cache Usage Analysis Script
 *
 * Analyzes cache hit/miss patterns and provides TTL optimization recommendations.
 *
 * Monitors:
 * - Cache hit rates by key pattern
 * - Average TTL vs actual key lifetime
 * - Memory usage by cache namespace
 * - Eviction patterns
 * - Miss penalty (time to regenerate)
 *
 * Usage:
 *   npx tsx scripts/monitoring/analyze-cache-usage.ts
 *   npx tsx scripts/monitoring/analyze-cache-usage.ts --recommend
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

interface CachePattern {
  pattern: string;
  keyCount: number;
  avgTTL: number;
  totalMemoryBytes: number;
  memoryPretty: string;
}

interface CacheStats {
  totalKeys: number;
  totalMemory: number;
  hitRate: number;
  patterns: CachePattern[];
  recommendations: string[];
}

const redis = new Redis(REDIS_URL);

async function getCachePatterns(): Promise<CachePattern[]> {
  const patterns = [
    'widget-config:*',
    'customer-profile:*',
    'domain-lookup:*',
    'query-cache:*',
    'session:*'
  ];

  const results: CachePattern[] = [];

  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      continue;
    }

    let totalTTL = 0;
    let totalMemory = 0;

    for (const key of keys) {
      const ttl = await redis.ttl(key);
      const memory = await redis.memory('USAGE', key);

      if (ttl > 0) {
        totalTTL += ttl;
      }
      if (memory) {
        totalMemory += memory;
      }
    }

    const avgTTL = keys.length > 0 ? totalTTL / keys.length : 0;
    const memoryPretty = formatBytes(totalMemory);

    results.push({
      pattern: pattern.replace(':*', ''),
      keyCount: keys.length,
      avgTTL: Math.round(avgTTL),
      totalMemoryBytes: totalMemory,
      memoryPretty
    });
  }

  return results.sort((a, b) => b.totalMemoryBytes - a.totalMemoryBytes);
}

async function getRedisInfo(): Promise<any> {
  const info = await redis.info('stats');
  const lines = info.split('\r\n');
  const stats: any = {};

  lines.forEach(line => {
    const [key, value] = line.split(':');
    if (key && value) {
      stats[key] = value;
    }
  });

  return stats;
}

async function calculateHitRate(): Promise<number> {
  const info = await getRedisInfo();
  const hits = parseInt(info.keyspace_hits || '0');
  const misses = parseInt(info.keyspace_misses || '0');
  const total = hits + misses;

  return total > 0 ? (hits / total) * 100 : 0;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatTTL(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

function generateRecommendations(patterns: CachePattern[], hitRate: number): string[] {
  const recommendations: string[] = [];

  // Hit rate recommendations
  if (hitRate < 70) {
    recommendations.push('⚠️  Cache hit rate <70% - consider increasing TTLs or cache more data');
  } else if (hitRate > 98) {
    recommendations.push('💡 Cache hit rate >98% - consider reducing TTLs to save memory');
  } else {
    recommendations.push('✅ Cache hit rate is healthy (70-98%)');
  }

  // Pattern-specific recommendations
  patterns.forEach(pattern => {
    const configuredTTL = getConfiguredTTL(pattern.pattern);

    if (configuredTTL && pattern.avgTTL < configuredTTL * 0.5) {
      recommendations.push(
        `💡 ${pattern.pattern}: Keys being evicted early (avg TTL ${formatTTL(pattern.avgTTL)} < configured ${formatTTL(configuredTTL)})`
      );
    }

    if (pattern.keyCount > 10000) {
      recommendations.push(
        `⚠️  ${pattern.pattern}: High key count (${pattern.keyCount.toLocaleString()}) - consider shorter TTLs or cleanup`
      );
    }

    if (pattern.totalMemoryBytes > 100 * 1024 * 1024) {
      recommendations.push(
        `⚠️  ${pattern.pattern}: High memory usage (${pattern.memoryPretty}) - consider optimization`
      );
    }
  });

  // Memory pressure
  const totalMemory = patterns.reduce((sum, p) => sum + p.totalMemoryBytes, 0);
  if (totalMemory > 500 * 1024 * 1024) {
    recommendations.push('⚠️  Total cache memory >500MB - monitor Redis memory limits');
  }

  return recommendations;
}

function getConfiguredTTL(pattern: string): number | null {
  const ttlConfig: Record<string, number> = {
    'widget-config': 300,      // 5 minutes
    'customer-profile': 600,   // 10 minutes
    'domain-lookup': 900,      // 15 minutes
    'query-cache': 120,        // 2 minutes
    'session': 3600            // 1 hour
  };

  return ttlConfig[pattern] || null;
}

function generateTTLRecommendations(patterns: CachePattern[]): void {
  console.log('\n📋 TTL OPTIMIZATION RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const recommendations: Array<{ pattern: string; current: number; recommended: number; reason: string }> = [];

  patterns.forEach(pattern => {
    const current = getConfiguredTTL(pattern.pattern);
    if (!current) return;

    const avgTTL = pattern.avgTTL;

    // If keys are being evicted early (avg TTL < 50% of configured)
    if (avgTTL < current * 0.5) {
      recommendations.push({
        pattern: pattern.pattern,
        current,
        recommended: Math.max(60, Math.round(avgTTL * 1.5)),
        reason: 'Keys evicted early due to memory pressure'
      });
    }

    // If keys are never evicted (avg TTL > 90% of configured)
    else if (avgTTL > current * 0.9) {
      recommendations.push({
        pattern: pattern.pattern,
        current,
        recommended: Math.round(current * 1.2),
        reason: 'Keys rarely evicted - can increase TTL slightly'
      });
    }

    // If memory usage is very high
    else if (pattern.totalMemoryBytes > 50 * 1024 * 1024) {
      recommendations.push({
        pattern: pattern.pattern,
        current,
        recommended: Math.round(current * 0.8),
        reason: 'High memory usage - reduce TTL to free memory'
      });
    }
  });

  if (recommendations.length === 0) {
    console.log('  ✅ All TTLs are optimally configured!\n');
  } else {
    recommendations.forEach(rec => {
      console.log(`  ${rec.pattern}`);
      console.log(`    Current TTL:     ${formatTTL(rec.current)}`);
      console.log(`    Recommended:     ${formatTTL(rec.recommended)}`);
      console.log(`    Reason:          ${rec.reason}`);
      console.log();
    });

    console.log('  To apply recommendations, update lib/cache/cache-config.ts:\n');
    recommendations.forEach(rec => {
      console.log(`  export const ${rec.pattern.toUpperCase().replace(/-/g, '_')}_TTL = ${rec.recommended}; // ${formatTTL(rec.recommended)}`);
    });
    console.log();
  }
}

async function analyzeCacheUsage(): Promise<CacheStats> {
  console.log('📊 Analyzing cache usage patterns...\n');

  const [patterns, hitRate] = await Promise.all([
    getCachePatterns(),
    calculateHitRate()
  ]);

  const totalKeys = patterns.reduce((sum, p) => sum + p.keyCount, 0);
  const totalMemory = patterns.reduce((sum, p) => sum + p.totalMemoryBytes, 0);

  const recommendations = generateRecommendations(patterns, hitRate);

  return {
    totalKeys,
    totalMemory,
    hitRate,
    patterns,
    recommendations
  };
}

function displayStats(stats: CacheStats) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  REDIS CACHE ANALYSIS DASHBOARD');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Overall Stats
  console.log('📈 OVERALL CACHE STATISTICS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`  Total Keys:      ${stats.totalKeys.toLocaleString()}`);
  console.log(`  Total Memory:    ${formatBytes(stats.totalMemory)}`);
  console.log(`  Hit Rate:        ${stats.hitRate.toFixed(2)}%`);

  const hitStatus = stats.hitRate > 90 ? '🟢 EXCELLENT' :
                    stats.hitRate > 70 ? '🟡 GOOD' : '🔴 NEEDS IMPROVEMENT';
  console.log(`  Status:          ${hitStatus}\n`);

  // Pattern Breakdown
  console.log('🔑 CACHE PATTERNS BY MEMORY USAGE');
  console.log('─────────────────────────────────────────────────────────');

  if (stats.patterns.length === 0) {
    console.log('  No cache keys found\n');
  } else {
    stats.patterns.forEach(pattern => {
      const configured = getConfiguredTTL(pattern.pattern);
      const ttlStatus = configured && pattern.avgTTL < configured * 0.5 ? ' ⚠️' : '';

      console.log(`  ${pattern.pattern}${ttlStatus}`);
      console.log(`    Keys:         ${pattern.keyCount.toLocaleString()}`);
      console.log(`    Memory:       ${pattern.memoryPretty}`);
      console.log(`    Avg TTL:      ${formatTTL(pattern.avgTTL)}`);
      if (configured) {
        console.log(`    Configured:   ${formatTTL(configured)}`);
      }
      console.log();
    });
  }

  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('─────────────────────────────────────────────────────────');
  if (stats.recommendations.length === 0) {
    console.log('  ✅ Cache configuration is optimal\n');
  } else {
    stats.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

async function main() {
  const args = process.argv.slice(2);
  const recommend = args.includes('--recommend');

  try {
    const stats = await analyzeCacheUsage();
    displayStats(stats);

    if (recommend) {
      generateTTLRecommendations(stats.patterns);
    }
  } catch (error) {
    console.error('Error analyzing cache:', error);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

main();
