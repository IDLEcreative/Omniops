/**
 * Search Failure Diagnostic Tool
 *
 * Purpose: Diagnose why specific products aren't found in search
 * Usage: npx tsx scripts/tests/diagnose-search-failure.ts --query="Hyva Tank Filler" --domain="thompsonseparts.co.uk"
 *
 * This script investigates:
 * 1. Whether the domain has a commerce provider configured
 * 2. Whether the product page has been scraped
 * 3. Whether embeddings exist for the scraped content
 * 4. What the semantic search similarity scores are
 * 5. What the exact search results would be
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { generateQueryEmbedding } from '@/lib/embeddings/query-embedding';

interface DiagnosticResult {
  step: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  message: string;
  data?: any;
}

const results: DiagnosticResult[] = [];

function log(step: string, status: DiagnosticResult['status'], message: string, data?: any) {
  results.push({ step, status, message, data });
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} [${step}] ${message}`);
  if (data) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
}

async function diagnoseDomain(domain: string) {
  console.log(`\n🔍 Diagnosing domain: ${domain}\n`);

  // Step 1: Check if domain exists in customer_configs
  log('Domain Config', 'info', 'Checking customer_configs table...', null);

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    log('Supabase', 'fail', 'Failed to create Supabase client', null);
    return;
  }

  const { data: config, error: configError } = await supabase
    .from('customer_configs')
    .select('id, domain, woocommerce_url, shopify_shop, created_at')
    .eq('domain', domain)
    .single();

  if (configError) {
    if (configError.code === 'PGRST116') {
      log('Domain Config', 'fail', `Domain "${domain}" not found in customer_configs table`, { error: configError.message });
    } else {
      log('Domain Config', 'fail', 'Error loading customer config', { error: configError.message });
    }
  } else {
    log('Domain Config', 'pass', 'Domain found in customer_configs', {
      id: config.id,
      woocommerce_url: config.woocommerce_url || 'not configured',
      shopify_shop: config.shopify_shop || 'not configured',
    });
  }

  // Step 2: Check commerce provider availability
  log('Commerce Provider', 'info', 'Checking for WooCommerce/Shopify provider...', null);

  const provider = await getCommerceProvider(domain);

  if (provider) {
    log('Commerce Provider', 'pass', `Provider found: ${provider.platform}`, { platform: provider.platform });
  } else {
    log('Commerce Provider', 'warn', 'No commerce provider configured for this domain', {
      recommendation: 'Configure WooCommerce or Shopify credentials in customer_configs table',
    });
  }

  return config?.id;
}

async function diagnoseScrapedContent(domain: string, domainId: string | undefined, url?: string) {
  console.log(`\n📄 Diagnosing scraped content for: ${domain}\n`);

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    log('Supabase', 'fail', 'Failed to create Supabase client', null);
    return;
  }

  // Step 3: Check if any pages have been scraped for this domain
  log('Scraped Pages', 'info', 'Checking scraped_pages table...', null);

  if (domainId) {
    const { data: scrapedPages, error: scrapeError } = await supabase
      .from('scraped_pages')
      .select('id, url, title, created_at')
      .eq('domain_id', domainId)
      .limit(10);

    if (scrapeError) {
      log('Scraped Pages', 'fail', 'Error querying scraped_pages', { error: scrapeError.message });
    } else if (!scrapedPages || scrapedPages.length === 0) {
      log('Scraped Pages', 'fail', 'No pages scraped for this domain', {
        recommendation: 'Run web scraping to populate content: npx tsx scripts/crawl-thompsons.mjs (if exists)',
      });
    } else {
      log('Scraped Pages', 'pass', `Found ${scrapedPages.length} scraped pages`, {
        total: scrapedPages.length,
        sample: scrapedPages.slice(0, 3).map(p => ({ url: p.url, title: p.title })),
      });

      // If specific URL provided, check if it's scraped
      if (url) {
        const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
        const matchingPage = scrapedPages.find(p =>
          p.url.toLowerCase().replace(/\/$/, '') === normalizedUrl
        );

        if (matchingPage) {
          log('Specific URL', 'pass', `URL found in scraped pages: ${url}`, { id: matchingPage.id });
          return matchingPage.id;
        } else {
          log('Specific URL', 'warn', `URL not found in scraped pages: ${url}`, {
            recommendation: 'This specific product page may not have been scraped yet',
          });
        }
      }
    }
  } else {
    log('Scraped Pages', 'fail', 'Cannot check scraped pages without domain ID', null);
  }

  return null;
}

async function diagnoseEmbeddings(domainId: string | undefined, pageId?: string) {
  console.log(`\n🧮 Diagnosing embeddings...\n`);

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    log('Supabase', 'fail', 'Failed to create Supabase client', null);
    return;
  }

  // Step 4: Check if embeddings exist
  log('Embeddings', 'info', 'Checking page_embeddings table...', null);

  if (domainId) {
    // Check total embeddings for domain
    const { count, error: countError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    if (countError) {
      log('Embeddings', 'fail', 'Error counting embeddings', { error: countError.message });
    } else {
      log('Embeddings', count && count > 0 ? 'pass' : 'fail', `Found ${count || 0} embeddings for domain`, { count });
    }

    // If specific page, check its embeddings
    if (pageId) {
      const { data: pageEmbeddings, error: embedError } = await supabase
        .from('page_embeddings')
        .select('id, chunk_number, chunk_text')
        .eq('scraped_page_id', pageId)
        .limit(5);

      if (embedError) {
        log('Page Embeddings', 'fail', 'Error querying page embeddings', { error: embedError.message });
      } else if (!pageEmbeddings || pageEmbeddings.length === 0) {
        log('Page Embeddings', 'fail', 'No embeddings found for this page', {
          recommendation: 'Run embedding generation for this page',
        });
      } else {
        log('Page Embeddings', 'pass', `Found ${pageEmbeddings.length} embeddings for this page`, {
          chunks: pageEmbeddings.map(e => ({
            chunk: e.chunk_number,
            preview: e.chunk_text?.substring(0, 100) + '...',
          })),
        });
      }
    }
  } else {
    log('Embeddings', 'fail', 'Cannot check embeddings without domain ID', null);
  }
}

async function diagnoseSemanticSearch(query: string, domain: string) {
  console.log(`\n🔎 Diagnosing semantic search for query: "${query}"\n`);

  // Step 5: Try semantic search and show results
  log('Semantic Search', 'info', 'Running semantic search...', { query, domain });

  try {
    const results = await searchSimilarContent(query, domain, 10, 0.1); // Lower threshold for diagnostics

    if (!results || results.length === 0) {
      log('Semantic Search', 'fail', 'No results found from semantic search', {
        possibleReasons: [
          'Query terms don\'t match scraped content',
          'Similarity scores are below threshold (0.1)',
          'No embeddings exist for relevant content',
        ],
      });
    } else {
      log('Semantic Search', 'pass', `Found ${results.length} results from semantic search`, {
        topResults: results.slice(0, 5).map(r => ({
          title: r.title,
          url: r.url,
          similarity: r.similarity,
          contentPreview: r.content.substring(0, 100) + '...',
        })),
      });

      // Check if any results are below typical threshold (0.2)
      const lowScoreResults = results.filter(r => r.similarity < 0.2);
      if (lowScoreResults.length > 0) {
        log('Similarity Threshold', 'warn', `${lowScoreResults.length} results have similarity < 0.2 (would be filtered in prod)`, {
          recommendation: 'Consider lowering similarity threshold or improving content matching',
        });
      }
    }
  } catch (error) {
    log('Semantic Search', 'fail', 'Error during semantic search', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function diagnoseQueryEmbedding(query: string) {
  console.log(`\n🎯 Diagnosing query embedding generation...\n`);

  log('Query Embedding', 'info', `Generating embedding for query: "${query}"`, null);

  try {
    const embedding = await generateQueryEmbedding(query, false);

    log('Query Embedding', 'pass', 'Successfully generated query embedding', {
      dimensions: embedding.length,
      sampleValues: embedding.slice(0, 5),
    });
  } catch (error) {
    log('Query Embedding', 'fail', 'Failed to generate query embedding', {
      error: error instanceof Error ? error.message : String(error),
      possibleReasons: [
        'OpenAI API key not configured',
        'OpenAI API rate limit reached',
        'Network connectivity issue',
      ],
    });
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warn').length;

  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log('');

  // Print critical failures
  const criticalFailures = results.filter(r => r.status === 'fail');
  if (criticalFailures.length > 0) {
    console.log('🔴 CRITICAL ISSUES:\n');
    criticalFailures.forEach(f => {
      console.log(`  • ${f.step}: ${f.message}`);
      if (f.data?.recommendation) {
        console.log(`    → ${f.data.recommendation}`);
      }
    });
    console.log('');
  }

  // Print warnings
  const warnings = results.filter(r => r.status === 'warn');
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach(w => {
      console.log(`  • ${w.step}: ${w.message}`);
      if (w.data?.recommendation) {
        console.log(`    → ${w.data.recommendation}`);
      }
    });
    console.log('');
  }

  // Next steps
  console.log('📝 NEXT STEPS:\n');

  if (failCount > 0) {
    console.log('  1. Address critical failures above');
    console.log('  2. Re-run diagnostic after fixes');
  } else if (warnCount > 0) {
    console.log('  1. Review warnings above');
    console.log('  2. Consider implementing recommendations');
  } else {
    console.log('  ✅ All checks passed! Search should be working correctly.');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const queryArg = args.find(arg => arg.startsWith('--query='));
  const domainArg = args.find(arg => arg.startsWith('--domain='));
  const urlArg = args.find(arg => arg.startsWith('--url='));

  if (!queryArg || !domainArg) {
    console.error('Usage: npx tsx scripts/tests/diagnose-search-failure.ts --query="search query" --domain="example.com" [--url="specific product url"]');
    console.error('\nExample:');
    console.error('  npx tsx scripts/tests/diagnose-search-failure.ts --query="Hyva Tank Filler" --domain="thompsonseparts.co.uk" --url="https://www.thompsonseparts.co.uk/product/hyva-tank-filler-breather-cap-assembly/"');
    process.exit(1);
  }

  const query = queryArg.split('=')[1];
  const domain = domainArg.split('=')[1];
  const url = urlArg ? urlArg.split('=')[1] : undefined;

  console.log('🔧 Search Failure Diagnostic Tool\n');
  console.log(`Query: ${query}`);
  console.log(`Domain: ${domain}`);
  if (url) console.log(`URL: ${url}`);
  console.log('');

  try {
    // Run diagnostics
    const domainId = await diagnoseDomain(domain);
    const pageId = await diagnoseScrapedContent(domain, domainId, url);
    await diagnoseEmbeddings(domainId, pageId || undefined);
    await diagnoseQueryEmbedding(query);
    await diagnoseSemanticSearch(query, domain);

    // Print summary
    await printSummary();
  } catch (error) {
    console.error('\n❌ Fatal error during diagnostics:', error);
    process.exit(1);
  }
}

main();
