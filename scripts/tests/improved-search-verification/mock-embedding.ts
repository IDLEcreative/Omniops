export async function mockGenerateQueryEmbedding(): Promise<number[]> {
  return new Array(1536).fill(0.1);
}
