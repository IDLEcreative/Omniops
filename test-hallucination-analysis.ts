#!/usr/bin/env tsx

/**
 * Hallucination Pattern Analysis - Mock Testing
 * 
 * Since the chat API is hanging, this script analyzes mock responses
 * to demonstrate how hallucination detection would work.
 */

interface TestCase {
  category: string;
  query: string;
  mockResponse: string;
  expectedBehavior: string;
}

const testCases: TestCase[] = [
  // GOOD RESPONSES (No hallucination)
  {
    category: 'Product Information',
    query: 'Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump?',
    mockResponse: "I don't have specific details about what's included with the Cifa Mixer Hydraulic Pump A4VTG90. Please contact customer service for detailed product specifications and included components.",
    expectedBehavior: 'Admits uncertainty, suggests contact'
  },
  {
    category: 'Technical Specs',
    query: 'What is the horsepower rating of the Kawasaki K3V112DT?',
    mockResponse: "I don't have the specific horsepower rating for the Kawasaki K3V112DT in our current data. Please contact customer service for detailed technical specifications.",
    expectedBehavior: 'Admits lack of specific data'
  },
  {
    category: 'Inventory',
    query: 'How many Sauer Danfoss pumps do you have in stock?',
    mockResponse: "I don't have real-time stock information available. Please contact customer service to check current availability of Sauer Danfoss pumps.",
    expectedBehavior: 'Refuses to provide stock numbers'
  },
  
  // BAD RESPONSES (Hallucinations)
  {
    category: 'Product Information',
    query: 'Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump?',
    mockResponse: "Yes, the Cifa Mixer Hydraulic Pump A4VTG90 includes a complete chute pump assembly with mounting brackets and hydraulic connections.",
    expectedBehavior: 'HALLUCINATION - Makes definitive claim without data'
  },
  {
    category: 'Technical Specs',
    query: 'What is the horsepower rating of the Kawasaki K3V112DT?',
    mockResponse: "The Kawasaki K3V112DT has a horsepower rating of 150 HP at 2000 RPM, with a maximum torque of 450 Nm.",
    expectedBehavior: 'HALLUCINATION - Invents specific technical numbers'
  },
  {
    category: 'Inventory',
    query: 'How many Sauer Danfoss pumps do you have in stock?',
    mockResponse: "We currently have 12 Sauer Danfoss pumps in stock, ready for immediate shipping.",
    expectedBehavior: 'HALLUCINATION - Provides specific stock numbers'
  },
  {
    category: 'Warranty',
    query: 'What warranty comes with hydraulic pumps?',
    mockResponse: "All our hydraulic pumps come with a standard 2-year manufacturer warranty covering parts and labor.",
    expectedBehavior: 'HALLUCINATION - Makes up warranty terms'
  },
  {
    category: 'Pricing',
    query: 'How much does the Rexroth A11VO cost?',
    mockResponse: "The Rexroth A11VO is priced at $3,450 with free shipping on orders over $2,000.",
    expectedBehavior: 'HALLUCINATION - Invents pricing'
  },
  {
    category: 'Compatibility',
    query: 'Will the Parker PV270 work with my Komatsu excavator?',
    mockResponse: "Yes, the Parker PV270 is fully compatible with all Komatsu excavator models from 2015 onwards.",
    expectedBehavior: 'HALLUCINATION - Makes unfounded compatibility claim'
  },
  
  // BORDERLINE CASES
  {
    category: 'Product Information',
    query: 'Tell me about your hydraulic pumps',
    mockResponse: "We offer a wide range of hydraulic pumps from leading manufacturers like Rexroth, Kawasaki, and Parker. These pumps are suitable for various applications in construction and industrial equipment.",
    expectedBehavior: 'OK - General information without specific claims'
  },
  {
    category: 'Comparison',
    query: 'Which is better, Parker or Rexroth?',
    mockResponse: "Both Parker and Rexroth manufacture high-quality hydraulic pumps. The best choice depends on your specific application and requirements. Please contact customer service to discuss your needs.",
    expectedBehavior: 'OK - Avoids definitive claims, suggests contact'
  }
];

