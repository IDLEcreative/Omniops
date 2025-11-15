import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { ValidationResult } from './core';

export async function validateContentProcessing(
  supabase: any,
  domain: string
): Promise<ValidationResult> {
  console.log('\n📄 3. CONTENT PROCESSING VALIDATION');
  console.log('-'.repeat(50));

  try {
    const { data: pages, error } = await supabase
      .from('scraped_pages')
      .select('url, title, content, scraped_at')
      .ilike('url', `%${domain}%`)
      .order('scraped_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!pages || pages.length === 0) {
      return {
        feature: 'Content Processing',
        status: 'FAIL',
        details: 'No scraped pages found for Thompson\'s E Parts domain'
      };
    }

    const contentAnalysis = analyzeContentProcessing(pages);

    console.log(`✅ Found ${pages.length} scraped pages`);
    console.log(`🧹 Nav/header removal quality: ${contentAnalysis.cleaningQuality}%`);

    const examples = pages.slice(0, 3).map(p => ({
      url: p.url,
      title: p.title,
      content_sample: p.content?.substring(0, 300) + '...',
      content_length: p.content?.length || 0,
      scraped_at: p.scraped_at
    }));

    return {
      feature: 'Content Processing',
      status: contentAnalysis.cleaningQuality > 75 ? 'PASS' : 'PARTIAL',
      details: `Found ${pages.length} pages with ${contentAnalysis.cleaningQuality}% content cleaning quality`,
      examples,
      metrics: contentAnalysis
    };

  } catch (error: any) {
    return {
      feature: 'Content Processing',
      status: 'FAIL',
      details: `Error during content processing validation: ${error.message}`
    };
  }
}

function analyzeContentProcessing(pages: any[]): any {
  let cleanPages = 0;
  let hasPriceInfo = 0;
  let hasStructuredContent = 0;

  const contentLengths: number[] = [];
  const navigationIndicators = ['menu', 'nav', 'header', 'footer', 'sidebar'];

  for (const page of pages) {
    if (!page.content) continue;

    const content = page.content.toLowerCase();
    contentLengths.push(page.content.length);

    const navCount = navigationIndicators.reduce((count, indicator) =>
      count + (content.match(new RegExp(indicator, 'g')) || []).length, 0);

    if (navCount < 5) cleanPages++;

    if (content.includes('$') || content.includes('price') || content.includes('cost')) {
      hasPriceInfo++;
    }

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

export async function validateDeduplicationSystem(
  redis: Redis,
  domain: string
): Promise<ValidationResult> {
  console.log('\n🔄 4. DEDUPLICATION SYSTEM VALIDATION');
  console.log('-'.repeat(50));

  try {
    const dedupeKeys = await redis.keys(`dedup:${domain}:*`);
    const cacheKeys = await redis.keys(`embedding_cache:*`);

    let uniqueChunks = 0;
    let duplicateChunks = 0;

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

    return {
      feature: 'Deduplication System',
      status: dedupeKeys.length > 0 ? 'PASS' : 'FAIL',
      details: `Found ${dedupeKeys.length} dedup keys with ${dedupeAnalysis.deduplicationRate}% duplicate rate`,
      metrics: dedupeAnalysis
    };

  } catch (error: any) {
    return {
      feature: 'Deduplication System',
      status: 'FAIL',
      details: `Error during deduplication validation: ${error.message}`
    };
  }
}

export async function validatePerformanceMetrics(
  supabase: any,
  redis: Redis,
  domain: string,
  jobId: string
): Promise<ValidationResult> {
  console.log('\n📈 5. PERFORMANCE METRICS VALIDATION');
  console.log('-'.repeat(50));

  try {
    const [pagesResult, embeddingsResult] = await Promise.all([
      supabase
        .from('scraped_pages')
        .select('id, scraped_at, url')
        .ilike('url', `%${domain}%`)
        .order('scraped_at', { ascending: false }),
      supabase
        .from('page_embeddings')
        .select('id, created_at, url')
        .ilike('url', `%${domain}%`)
        .order('created_at', { ascending: false })
    ]);

    const pages = pagesResult.data || [];
    const embeddings = embeddingsResult.data || [];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentPages = pages.filter(p => p.scraped_at > oneHourAgo);
    const recentEmbeddings = embeddings.filter(e => e.created_at > oneHourAgo);

    const jobStatus = await redis.get(`job:${jobId}`);
    const jobStats = await redis.hgetall(`job:${jobId}:stats`);

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
      processingVelocity: recentPages.length
    };

    console.log(`📊 Total pages scraped: ${performanceMetrics.totalPagesScraped}`);
    console.log(`🧠 Total embeddings: ${performanceMetrics.totalEmbeddings}`);
    console.log(`⚡ Embedding generation rate: ${performanceMetrics.embeddingGenerationRate}%`);
    console.log(`🏃 Recent processing velocity: ${performanceMetrics.processingVelocity} pages/hour`);

    return {
      feature: 'Performance Metrics',
      status: performanceMetrics.totalPagesScraped > 0 ? 'PASS' : 'FAIL',
      details: `Processed ${performanceMetrics.totalPagesScraped} pages with ${performanceMetrics.embeddingGenerationRate}% embedding rate`,
      metrics: performanceMetrics
    };

  } catch (error: any) {
    return {
      feature: 'Performance Metrics',
      status: 'FAIL',
      details: `Error during performance validation: ${error.message}`
    };
  }
}
