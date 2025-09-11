#!/usr/bin/env node

/**
 * Comprehensive Category Matching Algorithm Comparison
 * Tests more challenging scenarios to reveal algorithm differences
 */

// ============================================================================
// ALGORITHMS (same as before)
// ============================================================================
function currentAlgorithm(query, categoryName) {
  const msg = query.toLowerCase();
  const tokens = new Set(msg.split(/[^a-z0-9]+/i).filter(Boolean));
  
  const name = (categoryName || '').toLowerCase();
  const nameTokens = new Set(name.split(/[^a-z0-9]+/i).filter(Boolean));
  
  let score = 0;
  nameTokens.forEach(t => { if (tokens.has(t)) score += 1; });
  
  // Direct phrase match bonus
  if (score === 0 && name && msg.includes(name)) score += 2;
  
  return score;
}

function proposedAlgorithm(query, categoryName) {
  const queryLower = query.toLowerCase();
  const categoryLower = categoryName.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  const categoryWords = categoryLower.split(/\s+/).filter(Boolean);
  
  let score = 0;
  
  // 1. Exact substring match (highest priority)
  if (categoryLower.includes(queryLower.trim())) {
    score += 15;
  }
  
  // 2. Multi-word phrase matches
  if (queryWords.length > 1) {
    for (let i = 0; i < queryWords.length - 1; i++) {
      const bigram = `${queryWords[i]} ${queryWords[i + 1]}`;
      if (categoryLower.includes(bigram)) {
        score += 8;
      }
    }
  }
  
  // 3. Brand matching with high priority
  const brands = ['kinshofer', 'teng', 'cifa', 'blue spot', 'dewalt', 'makita', 'bosch', 'cat', 'caterpillar', 'jcb'];
  let brandMatchFound = false;
  brands.forEach(brand => {
    if (queryLower.includes(brand) && categoryLower.includes(brand)) {
      score += 12;
      brandMatchFound = true;
    }
  });
  
  // 4. Individual word matches
  const commonGenericWords = new Set([
    'kit', 'kits', 'set', 'sets', 'tool', 'tools', 'part', 'parts', 
    'system', 'systems', 'unit', 'units', 'equipment', 'components'
  ]);
  
  queryWords.forEach(word => {
    if (word.length < 2) return;
    
    if (categoryWords.includes(word)) {
      if (commonGenericWords.has(word)) {
        score += 1; // Lower score for generic words
      } else {
        score += brandMatchFound ? 2 : 4; // Lower individual word scores if brand already matched
      }
    }
  });
  
  return Math.round(score * 10) / 10;
}

