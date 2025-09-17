import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AuditResult {
  category: string;
  totalPages: number;
  pagesWithChunks: number;
  pagesWithEmbeddings: number;
  chunkingRate: number;
  embeddingRate: number;
  samples: Array<{
    url: string;
    title: string;
    hasChunks: boolean;
    hasEmbeddings: boolean;
    scrapedAt: string;
  }>;
}

interface TimeAnalysis {
  lastSuccessfulEmbedding: string | null;
  lastScrapedPage: string | null;
  processingByDate: Array<{
    date: string;
    scraped: number;
    chunked: number;
    embedded: number;
  }>;
}

async function analyzeCategory(category: string, domainId: string, sampleSize: number = 10): Promise<AuditResult> {
  console.log(`\n🔍 Analyzing category: ${category}`);
  
  // Get sample pages for this category
  const { data: pages, error } = await supabase
    .from('scraped_pages')
    .select('*')
    .eq('domain_id', domainId)
    .ilike('url', `%${category}%`)
    .limit(sampleSize);
    
  if (error || !pages) {
    console.error(`Error fetching pages for ${category}:`, error);
    return {
      category,
      totalPages: 0,
      pagesWithChunks: 0,
      pagesWithEmbeddings: 0,
      chunkingRate: 0,
      embeddingRate: 0,
      samples: []
    };
  }
  
  const samples = [];
  let pagesWithChunks = 0;
  let pagesWithEmbeddings = 0;
  
  for (const page of pages) {
    // Check for chunks
    const { data: chunks } = await supabase
      .from('website_content')
      .select('id')
      .eq('scraped_page_id', page.id)
      .limit(1);
      
    const hasChunks = chunks && chunks.length > 0;
    if (hasChunks) pagesWithChunks++;
    
    // Check for embeddings
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('id')
      .eq('page_id', page.id)
      .limit(1);
      
    const hasEmbeddings = embeddings && embeddings.length > 0;
    if (hasEmbeddings) pagesWithEmbeddings++;
    
    samples.push({
      url: page.url,
      title: page.title || 'No title',
      hasChunks: hasChunks || false,
      hasEmbeddings: hasEmbeddings || false,
      scrapedAt: page.created_at
    });
  }
  
  return {
    category,
    totalPages: pages.length,
    pagesWithChunks,
    pagesWithEmbeddings,
    chunkingRate: pages.length > 0 ? (pagesWithChunks / pages.length) * 100 : 0,
    embeddingRate: pages.length > 0 ? (pagesWithEmbeddings / pages.length) * 100 : 0,
    samples
  };
}

async function analyzeRandomSample(domainId: string, sampleSize: number = 20): Promise<AuditResult> {
  console.log(`\n🎲 Analyzing random sample of ${sampleSize} pages`);
  
  // Get random pages
  const { data: pages, error } = await supabase
    .from('scraped_pages')
    .select('*')
    .eq('domain_id', domainId)
    .limit(sampleSize)
    .order('created_at', { ascending: false });
    
  if (error || !pages) {
    console.error('Error fetching random pages:', error);
    return {
      category: 'Random Sample',
      totalPages: 0,
      pagesWithChunks: 0,
      pagesWithEmbeddings: 0,
      chunkingRate: 0,
      embeddingRate: 0,
      samples: []
    };
  }
  
  const samples = [];
  let pagesWithChunks = 0;
  let pagesWithEmbeddings = 0;
  
  for (const page of pages) {
    const { data: chunks } = await supabase
      .from('website_content')
      .select('id')
      .eq('scraped_page_id', page.id)
      .limit(1);
      
    const hasChunks = chunks && chunks.length > 0;
    if (hasChunks) pagesWithChunks++;
    
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('id')
      .eq('page_id', page.id)
      .limit(1);
      
    const hasEmbeddings = embeddings && embeddings.length > 0;
    if (hasEmbeddings) pagesWithEmbeddings++;
    
    samples.push({
      url: page.url,
      title: page.title || 'No title',
      hasChunks: hasChunks || false,
      hasEmbeddings: hasEmbeddings || false,
      scrapedAt: page.created_at
    });
  }
  
  return {
    category: 'Random Sample',
    totalPages: pages.length,
    pagesWithChunks,
    pagesWithEmbeddings,
    chunkingRate: pages.length > 0 ? (pagesWithChunks / pages.length) * 100 : 0,
    embeddingRate: pages.length > 0 ? (pagesWithEmbeddings / pages.length) * 100 : 0,
    samples
  };
}

