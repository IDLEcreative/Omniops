/**
 * MCP Tool Performance Baseline Measurement
 *
 * Purpose: Measure and track performance metrics for all MCP tools
 * Usage: npx tsx scripts/tests/measure-mcp-performance.ts
 *
 * Metrics Tracked:
 *   - Module load time
 *   - Metadata access time
 *   - Tool initialization overhead
 *
 * Last Updated: 2025-11-05
 */

import { performance } from 'perf_hooks';
import { serverRegistry } from '../../servers';

interface PerformanceMetrics {
  toolName: string;
  category: string;
  loadTimeMs: number;
  metadataAccessTimeMs: number;
  version: string;
  capabilities: string[];
}

async function measureToolPerformance(): Promise<void> {
  console.log('🔬 MCP Tool Performance Baseline Measurement\n');
  console.log('='.repeat(80));

  const allMetrics: PerformanceMetrics[] = [];

  // Iterate through all categories and tools
  for (const [categoryName, categoryInfo] of Object.entries(serverRegistry)) {
    console.log(`\n📁 Category: ${categoryName}`);
    console.log(`   Description: ${categoryInfo.description}`);
    console.log(`   Tools: ${categoryInfo.tools.length}\n`);

    for (const toolName of categoryInfo.tools) {
      const loadStart = performance.now();

      try {
        // Dynamic import of tool module
        const modulePath = `../../servers/${categoryName}/${toolName}`;
        const toolModule = await import(modulePath);

        const loadEnd = performance.now();
        const loadTime = loadEnd - loadStart;

        // Measure metadata access time
        const metadataStart = performance.now();
        const metadata = toolModule.metadata;
        const metadataEnd = performance.now();
        const metadataTime = metadataEnd - metadataStart;

        // Extract capabilities (handle both array and object formats)
        let capabilitiesList: string[] = [];
        if (Array.isArray(metadata.capabilities)) {
          capabilitiesList = metadata.capabilities;
        } else if (typeof metadata.capabilities === 'object' && metadata.capabilities !== null) {
          capabilitiesList = Object.keys(metadata.capabilities);
        }

        // Collect metrics
        const metrics: PerformanceMetrics = {
          toolName,
          category: categoryName,
          loadTimeMs: parseFloat(loadTime.toFixed(2)),
          metadataAccessTimeMs: parseFloat(metadataTime.toFixed(4)),
          version: metadata.version,
          capabilities: capabilitiesList
        };

        allMetrics.push(metrics);

        // Print individual tool metrics
        console.log(`   ✅ ${toolName}`);
        console.log(`      Load Time: ${metrics.loadTimeMs}ms`);
        console.log(`      Metadata Access: ${metrics.metadataAccessTimeMs}ms`);
        console.log(`      Version: ${metrics.version}`);
        console.log(`      Capabilities: ${metrics.capabilities.join(', ')}`);
        console.log('');

      } catch (error) {
        console.error(`   ❌ ${toolName} - Failed to load`);
        console.error(`      Error: ${error instanceof Error ? error.message : String(error)}`);
        console.log('');
      }
    }
  }

  // Summary statistics
  console.log('='.repeat(80));
  console.log('\n📊 Performance Summary\n');

  const totalTools = allMetrics.length;
  const avgLoadTime = allMetrics.reduce((sum, m) => sum + m.loadTimeMs, 0) / totalTools;
  const maxLoadTime = Math.max(...allMetrics.map(m => m.loadTimeMs));
  const minLoadTime = Math.min(...allMetrics.map(m => m.loadTimeMs));

  const slowestTool = allMetrics.find(m => m.loadTimeMs === maxLoadTime);
  const fastestTool = allMetrics.find(m => m.loadTimeMs === minLoadTime);

  console.log(`Total Tools Measured: ${totalTools}`);
  console.log(`Average Load Time: ${avgLoadTime.toFixed(2)}ms`);
  console.log(`Fastest Tool: ${fastestTool?.toolName} (${fastestTool?.loadTimeMs}ms)`);
  console.log(`Slowest Tool: ${slowestTool?.toolName} (${slowestTool?.loadTimeMs}ms)`);
  console.log(`Load Time Range: ${minLoadTime.toFixed(2)}ms - ${maxLoadTime.toFixed(2)}ms`);

  // Category breakdown
  console.log('\n📈 Performance by Category\n');

  const categories = [...new Set(allMetrics.map(m => m.category))];

  for (const category of categories) {
    const categoryMetrics = allMetrics.filter(m => m.category === category);
    const categoryAvg = categoryMetrics.reduce((sum, m) => sum + m.loadTimeMs, 0) / categoryMetrics.length;

    console.log(`${category}:`);
    console.log(`  Tools: ${categoryMetrics.length}`);
    console.log(`  Average Load Time: ${categoryAvg.toFixed(2)}ms`);
  }

  // Performance baselines
  console.log('\n🎯 Performance Baselines\n');
  console.log('Target Metrics:');
  console.log(`  ✅ Load Time: < 100ms per tool (Current avg: ${avgLoadTime.toFixed(2)}ms)`);
  console.log(`  ✅ Metadata Access: < 1ms (Current avg: ${(allMetrics.reduce((sum, m) => sum + m.metadataAccessTimeMs, 0) / totalTools).toFixed(4)}ms)`);

  const loadTimePassed = avgLoadTime < 100;
  const metadataTimePassed = allMetrics.every(m => m.metadataAccessTimeMs < 1);

  console.log('\n' + '='.repeat(80));

  if (loadTimePassed && metadataTimePassed) {
    console.log('\n✅ All performance baselines met!');
  } else {
    console.log('\n⚠️  Some performance baselines not met:');
    if (!loadTimePassed) {
      console.log(`   - Average load time exceeds target (${avgLoadTime.toFixed(2)}ms > 100ms)`);
    }
    if (!metadataTimePassed) {
      console.log(`   - Some metadata access times exceed target (> 1ms)`);
    }
  }

  console.log('');
}

// Run measurement
measureToolPerformance().catch((error) => {
  console.error('❌ Performance measurement failed:', error);
  process.exit(1);
});
