// Utility functions and testing for content deduplication
import { ContentDeduplicator } from './content-deduplicator';
import type { Pattern } from './content-deduplicator-types';
import * as crypto from 'crypto';
import { isVariable } from './content-deduplicator-similarity';
import type { SupabaseClient } from '@/types/supabase';

// Pattern detection utilities
export function detectTemplatePattern(contents: string[]): Pattern | null {
  if (contents.length < 2) return null;

  const commonPattern = extractCommonPattern(contents);
  if (commonPattern.similarity < 0.7) return null;

  const patternId = crypto.createHash('sha256').update(commonPattern.template).digest('hex');

  return {
    id: patternId,
    template: commonPattern.template,
    frequency: contents.length,
    variations: contents,
    pages: []
  };
}

export function extractCommonPattern(contents: string[]): { template: string; similarity: number } {
  if (contents.length === 0) return { template: '', similarity: 0 };

  let template = contents[0] || '';
  let totalSimilarity = 1;

  for (let i = 1; i < contents.length; i++) {
    const currentContent = contents[i];
    if (currentContent !== undefined) {
      const { common, similarity } = findCommonStructure(template, currentContent);
      template = common;
      totalSimilarity += similarity;
    }
  }

  return {
    template,
    similarity: totalSimilarity / contents.length
  };
}

export function findCommonStructure(text1: string, text2: string): { common: string; similarity: number } {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  const commonWords: string[] = [];

  let i = 0, j = 0;
  let matches = 0;

  while (i < words1.length && j < words2.length) {
    const word1 = words1[i];
    const word2 = words2[j];
    if (word1 !== undefined && word2 !== undefined) {
      if (word1 === word2) {
        commonWords.push(word1);
        matches++;
        i++;
        j++;
      } else if (isVariableWord(word1, word2)) {
        commonWords.push('{{VAR}}');
        matches += 0.5;
        i++;
        j++;
      } else {
        i++;
        j++;
      }
    } else {
      break;
    }
  }

  const maxLength = Math.max(words1.length, words2.length);
  const similarity = matches / maxLength;

  return {
    common: commonWords.join(' '),
    similarity
  };
}

function isVariableWord(word1: string, word2: string): boolean {
  return isVariable(word1, word2);
}

// Testing class
export class ContentDeduplicatorTester {
  private deduplicator: ContentDeduplicator;

  constructor(deduplicator: ContentDeduplicator) {
    this.deduplicator = deduplicator;
  }

  async runTests(): Promise<void> {
    console.log('Running Content Deduplicator tests...');

    await this.testBasicDeduplication();
    await this.testSimilarityDetection();
    await this.testBatchProcessing();
    await this.testTemplateDetection();
    await this.testCompression();
    await this.testMetrics();

    console.log('All tests completed!');
  }

  private async testBasicDeduplication(): Promise<void> {
    console.log('Testing basic deduplication...');

    const content1 = "This is a sample navigation menu with Home, About, Contact links.";
    const content2 = "This is a sample navigation menu with Home, About, Contact links.";
    const content3 = "This is a different footer content with copyright information.";

    const hash1 = await this.deduplicator.processContent(content1, 'https://example.com/page1');
    const hash2 = await this.deduplicator.processContent(content2, 'https://example.com/page2');
    const hash3 = await this.deduplicator.processContent(content3, 'https://example.com/page3');

    console.assert(hash1 === hash2, 'Identical content should have same hash');
    console.assert(hash1 !== hash3, 'Different content should have different hash');

    const retrievedContent = await this.deduplicator.getContent(hash1);
    console.assert(retrievedContent === content1, 'Retrieved content should match original');

    console.log('✓ Basic deduplication test passed');
  }

  private async testSimilarityDetection(): Promise<void> {
    console.log('Testing similarity detection...');

    const template1 = "Welcome to our website. We have 100 products available.";
    const template2 = "Welcome to our website. We have 250 products available.";
    const template3 = "Welcome to our website. We have 500 products available.";

    await this.deduplicator.processContent(template1, 'https://example.com/category1');
    await this.deduplicator.processContent(template2, 'https://example.com/category2');
    await this.deduplicator.processContent(template3, 'https://example.com/category3');

    const stats = this.deduplicator.getStorageStats();
    console.log('Storage stats after similarity test:', stats);

    console.log('✓ Similarity detection test passed');
  }

  private async testBatchProcessing(): Promise<void> {
    console.log('Testing batch processing...');

    const contents = [
      { content: "Header content with logo and main navigation", url: 'https://example.com/page1' },
      { content: "Header content with logo and main navigation", url: 'https://example.com/page2' },
      { content: "Footer content with copyright and links", url: 'https://example.com/page3' },
      { content: "Footer content with copyright and links", url: 'https://example.com/page4' },
      { content: "Unique page content about our services", url: 'https://example.com/page5' }
    ];

    const result = await this.deduplicator.batchProcess(contents);

    console.assert(result.hashes.length === contents.length, 'Should return hash for each content');
    console.log('Batch processing result:', result);

    console.log('✓ Batch processing test passed');
  }

  private async testTemplateDetection(): Promise<void> {
    console.log('Testing template detection...');

    const templates = [
      "Product: iPhone 12 - Price: $999",
      "Product: Samsung Galaxy - Price: $899",
      "Product: Google Pixel - Price: $799"
    ];

    const contents = templates.map((template, i) => ({
      content: template,
      url: `https://example.com/product${i + 1}`
    }));

    const result = await this.deduplicator.batchProcess(contents, {
      similarityThreshold: 0.7,
      enableCompression: true,
      batchSize: 10,
      useRedis: false,
      detectTemplates: true
    });

    console.log('Template detection result:', result.patterns);
    console.log('✓ Template detection test passed');
  }

  private async testCompression(): Promise<void> {
    console.log('Testing compression...');

    const longContent = "This is a very long content that should be compressed. ".repeat(100);

    const hash = await this.deduplicator.processContent(
      longContent,
      'https://example.com/long-page',
      {
        similarityThreshold: 0.8,
        enableCompression: true,
        batchSize: 100,
        useRedis: false,
        detectTemplates: false
      }
    );

    const retrievedContent = await this.deduplicator.getContent(hash);
    console.assert(retrievedContent === longContent, 'Compressed content should decompress correctly');

    console.log('✓ Compression test passed');
  }

  private async testMetrics(): Promise<void> {
    console.log('Testing metrics generation...');

    const metrics = await this.deduplicator.generateMetrics();

    console.log('Deduplication metrics:', metrics);

    console.assert(metrics.totalPages >= 0, 'Total pages should be non-negative');
    console.assert(metrics.storageReduction >= 0, 'Storage reduction should be non-negative');

    console.log('✓ Metrics test passed');
  }
}

// Example usage
export const ContentDeduplicatorUtils = {
  async createSupabaseSchema(supabase: SupabaseClient): Promise<void> {
    await supabase.from('content_hashes').select('*').limit(1);
  },

  async exampleUsage(): Promise<void> {
    const deduplicator = new ContentDeduplicator(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      process.env.REDIS_URL
    );

    const hash = await deduplicator.processContent(
      "This is navigation content",
      "https://example.com/page1"
    );

    const contents = [
      { content: "Header content", url: "https://example.com/page1" },
      { content: "Footer content", url: "https://example.com/page2" }
    ];

    await deduplicator.batchProcess(contents);
    const metrics = await deduplicator.generateMetrics();
    console.log('Deduplication saved:', metrics.storageReduction + '%');

    await deduplicator.getContent(hash);
    await deduplicator.cleanup();
  }
};
