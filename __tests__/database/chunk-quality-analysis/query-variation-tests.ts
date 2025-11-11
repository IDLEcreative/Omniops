import { searchSimilarContent } from '@/lib/embeddings';
import { ChunkAnalysis } from './types';
import { TEST_QUERIES } from './queries';

function classifyChunk(url: string, content: string) {
  if (url.includes('/product/')) {
    return 'product';
  }
  if (url === '/') {
    return 'homepage';
  }
  const normalizedContent = content.toLowerCase();
  if (normalizedContent.includes('navigation') || normalizedContent.includes('menu')) {
    return 'navigation';
  }
  if (url.includes('/category/') || url.includes('/shop/')) {
    return 'category';
  }
  return 'general';
}

export async function testQueryVariations(domain: string) {
  console.log('\n=== QUERY VARIATION TESTING ===\n');

  const results: ChunkAnalysis[] = [];

  for (const testQuery of TEST_QUERIES) {
    console.log(`\n--- Testing: ${testQuery.name} ---`);
    console.log(`Query: "${testQuery.query}"`);
    console.log(`Expected: ${testQuery.expectedType}`);
    console.log(`Description: ${testQuery.description}`);

    try {
      const chunks = await searchSimilarContent(testQuery.query, domain, 5, 0.15);

      console.log(`\nResults: ${chunks.length} chunks found`);

      const analysis: ChunkAnalysis = {
        query: testQuery.query,
        resultsCount: chunks.length,
        avgSimilarity: chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length || 0,
        chunkTypes: {},
        topResults: [],
      };

      chunks.forEach((chunk, idx) => {
        console.log(`\n[${idx + 1}] Similarity: ${chunk.similarity.toFixed(4)}`);
        console.log(`    Title: ${chunk.title}`);
        console.log(`    URL: ${chunk.url}`);
        console.log(`    Content: ${chunk.content.substring(0, 150)}...`);
        console.log(`    Length: ${chunk.content.length} chars`);

        const chunkType = classifyChunk(chunk.url, chunk.content);
        analysis.chunkTypes[chunkType] = (analysis.chunkTypes[chunkType] || 0) + 1;

        analysis.topResults.push({
          similarity: chunk.similarity,
          title: chunk.title,
          url: chunk.url,
          contentPreview: chunk.content.substring(0, 100),
          chunkLength: chunk.content.length,
        });
      });

      results.push(analysis);

      console.log('\nChunk Type Distribution:');
      Object.entries(analysis.chunkTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log(`Average Similarity: ${analysis.avgSimilarity.toFixed(4)}`);
    } catch (error) {
      console.error(`Error testing query "${testQuery.query}":`, error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}
