#!/usr/bin/env npx tsx
/**
 * Quick validation script to verify search improvements
 * Run after implementing changes: npx tsx validate-search-improvements.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { searchSimilarContent, generateQueryEmbedding } from './lib/embeddings';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DOMAIN = 'thompsonseparts.co.uk';

// Validation checks
const VALIDATIONS = {
  SIMILARITY_THRESHOLD: {
    expected: 0.45,
    min: 0.4,
    max: 0.5
  },
  CHUNK_LIMIT: {
    expected: 20,
    min: 15,
    max: 25
  },
  CONTENT_LENGTH: {
    product: 2000,
    support: 1500,
    policy: 1000,
    min: 800
  }
};

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

/**
 * Check if similarity threshold has been updated
 */
async function validateSimilarityThreshold(): Promise<ValidationResult> {
  try {
    // Test with a query that should return results with lower similarity
    const query = 'general information about products';
    const embedding = await generateQueryEmbedding(query);
    
    // Get domain_id
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', DOMAIN)
      .single();
    
    if (!domainData) {
      return {
        check: 'Similarity Threshold',
        status: 'fail',
        message: 'Domain not found'
      };
    }
    
    // Try with the improved threshold
    const { data: results } = await supabase.rpc('search_embeddings', {
      query_embedding: embedding,
      p_domain_id: domainData.id,
      match_threshold: VALIDATIONS.SIMILARITY_THRESHOLD.expected,
      match_count: 5
    });
    
    // Try with old threshold
    const { data: oldResults } = await supabase.rpc('search_embeddings', {
      query_embedding: embedding,
      p_domain_id: domainData.id,
      match_threshold: 0.7,
      match_count: 5
    });
    
    const improvement = ((results?.length || 0) - (oldResults?.length || 0)) / Math.max(oldResults?.length || 1, 1) * 100;
    
    return {
      check: 'Similarity Threshold',
      status: improvement > 50 ? 'pass' : 'warn',
      message: `Found ${results?.length || 0} results (vs ${oldResults?.length || 0} with old threshold)`,
      details: {
        improvement: `${improvement.toFixed(0)}% more results`,
        newThreshold: VALIDATIONS.SIMILARITY_THRESHOLD.expected,
        oldThreshold: 0.7
      }
    };
  } catch (error) {
    return {
      check: 'Similarity Threshold',
      status: 'fail',
      message: `Error: ${error}`
    };
  }
}

/**
 * Check if chunk limit has been increased
 */
async function validateChunkLimit(): Promise<ValidationResult> {
  try {
    // Test specific product query
    const results = await searchSimilarContent(
      'DC66-10P pump',
      DOMAIN,
      25,  // Request max chunks
      0.45
    );
    
    const chunkCount = results.length;
    const status = chunkCount >= VALIDATIONS.CHUNK_LIMIT.min ? 'pass' : 
                   chunkCount >= 10 ? 'warn' : 'fail';
    
    return {
      check: 'Chunk Limit',
      status,
      message: `Retrieved ${chunkCount} chunks`,
      details: {
        expected: `${VALIDATIONS.CHUNK_LIMIT.min}-${VALIDATIONS.CHUNK_LIMIT.max}`,
        actual: chunkCount
      }
    };
  } catch (error) {
    return {
      check: 'Chunk Limit',
      status: 'fail',
      message: `Error: ${error}`
    };
  }
}

/**
 * Check content truncation for different page types
 */
async function validateContentTruncation(): Promise<ValidationResult> {
  try {
    // Test product page
    const productResults = await searchSimilarContent(
      'hydraulic pump specifications',
      DOMAIN,
      5,
      0.45
    );
    
    const productContent = productResults.find(r => r.url.includes('/product/'));
    const productLength = productContent?.content.length || 0;
    
    // Test policy page
    const policyResults = await searchSimilarContent(
      'return policy',
      DOMAIN,
      5,
      0.45
    );
    
    const policyContent = policyResults.find(r => 
      r.url.includes('policy') || r.url.includes('terms') || r.content.includes('policy')
    );
    const policyLength = policyContent?.content.length || 0;
    
    const status = productLength >= VALIDATIONS.CONTENT_LENGTH.min && 
                   policyLength >= VALIDATIONS.CONTENT_LENGTH.min ? 'pass' : 'warn';
    
    return {
      check: 'Content Truncation',
      status,
      message: `Product: ${productLength} chars, Policy: ${policyLength} chars`,
      details: {
        productContent: productLength >= VALIDATIONS.CONTENT_LENGTH.product ? '✅ Adequate' : '⚠️ May be truncated',
        policyContent: policyLength >= VALIDATIONS.CONTENT_LENGTH.min ? '✅ Adequate' : '⚠️ May be truncated'
      }
    };
  } catch (error) {
    return {
      check: 'Content Truncation',
      status: 'fail',
      message: `Error: ${error}`
    };
  }
}

