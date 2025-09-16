/**
 * Investigation Script: DC66-10P Relay Control Products
 * 
 * This script performs a comprehensive forensic analysis to determine:
 * 1. Whether DC66-10P products exist in the database
 * 2. How they are indexed and stored
 * 3. Why they may not be appearing in search results
 * 4. The complete data pipeline from scraping to search
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Known DC66-10P products from requirements
const EXPECTED_PRODUCTS = [
  {
    sku: 'DC66-10P-24-V2',
    name: '24V Relay For Relay Control Assembly V2',
    price: '£65.00',
    type: 'RELAY CONTROL'
  },
  {
    sku: 'DC66-10Pxxx',
    name: '24V Genuine Albright Relay',
    price: '£54.98 – £243.25',
    type: 'RELAY CONTROL'
  },
  {
    sku: 'DC66-10P/2-5700-IG2P10DD25A',
    name: 'Allbright Solenoid & V2 NEW Relay Box',
    price: '£95.00',
    type: 'RELAY CONTROL'
  },
  {
    sku: 'DC66-10P-12v',
    name: '12V ONLY Allbright Relay',
    price: '£70.00',
    type: 'RELAY CONTROL'
  }
];

interface InvestigationResult {
  timestamp: string;
  phase: string;
  findings: any;
  issues?: string[];
  recommendations?: string[];
}

const results: InvestigationResult[] = [];

async function logFindings(phase: string, findings: any, issues?: string[], recommendations?: string[]) {
  const result: InvestigationResult = {
    timestamp: new Date().toISOString(),
    phase,
    findings,
    issues,
    recommendations
  };
  results.push(result);
  
  console.log('\n' + '='.repeat(80));
  console.log(`PHASE: ${phase}`);
  console.log('='.repeat(80));
  console.log('Findings:', JSON.stringify(findings, null, 2));
  if (issues?.length) {
    console.log('\n⚠️  Issues Detected:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  if (recommendations?.length) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}

// PHASE 1: Check scraped_pages table for DC66-10P content
async function investigateScrapedPages() {
  console.log('\n🔍 PHASE 1: Investigating scraped_pages table...');
  
  const queries = [
    // Direct SKU search
    `SELECT id, url, title, content, scraped_at, domain_id 
     FROM scraped_pages 
     WHERE content ILIKE '%DC66-10P%' 
     LIMIT 20`,
    
    // Search for relay control products
    `SELECT id, url, title, content, scraped_at, domain_id 
     FROM scraped_pages 
     WHERE (content ILIKE '%relay control%' OR title ILIKE '%relay%')
     AND content ILIKE '%DC66%'
     LIMIT 20`,
    
    // Search for Albright/Allbright products
    `SELECT id, url, title, content, scraped_at, domain_id 
     FROM scraped_pages 
     WHERE (content ILIKE '%albright%' OR content ILIKE '%allbright%')
     AND (content ILIKE '%relay%' OR content ILIKE '%solenoid%')
     LIMIT 20`
  ];
  
  const findings: any = {
    direct_sku_matches: [],
    relay_control_matches: [],
    albright_matches: [],
    domains_checked: new Set()
  };
  
  for (let i = 0; i < queries.length; i++) {
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: queries[i] 
    }).single();
    
    if (error) {
      console.error(`Query ${i + 1} error:`, error);
      continue;
    }
    
    const key = i === 0 ? 'direct_sku_matches' : 
                i === 1 ? 'relay_control_matches' : 
                'albright_matches';
    
    if (data?.rows) {
      findings[key] = data.rows.map((row: any) => ({
        id: row.id,
        url: row.url,
        title: row.title,
        domain_id: row.domain_id,
        scraped_at: row.scraped_at,
        content_snippet: row.content?.substring(0, 500)
      }));
      
      data.rows.forEach((row: any) => findings.domains_checked.add(row.domain_id));
    }
  }
  
  findings.domains_checked = Array.from(findings.domains_checked);
  
  const issues = [];
  if (findings.direct_sku_matches.length === 0) {
    issues.push('No direct SKU matches found for DC66-10P products');
  }
  if (findings.relay_control_matches.length === 0) {
    issues.push('No relay control products found with DC66 prefix');
  }
  
  await logFindings('Scraped Pages Investigation', findings, issues);
  return findings;
}

// PHASE 2: Check structured_extractions for products
async function investigateStructuredExtractions() {
  console.log('\n🔍 PHASE 2: Investigating structured_extractions table...');
  
  const { data, error } = await supabase
    .from('structured_extractions')
    .select('*')
    .eq('extraction_type', 'products')
    .or('content.ilike.%DC66-10P%,content.ilike.%relay control%,content.ilike.%albright%')
    .limit(50);
  
  const findings: any = {
    total_products: 0,
    dc66_products: [],
    relay_products: [],
    extraction_patterns: new Set()
  };
  
  if (data) {
    findings.total_products = data.length;
    
    data.forEach(item => {
      const content = typeof item.content === 'string' ? 
        JSON.parse(item.content) : item.content;
      
      // Check if this is a DC66-10P product
      const isDC66 = JSON.stringify(content).includes('DC66-10P');
      const isRelay = JSON.stringify(content).toLowerCase().includes('relay');
      
      if (isDC66) {
        findings.dc66_products.push({
          id: item.id,
          domain_id: item.domain_id,
          content,
          extracted_at: item.created_at
        });
      }
      
      if (isRelay) {
        findings.relay_products.push({
          id: item.id,
          domain_id: item.domain_id,
          content,
          extracted_at: item.created_at
        });
      }
      
      // Track extraction patterns
      if (content.products && Array.isArray(content.products)) {
        findings.extraction_patterns.add('array_format');
      } else if (content.name && content.sku) {
        findings.extraction_patterns.add('single_product');
      } else {
        findings.extraction_patterns.add('unknown_format');
      }
    });
  }
  
  findings.extraction_patterns = Array.from(findings.extraction_patterns);
  
  const issues = [];
  if (findings.dc66_products.length === 0) {
    issues.push('No DC66-10P products found in structured extractions');
  }
  
  const recommendations = [];
  if (findings.extraction_patterns.includes('unknown_format')) {
    recommendations.push('Standardize product extraction format');
  }
  
  await logFindings('Structured Extractions Investigation', findings, issues, recommendations);
  return findings;
}

// PHASE 3: Check page_embeddings for DC66-10P content
async function investigateEmbeddings() {
  console.log('\n🔍 PHASE 3: Investigating page_embeddings table...');
  
  // First, get sample embeddings for DC66-10P content
  const testQueries = [
    'DC66-10P relay control',
    '24V relay control assembly',
    'Albright relay solenoid'
  ];
  
  const findings: any = {
    embedding_coverage: {},
    similarity_scores: [],
    indexed_domains: new Set()
  };
  
  for (const query of testQueries) {
    console.log(`\n  Testing query: "${query}"`);
    
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search for similar embeddings
    const { data, error } = await supabase.rpc('match_page_sections', {
      embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 10
    });
    
    if (data) {
      findings.similarity_scores.push({
        query,
        results: data.map((r: any) => ({
          content_snippet: r.content?.substring(0, 200),
          similarity: r.similarity,
          page_id: r.page_id,
          domain_id: r.domain_id
        }))
      });
      
      data.forEach((r: any) => findings.indexed_domains.add(r.domain_id));
    }
  }
  
  // Check embedding coverage
  const { data: embeddingStats } = await supabase
    .from('page_embeddings')
    .select('domain_id, page_id')
    .limit(1000);
  
  if (embeddingStats) {
    const domainCounts = embeddingStats.reduce((acc: any, curr: any) => {
      acc[curr.domain_id] = (acc[curr.domain_id] || 0) + 1;
      return acc;
    }, {});
    
    findings.embedding_coverage = domainCounts;
  }
  
  findings.indexed_domains = Array.from(findings.indexed_domains);
  
  const issues = [];
  const hasRelevantResults = findings.similarity_scores.some((score: any) => 
    score.results.some((r: any) => r.similarity > 0.7)
  );
  
  if (!hasRelevantResults) {
    issues.push('No high-similarity embeddings found for DC66-10P queries');
  }
  
  await logFindings('Embeddings Investigation', findings, issues);
  return findings;
}

// PHASE 4: Check WooCommerce products
async function investigateWooCommerceProducts() {
  console.log('\n🔍 PHASE 4: Investigating WooCommerce products...');
  
  const findings: any = {
    woo_products: [],
    sync_status: {},
    credential_check: {}
  };
  
  // Check for WooCommerce product data in structured_extractions
  const { data: wooData } = await supabase
    .from('structured_extractions')
    .select('*')
    .eq('extraction_type', 'woocommerce_products')
    .limit(100);
  
  if (wooData) {
    wooData.forEach(item => {
      const content = typeof item.content === 'string' ? 
        JSON.parse(item.content) : item.content;
      
      if (JSON.stringify(content).includes('DC66')) {
        findings.woo_products.push({
          id: item.id,
          domain_id: item.domain_id,
          product_data: content,
          synced_at: item.created_at
        });
      }
    });
  }
  
  // Check customer configs for WooCommerce credentials
  const { data: configs } = await supabase
    .from('customer_configs')
    .select('id, domain, woocommerce_url, encrypted_woocommerce_key')
    .not('woocommerce_url', 'is', null);
  
  if (configs) {
    findings.credential_check = {
      total_woo_configs: configs.length,
      domains_with_woo: configs.map((c: any) => c.domain)
    };
  }
  
  const issues = [];
  if (findings.woo_products.length === 0) {
    issues.push('No DC66 products found in WooCommerce sync data');
  }
  
  await logFindings('WooCommerce Investigation', findings, issues);
  return findings;
}

// PHASE 5: Test actual search functionality
async function testSearchFunctionality() {
  console.log('\n🔍 PHASE 5: Testing search functionality...');
  
  const testQueries = [
    'DC66-10P',
    'DC66-10P-24-V2',
    'relay control',
    'Albright relay',
    '24V relay',
    'relay control assembly'
  ];
  
  const findings: any = {
    search_results: [],
    query_performance: []
  };
  
  for (const query of testQueries) {
    const startTime = Date.now();
    
    // Test embedding search
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    
    const { data: embedResults } = await supabase.rpc('match_page_sections', {
      embedding: embeddingResponse.data[0].embedding,
      match_threshold: 0.5,
      match_count: 5
    });
    
    // Test text search
    const { data: textResults } = await supabase
      .from('scraped_pages')
      .select('id, url, title, content')
      .ilike('content', `%${query}%`)
      .limit(5);
    
    const endTime = Date.now();
    
    findings.search_results.push({
      query,
      embedding_matches: embedResults?.length || 0,
      text_matches: textResults?.length || 0,
      top_embedding_result: embedResults?.[0] ? {
        similarity: embedResults[0].similarity,
        content_preview: embedResults[0].content?.substring(0, 200)
      } : null,
      top_text_result: textResults?.[0] ? {
        url: textResults[0].url,
        title: textResults[0].title
      } : null
    });
    
    findings.query_performance.push({
      query,
      response_time_ms: endTime - startTime
    });
  }
  
  const issues = [];
  const recommendations = [];
  
  // Check if any DC66-10P queries returned results
  const dc66Results = findings.search_results.filter((r: any) => 
    r.query.includes('DC66') && (r.embedding_matches > 0 || r.text_matches > 0)
  );
  
  if (dc66Results.length === 0) {
    issues.push('DC66-10P products not found in any search method');
    recommendations.push('Re-scrape product pages with DC66-10P products');
    recommendations.push('Verify content extraction is capturing product SKUs');
  }
  
  await logFindings('Search Functionality Test', findings, issues, recommendations);
  return findings;
}

// PHASE 6: Data pipeline analysis
async function analyzeDataPipeline() {
  console.log('\n🔍 PHASE 6: Analyzing data pipeline integrity...');
  
  const findings: any = {
    pipeline_stages: {
      scraping: { status: 'unknown', issues: [] },
      extraction: { status: 'unknown', issues: [] },
      embedding: { status: 'unknown', issues: [] },
      search: { status: 'unknown', issues: [] }
    },
    data_consistency: {},
    missing_links: []
  };
  
  // Check scraping -> extraction link
  const { data: scrapedWithoutExtraction } = await supabase.rpc('exec_sql', {
    query: `
      SELECT sp.id, sp.url, sp.domain_id
      FROM scraped_pages sp
      LEFT JOIN structured_extractions se 
        ON sp.domain_id = se.domain_id 
        AND se.extraction_type = 'products'
      WHERE sp.content ILIKE '%DC66%'
        AND se.id IS NULL
      LIMIT 10
    `
  }).single();
  
  if (scrapedWithoutExtraction?.rows?.length > 0) {
    findings.pipeline_stages.extraction.issues.push(
      `${scrapedWithoutExtraction.rows.length} pages with DC66 content have no product extractions`
    );
    findings.missing_links.push({
      stage: 'scraping -> extraction',
      affected_pages: scrapedWithoutExtraction.rows
    });
  }
  
  // Check extraction -> embedding link
  const { data: extractedWithoutEmbedding } = await supabase.rpc('exec_sql', {
    query: `
      SELECT se.id, se.domain_id
      FROM structured_extractions se
      LEFT JOIN page_embeddings pe ON se.domain_id = pe.domain_id
      WHERE se.extraction_type = 'products'
        AND pe.id IS NULL
      LIMIT 10
    `
  }).single();
  
  if (extractedWithoutEmbedding?.rows?.length > 0) {
    findings.pipeline_stages.embedding.issues.push(
      `${extractedWithoutEmbedding.rows.length} product extractions have no embeddings`
    );
    findings.missing_links.push({
      stage: 'extraction -> embedding',
      affected_items: extractedWithoutEmbedding.rows
    });
  }
  
  // Determine overall pipeline health
  Object.keys(findings.pipeline_stages).forEach(stage => {
    const stageData = findings.pipeline_stages[stage];
    stageData.status = stageData.issues.length === 0 ? 'healthy' : 'issues_detected';
  });
  
  const issues = [];
  const recommendations = [];
  
  if (findings.missing_links.length > 0) {
    issues.push(`Data pipeline has ${findings.missing_links.length} broken links`);
    recommendations.push('Run data consistency checker to repair pipeline');
    recommendations.push('Implement pipeline monitoring for future issues');
  }
  
  await logFindings('Data Pipeline Analysis', findings, issues, recommendations);
  return findings;
}

// PHASE 7: Generate final report and recommendations
async function generateFinalReport() {
  console.log('\n' + '='.repeat(80));
  console.log('FINAL INVESTIGATION REPORT');
  console.log('='.repeat(80));
  
  const report = {
    investigation_date: new Date().toISOString(),
    expected_products: EXPECTED_PRODUCTS,
    findings_summary: {
      products_found: [],
      products_missing: [],
      pipeline_issues: [],
      search_effectiveness: {}
    },
    root_causes: [],
    action_plan: []
  };
  
  // Analyze all results to determine root causes
  const scrapedPagesFound = results.find(r => r.phase === 'Scraped Pages Investigation')?.findings.direct_sku_matches.length > 0;
  const structuredExtractionsFound = results.find(r => r.phase === 'Structured Extractions Investigation')?.findings.dc66_products.length > 0;
  const embeddingsFound = results.find(r => r.phase === 'Embeddings Investigation')?.findings.similarity_scores.some((s: any) => s.results.length > 0);
  const searchWorking = results.find(r => r.phase === 'Search Functionality Test')?.findings.search_results.some((r: any) => r.embedding_matches > 0 || r.text_matches > 0);
  
  // Determine root causes
  if (!scrapedPagesFound) {
    report.root_causes.push('Products not present in scraped content - pages may not have been scraped');
    report.action_plan.push({
      priority: 'HIGH',
      action: 'Scrape product pages containing DC66-10P products',
      details: 'Ensure crawler visits product listing and detail pages'
    });
  }
  
  if (scrapedPagesFound && !structuredExtractionsFound) {
    report.root_causes.push('Content extraction failing to identify products');
    report.action_plan.push({
      priority: 'HIGH',
      action: 'Fix product extraction logic',
      details: 'Review extraction patterns for SKU formats like DC66-10P'
    });
  }
  
  if (structuredExtractionsFound && !embeddingsFound) {
    report.root_causes.push('Embeddings not generated for product content');
    report.action_plan.push({
      priority: 'MEDIUM',
      action: 'Generate embeddings for product pages',
      details: 'Run embedding generation for domains with DC66 products'
    });
  }
  
  if (!searchWorking) {
    report.root_causes.push('Search functionality not returning relevant results');
    report.action_plan.push({
      priority: 'HIGH',
      action: 'Tune search parameters',
      details: 'Adjust similarity thresholds and query processing'
    });
  }
  
  // Add optimization recommendations
  report.action_plan.push({
    priority: 'LOW',
    action: 'Implement product-specific indexing',
    details: 'Create dedicated product search index with SKU-based retrieval'
  });
  
  console.log('\n📊 FINDINGS SUMMARY:');
  console.log('-------------------');
  console.log(`Scraped Pages: ${scrapedPagesFound ? '✅ Found' : '❌ Not Found'}`);
  console.log(`Structured Extractions: ${structuredExtractionsFound ? '✅ Found' : '❌ Not Found'}`);
  console.log(`Embeddings: ${embeddingsFound ? '✅ Found' : '❌ Not Found'}`);
  console.log(`Search Working: ${searchWorking ? '✅ Yes' : '❌ No'}`);
  
  console.log('\n🔍 ROOT CAUSES:');
  console.log('---------------');
  report.root_causes.forEach((cause, i) => {
    console.log(`${i + 1}. ${cause}`);
  });
  
  console.log('\n📋 ACTION PLAN:');
  console.log('---------------');
  report.action_plan.forEach((action, i) => {
    console.log(`${i + 1}. [${action.priority}] ${action.action}`);
    console.log(`   ${action.details}`);
  });
  
  // Save report to file
  const fs = await import('fs');
  fs.writeFileSync(
    'dc66-investigation-report.json',
    JSON.stringify({ report, detailed_results: results }, null, 2)
  );
  
  console.log('\n💾 Full report saved to: dc66-investigation-report.json');
  
  return report;
}

// Main execution
async function main() {
  console.log('🚀 Starting DC66-10P Product Investigation');
  console.log('=' .repeat(80));
  console.log('Expected products to find:');
  EXPECTED_PRODUCTS.forEach(p => {
    console.log(`  - ${p.sku}: ${p.name} (${p.price})`);
  });
  
  try {
    // Execute all investigation phases
    await investigateScrapedPages();
    await investigateStructuredExtractions();
    await investigateEmbeddings();
    await investigateWooCommerceProducts();
    await testSearchFunctionality();
    await analyzeDataPipeline();
    
    // Generate final report
    const report = await generateFinalReport();
    
    console.log('\n✅ Investigation Complete!');
    
    // Return exit code based on findings
    const allProductsFound = report.root_causes.length === 0;
    process.exit(allProductsFound ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Investigation failed:', error);
    process.exit(1);
  }
}

// Run the investigation
main();