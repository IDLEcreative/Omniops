// Content processing strategies and helper methods
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import { LZString } from './content-deduplicator-compression';
import { MinHash, LRUCache } from './content-deduplicator-similarity';
import type { ContentHash, SimilarityResult } from './content-deduplicator-types';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export function generateHash(content: string): string {
  const normalizedContent = normalizeContent(content);
  return crypto.createHash('sha256').update(normalizedContent).digest('hex');
}

export function normalizeContent(content: string): string {
  return content.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
}

export function detectContentType(content: string, url: string): ContentHash['type'] {
  const normalized = content.toLowerCase();

  if (normalized.includes('navigation') || normalized.includes('menu') ||
    normalized.includes('nav-') || normalized.includes('navbar')) {
    return 'navigation';
  }

  if (normalized.includes('footer') || normalized.includes('copyright') ||
    normalized.includes('contact us') || normalized.includes('privacy')) {
    return 'footer';
  }

  if (normalized.includes('sidebar') || normalized.includes('aside') ||
    normalized.includes('widget')) {
    return 'sidebar';
  }

  if (normalized.includes('header') || normalized.includes('logo') ||
    normalized.includes('banner')) {
    return 'header';
  }

  return 'unique';
}

export async function compressContent(content: string): Promise<{ compressed: string; ratio: number }> {
  const originalSize = Buffer.byteLength(content, 'utf8');
  const lzCompressed = LZString.compressToBase64(content);
  const lzSize = Buffer.byteLength(lzCompressed, 'utf8');
  const gzipBuffer = await gzip(content);
  const gzipSize = gzipBuffer.length;

  if (lzSize < gzipSize) {
    return { compressed: 'lz:' + lzCompressed, ratio: originalSize / lzSize };
  } else {
    return { compressed: 'gz:' + gzipBuffer.toString('base64'), ratio: originalSize / gzipSize };
  }
}

export async function decompressContent(compressed: string): Promise<string> {
  if (compressed.startsWith('lz:')) {
    return LZString.decompressFromBase64(compressed.substring(3)) || '';
  } else if (compressed.startsWith('gz:')) {
    const buffer = Buffer.from(compressed.substring(3), 'base64');
    const decompressed = await gunzip(buffer);
    return decompressed.toString('utf8');
  }
  return compressed;
}

export async function findSimilarContent(
  content: string,
  minHashCache: LRUCache<string, MinHash>,
  threshold: number = 0.8
): Promise<SimilarityResult[]> {
  const contentHash = generateHash(content);
  let minHash = minHashCache.get(contentHash);

  if (!minHash) {
    minHash = new MinHash();
    minHash.update(content);
    minHashCache.set(contentHash, minHash);
  }

  const results: SimilarityResult[] = [];

  for (const [hash, cachedMinHash] of minHashCache.entries()) {
    if (hash === contentHash) continue;

    const similarity = minHash.jaccardSimilarity(cachedMinHash);
    if (similarity >= threshold) {
      let type: SimilarityResult['type'] = 'near-duplicate';
      if (similarity === 1.0) type = 'exact';
      else if (similarity > 0.9) type = 'template-variation';

      results.push({ hash, similarity, type });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

export async function performMemoryCleanup(
  storage: {
    commonElements: Map<string, ContentHash>;
    uniqueContent: Map<string, string>;
    references: Map<string, string[]>;
  },
  processedPages: number,
  MAX_COMMON_ELEMENTS: number
): Promise<void> {

  if (storage.commonElements.size > MAX_COMMON_ELEMENTS) {
    const elementsToKeep = new Map<string, ContentHash>();
    const sortedElements = Array.from(storage.commonElements.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, Math.floor(MAX_COMMON_ELEMENTS * 0.8));

    for (const [hash, content] of sortedElements) {
      elementsToKeep.set(hash, content);
    }

    storage.commonElements = elementsToKeep;
  }

  if (storage.uniqueContent.size > 1000) {
    const keysToDelete: string[] = [];
    let count = 0;
    for (const key of storage.uniqueContent.keys()) {
      if (count++ > 800) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      storage.uniqueContent.delete(key);
    }
  }

  const validHashes = new Set(storage.commonElements.keys());
  for (const [url, hashes] of storage.references.entries()) {
    const validRefs = hashes.filter(h => validHashes.has(h));
    if (validRefs.length !== hashes.length) {
      storage.references.set(url, validRefs);
    }
    if (validRefs.length === 0) {
      storage.references.delete(url);
    }
  }

  if (global.gc) {
    global.gc();
  }
}
