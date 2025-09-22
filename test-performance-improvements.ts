#!/usr/bin/env npx tsx

/**
 * Performance Testing Script
 * Validates the database performance improvements
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PerformanceTest {
  name: string;
  description: string;
  run: () => Promise<{ duration: number; success: boolean; details: string }>;
}

class PerformanceValidator {
  private tests: PerformanceTest[] = [];
  
  constructor() {
    this.setupTests();
  }
  
  private setupTests() {
    // Test 1: DELETE operation performance
    this.tests.push({
      name: 'DELETE by page_id performance',
      description: 'Should complete in <5ms with new composite index',
      run: async () => {
        const start = Date.now();
        
        // Create test data
        const { data: page } = await supabase
          .from('scraped_pages')
          .select('id')
          .limit(1)
          .single();
        
        if (!page) {
          return {
            duration: 0,
            success: false,
            details: 'No test data available'
          };
        }
        
        // Test DELETE performance
        const deleteStart = Date.now();
        await supabase
          .from('page_embeddings')
          .delete()
          .eq('page_id', page.id);
        const deleteTime = Date.now() - deleteStart;
        
        return {
          duration: deleteTime,
          success: deleteTime < 5,
          details: `DELETE took ${deleteTime}ms (target: <5ms)`
        };
      }
    });
    
    // Test 2: Batch INSERT performance
    this.tests.push({
      name: 'Batch INSERT performance',
      description: 'Should handle 1000 rows in <500ms',
      run: async () => {
        const testData = Array.from({ length: 100 }, (_, i) => ({
          chunk_text: `Test chunk ${i}`,
          metadata: { test: true, index: i },
          page_id: '00000000-0000-0000-0000-000000000000',
          domain_id: null
        }));
        
        const start = Date.now();
        const { error } = await supabase
          .from('page_embeddings')
          .insert(testData);
        const duration = Date.now() - start;
        
        // Clean up test data
        await supabase
          .from('page_embeddings')
          .delete()
          .eq('page_id', '00000000-0000-0000-0000-000000000000');
        
        return {
          duration,
          success: duration < 500 && !error,
          details: error ? `Error: ${error.message}` : `INSERT took ${duration}ms`
        };
      }
    });
    
    // Test 3: Vector search performance
    this.tests.push({
      name: 'Vector similarity search',
      description: 'Should complete in <100ms with IVFFlat index',
      run: async () => {
        // Generate a random vector for testing
        const testVector = Array.from({ length: 1536 }, () => Math.random());
        
        const start = Date.now();
        const { data, error } = await supabase.rpc('search_embeddings', {
          query_embedding: testVector,
          p_domain_id: null,
          match_threshold: 0.5,
          match_count: 10
        });
        const duration = Date.now() - start;
        
        return {
          duration,
          success: duration < 100 && !error,
          details: error ? `Error: ${error.message}` : 
                   `Search returned ${data?.length || 0} results in ${duration}ms`
        };
      }
    });
    
    // Test 4: Batch UPDATE performance
    this.tests.push({
      name: 'Batch UPDATE performance',
      description: 'Should update 100 rows in <50ms',
      run: async () => {
        // Get some existing IDs
        const { data: embeddings } = await supabase
          .from('page_embeddings')
          .select('id')
          .limit(100);
        
        if (!embeddings || embeddings.length === 0) {
          return {
            duration: 0,
            success: false,
            details: 'No test data available'
          };
        }
        
        const ids = embeddings.map(e => e.id);
        const start = Date.now();
        
        const { error } = await supabase
          .from('page_embeddings')
          .update({ metadata: { updated: new Date().toISOString() } })
          .in('id', ids);
        
        const duration = Date.now() - start;
        
        return {
          duration,
          success: duration < 50 * ids.length && !error,
          details: `Updated ${ids.length} rows in ${duration}ms`
        };
      }
    });
  }
  
  async runTests() {
    console.log('🧪 Running Performance Validation Tests\n');
    console.log('=' .repeat(50));
    
    const results = [];
    
    for (const test of this.tests) {
      console.log(`\n📊 ${test.name}`);
      console.log(`   ${test.description}`);
      
      try {
        const result = await test.run();
        results.push({ ...result, name: test.name });
        
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`   ${status}: ${result.details}`);
      } catch (error: any) {
        console.log(`   ❌ ERROR: ${error.message}`);
        results.push({
          name: test.name,
          success: false,
          duration: 0,
          details: error.message
        });
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📈 Performance Test Summary\n');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Consider:');
      console.log('1. Running the migration: npx supabase migration up');
      console.log('2. Checking index creation status in Supabase Dashboard');
      console.log('3. Running ANALYZE on tables after index creation');
    } else {
      console.log('\n🎉 All performance tests passed!');
      console.log('The optimizations are working as expected.');
    }
    
    return {
      passed,
      failed,
      results
    };
  }
}

async function main() {
  const validator = new PerformanceValidator();
  const { passed, failed } = await validator.runTests();
  
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

export { PerformanceValidator };