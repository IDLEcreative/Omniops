import { CONFIG } from './config';

export function splitIntoChunks(text: string, maxChunkSize: number = CONFIG.CHUNK_SIZE): string[] {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? '. ' : '') + sentence;
    }
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks.filter(Boolean);
}
