import { searchSimilarContent } from '@/lib/embeddings';

export async function testSimilarityScoreDistribution(domain: string, query = 'IP69K waterproof connectors') {
  console.log('\n=== SIMILARITY SCORE DISTRIBUTION ANALYSIS ===\n');
  console.log(`Testing with query: "${query}"`);

  const thresholds = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3];

  for (const threshold of thresholds) {
    console.log(`\n--- Threshold: ${threshold} ---`);

    const chunks = await searchSimilarContent(query, domain, 10, threshold);
    console.log(`Results: ${chunks.length} chunks`);

    if (chunks.length === 0) {
      continue;
    }

    const scores = chunks.map((c) => c.similarity);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    console.log(`  Average: ${avgScore.toFixed(4)}`);
    console.log(`  Min: ${minScore.toFixed(4)}`);
    console.log(`  Max: ${maxScore.toFixed(4)}`);
    console.log(`  Range: ${(maxScore - minScore).toFixed(4)}`);

    console.log('\n  Score Distribution:');
    chunks.forEach((chunk, idx) => {
      const isProduct = chunk.url.includes('/product/');
      console.log(
        `    ${idx + 1}. ${chunk.similarity.toFixed(4)} ${isProduct ? '[PRODUCT]' : '[OTHER]'} - ${chunk.title.substring(0, 50)}`
      );
    });
  }
}
