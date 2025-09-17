#!/usr/bin/env npx tsx
/**
 * Performance comparison between original and optimized chat implementations
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

interface TestResult {
  query: string;
  original: {
    success: boolean;
    timeMs: number;
    sourcesFound: number;
    error?: string;
  };
  optimized: {
    success: boolean;
    timeMs: number;
    sourcesFound: number;
    error?: string;
  };
  improvement: number; // Percentage improvement
}

async function testEndpoint(
  url: string, 
  query: string, 
  domain: string,
  timeoutMs: number = 60000
): Promise<{ success: boolean; timeMs: number; sourcesFound: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: uuidv4(),
        domain: domain,
        config: {
          ai: {
            maxSearchIterations: 2,
            searchTimeout: 5000
          },
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          }
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        timeMs: elapsed,
        sourcesFound: 0,
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      timeMs: elapsed,
      sourcesFound: data.sources?.length || 0
    };
    
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    return {
      success: false,
      timeMs: elapsed,
      sourcesFound: 0,
      error: error.name === 'AbortError' ? 'Timeout' : error.message
    };
  }
}

async function runComparison() {
  console.log('🏁 PERFORMANCE COMPARISON TEST');
  console.log('═'.repeat(60));
  console.log('Comparing original vs optimized implementations');
  console.log('═'.repeat(60));
  
  const domain = 'thompsonseparts.co.uk';
  const testQueries = [
    'Cifa products',
    'hydraulic pumps',
    'water systems',
    'Show me all Cifa mixer pumps',
    'DC66-10P Agri Flip'
  ];
  
  const results: TestResult[] = [];
  
  for (const query of testQueries) {
    console.log(`\n📝 Testing: "${query}"`);
    console.log('─'.repeat(60));
    
    // Test original endpoint
    console.log('Testing ORIGINAL implementation...');
    const originalResult = await testEndpoint(
      'http://localhost:3000/api/chat-intelligent',
      query,
      domain,
      30000 // 30 second timeout
    );
    
    if (originalResult.success) {
      console.log(`✅ Original: ${originalResult.timeMs}ms (${originalResult.sourcesFound} sources)`);
    } else {
      console.log(`❌ Original: Failed after ${originalResult.timeMs}ms - ${originalResult.error}`);
    }
    
    // Brief pause
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test optimized endpoint
    console.log('Testing OPTIMIZED implementation...');
    const optimizedResult = await testEndpoint(
      'http://localhost:3000/api/chat-intelligent-optimized',
      query,
      domain,
      30000 // 30 second timeout
    );
    
    if (optimizedResult.success) {
      console.log(`✅ Optimized: ${optimizedResult.timeMs}ms (${optimizedResult.sourcesFound} sources)`);
    } else {
      console.log(`❌ Optimized: Failed after ${optimizedResult.timeMs}ms - ${optimizedResult.error}`);
    }
    
    // Calculate improvement
    let improvement = 0;
    if (originalResult.success && optimizedResult.success) {
      improvement = ((originalResult.timeMs - optimizedResult.timeMs) / originalResult.timeMs) * 100;
    } else if (!originalResult.success && optimizedResult.success) {
      improvement = 100; // Optimized succeeded where original failed
    } else if (originalResult.success && !optimizedResult.success) {
      improvement = -100; // Original succeeded where optimized failed
    }
    
    results.push({
      query,
      original: originalResult,
      optimized: optimizedResult,
      improvement
    });
    
    if (improvement > 0) {
      console.log(`🚀 Performance improvement: ${improvement.toFixed(1)}% faster`);
    } else if (improvement < 0) {
      console.log(`⚠️ Performance regression: ${Math.abs(improvement).toFixed(1)}% slower`);
    } else {
      console.log(`➡️ No significant performance change`);
    }
    
    // Longer pause between queries
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 PERFORMANCE SUMMARY REPORT');
  console.log('═'.repeat(60));
  
  // Success rate comparison
  const originalSuccesses = results.filter(r => r.original.success).length;
  const optimizedSuccesses = results.filter(r => r.optimized.success).length;
  
  console.log('\n✅ Success Rates:');
  console.log(`  Original:  ${originalSuccesses}/${results.length} (${(originalSuccesses/results.length*100).toFixed(1)}%)`);
  console.log(`  Optimized: ${optimizedSuccesses}/${results.length} (${(optimizedSuccesses/results.length*100).toFixed(1)}%)`);
  
  // Average response times (successful queries only)
  const successfulOriginal = results.filter(r => r.original.success);
  const successfulOptimized = results.filter(r => r.optimized.success);
  
  if (successfulOriginal.length > 0) {
    const avgOriginal = successfulOriginal.reduce((sum, r) => sum + r.original.timeMs, 0) / successfulOriginal.length;
    console.log(`\n⏱️ Average Response Times (successful queries):`);
    console.log(`  Original:  ${avgOriginal.toFixed(0)}ms`);
  }
  
  if (successfulOptimized.length > 0) {
    const avgOptimized = successfulOptimized.reduce((sum, r) => sum + r.optimized.timeMs, 0) / successfulOptimized.length;
    console.log(`  Optimized: ${avgOptimized.toFixed(0)}ms`);
  }
  
  // Timeout analysis
  const originalTimeouts = results.filter(r => r.original.error === 'Timeout').length;
  const optimizedTimeouts = results.filter(r => r.optimized.error === 'Timeout').length;
  
  console.log('\n⏱️ Timeout Analysis:');
  console.log(`  Original timeouts:  ${originalTimeouts}`);
  console.log(`  Optimized timeouts: ${optimizedTimeouts}`);
  
  // Individual query improvements
  console.log('\n📈 Per-Query Performance:');
  results.forEach(r => {
    const symbol = r.improvement > 50 ? '🚀' : 
                   r.improvement > 20 ? '⚡' : 
                   r.improvement > 0 ? '✅' : 
                   r.improvement < 0 ? '❌' : '➡️';
    
    console.log(`  ${symbol} "${r.query}"`);
    
    if (r.original.success && r.optimized.success) {
      console.log(`     Original: ${r.original.timeMs}ms → Optimized: ${r.optimized.timeMs}ms`);
      console.log(`     Improvement: ${r.improvement > 0 ? '+' : ''}${r.improvement.toFixed(1)}%`);
    } else if (!r.original.success && r.optimized.success) {
      console.log(`     Original: FAILED → Optimized: ${r.optimized.timeMs}ms ✅`);
    } else if (r.original.success && !r.optimized.success) {
      console.log(`     Original: ${r.original.timeMs}ms → Optimized: FAILED ❌`);
    } else {
      console.log(`     Both failed`);
    }
  });
  
  // Overall verdict
  console.log('\n' + '═'.repeat(60));
  console.log('🎯 VERDICT:');
  
  const avgImprovement = results
    .filter(r => r.original.success && r.optimized.success)
    .reduce((sum, r) => sum + r.improvement, 0) / 
    results.filter(r => r.original.success && r.optimized.success).length || 0;
  
  if (optimizedSuccesses > originalSuccesses) {
    console.log('✅ OPTIMIZED VERSION IS MORE RELIABLE');
  } else if (optimizedSuccesses < originalSuccesses) {
    console.log('⚠️ OPTIMIZED VERSION IS LESS RELIABLE');
  }
  
  if (avgImprovement > 50) {
    console.log('🚀 SIGNIFICANT PERFORMANCE IMPROVEMENT');
    console.log(`   Average improvement: ${avgImprovement.toFixed(1)}% faster`);
  } else if (avgImprovement > 20) {
    console.log('⚡ GOOD PERFORMANCE IMPROVEMENT');
    console.log(`   Average improvement: ${avgImprovement.toFixed(1)}% faster`);
  } else if (avgImprovement > 0) {
    console.log('✅ MODERATE PERFORMANCE IMPROVEMENT');
    console.log(`   Average improvement: ${avgImprovement.toFixed(1)}% faster`);
  } else {
    console.log('❌ NO SIGNIFICANT IMPROVEMENT');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (optimizedTimeouts < originalTimeouts) {
    console.log('  ✅ Optimized version successfully reduces timeouts');
  }
  
  if (avgImprovement > 20 && optimizedSuccesses >= originalSuccesses) {
    console.log('  ✅ Deploy the optimized version to production');
  } else if (optimizedSuccesses > originalSuccesses) {
    console.log('  ✅ Optimized version improves reliability');
  } else {
    console.log('  ⚠️ Further optimization may be needed');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ COMPARISON TEST COMPLETE');
  console.log('═'.repeat(60));
}

// Run the comparison
console.log('🚀 Starting Performance Comparison...\n');
runComparison()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });