import crypto from 'node:crypto';

export function generateSampleData(count) {
  const pages = [];
  const embeddings = [];

  for (let i = 0; i < count; i += 1) {
    const pageId = crypto.randomUUID();
    const url = `https://test.example.com/page-${Date.now()}-${i}`;

    pages.push({
      id: pageId,
      url,
      title: `Test Page ${i}`,
      content: `This is test content for page ${i}. `.repeat(50),
      scraped_at: new Date().toISOString(),
      metadata: { test: true, index: i },
    });

    for (let j = 0; j < 3; j += 1) {
      embeddings.push({
        page_id: pageId,
        chunk_text: `Chunk ${j} of page ${i}`,
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        metadata: { chunk_index: j, total_chunks: 3 },
      });
    }
  }

  return { pages, embeddings };
}
