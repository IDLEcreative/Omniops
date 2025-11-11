/**
 * Agent 3: Comprehensive Chunk Quality & Semantic Search Analysis
 * This orchestrator delegates to modular helpers under ./chunk-quality-analysis.
 */

import { analyzeSearchEmbeddingsFunction } from './chunk-quality-analysis/search-function-analysis';
import { analyzeChunkMetadata } from './chunk-quality-analysis/metadata-analysis';
import { testQueryVariations } from './chunk-quality-analysis/query-variation-tests';
import { testSimilarityScoreDistribution } from './chunk-quality-analysis/similarity-distribution';
import { testChunkIndexImpact } from './chunk-quality-analysis/chunk-index-analysis';
import { printSummaryReport } from './chunk-quality-analysis/summary-report';
import { TEST_DOMAIN, TEST_QUERIES } from './chunk-quality-analysis/queries';

async function runChunkQualityAnalysis() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Agent 3: Chunk Quality & Semantic Search Analysis        ║');
  console.log(`║   Test Domain: ${TEST_DOMAIN}`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await analyzeSearchEmbeddingsFunction();
  await analyzeChunkMetadata(TEST_DOMAIN);
  await testQueryVariations(TEST_DOMAIN);
  await testSimilarityScoreDistribution(TEST_DOMAIN);
  await testChunkIndexImpact(TEST_DOMAIN);

  printSummaryReport(TEST_QUERIES.length, TEST_DOMAIN);
}

runChunkQualityAnalysis()
  .then(() => {
    console.log('\n✓ Analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Analysis failed:', error);
    process.exit(1);
  });
