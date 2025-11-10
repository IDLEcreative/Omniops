import type OpenAI from 'openai';
import { CONFIG } from './config';

export async function generateEmbeddingsWithRetry(
  openai: OpenAI,
  chunks: string[],
  retries: number = CONFIG.MAX_RETRIES
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += CONFIG.OPENAI_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CONFIG.OPENAI_BATCH_SIZE);
    let attempt = 0;
    let lastError: unknown;

    while (attempt < retries) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch
        });
        embeddings.push(...response.data.map(item => item.embedding));
        break;
      } catch (error: any) {
        lastError = error;
        attempt++;

        if (error?.status === 429) {
          const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(`  ⏳ Rate limited, waiting ${delay}ms...`);
          await sleep(delay);
        } else if (attempt < retries) {
          console.log(`  ⚠️ Attempt ${attempt} failed, retrying...`);
          await sleep(CONFIG.RETRY_DELAY_MS);
        }
      }
    }

    if (attempt >= retries) {
      throw new Error(`Failed to generate embeddings after ${retries} attempts: ${lastError}`);
    }

    if (i + CONFIG.OPENAI_BATCH_SIZE < chunks.length) {
      await sleep(200);
    }
  }

  return embeddings;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
