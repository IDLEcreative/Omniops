import { createServiceRoleClientSync } from '@/lib/supabase/server';

interface CleanupOptions {
  domain?: string;
  includeJobs?: boolean;
  includeCache?: boolean;
  preserveConfigs?: boolean;
}

interface CleanupResult {
  success: boolean;
  deletedCounts: {
    pages?: number;
    content?: number;
    embeddings?: number;
    extractions?: number;
    jobs?: number;
    cache?: number;
    conversations?: number;
    messages?: number;
  };
  error?: string;
}

export class DatabaseCleaner {
  private supabase: any;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!url || !key) {
      throw new Error('Supabase credentials not provided');
    }
    
    this.supabase = createClient(url, key);
  }

  async cleanAllScrapedData(options: CleanupOptions = {}): Promise<CleanupResult> {
    const {
      domain,
      includeJobs = true,
      includeCache = true,
      preserveConfigs = true
    } = options;

    const result: CleanupResult = {
      success: false,
      deletedCounts: {}
    };

    try {
      // Start transaction-like behavior
      console.log('🧹 Starting database cleanup...');
      
      // Get domain ID if specific domain provided
      let domainId: string | null = null;
      if (domain) {
        const { data: domainData } = await this.supabase
          .from('domains')
          .select('id')
          .eq('domain', domain)
          .single();
        
        if (domainData) {
          domainId = domainData.id;
          console.log(`📍 Found domain: ${domain} (ID: ${domainId})`);
        } else {
          throw new Error(`Domain ${domain} not found`);
        }
      }

      // Delete page embeddings first (references scraped_pages)
      const embeddingsQuery = domainId
        ? this.supabase.from('page_embeddings').delete().eq('domain_id', domainId)
        : this.supabase.from('page_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data: embeddings, error: embError } = await embeddingsQuery.select('id');
      if (embError) throw embError;
      result.deletedCounts.embeddings = embeddings?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.embeddings} embeddings`);

      // Delete structured extractions
      const extractionsQuery = domainId
        ? this.supabase.from('structured_extractions').delete().eq('domain_id', domainId)
        : this.supabase.from('structured_extractions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data: extractions, error: extError } = await extractionsQuery.select('id');
      if (extError) throw extError;
      result.deletedCounts.extractions = extractions?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.extractions} structured extractions`);

      // Delete website content
      const contentQuery = domainId
        ? this.supabase.from('website_content').delete().eq('domain_id', domainId)
        : this.supabase.from('website_content').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data: content, error: contError } = await contentQuery.select('id');
      if (contError) throw contError;
      result.deletedCounts.content = content?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.content} website content entries`);

      // Delete scraped pages
      const pagesQuery = domainId
        ? this.supabase.from('scraped_pages').delete().eq('domain_id', domainId)
        : this.supabase.from('scraped_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data: pages, error: pageError } = await pagesQuery.select('id');
      if (pageError) throw pageError;
      result.deletedCounts.pages = pages?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.pages} scraped pages`);

      // Delete scrape jobs if requested
      if (includeJobs) {
        const jobsQuery = domainId
          ? this.supabase.from('scrape_jobs').delete().eq('domain_id', domainId)
          : this.supabase.from('scrape_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        const { data: jobs, error: jobError } = await jobsQuery.select('id');
        if (jobError) console.warn('Warning: scrape_jobs table might not exist', jobError);
        else {
          result.deletedCounts.jobs = jobs?.length || 0;
          console.log(`✅ Deleted ${result.deletedCounts.jobs} scrape jobs`);
        }
      }

      // Delete query cache if requested
      if (includeCache) {
        const cacheQuery = domainId
          ? this.supabase.from('query_cache').delete().eq('domain', domain)
          : this.supabase.from('query_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        const { data: cache, error: cacheError } = await cacheQuery.select('id');
        if (cacheError) console.warn('Warning: query_cache table might not exist', cacheError);
        else {
          result.deletedCounts.cache = cache?.length || 0;
          console.log(`✅ Deleted ${result.deletedCounts.cache} cached queries`);
        }
      }

      // Delete conversations and messages for this domain
      if (domain) {
        const { data: conversations, error: convError } = await this.supabase
          .from('conversations')
          .delete()
          .eq('domain', domain)
          .select('id');
        
        if (!convError) {
          result.deletedCounts.conversations = conversations?.length || 0;
          console.log(`✅ Deleted ${result.deletedCounts.conversations} conversations`);
        }
      }

      // Update domain last_scraped_at to null
      if (domainId) {
        await this.supabase
          .from('domains')
          .update({ 
            last_scraped_at: null,
            last_content_refresh: null 
          })
          .eq('id', domainId);
        console.log('✅ Reset domain scraping timestamps');
      }

      result.success = true;
      console.log('🎉 Database cleanup completed successfully!');
      
      return result;

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      result.error = error instanceof Error ? error.message : String(error);
      return result;
    }
  }

  async getScrapingStats(domain?: string): Promise<any> {
    try {
      const stats: any = {};

      // Get domain ID if provided
      let domainId: string | null = null;
      if (domain) {
        const { data: domainData } = await this.supabase
          .from('domains')
          .select('id')
          .eq('domain', domain)
          .single();
        domainId = domainData?.id || null;
      }

      // Count scraped pages
      const pagesQuery = domainId
        ? this.supabase.from('scraped_pages').select('id', { count: 'exact' }).eq('domain_id', domainId)
        : this.supabase.from('scraped_pages').select('id', { count: 'exact' });
      const { count: pagesCount } = await pagesQuery;
      stats.scraped_pages = pagesCount || 0;

      // Count website content
      const contentQuery = domainId
        ? this.supabase.from('website_content').select('id', { count: 'exact' }).eq('domain_id', domainId)
        : this.supabase.from('website_content').select('id', { count: 'exact' });
      const { count: contentCount } = await contentQuery;
      stats.website_content = contentCount || 0;

      // Count embeddings
      const embeddingsQuery = domainId
        ? this.supabase.from('page_embeddings').select('id', { count: 'exact' }).eq('domain_id', domainId)
        : this.supabase.from('page_embeddings').select('id', { count: 'exact' });
      const { count: embeddingsCount } = await embeddingsQuery;
      stats.embeddings = embeddingsCount || 0;

      // Count structured extractions
      const extractionsQuery = domainId
        ? this.supabase.from('structured_extractions').select('id', { count: 'exact' }).eq('domain_id', domainId)
        : this.supabase.from('structured_extractions').select('id', { count: 'exact' });
      const { count: extractionsCount } = await extractionsQuery;
      stats.structured_extractions = extractionsCount || 0;

      // Get total size estimate (rough)
      const sizeQuery = domainId
        ? `SELECT 
            pg_size_pretty(SUM(pg_column_size(content))) as content_size,
            pg_size_pretty(SUM(pg_column_size(html))) as html_size
           FROM scraped_pages 
           WHERE domain_id = '${domainId}'`
        : `SELECT 
            pg_size_pretty(SUM(pg_column_size(content))) as content_size,
            pg_size_pretty(SUM(pg_column_size(html))) as html_size
           FROM scraped_pages`;
      
      const { data: sizeData } = await this.supabase.rpc('exec_sql', { query: sizeQuery });
      if (sizeData && sizeData[0]) {
        stats.storage = sizeData[0];
      }

      return stats;

    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }
}

// CLI usage example
if (require.main === module) {
  const cleaner = new DatabaseCleaner();
  
  const args = process.argv.slice(2);
  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const stats = args.includes('--stats');
  
  if (stats) {
    cleaner.getScrapingStats(domain).then(result => {
      console.log('📊 Scraping Statistics:');
      console.log(JSON.stringify(result, null, 2));
    });
  } else {
    cleaner.cleanAllScrapedData({ domain }).then(result => {
      console.log('Cleanup Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    });
  }
}