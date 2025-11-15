import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

export interface ValidationResult {
  feature: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  details: string;
  examples?: any[];
  metrics?: Record<string, any>;
}

export class ThompsonsValidation {
  private results: ValidationResult[] = [];
  private readonly DOMAIN = 'thompsonseparts';
  private readonly JOB_ID = 'crawl_1757494341218_eibkdjk5g';
  private supabase: any;
  private redis: Redis;

  constructor(
    supabaseUrl: string,
    supabaseServiceKey: string,
    redisUrl: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.redis = new Redis(redisUrl);
  }

  async validateAll(): Promise<ValidationResult[]> {
    console.log(`🔍 Starting comprehensive validation for Thompson's E Parts scrape (Job ID: ${this.JOB_ID})`);
    console.log('=' .repeat(80));

    try {
      await Promise.all([
        this.validateMetadataExtraction(),
        this.validateSemanticChunking(),
        this.validateContentProcessing(),
        this.validateDeduplicationSystem(),
        this.validatePerformanceMetrics()
      ]);
    } catch (error) {
      console.error('❌ Validation error:', error);
    } finally {
      await this.redis.quit();
    }

    return this.results;
  }

  private async validateMetadataExtraction(): Promise<void> {
    console.log('\n📊 1. METADATA EXTRACTION VALIDATION');
    console.log('-'.repeat(50));

    try {
      const { data: embeddings, error } = await this.supabase
        .from('page_embeddings')
        .select('url, metadata, chunk_metadata, created_at')
        .ilike('url', `%${this.DOMAIN}%`)
        .order('id', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!embeddings || embeddings.length === 0) {
        this.results.push({
          feature: 'Metadata Extraction',
          status: 'FAIL',
          details: 'No embeddings found for Thompson\'s E Parts domain'
        });
        return;
      }

      const metadataAnalysis = this.analyzeMetadata(embeddings);

      console.log(`✅ Found ${embeddings.length} embedding entries`);
      console.log(`📈 Metadata coverage: ${metadataAnalysis.coverage}%`);

      const examples = embeddings.slice(0, 3).map(e => ({
        url: e.url,
        metadata: e.metadata,
        chunk_metadata: e.chunk_metadata,
        created_at: e.created_at
      }));

      this.results.push({
        feature: 'Metadata Extraction',
        status: metadataAnalysis.coverage > 80 ? 'PASS' : 'PARTIAL',
        details: `Found ${embeddings.length} embeddings with ${metadataAnalysis.coverage}% metadata coverage`,
        examples,
        metrics: metadataAnalysis
      });

    } catch (error: any) {
      this.results.push({
        feature: 'Metadata Extraction',
        status: 'FAIL',
        details: `Error during metadata validation: ${error.message}`
      });
    }
  }

  private analyzeMetadata(embeddings: any[]): any {
    const totalEmbeddings = embeddings.length;
    let hasContentType = 0;
    let hasKeywords = 0;
    let hasEntities = 0;
    let hasSemanticDensity = 0;
    let hasPriceRange = 0;
    let hasContactInfo = 0;
    let hasQaPairs = 0;

    const contentTypes = new Set();
    const avgSemanticDensity: number[] = [];

    for (const embedding of embeddings) {
      if (!embedding.metadata) continue;

      const metadata = typeof embedding.metadata === 'string'
        ? JSON.parse(embedding.metadata)
        : embedding.metadata;

      if (metadata.content_type) {
        hasContentType++;
        contentTypes.add(metadata.content_type);
      }
      if (metadata.keywords?.length > 0) hasKeywords++;
      if (metadata.entities) hasEntities++;
      if (metadata.semantic_density !== undefined) {
        hasSemanticDensity++;
        avgSemanticDensity.push(metadata.semantic_density);
      }
      if (metadata.price_range) hasPriceRange++;
      if (metadata.contact_info) hasContactInfo++;
      if (metadata.qa_pairs?.length > 0) hasQaPairs++;
    }

    return {
      coverage: Math.round((hasContentType / totalEmbeddings) * 100),
      contentTypesCoverage: Math.round((hasContentType / totalEmbeddings) * 100),
      keywordsCoverage: Math.round((hasKeywords / totalEmbeddings) * 100),
      entitiesCoverage: Math.round((hasEntities / totalEmbeddings) * 100),
      semanticDensityCoverage: Math.round((hasSemanticDensity / totalEmbeddings) * 100),
      priceRangeCoverage: Math.round((hasPriceRange / totalEmbeddings) * 100),
      contactInfoCoverage: Math.round((hasContactInfo / totalEmbeddings) * 100),
      qaPairsCoverage: Math.round((hasQaPairs / totalEmbeddings) * 100),
      contentTypesFound: Array.from(contentTypes),
      avgSemanticDensity: avgSemanticDensity.length > 0
        ? avgSemanticDensity.reduce((a, b) => a + b, 0) / avgSemanticDensity.length
        : 0
    };
  }

