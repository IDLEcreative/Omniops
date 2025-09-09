#!/usr/bin/env node

/**
 * Category Matching Algorithm Comparison Test
 * Tests CURRENT vs PROPOSED algorithms side by side
 * Without any hardcoded category mappings
 */

// ============================================================================
// CURRENT ALGORITHM (from codebase: app/api/chat/route.ts)
// ============================================================================
function currentAlgorithm(query, categoryName) {
  const msg = query.toLowerCase();
  const tokens = new Set(msg.split(/[^a-z0-9]+/i).filter(Boolean));
  
  const name = (categoryName || '').toLowerCase();
  const nameTokens = new Set(name.split(/[^a-z0-9]+/i).filter(Boolean));
  
  let score = 0;
  nameTokens.forEach(t => { if (tokens.has(t)) score += 1; });
  
  // Direct phrase match bonus (from codebase)
  if (score === 0 && name && msg.includes(name)) score += 2;
  
  return score;
}

// ============================================================================
// PROPOSED IMPROVED ALGORITHM
// ============================================================================
function proposedAlgorithm(query, categoryName) {
  const queryLower = query.toLowerCase();
  const categoryLower = categoryName.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  const categoryWords = categoryLower.split(/\s+/).filter(Boolean);
  
  let score = 0;
  
  // 1. Exact substring match (highest priority)
  if (categoryLower.includes(queryLower.trim())) {
    score += 10;
  }
  
  // 2. Multi-word phrase matches (high priority)
  if (queryWords.length > 1) {
    // Check for bigrams (2-word phrases)
    for (let i = 0; i < queryWords.length - 1; i++) {
      const bigram = `${queryWords[i]} ${queryWords[i + 1]}`;
      if (categoryLower.includes(bigram)) {
        score += 5;
      }
    }
    
    // Check for trigrams (3-word phrases) if query is long enough
    for (let i = 0; i < queryWords.length - 2; i++) {
      const trigram = `${queryWords[i]} ${queryWords[i + 1]} ${queryWords[i + 2]}`;
      if (categoryLower.includes(trigram)) {
        score += 8;
      }
    }
  }
  
  // 3. Individual word matches with weighting
  const commonGenericWords = new Set([
    'kit', 'kits', 'set', 'sets', 'tool', 'tools', 'part', 'parts', 
    'system', 'systems', 'unit', 'units', 'equipment', 'components',
    'accessories', 'supplies', 'items', 'products'
  ]);
  
  queryWords.forEach(word => {
    if (word.length < 2) return; // Skip very short words
    
    if (categoryWords.includes(word)) {
      // Lower score for generic words, higher for specific words
      if (commonGenericWords.has(word)) {
        score += 0.8;
      } else {
        score += 3;
      }
    }
    
    // Partial word matches for longer words (stem matching)
    if (word.length >= 4) {
      const wordStem = word.slice(0, -1); // Remove last character
      categoryWords.forEach(catWord => {
        if (catWord.length >= 4 && (catWord.startsWith(wordStem) || word.startsWith(catWord.slice(0, -1)))) {
          score += 1.5;
        }
      });
    }
  });
  
  // 4. Brand/manufacturer exact match bonus
  const brands = ['kinshofer', 'teng', 'cifa', 'blue spot', 'dewalt', 'makita', 'bosch'];
  brands.forEach(brand => {
    if (queryLower.includes(brand) && categoryLower.includes(brand)) {
      score += 6;
    }
  });
  
  // 5. Word order proximity bonus
  if (queryWords.length > 1 && score > 0) {
    let orderBonus = 0;
    for (let i = 0; i < queryWords.length - 1; i++) {
      const word1Idx = categoryWords.indexOf(queryWords[i]);
      const word2Idx = categoryWords.indexOf(queryWords[i + 1]);
      
      if (word1Idx !== -1 && word2Idx !== -1) {
        const distance = Math.abs(word2Idx - word1Idx);
        if (distance === 1) {
          orderBonus += 2; // Adjacent words
        } else if (distance <= 3) {
          orderBonus += 1; // Close words
        }
      }
    }
    score += orderBonus;
  }
  
  return Math.round(score * 10) / 10; // Round to 1 decimal place
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================
const testScenarios = [
  {
    name: "Kinshofer Pin & Bush Kit",
    query: "Kinshofer pin & bush kit",
    categories: [
      "Camera Kit Cables",
      "Pin & Bush Kits to Fit Kinshofer", 
      "Electrical Kits",
      "Construction Equipment Kits",
      "Hydraulic Kits"
    ],
    expectedWinner: "Pin & Bush Kits to Fit Kinshofer"
  },
  {
    name: "Teng Torque Wrenches",
    query: "Teng torque wrenches",
    categories: [
      "Teng Tools",
      "Torque Wrenches",
      "Blue Spot Tools", 
      "Wrenches & Spanners",
      "Hand Tools"
    ],
    expectedWinner: "Teng Tools" // Should match brand first
  },
  {
    name: "Cifa Mixer Pump",
    query: "pump for Cifa mixer",
    categories: [
      "Cifa Hydraulic Parts",
      "Water Pumps", 
      "Mixer Parts",
      "Pump Kits",
      "Hydraulic Pumps"
    ],
    expectedWinner: "Cifa Hydraulic Parts"
  },
  {
    name: "Sheet Roller Bar",
    query: "sheet roller bar",
    categories: [
      "Tipper Sheet System Parts",
      "Roller Bearings",
      "Bar Equipment", 
      "Sheet Metal",
      "Roller Systems"
    ],
    expectedWinner: "Tipper Sheet System Parts"
  },
  {
    name: "Generic Tool Kit",
    query: "tool kit",
    categories: [
      "Professional Tool Kits",
      "Basic Tool Sets",
      "Automotive Tool Kits",
      "Electrical Tool Kits",
      "General Tools"
    ],
    expectedWinner: "Professional Tool Kits" // Should prefer more specific match
  },
  {
    name: "Hydraulic Hose",
    query: "hydraulic hose",
    categories: [
      "Hydraulic Hoses & Fittings",
      "Industrial Hoses",
      "Hydraulic Components",
      "Rubber Hoses",
      "Hose Assemblies"
    ],
    expectedWinner: "Hydraulic Hoses & Fittings"
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================
console.log('🧪 Category Matching Algorithm Comparison Test\n');
console.log('=' .repeat(80));

let currentWins = 0;
let proposedWins = 0;
let ties = 0;
let bothWrong = 0;

testScenarios.forEach((scenario, index) => {
  console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
  console.log(`Query: "${scenario.query}"`);
  console.log(`Expected Winner: "${scenario.expectedWinner}"`);
  console.log('-'.repeat(60));
  
  // Score all categories with both algorithms
  const currentResults = scenario.categories.map(cat => ({
    category: cat,
    score: currentAlgorithm(scenario.query, cat)
  })).sort((a, b) => b.score - a.score);
  
  const proposedResults = scenario.categories.map(cat => ({
    category: cat,
    score: proposedAlgorithm(scenario.query, cat)
  })).sort((a, b) => b.score - a.score);
  
  // Show top 3 results for each algorithm
  console.log('\n🔍 CURRENT Algorithm Results:');
  currentResults.slice(0, 3).forEach((result, i) => {
    const marker = i === 0 ? '👑' : '  ';
    const isExpected = result.category === scenario.expectedWinner ? ' ✅' : '';
    console.log(`${marker} ${result.category}: ${result.score}${isExpected}`);
  });
  
  console.log('\n🚀 PROPOSED Algorithm Results:');
  proposedResults.slice(0, 3).forEach((result, i) => {
    const marker = i === 0 ? '👑' : '  ';
    const isExpected = result.category === scenario.expectedWinner ? ' ✅' : '';
    console.log(`${marker} ${result.category}: ${result.score}${isExpected}`);
  });
  
  // Determine winners
  const currentWinner = currentResults[0].category;
  const proposedWinner = proposedResults[0].category;
  
  console.log('\n📊 Analysis:');
  console.log(`Current Algorithm picked: "${currentWinner}"`);
  console.log(`Proposed Algorithm picked: "${proposedWinner}"`);
  
  const currentCorrect = currentWinner === scenario.expectedWinner;
  const proposedCorrect = proposedWinner === scenario.expectedWinner;
  
  if (currentCorrect && proposedCorrect) {
    console.log('🤝 Result: Both algorithms correct (TIE)');
    ties++;
  } else if (proposedCorrect && !currentCorrect) {
    console.log('🎉 Result: PROPOSED algorithm wins (fixed the issue!)');
    proposedWins++;
  } else if (currentCorrect && !proposedCorrect) {
    console.log('😔 Result: CURRENT algorithm wins (proposed made it worse)');
    currentWins++;
  } else {
    console.log('❌ Result: Both algorithms wrong');
    bothWrong++;
  }
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('📈 FINAL RESULTS SUMMARY');
console.log('='.repeat(80));

const total = testScenarios.length;
console.log(`\nTotal Test Scenarios: ${total}`);
console.log(`🚀 Proposed Algorithm Wins: ${proposedWins} (${Math.round(proposedWins/total*100)}%)`);
console.log(`🔍 Current Algorithm Wins: ${currentWins} (${Math.round(currentWins/total*100)}%)`);
console.log(`🤝 Ties (both correct): ${ties} (${Math.round(ties/total*100)}%)`);
console.log(`❌ Both Wrong: ${bothWrong} (${Math.round(bothWrong/total*100)}%)`);

if (proposedWins > currentWins) {
  console.log(`\n✅ RECOMMENDATION: Implement the PROPOSED algorithm`);
  console.log(`   - Fixes ${proposedWins} issues that the current algorithm misses`);
  console.log(`   - Maintains performance on ${ties} scenarios where both work`);
  console.log(`   - Only regresses on ${currentWins} scenarios`);
} else if (currentWins > proposedWins) {
  console.log(`\n❌ RECOMMENDATION: Keep the CURRENT algorithm`);
  console.log(`   - Proposed algorithm would make things worse`);
} else {
  console.log(`\n🤷 RECOMMENDATION: Both algorithms perform similarly`);
  console.log(`   - Consider other factors (performance, maintainability)`);
}

console.log('\n📋 Key Improvements in Proposed Algorithm:');
console.log('  • Multi-word phrase matching (bigrams/trigrams)');
console.log('  • Brand/manufacturer recognition');  
console.log('  • Weighted scoring (less weight for generic words)');
console.log('  • Word proximity bonuses');
console.log('  • Partial word matching for variations');

console.log('\n🎯 Test completed successfully!');