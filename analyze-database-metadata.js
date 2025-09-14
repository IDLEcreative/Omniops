#!/usr/bin/env node

/**
 * Comprehensive Database Metadata Analysis
 * Analyzes metadata consistency and proper consolidation in the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class MetadataAnalyzer {
  constructor() {
    this.results = {
      totalPages: 0,
      pagesWithMetadata: 0,
      consolidatedPages: 0,
      duplicateFields: [],
      inconsistencies: [],
      missingFields: [],
      completenessStats: {},
      enrichmentStatus: {
        withEmbeddings: 0,
        withoutEmbeddings: 0,
        enrichedEmbeddings: 0
      }
    };
  }

  async analyzeDatabase() {
    console.log('\n' + '='.repeat(80));
    console.log('   DATABASE METADATA CONSISTENCY & CONSOLIDATION ANALYSIS');
    console.log('='.repeat(80) + '\n');

    try {
      // Step 1: Get recent scraped pages with metadata
      await this.fetchRecentPages();
      
      // Step 2: Analyze metadata structure and consolidation
      await this.analyzeMetadataStructure();
      
      // Step 3: Check embedding enrichment consistency
      await this.analyzeEmbeddingEnrichment();
      
      // Step 4: Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      console.error(error);
    }
  }

  async fetchRecentPages() {
    console.log('📊 Step 1: Fetching recent scraped pages...\n');

    // Get total pages
    const { count: totalCount } = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact', head: true });
    
    this.results.totalPages = totalCount || 0;
    console.log(`   Total pages in database: ${this.results.totalPages}`);

    // Get pages with metadata from last 7 days
    const { data: recentPages, error } = await supabase
      .from('scraped_pages')
      .select(`
        id, 
        url, 
        title, 
        metadata, 
        scraped_at, 
        created_at,
        domains!scraped_pages_domain_id_fkey(domain)
      `)
      .not('metadata', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    this.pages = recentPages || [];
    this.results.pagesWithMetadata = this.pages.length;
    
    console.log(`   Pages with metadata (last 7 days): ${this.results.pagesWithMetadata}`);
    
    if (this.pages.length === 0) {
      console.log('\n⚠️  No pages with metadata found in the last 7 days');
      console.log('   Consider running a fresh scrape to generate test data');
      return;
    }

    // Show domain distribution
    const domainCounts = {};
    this.pages.forEach(page => {
      const domain = page.domains?.domain || 'Unknown';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });

    console.log('\n   Domain distribution:');
    Object.entries(domainCounts).forEach(([domain, count]) => {
      console.log(`     • ${domain}: ${count} pages`);
    });
  }

  async analyzeMetadataStructure() {
    console.log('\n📋 Step 2: Analyzing metadata structure and consolidation...\n');

    const fieldStats = {
      productSku: 0,
      productPrice: 0,
      productInStock: 0,
      productBrand: 0,
      productCategory: 0,
      ecommerceData: 0,
      extractMeta: 0,
      contentType: 0,
      keywords: 0
    };

    for (const page of this.pages) {
      const metadata = page.metadata;
      let isConsolidated = false;

      // Check for consolidated product fields at top level
      const consolidatedFields = {
        productSku: metadata.productSku,
        productPrice: metadata.productPrice,
        productInStock: metadata.productInStock,
        productBrand: metadata.productBrand,
        productCategory: metadata.productCategory
      };

      // Count field presence
      Object.keys(fieldStats).forEach(field => {
        if (metadata[field] !== undefined && metadata[field] !== null) {
          fieldStats[field]++;
        }
      });

      // Check consolidation quality
      const hasConsolidatedFields = Object.values(consolidatedFields).some(v => v !== undefined && v !== null);
      
      if (hasConsolidatedFields) {
        this.results.consolidatedPages++;
        isConsolidated = true;
      }

      // Check for duplication issues
      if (metadata.ecommerceData?.products?.[0]) {
        const ecomProduct = metadata.ecommerceData.products[0];
        
        // Look for conflicts between consolidated fields and ecommerceData
        const conflicts = [];
        
        if (metadata.productSku && ecomProduct.sku && metadata.productSku !== ecomProduct.sku) {
          conflicts.push({ field: 'sku', consolidated: metadata.productSku, ecommerce: ecomProduct.sku });
        }
        
        if (metadata.productPrice && ecomProduct.price && metadata.productPrice !== ecomProduct.price) {
          conflicts.push({ field: 'price', consolidated: metadata.productPrice, ecommerce: ecomProduct.price });
        }

        if (conflicts.length > 0) {
          this.results.duplicateFields.push({
            url: page.url,
            conflicts: conflicts
          });
        }
      }

      // Check for missing expected fields on product pages
      if (metadata.contentType === 'product' || page.url.includes('/product') || metadata.ecommerceData?.products?.length > 0) {
        const expectedFields = ['productSku', 'productPrice', 'productInStock'];
        const missingFields = expectedFields.filter(field => !metadata[field] && metadata[field] !== false);
        
        if (missingFields.length > 0) {
          this.results.missingFields.push({
            url: page.url,
            missing: missingFields,
            hasEcommerceData: !!metadata.ecommerceData?.products?.length
          });
        }
      }

      // Track inconsistent field naming
      const legacyFields = ['sku', 'price', 'inStock', 'brand', 'category'];
      const hasLegacyFields = legacyFields.some(field => metadata[field] !== undefined);
      const hasModernFields = Object.keys(consolidatedFields).some(field => metadata[field] !== undefined);
      
      if (hasLegacyFields && hasModernFields) {
        this.results.inconsistencies.push({
          url: page.url,
          issue: 'Mixed legacy and modern field naming'
        });
      }
    }

    this.results.completenessStats = fieldStats;

    // Display analysis results
    console.log('   Metadata Field Statistics:');
    console.log('   ' + '─'.repeat(50));
    
    Object.entries(fieldStats).forEach(([field, count]) => {
      const percentage = Math.round((count / this.results.pagesWithMetadata) * 100);
      const bar = '█'.repeat(Math.floor(percentage / 5));
      console.log(`     ${field.padEnd(20)} │ ${count.toString().padStart(3)} (${percentage.toString().padStart(3)}%) ${bar}`);
    });

    console.log('\n   Consolidation Status:');
    console.log('   ' + '─'.repeat(50));
    console.log(`     Pages with consolidated metadata: ${this.results.consolidatedPages}/${this.results.pagesWithMetadata}`);
    console.log(`     Consolidation rate: ${Math.round((this.results.consolidatedPages / this.results.pagesWithMetadata) * 100)}%`);
  }

  async analyzeEmbeddingEnrichment() {
    console.log('\n🔍 Step 3: Analyzing embedding enrichment consistency...\n');

    // Check page_embeddings table
    const { count: totalEmbeddings } = await supabase
      .from('page_embeddings')
      .select('id', { count: 'exact', head: true });

    console.log(`   Total embeddings in database: ${totalEmbeddings || 0}`);

    // Sample some pages to check enrichment
    const sampleSize = Math.min(5, this.results.consolidatedPages);
    const consolidatedPages = this.pages.filter(page => 
      page.metadata.productSku || page.metadata.productPrice || page.metadata.productBrand
    ).slice(0, sampleSize);

    console.log(`   Checking enrichment for ${sampleSize} consolidated pages...\n`);

    for (const page of consolidatedPages) {
      const { data: embeddings } = await supabase
        .from('page_embeddings')
        .select('chunk_text, metadata_embedding')
        .eq('page_id', page.id)
        .limit(1);

      if (embeddings && embeddings.length > 0) {
        this.results.enrichmentStatus.withEmbeddings++;
        
        const chunkText = embeddings[0].chunk_text || '';
        const hasEnrichment = chunkText.includes('SKU:') || 
                             chunkText.includes('Price:') || 
                             chunkText.includes('Brand:') ||
                             chunkText.includes('In Stock:');
        
        if (hasEnrichment) {
          this.results.enrichmentStatus.enrichedEmbeddings++;
        }

        console.log(`     ${page.url.substring(0, 60)}...`);
        console.log(`       Has metadata: ${page.metadata.productSku ? '✅' : '❌'}`);
        console.log(`       Has embedding: ✅`);
        console.log(`       Is enriched: ${hasEnrichment ? '✅' : '❌'}`);
        console.log(`       Has metadata embedding: ${embeddings[0].metadata_embedding ? '✅' : '❌'}`);
        console.log('');
      } else {
        this.results.enrichmentStatus.withoutEmbeddings++;
        console.log(`     ${page.url}: ❌ No embeddings found`);
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('   COMPREHENSIVE METADATA ANALYSIS REPORT');
    console.log('='.repeat(80) + '\n');

    // Overview Statistics
    console.log('📊 OVERVIEW STATISTICS');
    console.log('─'.repeat(40));
    console.log(`Total pages in database: ${this.results.totalPages}`);
    console.log(`Pages with metadata (7 days): ${this.results.pagesWithMetadata}`);
    console.log(`Properly consolidated pages: ${this.results.consolidatedPages}`);
    console.log(`Consolidation success rate: ${Math.round((this.results.consolidatedPages / Math.max(this.results.pagesWithMetadata, 1)) * 100)}%`);

    // Field Completeness Analysis
    console.log('\n🔍 FIELD COMPLETENESS ANALYSIS');
    console.log('─'.repeat(40));
    
    const criticalFields = ['productSku', 'productPrice', 'productInStock'];
    const criticalFieldsPresent = criticalFields.reduce((sum, field) => 
      sum + (this.results.completenessStats[field] || 0), 0
    );
    
    console.log(`Critical product fields present: ${criticalFieldsPresent}/${criticalFields.length * this.results.pagesWithMetadata}`);
    console.log(`Critical field coverage: ${Math.round((criticalFieldsPresent / (criticalFields.length * Math.max(this.results.pagesWithMetadata, 1))) * 100)}%`);

    // Issues Found
    console.log('\n⚠️ ISSUES DETECTED');
    console.log('─'.repeat(40));

    if (this.results.duplicateFields.length > 0) {
      console.log(`❌ Duplicate/Conflicting Fields: ${this.results.duplicateFields.length} pages`);
      this.results.duplicateFields.slice(0, 3).forEach(issue => {
        console.log(`   • ${issue.url}`);
        issue.conflicts.forEach(conflict => {
          console.log(`     - ${conflict.field}: "${conflict.consolidated}" vs "${conflict.ecommerce}"`);
        });
      });
      if (this.results.duplicateFields.length > 3) {
        console.log(`     ... and ${this.results.duplicateFields.length - 3} more`);
      }
    } else {
      console.log('✅ No duplicate/conflicting fields detected');
    }

    if (this.results.missingFields.length > 0) {
      console.log(`\n⚠️ Missing Expected Fields: ${this.results.missingFields.length} product pages`);
      this.results.missingFields.slice(0, 3).forEach(issue => {
        console.log(`   • ${issue.url}: missing ${issue.missing.join(', ')}`);
      });
      if (this.results.missingFields.length > 3) {
        console.log(`     ... and ${this.results.missingFields.length - 3} more`);
      }
    } else {
      console.log('✅ No missing critical fields on product pages');
    }

    if (this.results.inconsistencies.length > 0) {
      console.log(`\n⚠️ Field Naming Inconsistencies: ${this.results.inconsistencies.length} pages`);
      this.results.inconsistencies.slice(0, 3).forEach(issue => {
        console.log(`   • ${issue.url}: ${issue.issue}`);
      });
    } else {
      console.log('✅ No field naming inconsistencies detected');
    }

    // Enrichment Analysis
    console.log('\n🚀 EMBEDDING ENRICHMENT STATUS');
    console.log('─'.repeat(40));
    
    const enrichmentRate = this.results.enrichmentStatus.withEmbeddings > 0 
      ? Math.round((this.results.enrichmentStatus.enrichedEmbeddings / this.results.enrichmentStatus.withEmbeddings) * 100)
      : 0;
    
    console.log(`Pages with embeddings: ${this.results.enrichmentStatus.withEmbeddings}`);
    console.log(`Pages without embeddings: ${this.results.enrichmentStatus.withoutEmbeddings}`);
    console.log(`Properly enriched embeddings: ${this.results.enrichmentStatus.enrichedEmbeddings}`);
    console.log(`Enrichment success rate: ${enrichmentRate}%`);

    // Final Assessment
    console.log('\n🎯 FINAL ASSESSMENT');
    console.log('─'.repeat(40));

    const consolidationRate = Math.round((this.results.consolidatedPages / Math.max(this.results.pagesWithMetadata, 1)) * 100);
    const hasMajorIssues = this.results.duplicateFields.length > 0 || this.results.inconsistencies.length > 0;
    const criticalCoverage = Math.round((criticalFieldsPresent / (criticalFields.length * Math.max(this.results.pagesWithMetadata, 1))) * 100);

    if (consolidationRate >= 80 && !hasMajorIssues && criticalCoverage >= 70) {
      console.log('✅ EXCELLENT: Metadata consolidation is working properly');
      console.log('   • High consolidation rate');
      console.log('   • No major structural issues');
      console.log('   • Good critical field coverage');
    } else if (consolidationRate >= 50 && criticalCoverage >= 50) {
      console.log('⚠️ GOOD WITH IMPROVEMENTS NEEDED:');
      if (consolidationRate < 80) console.log('   • Consider improving consolidation rate');
      if (hasMajorIssues) console.log('   • Address duplicate/conflicting fields');
      if (criticalCoverage < 70) console.log('   • Improve critical field extraction');
    } else {
      console.log('❌ NEEDS ATTENTION: Major issues detected');
      console.log('   • Low consolidation or critical field coverage');
      console.log('   • Consider debugging metadata extraction');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('─'.repeat(40));
    
    if (consolidationRate < 80) {
      console.log('• Increase metadata consolidation by improving ecommerce extraction');
    }
    
    if (this.results.duplicateFields.length > 0) {
      console.log('• Fix duplicate field conflicts in metadata consolidation logic');
    }
    
    if (criticalCoverage < 70) {
      console.log('• Improve extraction of critical product fields (SKU, price, stock)');
    }
    
    if (enrichmentRate < 80) {
      console.log('• Check embedding enrichment pipeline - metadata may not be flowing to embeddings');
    }
    
    if (this.results.pagesWithMetadata < 10) {
      console.log('• Run fresh scrapes to generate more test data for analysis');
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}

async function main() {
  const analyzer = new MetadataAnalyzer();
  await analyzer.analyzeDatabase();
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { MetadataAnalyzer };