// ============================================================================
// COMPREHENSIVE TEST SCENARIOS
// ============================================================================
const testScenarios = [
  {
    name: "Brand vs Product Type Priority",
    query: "Teng torque wrenches", 
    categories: [
      "Teng Tools", // Should win - brand match
      "Torque Wrenches", // Product type match
      "Blue Spot Tools",
      "Wrenches & Spanners"
    ],
    expectedWinner: "Teng Tools",
    reasoning: "Brand should take priority over generic product type"
  },
  
  {
    name: "Specific vs Generic Terms",
    query: "hydraulic excavator parts",
    categories: [
      "Excavator Hydraulic Components", // More specific
      "Hydraulic Parts", // Generic
      "Excavator Parts", // Generic  
      "General Parts"
    ],
    expectedWinner: "Excavator Hydraulic Components",
    reasoning: "More specific multi-word match should win"
  },
  
  {
    name: "Phrase Order Sensitivity", 
    query: "door seal kit",
    categories: [
      "Door Seal Kits", // Exact phrase match
      "Seal Door Components", // Words reversed
      "Sealing Kits", // Partial match
      "Door Parts & Seals" // Words separated
    ],
    expectedWinner: "Door Seal Kits",
    reasoning: "Exact phrase order should score highest"
  },
  
  {
    name: "Generic Word Dilution",
    query: "air filter kit", 
    categories: [
      "Air Filter Kits", // Perfect match but has 'kit'
      "Air Filters", // Specific without generic
      "Filter Kits", // Generic + generic
      "Automotive Air Filters" // Specific + specific
    ],
    expectedWinner: "Air Filter Kits",
    reasoning: "Perfect match should win despite generic 'kit'"
  },
  
  {
    name: "Complex Multi-Brand Query",
    query: "JCB hydraulic pump seal kit",
    categories: [
      "JCB Hydraulic Parts", // Brand + general
      "Hydraulic Pump Seals", // Product specific
      "Pump Seal Kits", // Product + generic
      "JCB Service Kits", // Brand + generic
      "Hydraulic Seal Kits" // Product + generic
    ],
    expectedWinner: "JCB Hydraulic Parts", 
    reasoning: "Brand match should take priority in complex queries"
  },
  
  {
    name: "Substring vs Token Matching",
    query: "engine cooling fan",
    categories: [
      "Engine Cooling Systems", // Partial phrase match
      "Cooling Fans", // Partial phrase match
      "Engine Fans & Cooling", // All words but different order
      "Fan Assemblies", // Single word
      "Engine Components" // Single word
    ],
    expectedWinner: "Engine Cooling Systems",
    reasoning: "Longer phrase matches should score higher"
  },
  
  {
    name: "Ambiguous Generic Terms",
    query: "rubber seal",
    categories: [
      "Rubber Seals & Gaskets", // Exact + more
      "Sealing Solutions", // Generic alternative
      "Rubber Components", // Material match
      "Hydraulic Seals", // Application specific
      "Engine Seals" // Application specific
    ],
    expectedWinner: "Rubber Seals & Gaskets",
    reasoning: "Exact phrase match with additional context"
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================
console.log('🔬 Comprehensive Category Matching Algorithm Test\n');
console.log('=' .repeat(80));

let improvements = 0;
let regressions = 0;
let ties = 0;
let bothWrong = 0;

testScenarios.forEach((scenario, index) => {
  console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
  console.log(`Query: "${scenario.query}"`);
  console.log(`Expected: "${scenario.expectedWinner}"`);
  console.log(`Reasoning: ${scenario.reasoning}`);
  console.log('-'.repeat(70));
  
  // Score with both algorithms
  const currentResults = scenario.categories.map(cat => ({
    category: cat,
    score: currentAlgorithm(scenario.query, cat)
  })).sort((a, b) => b.score - a.score);
  
  const proposedResults = scenario.categories.map(cat => ({
    category: cat, 
    score: proposedAlgorithm(scenario.query, cat)
  })).sort((a, b) => b.score - a.score);
  
  // Display results
  console.log('\n🔍 CURRENT Algorithm:');
  currentResults.forEach((result, i) => {
    const marker = i === 0 ? '👑' : '  ';
    const isExpected = result.category === scenario.expectedWinner ? ' ✅' : '';
    console.log(`${marker} ${result.category}: ${result.score}${isExpected}`);
  });
  
  console.log('\n🚀 PROPOSED Algorithm:');
  proposedResults.forEach((result, i) => {
    const marker = i === 0 ? '👑' : '  ';  
    const isExpected = result.category === scenario.expectedWinner ? ' ✅' : '';
    console.log(`${marker} ${result.category}: ${result.score}${isExpected}`);
  });
  
  // Analyze winners
  const currentWinner = currentResults[0].category;
  const proposedWinner = proposedResults[0].category;
  const expected = scenario.expectedWinner;
  
  console.log('\n📊 Analysis:');
  const currentCorrect = currentWinner === expected;
  const proposedCorrect = proposedWinner === expected;
  
  if (currentCorrect && proposedCorrect) {
    console.log('🤝 Both algorithms correct');
    ties++;
  } else if (proposedCorrect && !currentCorrect) {
    console.log('🎉 PROPOSED wins - Fixed the issue!');
    improvements++;
  } else if (currentCorrect && !proposedCorrect) {
    console.log('😔 CURRENT wins - Proposed regressed');
    regressions++;
  } else {
    console.log('❌ Both algorithms wrong');
    bothWrong++;
  }
  
  // Show confidence levels
  const currentConfidence = currentResults[0].score - (currentResults[1]?.score || 0);
  const proposedConfidence = proposedResults[0].score - (proposedResults[1]?.score || 0);
  console.log(`Confidence gap - Current: ${currentConfidence}, Proposed: ${Math.round(proposedConfidence * 10) / 10}`);
});

// ============================================================================
// DETAILED SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('📊 COMPREHENSIVE TEST RESULTS');
console.log('='.repeat(80));

const total = testScenarios.length;
console.log(`\nTotal Scenarios: ${total}`);
console.log(`🎉 Proposed Improvements: ${improvements} (${Math.round(improvements/total*100)}%)`);  
console.log(`🤝 Both Correct: ${ties} (${Math.round(ties/total*100)}%)`);
console.log(`😔 Proposed Regressions: ${regressions} (${Math.round(regressions/total*100)}%)`);
console.log(`❌ Both Wrong: ${bothWrong} (${Math.round(bothWrong/total*100)}%)`);

const netImprovement = improvements - regressions;
console.log(`\n📈 Net Improvement: ${netImprovement > 0 ? '+' : ''}${netImprovement} scenarios`);

if (netImprovement > 0) {
  console.log('\n✅ RECOMMENDATION: IMPLEMENT the proposed algorithm');
  console.log(`   📊 Fixes ${improvements} issues vs ${regressions} new issues`);
  console.log('   🎯 Key benefits:');
  console.log('     • Better brand recognition and prioritization');
  console.log('     • Improved multi-word phrase matching');
  console.log('     • More confident scoring (reduces ties)'); 
  console.log('     • Weighted scoring reduces generic word noise');
} else if (netImprovement < 0) {
  console.log('\n❌ RECOMMENDATION: Keep current algorithm');
  console.log(`   📊 Would cause ${Math.abs(netImprovement)} net regressions`);
} else {
  console.log('\n🤷 RECOMMENDATION: Similar performance');
  console.log('   📊 Consider other factors like maintainability');
}

console.log('\n🔍 Algorithm Differences Analysis:');
console.log('┌─────────────────────┬─────────────────────┬─────────────────────┐');
console.log('│ Feature             │ Current Algorithm   │ Proposed Algorithm  │');
console.log('├─────────────────────┼─────────────────────┼─────────────────────┤');
console.log('│ Token Matching      │ Simple 1:1 overlap  │ Weighted by word    │');
console.log('│ Phrase Recognition  │ Basic substring     │ Multi-word phrases  │'); 
console.log('│ Brand Priority      │ None               │ High priority       │');
console.log('│ Generic Word Handle │ Equal weight       │ Reduced weight      │');
console.log('│ Confidence Scoring  │ Low differentiation│ High differentiation│');
console.log('└─────────────────────┴─────────────────────┴─────────────────────┘');

console.log('\n✨ Test completed - Ready for implementation decision!');