async function analyzeTimePatterns(domainId: string): Promise<TimeAnalysis> {
  console.log('\n⏰ Analyzing time patterns...');
  
  // Get pages for this domain first
  const { data: pageIds } = await supabase
    .from('scraped_pages')
    .select('id')
    .eq('domain_id', domainId);
    
  const pageIdList = pageIds?.map(p => p.id) || [];
  
  // Get last successful embedding for this domain's pages
  const { data: lastEmbedding } = await supabase
    .from('page_embeddings')
    .select('created_at')
    .in('page_id', pageIdList)
    .order('created_at', { ascending: false })
    .limit(1);
    
  // Get last scraped page
  const { data: lastPage } = await supabase
    .from('scraped_pages')
    .select('created_at')
    .eq('domain_id', domainId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  // Analyze processing by date (we'll skip this for now if the function doesn't exist)
  let dateStats = [];
  try {
    const { data } = await supabase.rpc('get_processing_stats_by_date', { p_domain_id: domainId });
    dateStats = data || [];
  } catch (error) {
    console.log('  Note: Processing stats function not available');
  }
  
  return {
    lastSuccessfulEmbedding: lastEmbedding?.[0]?.created_at || null,
    lastScrapedPage: lastPage?.[0]?.created_at || null,
    processingByDate: dateStats
  };
}

async function getOverallStats(domainId: string) {
  console.log('\n📊 Getting overall statistics...');
  
  // Total scraped pages
  const { count: totalPages } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domainId);
    
  // Pages with chunks
  const { data: pagesWithChunksData } = await supabase
    .from('website_content')
    .select('scraped_page_id')
    .not('scraped_page_id', 'is', null);
    
  const uniquePagesWithChunks = new Set(pagesWithChunksData?.map(p => p.scraped_page_id) || []);
  
  // Pages with embeddings
  const { data: pagesWithEmbeddingsData } = await supabase
    .from('page_embeddings')
    .select('page_id')
    .not('page_id', 'is', null);
    
  const uniquePagesWithEmbeddings = new Set(pagesWithEmbeddingsData?.map(p => p.page_id) || []);
  
  return {
    totalPages: totalPages || 0,
    pagesWithChunks: uniquePagesWithChunks.size,
    pagesWithEmbeddings: uniquePagesWithEmbeddings.size,
    chunkingRate: totalPages ? (uniquePagesWithChunks.size / totalPages) * 100 : 0,
    embeddingRate: totalPages ? (uniquePagesWithEmbeddings.size / totalPages) * 100 : 0
  };
}

async function checkJobConfiguration(domain: string) {
  console.log('\n⚙️ Checking job configuration...');
  
  // Check recent scrape jobs
  const { data: recentJobs } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('domain', domain)
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (recentJobs && recentJobs.length > 0) {
    console.log('Recent scrape jobs:');
    recentJobs.forEach(job => {
      console.log(`  - Job ${job.id}: Status=${job.status}, Created=${job.created_at}`);
      if (job.config) {
        console.log(`    Config: ${JSON.stringify(job.config, null, 2)}`);
      }
    });
  }
  
  // Check customer config
  const { data: customerConfig } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();
    
  if (customerConfig) {
    console.log('\nCustomer configuration:');
    console.log(`  - Embedding enabled: ${customerConfig.embedding_enabled ?? 'not set'}`);
    console.log(`  - Auto-chunking: ${customerConfig.auto_chunking ?? 'not set'}`);
  }
  
  return { recentJobs, customerConfig };
}

