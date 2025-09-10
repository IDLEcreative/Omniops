#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Redis configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface ValidationResult {
  feature: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  details: string;
  examples?: any[];
  metrics?: Record<string, any>;
}

class ThompsonsValidation {
  private results: ValidationResult[] = [];
  private readonly DOMAIN = 'thompsonseparts';
  private readonly JOB_ID = 'crawl_1757494341218_eibkdjk5g';

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
      await redis.quit();
    }

    return this.results;
  }

  private async validateMetadataExtraction(): Promise<void> {
    console.log('\n📊 1. METADATA EXTRACTION VALIDATION');
    console.log('-'.repeat(50));

    try {
      // Query recent page_embeddings with metadata
      const { data: embeddings, error } = await supabase
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

      // Analyze metadata quality
      const metadataAnalysis = this.analyzeMetadata(embeddings);
      
      console.log(`✅ Found ${embeddings.length} embedding entries`);
      console.log(`📈 Metadata coverage: ${metadataAnalysis.coverage}%`);
      
      // Show examples
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

    } catch (error) {
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
      // Query chunk metadata
      const { data: chunks, error } = await supabase
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

    } catch (error) {
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

  private async validateContentProcessing(): Promise<void> {
    console.log('\n📄 3. CONTENT PROCESSING VALIDATION');
    console.log('-'.repeat(50));

    try {
      // Query scraped pages
      const { data: pages, error } = await supabase
        .from('scraped_pages')
        .select('url, title, content, scraped_at')
        .ilike('url', `%${this.DOMAIN}%`)
        .order('scraped_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!pages || pages.length === 0) {
        this.results.push({
          feature: 'Content Processing',
          status: 'FAIL',
          details: 'No scraped pages found for Thompson\'s E Parts domain'
        });
        return;
      }

      const contentAnalysis = this.analyzeContentProcessing(pages);
      
      console.log(`✅ Found ${pages.length} scraped pages`);
      console.log(`🧹 Nav/header removal quality: ${contentAnalysis.cleaningQuality}%`);

      const examples = pages.slice(0, 3).map(p => ({
        url: p.url,
        title: p.title,
        content_sample: p.content?.substring(0, 300) + '...',
        content_length: p.content?.length || 0,
        scraped_at: p.scraped_at
      }));

      this.results.push({
        feature: 'Content Processing',
        status: contentAnalysis.cleaningQuality > 75 ? 'PASS' : 'PARTIAL',
        details: `Found ${pages.length} pages with ${contentAnalysis.cleaningQuality}% content cleaning quality`,
        examples,
        metrics: contentAnalysis
      });

    } catch (error) {
      this.results.push({
        feature: 'Content Processing',
        status: 'FAIL',
        details: `Error during content processing validation: ${error.message}`
      });
    }
  }

  private analyzeContentProcessing(pages: any[]): any {
    let cleanPages = 0;
    let hasPriceInfo = 0;
    let hasStructuredContent = 0;
    
    const contentLengths: number[] = [];
    const navigationIndicators = ['menu', 'nav', 'header', 'footer', 'sidebar'];

    for (const page of pages) {
      if (!page.content) continue;
      
      const content = page.content.toLowerCase();
      contentLengths.push(page.content.length);
      
      // Check if navigation elements are removed (fewer nav indicators = better cleaning)
      const navCount = navigationIndicators.reduce((count, indicator) => 
        count + (content.match(new RegExp(indicator, 'g')) || []).length, 0);
      
      if (navCount < 5) cleanPages++; // Arbitrary threshold
      
      // Check for price information in product pages
      if (content.includes('$') || content.includes('price') || content.includes('cost')) {
        hasPriceInfo++;
      }
      
      // Check for structured content
      if (page.title && page.content.length > 100) {
        hasStructuredContent++;
      }
    }

    return {
      cleaningQuality: Math.round((cleanPages / pages.length) * 100),
      priceInfoCoverage: Math.round((hasPriceInfo / pages.length) * 100),
      structuredContentCoverage: Math.round((hasStructuredContent / pages.length) * 100),
      avgContentLength: contentLengths.length > 0 
        ? Math.round(contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length)
        : 0,
      totalPages: pages.length
    };
  }

  private async validateDeduplicationSystem(): Promise<void> {
    console.log('\n🔄 4. DEDUPLICATION SYSTEM VALIDATION');
    console.log('-'.repeat(50));

    try {
      // Check Redis for deduplication stats
      const dedupeKeys = await redis.keys(`dedup:${this.DOMAIN}:*`);
      const cacheKeys = await redis.keys(`embedding_cache:*`);
      
      let uniqueChunks = 0;
      let duplicateChunks = 0;
      
      // Sample some deduplication keys to get stats
      for (let i = 0; i < Math.min(dedupeKeys.length, 10); i++) {
        const key = dedupeKeys[i];
        const value = await redis.get(key);
        if (value === 'processed') {
          uniqueChunks++;
        } else if (value === 'duplicate') {
          duplicateChunks++;
        }
      }

      const dedupeAnalysis = {
        totalDedupeKeys: dedupeKeys.length,
        cacheKeys: cacheKeys.length,
        sampledUnique: uniqueChunks,
        sampledDuplicates: duplicateChunks,
        deduplicationRate: duplicateChunks > 0 
          ? Math.round((duplicateChunks / (uniqueChunks + duplicateChunks)) * 100)
          : 0
      };

      console.log(`📊 Found ${dedupeKeys.length} deduplication keys`);
      console.log(`💾 Found ${cacheKeys.length} embedding cache keys`);
      console.log(`🔍 Deduplication rate: ${dedupeAnalysis.deduplicationRate}%`);

      this.results.push({
        feature: 'Deduplication System',
        status: dedupeKeys.length > 0 ? 'PASS' : 'FAIL',
        details: `Found ${dedupeKeys.length} dedup keys with ${dedupeAnalysis.deduplicationRate}% duplicate rate`,
        metrics: dedupeAnalysis
      });

    } catch (error) {
      this.results.push({
        feature: 'Deduplication System',
        status: 'FAIL',
        details: `Error during deduplication validation: ${error.message}`
      });
    }
  }

  private async validatePerformanceMetrics(): Promise<void> {
    console.log('\n📈 5. PERFORMANCE METRICS VALIDATION');
    console.log('-'.repeat(50));

    try {
      // Get overall processing stats
      const [pagesResult, embeddingsResult] = await Promise.all([
        supabase
          .from('scraped_pages')
          .select('id, scraped_at, url')
          .ilike('url', `%${this.DOMAIN}%`)
          .order('scraped_at', { ascending: false }),
        supabase
          .from('page_embeddings')
          .select('id, created_at, url')
          .ilike('url', `%${this.DOMAIN}%`)
          .order('created_at', { ascending: false })
      ]);

      const pages = pagesResult.data || [];
      const embeddings = embeddingsResult.data || [];

      // Check for recent activity (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentPages = pages.filter(p => p.scraped_at > oneHourAgo);
      const recentEmbeddings = embeddings.filter(e => e.created_at > oneHourAgo);

      // Check job status in Redis
      const jobStatus = await redis.get(`job:${this.JOB_ID}`);
      const jobStats = await redis.hgetall(`job:${this.JOB_ID}:stats`);

      const performanceMetrics = {
        totalPagesScraped: pages.length,
        totalEmbeddings: embeddings.length,
        recentPagesLastHour: recentPages.length,
        recentEmbeddingsLastHour: recentEmbeddings.length,
        embeddingGenerationRate: pages.length > 0 
          ? Math.round((embeddings.length / pages.length) * 100) 
          : 0,
        jobStatus,
        jobStats,
        processingVelocity: recentPages.length // pages per hour
      };

      console.log(`📊 Total pages scraped: ${performanceMetrics.totalPagesScraped}`);
      console.log(`🧠 Total embeddings: ${performanceMetrics.totalEmbeddings}`);
      console.log(`⚡ Embedding generation rate: ${performanceMetrics.embeddingGenerationRate}%`);
      console.log(`🏃 Recent processing velocity: ${performanceMetrics.processingVelocity} pages/hour`);

      this.results.push({
        feature: 'Performance Metrics',
        status: performanceMetrics.totalPagesScraped > 0 ? 'PASS' : 'FAIL',
        details: `Processed ${performanceMetrics.totalPagesScraped} pages with ${performanceMetrics.embeddingGenerationRate}% embedding rate`,
        metrics: performanceMetrics
      });

    } catch (error) {
      this.results.push({
        feature: 'Performance Metrics',
        status: 'FAIL',
        details: `Error during performance validation: ${error.message}`
      });
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 THOMPSON\'S E PARTS SCRAPE VALIDATION SUMMARY');
    console.log('='.repeat(80));

    let passed = 0;
    let partial = 0;
    let failed = 0;

    this.results.forEach(result => {
      const emoji = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
      console.log(`${emoji} ${result.feature}: ${result.status} - ${result.details}`);
      
      if (result.status === 'PASS') passed++;
      else if (result.status === 'PARTIAL') partial++;
      else failed++;
    });

    console.log('\n📊 Overall Status:');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ⚠️ Partial: ${partial}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📋 Total Features: ${this.results.length}`);
    
    const overallScore = ((passed * 2 + partial) / (this.results.length * 2)) * 100;
    console.log(`  🎯 Overall Score: ${Math.round(overallScore)}%`);

    if (overallScore >= 80) {
      console.log('\n🎉 Scrape validation: EXCELLENT');
    } else if (overallScore >= 60) {
      console.log('\n👍 Scrape validation: GOOD');
    } else if (overallScore >= 40) {
      console.log('\n⚠️ Scrape validation: NEEDS IMPROVEMENT');
    } else {
      console.log('\n❌ Scrape validation: CRITICAL ISSUES');
    }
  }
}

async function main() {
  const validator = new ThompsonsValidation();
  
  try {
    await validator.validateAll();
    validator.printSummary();
  } catch (error) {
    console.error('❌ Fatal validation error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default ThompsonsValidation;