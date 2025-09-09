import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API endpoint to monitor metadata quality for embeddings
 * GET /api/metadata-quality?domain=example.com
 */

const querySchema = z.object({
  domain: z.string().optional(),
});

interface MetadataStats {
  totalEmbeddings: number;
  withEnhancedMetadata: number;
  contentTypeDistribution: Record<string, number>;
  avgKeywordsPerChunk: number;
  avgReadabilityScore: number;
  coveragePercentage: number;
  topKeywords: string[];
  commonEntities: {
    skus: string[];
    brands: string[];
    products: string[];
  };
  priceRanges?: {
    min: number;
    max: number;
    avg: number;
    currency: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      domain: searchParams.get('domain') || undefined,
    });

    // Create Supabase client
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get domain ID if domain is specified
    let domainId: string | null = null;
    if (params.domain) {
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', params.domain.replace('www.', ''))
        .single();

      if (domainError || !domainData) {
        return NextResponse.json(
          { error: `Domain not found: ${params.domain}` },
          { status: 404 }
        );
      }
      domainId = domainData.id;
    }

    // Get metadata statistics from database function
    const { data: statsData, error: statsError } = await supabase.rpc('get_metadata_stats', {
      p_domain_id: domainId
    });

    if (statsError) {
      console.error('Error fetching metadata stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch metadata statistics' },
        { status: 500 }
      );
    }

    // Get additional detailed statistics
    let query = supabase
      .from('page_embeddings')
      .select('metadata');

    if (domainId) {
      // Join with scraped_pages to filter by domain
      query = supabase
        .from('page_embeddings')
        .select('metadata, scraped_pages!inner(domain_id)')
        .eq('scraped_pages.domain_id', domainId);
    }

    const { data: embeddings, error: embeddingsError } = await query;

    if (embeddingsError) {
      console.error('Error fetching embeddings:', embeddingsError);
      return NextResponse.json(
        { error: 'Failed to fetch embedding details' },
        { status: 500 }
      );
    }

    // Process detailed statistics
    const keywordFrequency = new Map<string, number>();
    const skuSet = new Set<string>();
    const brandSet = new Set<string>();
    const productSet = new Set<string>();
    const prices: number[] = [];
    let currencies = new Set<string>();

    embeddings?.forEach(embedding => {
      const metadata = embedding.metadata;
      if (!metadata) return;

      // Collect keywords
      if (metadata.keywords && Array.isArray(metadata.keywords)) {
        metadata.keywords.forEach((keyword: string) => {
          keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
        });
      }

      // Collect entities
      if (metadata.entities) {
        if (metadata.entities.skus) {
          metadata.entities.skus.forEach((sku: string) => skuSet.add(sku));
        }
        if (metadata.entities.brands) {
          metadata.entities.brands.forEach((brand: string) => brandSet.add(brand));
        }
        if (metadata.entities.products) {
          metadata.entities.products.forEach((product: string) => productSet.add(product));
        }
      }

      // Collect price data
      if (metadata.price_range) {
        if (metadata.price_range.min) prices.push(metadata.price_range.min);
        if (metadata.price_range.max) prices.push(metadata.price_range.max);
        if (metadata.price_range.currency) currencies.add(metadata.price_range.currency);
      }
    });

    // Get top keywords
    const topKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);

    // Calculate price statistics
    let priceRanges;
    if (prices.length > 0) {
      priceRanges = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        currency: Array.from(currencies)[0] || 'USD'
      };
    }

    // Prepare response
    const stats = statsData && statsData.length > 0 ? statsData[0] : {};
    
    const response: MetadataStats = {
      totalEmbeddings: stats.total_embeddings || 0,
      withEnhancedMetadata: stats.with_enhanced_metadata || 0,
      contentTypeDistribution: stats.content_type_distribution || {},
      avgKeywordsPerChunk: parseFloat(stats.avg_keywords_per_chunk || 0),
      avgReadabilityScore: parseFloat(stats.avg_readability_score || 0),
      coveragePercentage: parseFloat(stats.coverage_percentage || 0),
      topKeywords,
      commonEntities: {
        skus: Array.from(skuSet).slice(0, 10),
        brands: Array.from(brandSet).slice(0, 10),
        products: Array.from(productSet).slice(0, 10)
      },
      priceRanges
    };

    // Add recommendations
    const recommendations = [];
    
    if (response.coveragePercentage < 50) {
      recommendations.push({
        type: 'coverage',
        message: 'Less than 50% of embeddings have enhanced metadata. Run migration script to improve search quality.',
        action: 'npx tsx scripts/migrate-embeddings.ts'
      });
    }

    if (response.avgKeywordsPerChunk < 5) {
      recommendations.push({
        type: 'keywords',
        message: 'Average keywords per chunk is low. This may impact search relevance.',
        action: 'Review content extraction to ensure meaningful keywords are captured.'
      });
    }

    const contentTypes = Object.keys(response.contentTypeDistribution);
    if (contentTypes.length === 1 && contentTypes[0] === 'general') {
      recommendations.push({
        type: 'classification',
        message: 'All content classified as "general". Content type classification may need improvement.',
        action: 'Review MetadataExtractor.classifyContent() logic for your domain.'
      });
    }

    return NextResponse.json({
      domain: params.domain || 'all',
      stats: response,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metadata quality endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}