#!/usr/bin/env npx tsx
import { analyzeCurrentSystem } from './vector-graph/current-system';
import { simulateGraphPerformance } from './vector-graph/performance';
import { analyzeBenefitsVsCosts, recommendAlternatives } from './vector-graph/analysis';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     VECTOR GRAPH PERFORMANCE IMPACT ANALYSIS              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await analyzeCurrentSystem();
  await simulateGraphPerformance();

  await analyzeBenefitsVsCosts();
  recommendAlternatives();

  console.log('\n=== RECOMMENDATION ===\n');
  console.log('❌ FULL GRAPH IMPLEMENTATION NOT RECOMMENDED');
  console.log('✅ RECOMMENDED: Enhanced caching + pre-computed clusters');
}

main().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