  private async validateSemanticChunking(): Promise<void> {
    console.log('\n🧩 2. SEMANTIC CHUNKING VALIDATION');
    console.log('-'.repeat(50));

    try {
      const { data: chunks, error } = await this.supabase
        .from('page_embeddings')
        .select('url, chunk_metadata, content, created_at')
        .ilike('url', `%${this.DOMAIN}%`)
        .not('chunk_metadata', 'is', null)
        .order('id', { ascending: false })
        .limit(15);

      if (error) throw error;

      if (!chunks || chunks.length === 0) {
        this.results.push({
          feature: 'Semantic Chunking',
          status: 'FAIL',
          details: 'No chunks with chunk_metadata found'
        });
        return;
      }

      const chunkAnalysis = this.analyzeChunking(chunks);

      console.log(`✅ Found ${chunks.length} chunks with metadata`);
      console.log(`📊 Chunk structure quality: ${chunkAnalysis.structureQuality}%`);

      const examples = chunks.slice(0, 3).map(c => ({
        url: c.url,
        chunk_metadata: c.chunk_metadata,
        content_preview: c.content?.substring(0, 200) + '...',
        created_at: c.created_at
      }));

      this.results.push({
        feature: 'Semantic Chunking',
        status: chunkAnalysis.structureQuality > 70 ? 'PASS' : 'PARTIAL',
        details: `Found ${chunks.length} chunks with ${chunkAnalysis.structureQuality}% structure quality`,
        examples,
        metrics: chunkAnalysis
      });

    } catch (error: any) {
      this.results.push({
        feature: 'Semantic Chunking',
        status: 'FAIL',
        details: `Error during chunking validation: ${error.message}`
      });
    }
  }

  private analyzeChunking(chunks: any[]): any {
    const totalChunks = chunks.length;
    let hasType = 0;
    let hasParentHeading = 0;
    let hasBoundaries = 0;
    let hasOverlapHandling = 0;

    const chunkTypes = new Set();
    const avgContentLength: number[] = [];

    for (const chunk of chunks) {
      if (!chunk.chunk_metadata) continue;

      const chunkMeta = typeof chunk.chunk_metadata === 'string'
        ? JSON.parse(chunk.chunk_metadata)
        : chunk.chunk_metadata;

      if (chunkMeta.type) {
        hasType++;
        chunkTypes.add(chunkMeta.type);
      }
      if (chunkMeta.parent_heading) hasParentHeading++;
      if (chunkMeta.boundaries) hasBoundaries++;
      if (chunkMeta.overlap_handling !== undefined) hasOverlapHandling++;

      if (chunk.content) {
        avgContentLength.push(chunk.content.length);
      }
    }

    return {
      structureQuality: Math.round(((hasType + hasParentHeading + hasBoundaries) / (totalChunks * 3)) * 100),
      typeCoverage: Math.round((hasType / totalChunks) * 100),
      parentHeadingCoverage: Math.round((hasParentHeading / totalChunks) * 100),
      boundariesCoverage: Math.round((hasBoundaries / totalChunks) * 100),
      overlapHandlingCoverage: Math.round((hasOverlapHandling / totalChunks) * 100),
      chunkTypesFound: Array.from(chunkTypes),
      avgContentLength: avgContentLength.length > 0
        ? Math.round(avgContentLength.reduce((a, b) => a + b, 0) / avgContentLength.length)
        : 0
    };
  }

  getResults(): ValidationResult[] {
    return this.results;
  }
}