/**
 * Test specific queries for accuracy
 */
async function validateQueryAccuracy(): Promise<ValidationResult> {
  try {
    const testQueries = [
      {
        query: 'DC66-10P specifications',
        expectedTerms: ['130 cm3/rev', '420 bar', 'EBA13041B']
      },
      {
        query: 'return policy',
        expectedTerms: ['return', 'policy', 'days']
      }
    ];
    
    let totalFound = 0;
    let totalExpected = 0;
    const details: any = {};
    
    for (const test of testQueries) {
      const results = await searchSimilarContent(test.query, DOMAIN, 20, 0.45);
      const allContent = results.map(r => r.content).join(' ').toLowerCase();
      
      const found = test.expectedTerms.filter(term => 
        allContent.includes(term.toLowerCase())
      );
      
      totalFound += found.length;
      totalExpected += test.expectedTerms.length;
      
      details[test.query] = `${found.length}/${test.expectedTerms.length} terms found`;
    }
    
    const accuracy = (totalFound / totalExpected * 100);
    const status = accuracy >= 80 ? 'pass' : accuracy >= 60 ? 'warn' : 'fail';
    
    return {
      check: 'Query Accuracy',
      status,
      message: `${accuracy.toFixed(0)}% accuracy (${totalFound}/${totalExpected} terms)`,
      details
    };
  } catch (error) {
    return {
      check: 'Query Accuracy',
      status: 'fail',
      message: `Error: ${error}`
    };
  }
}

/**
 * Run all validations
 */
async function runValidation() {
  console.log(chalk.bold.blue('\n🔍 SEARCH IMPROVEMENTS VALIDATION\n'));
  console.log(chalk.gray('Domain: ' + DOMAIN));
  console.log(chalk.gray('─'.repeat(60)));
  
  const validations = [
    validateSimilarityThreshold(),
    validateChunkLimit(),
    validateContentTruncation(),
    validateQueryAccuracy()
  ];
  
  const results = await Promise.all(validations);
  
  // Display results
  console.log();
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : 
                 result.status === 'warn' ? '⚠️' : '❌';
    
    const color = result.status === 'pass' ? chalk.green :
                  result.status === 'warn' ? chalk.yellow : chalk.red;
    
    console.log(color(`${icon} ${result.check}: ${result.message}`));
    
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(chalk.gray(`   ${key}: ${value}`));
      });
    }
    console.log();
  }
  
  // Overall status
  const passCount = results.filter(r => r.status === 'pass').length;
  const warnCount = results.filter(r => r.status === 'warn').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.bold('\nOVERALL STATUS:'));
  
  if (failCount > 0) {
    console.log(chalk.red(`❌ ${failCount} checks failed - improvements not fully implemented`));
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.gray('1. Review /docs/SEARCH_IMPROVEMENTS_MIGRATION.md'));
    console.log(chalk.gray('2. Update settings in lib/embeddings.ts'));
    console.log(chalk.gray('3. Run this validation again'));
  } else if (warnCount > 0) {
    console.log(chalk.yellow(`⚠️ ${warnCount} warnings - improvements partially implemented`));
    console.log(chalk.gray('\nConsider fine-tuning the settings for optimal results'));
  } else {
    console.log(chalk.green(`✅ All ${passCount} checks passed - improvements successfully implemented!`));
    console.log(chalk.gray('\nYour search accuracy should now be significantly improved'));
  }
  
  // Performance tip
  console.log(chalk.cyan('\n💡 TIP: Run the full comparison test for detailed metrics:'));
  console.log(chalk.gray('   npx tsx test-search-comparison.ts\n'));
}

// Run validation
runValidation().catch(console.error);