async function main() {
  console.log('🔍 COMPREHENSIVE EMBEDDING AUDIT');
  console.log('================================\n');
  
  // Get the domain configuration
  const DOMAIN = 'thompsonseparts.co.uk';
  const { data: domainConfig } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', DOMAIN)
    .single();
    
  if (!domainConfig) {
    console.error(`❌ Domain ${DOMAIN} not found in customer_configs`);
    process.exit(1);
  }
  
  const domainId = domainConfig.id;
  console.log(`✅ Found domain: ${DOMAIN} with ID: ${domainId}\n`);
  
  // Overall statistics
  const overallStats = await getOverallStats(domainId);
  console.log('📈 OVERALL STATISTICS:');
  console.log(`  Total pages: ${overallStats.totalPages}`);
  console.log(`  Pages with chunks: ${overallStats.pagesWithChunks} (${overallStats.chunkingRate.toFixed(2)}%)`);
  console.log(`  Pages with embeddings: ${overallStats.pagesWithEmbeddings} (${overallStats.embeddingRate.toFixed(2)}%)`);
  
  // Categories to analyze
  const categories = [
    'electrical',
    'hydraulic',
    'teng-tools',
    'tipper',
    'safety',
    'pneumatic',
    'hand-tools',
    'power-tools'
  ];
  
  const categoryResults: AuditResult[] = [];
  
  // Analyze each category
  for (const category of categories) {
    const result = await analyzeCategory(category, domainId, 10);
    categoryResults.push(result);
    
    console.log(`  ✅ Chunking rate: ${result.chunkingRate.toFixed(2)}%`);
    console.log(`  ✅ Embedding rate: ${result.embeddingRate.toFixed(2)}%`);
    
    // Show sample failures
    const failures = result.samples.filter(s => !s.hasChunks || !s.hasEmbeddings);
    if (failures.length > 0) {
      console.log(`  ⚠️ Failed samples:`);
      failures.slice(0, 3).forEach(f => {
        console.log(`    - ${f.url.substring(0, 60)}... [Chunks: ${f.hasChunks}, Embeddings: ${f.hasEmbeddings}]`);
      });
    }
  }
  
  // Random sample analysis
  const randomResult = await analyzeRandomSample(domainId, 30);
  categoryResults.push(randomResult);
  
  // Time pattern analysis
  const timeAnalysis = await analyzeTimePatterns(domainId);
  console.log('\n📅 TIME ANALYSIS:');
  console.log(`  Last successful embedding: ${timeAnalysis.lastSuccessfulEmbedding || 'Never'}`);
  console.log(`  Last scraped page: ${timeAnalysis.lastScrapedPage || 'Never'}`);
  
  // Job configuration check
  await checkJobConfiguration(DOMAIN);
  
  // Summary report
  console.log('\n' + '='.repeat(80));
  console.log('📋 AUDIT SUMMARY REPORT');
  console.log('='.repeat(80));
  
  console.log('\n🔴 CRITICAL FINDINGS:');
  const criticalCategories = categoryResults.filter(r => r.embeddingRate < 50);
  if (criticalCategories.length > 0) {
    console.log(`  ⚠️ ${criticalCategories.length} categories have <50% embedding rate:`);
    criticalCategories.forEach(c => {
      console.log(`    - ${c.category}: ${c.embeddingRate.toFixed(2)}% embedded`);
    });
  }
  
  console.log('\n📊 CATEGORY BREAKDOWN:');
  console.log('  Category          | Pages | Chunks % | Embeddings %');
  console.log('  -----------------|-------|----------|-------------');
  categoryResults.forEach(r => {
    const categoryName = r.category.padEnd(16);
    const pages = r.totalPages.toString().padEnd(5);
    const chunks = `${r.chunkingRate.toFixed(1)}%`.padEnd(8);
    const embeddings = `${r.embeddingRate.toFixed(1)}%`;
    console.log(`  ${categoryName} | ${pages} | ${chunks} | ${embeddings}`);
  });
  
  // Problem scope assessment
  const avgEmbeddingRate = categoryResults.reduce((sum, r) => sum + r.embeddingRate, 0) / categoryResults.length;
  console.log('\n🎯 PROBLEM SCOPE:');
  console.log(`  Average embedding rate: ${avgEmbeddingRate.toFixed(2)}%`);
  
  if (avgEmbeddingRate < 10) {
    console.log('  ❌ CRITICAL: System-wide embedding failure detected!');
    console.log('  → The embedding pipeline appears to be completely broken');
  } else if (avgEmbeddingRate < 50) {
    console.log('  ⚠️ SEVERE: Majority of pages lack embeddings');
    console.log('  → Partial system failure, immediate attention required');
  } else if (avgEmbeddingRate < 90) {
    console.log('  ⚠️ WARNING: Significant gaps in embedding coverage');
    console.log('  → System partially functional but needs investigation');
  } else {
    console.log('  ✅ System appears to be functioning normally');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('  1. Check if embedding generation is enabled in configuration');
  console.log('  2. Review scraping job logs for post-processing errors');
  console.log('  3. Verify OpenAI API key is valid and has sufficient credits');
  console.log('  4. Check Redis queue for stuck embedding jobs');
  console.log('  5. Consider running manual embedding generation for missing pages');
  
  process.exit(0);
}

// Run the audit
main().catch(console.error);