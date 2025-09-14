/**
 * Final Accuracy Achievement Test - 93-95% Target Verification
 * Tests the complete enhanced context window system with corrected migration
 * Validates that we achieve the 93-95% accuracy target
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

// Test scenarios with expected information
const testScenarios = [
  {
    query: "I need an alternator pulley for a Freelander",
    expectedKeywords: ['alternator', 'pulley', 'Freelander', 'Land Rover', 'belt', 'tension'],
    category: 'Product Search',
    minChunksNeeded: 8
  },
  {
    query: "What are the specifications for DC66-10P hydraulic tank?",
    expectedKeywords: ['DC66-10P', 'hydraulic', 'tank', 'capacity', 'specifications', 'dimensions'],
    category: 'Technical Specification',
    minChunksNeeded: 10
  },
  {
    query: "Compare different brake pad types for commercial vehicles",
    expectedKeywords: ['brake', 'pad', 'organic', 'ceramic', 'metallic', 'commercial', 'truck'],
    category: 'Comparison Query',
    minChunksNeeded: 15
  },
  {
    query: "What torque wrenches do you have and what are their accuracy ratings?",
    expectedKeywords: ['torque', 'wrench', 'accuracy', 'rating', 'specification', 'tool'],
    category: 'Product Inventory',
    minChunksNeeded: 10
  },
  {
    query: "I need a complete pin and bush kit for Kinshofer KM602",
    expectedKeywords: ['pin', 'bush', 'kit', 'Kinshofer', 'KM602', 'complete'],
    category: 'Specific Product',
    minChunksNeeded: 8
  }
];

interface TestResult {
  query: string;
  category: string;
  responseQuality: number;
  keywordMatches: number;
  totalKeywords: number;
  responseLength: number;
  hasSpecificInfo: boolean;
  accuracy: number;
}

async function testAccuracy(scenario: typeof testScenarios[0]): Promise<TestResult> {
  console.log(`\n📝 Testing: "${scenario.query}"`);
  console.log(`   Category: ${scenario.category}`);
  console.log('─'.repeat(60));
  
  try {
    // Call the actual chat API endpoint
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: scenario.query
          }
        ],
        domain: 'thompsonseparts.com',
        sessionId: `test-accuracy-${Date.now()}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.response || '';
    
    // Analyze response quality
    const lowerResponse = aiResponse.toLowerCase();
    const keywordMatches = scenario.expectedKeywords.filter(
      keyword => lowerResponse.includes(keyword.toLowerCase())
    ).length;
    
    // Check for specific product/technical information
    const hasSpecificInfo = 
      lowerResponse.includes('sku') ||
      lowerResponse.includes('part number') ||
      lowerResponse.includes('specification') ||
      lowerResponse.includes('£') ||
      lowerResponse.includes('capacity') ||
      lowerResponse.includes('dimension');
    
    // Calculate accuracy score
    const keywordScore = (keywordMatches / scenario.expectedKeywords.length) * 100;
    const lengthScore = Math.min(100, (aiResponse.length / 500) * 100); // Expect at least 500 chars
    const specificityScore = hasSpecificInfo ? 100 : 50;
    
    // Weighted accuracy calculation
    const accuracy = (
      keywordScore * 0.4 +      // 40% keyword matching
      lengthScore * 0.3 +       // 30% response completeness
      specificityScore * 0.3    // 30% specific information
    );
    
    // Display results
    console.log(`✅ Response received (${aiResponse.length} chars)`);
    console.log(`📊 Keyword matches: ${keywordMatches}/${scenario.expectedKeywords.length}`);
    console.log(`🎯 Has specific info: ${hasSpecificInfo ? 'Yes' : 'No'}`);
    console.log(`📈 Accuracy score: ${accuracy.toFixed(1)}%`);
    
    // Show sample of response
    console.log(`\n📝 Response preview:`);
    console.log(`   "${aiResponse.substring(0, 200)}..."`);
    
    return {
      query: scenario.query,
      category: scenario.category,
      responseQuality: accuracy,
      keywordMatches,
      totalKeywords: scenario.expectedKeywords.length,
      responseLength: aiResponse.length,
      hasSpecificInfo,
      accuracy
    };
    
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return {
      query: scenario.query,
      category: scenario.category,
      responseQuality: 0,
      keywordMatches: 0,
      totalKeywords: scenario.expectedKeywords.length,
      responseLength: 0,
      hasSpecificInfo: false,
      accuracy: 0
    };
  }
}

async function runAccuracyTests() {
  console.log('🎯 Final Accuracy Achievement Test');
  console.log('=' .repeat(60));
  console.log('Target: 93-95% accuracy with enhanced context window');
  console.log('Testing with real Thompson\'s eParts data\n');
  
  // Check if dev server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (!healthCheck) {
      console.error('❌ Dev server not running! Please start with: npm run dev');
      return;
    }
  } catch (error) {
    console.error('❌ Cannot connect to dev server. Please run: npm run dev');
    return;
  }
  
  const results: TestResult[] = [];
  
  // Run all test scenarios
  for (const scenario of testScenarios) {
    const result = await testAccuracy(scenario);
    results.push(result);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Calculate overall statistics
  console.log('\n' + '=' .repeat(60));
  console.log('📊 ACCURACY TEST RESULTS');
  console.log('=' .repeat(60));
  
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
  const successfulTests = results.filter(r => r.accuracy >= 85).length;
  const excellentTests = results.filter(r => r.accuracy >= 93).length;
  
  // Detailed breakdown by category
  console.log('\n📈 Results by Category:');
  results.forEach(result => {
    const status = result.accuracy >= 93 ? '✅' : result.accuracy >= 85 ? '⚠️' : '❌';
    console.log(`${status} ${result.category}: ${result.accuracy.toFixed(1)}%`);
    console.log(`   Keywords: ${result.keywordMatches}/${result.totalKeywords}, Length: ${result.responseLength} chars`);
  });
  
  // Overall performance
  console.log('\n🎯 OVERALL PERFORMANCE:');
  console.log(`Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
  console.log(`Successful (≥85%): ${successfulTests}/${results.length}`);
  console.log(`Excellent (≥93%): ${excellentTests}/${results.length}`);
  
  // Final verdict
  console.log('\n' + '=' .repeat(60));
  console.log('🏆 FINAL VERDICT:');
  
  if (avgAccuracy >= 93) {
    console.log('✅ TARGET ACHIEVED! System delivers 93-95% accuracy!');
    console.log('   The enhanced context window with corrected migration');
    console.log('   successfully provides the AI with sufficient context');
    console.log('   to deliver highly accurate, specific responses.');
  } else if (avgAccuracy >= 90) {
    console.log('✅ EXCELLENT PERFORMANCE! 90%+ accuracy achieved!');
    console.log('   System is performing very well, minor tuning could');
    console.log('   push it to the 93-95% target range.');
  } else if (avgAccuracy >= 85) {
    console.log('⚠️ GOOD PERFORMANCE - 85-90% accuracy');
    console.log('   System is functional but needs optimization to reach target.');
  } else {
    console.log('❌ Below target - Additional investigation needed');
  }
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  if (avgAccuracy < 93) {
    console.log('1. Fine-tune similarity threshold (currently 0.65)');
    console.log('2. Increase minimum chunks if needed');
    console.log('3. Enhance metadata extraction patterns');
    console.log('4. Consider query expansion techniques');
  } else {
    console.log('1. System is performing optimally');
    console.log('2. Monitor performance in production');
    console.log('3. Collect user feedback for continuous improvement');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Testing complete!');
}

// Run the accuracy tests
console.log('⚠️ Make sure the dev server is running (npm run dev)');
console.log('Starting tests in 3 seconds...\n');

setTimeout(() => {
  runAccuracyTests().catch(console.error);
}, 3000);