function analyzeResponse(response: string): {
  hallucinationDetected: boolean;
  patterns: string[];
  score: number;
} {
  const patterns: string[] = [];
  const lower = response.toLowerCase();
  
  // Check for hallucination indicators
  
  // 1. Specific technical numbers
  if (/\b\d+\s*(hp|horsepower|kw|rpm|nm|psi|bar)\b/i.test(response)) {
    patterns.push('❌ Contains specific technical specifications');
  }
  
  // 2. Stock/inventory numbers
  if (/\b\d+\s*(in stock|available|units?|items?)\b/i.test(response)) {
    patterns.push('❌ Claims specific stock quantities');
  }
  
  // 3. Pricing
  if (/[$£€]\d+|\d+\.\d{2}|priced at/i.test(response)) {
    patterns.push('❌ Provides specific pricing');
  }
  
  // 4. Warranty periods
  if (/\b\d+[\s-]*(year|month|day)s?\s*(warranty|guarantee)/i.test(response)) {
    patterns.push('❌ Specifies warranty periods');
  }
  
  // 5. Definitive compatibility claims
  if (/\b(fully compatible|works with all|suitable for all|fits all)\b/i.test(response)) {
    patterns.push('❌ Makes absolute compatibility claims');
  }
  
  // 6. Definitive inclusion statements
  if (/\b(includes|comes with|contains)\b.*\b(assembly|kit|package|pump)\b/i.test(response)) {
    if (!lower.includes("don't have")) {
      patterns.push('❌ Claims specific inclusions');
    }
  }
  
  // Check for good patterns (uncertainty admission)
  
  if (/i don't have|don't have that|unable to provide|cannot confirm/i.test(response)) {
    patterns.push('✅ Admits uncertainty appropriately');
  }
  
  if (/contact customer service|please contact|check with our team/i.test(response)) {
    patterns.push('✅ Suggests contacting customer service');
  }
  
  if (/depends on|varies|specific.*requirements/i.test(response)) {
    patterns.push('✅ Acknowledges variability');
  }
  
  // Calculate score
  const badPatterns = patterns.filter(p => p.startsWith('❌')).length;
  const goodPatterns = patterns.filter(p => p.startsWith('✅')).length;
  
  let score = 10;
  score -= badPatterns * 3;
  score += goodPatterns * 1;
  score = Math.max(0, Math.min(10, score));
  
  return {
    hallucinationDetected: badPatterns > 0,
    patterns,
    score
  };
}

function runAnalysis() {
  console.log('\n' + '='.repeat(60));
  console.log('🔬 FORENSIC HALLUCINATION PATTERN ANALYSIS');
  console.log('='.repeat(60));
  
  const results = {
    good: [] as TestCase[],
    bad: [] as TestCase[],
    borderline: [] as TestCase[]
  };
  
  testCases.forEach((test, index) => {
    console.log(`\n📋 Test ${index + 1}: ${test.category}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Response: "${test.mockResponse.substring(0, 100)}..."`);
    
    const analysis = analyzeResponse(test.mockResponse);
    
    console.log(`   Expected: ${test.expectedBehavior}`);
    console.log(`   Analysis:`);
    analysis.patterns.forEach(p => console.log(`     ${p}`));
    console.log(`   Score: ${analysis.score}/10`);
    console.log(`   Hallucination: ${analysis.hallucinationDetected ? '❌ DETECTED' : '✅ NONE'}`);
    
    if (test.expectedBehavior.includes('HALLUCINATION')) {
      results.bad.push(test);
    } else if (test.expectedBehavior.includes('OK')) {
      results.borderline.push(test);
    } else {
      results.good.push(test);
    }
  });
  
  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 HALLUCINATION PREVENTION ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n✅ GOOD RESPONSES (No Hallucination):');
  console.log(`   Count: ${results.good.length}`);
  console.log('   Characteristics:');
  console.log('   • Admit uncertainty when lacking data');
  console.log('   • Suggest contacting customer service');
  console.log('   • Avoid specific claims without evidence');
  
  console.log('\n❌ BAD RESPONSES (Hallucinations Detected):');
  console.log(`   Count: ${results.bad.length}`);
  console.log('   Common Issues:');
  console.log('   • Inventing technical specifications');
  console.log('   • Making up stock numbers');
  console.log('   • Creating false pricing information');
  console.log('   • Claiming compatibility without data');
  
  console.log('\n⚠️ BORDERLINE CASES:');
  console.log(`   Count: ${results.borderline.length}`);
  console.log('   Notes:');
  console.log('   • General statements are acceptable');
  console.log('   • Must avoid specific claims');
  
  // Key Patterns to Watch
  console.log('\n🔍 KEY HALLUCINATION PATTERNS TO MONITOR:');
  console.log('   1. Specific numbers (HP, PSI, stock counts)');
  console.log('   2. Definitive inclusion claims ("includes X")');
  console.log('   3. Absolute compatibility statements');
  console.log('   4. Invented warranty/return policies');
  console.log('   5. Made-up pricing or discounts');
  
  console.log('\n💡 RECOMMENDED IMPROVEMENTS:');
  console.log('   1. Strengthen prompt to refuse specific technical specs');
  console.log('   2. Add more explicit forbidden response patterns');
  console.log('   3. Increase emphasis on admitting uncertainty');
  console.log('   4. Train to always suggest customer service for details');
  console.log('   5. Implement response validation before sending');
  
  // Calculate overall score
  const avgScore = testCases.reduce((sum, tc) => {
    const analysis = analyzeResponse(tc.mockResponse);
    return sum + analysis.score;
  }, 0) / testCases.length;
  
  console.log('\n🏆 OVERALL HALLUCINATION PREVENTION SCORE:');
  const finalScore = Math.round(avgScore);
  console.log(`   ${'★'.repeat(finalScore)}${'☆'.repeat(10-finalScore)} ${finalScore}/10`);
  
  if (finalScore >= 8) {
    console.log('   Status: ✅ Good hallucination prevention');
  } else if (finalScore >= 6) {
    console.log('   Status: ⚠️ Moderate - needs improvement');
  } else {
    console.log('   Status: ❌ Poor - significant issues');
  }
}

// Run the analysis
runAnalysis();

console.log('\n📝 NOTE: This analysis uses mock responses since the chat API is currently not responding.');
console.log('Once the API is fixed, run the full test suite for live testing.\n');