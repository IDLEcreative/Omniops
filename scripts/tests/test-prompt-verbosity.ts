#!/usr/bin/env npx tsx
/**
 * System Prompt Verbosity Test
 * 
 * This script analyzes the impact of reducing system prompt length on response verbosity.
 * It compares the current long system prompt vs a simplified version and simulates
 * what kind of responses they would generate.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Extract the current system prompt from the chat route
const extractCurrentSystemPrompt = (): string => {
  const filePath = join(process.cwd(), 'app/api/chat/route.ts');
  const content = readFileSync(filePath, 'utf8');
  
  // Find the system context between the backticks
  const match = content.match(/systemContext = `([^`]+)`/s);
  if (!match) {
    throw new Error('Could not extract system prompt from chat route');
  }
  
  return match[1].trim();
};

// Create a simplified version following the requirements
const createSimplifiedPrompt = (): string => {
  return `Helpful customer service assistant. Be brief. Show products available. Never link externally - only same-domain links. When unsure, direct to customer service.`;
};

// Test queries to simulate different scenarios
const testQueries = [
  "Need a pump for my Cifa mixer",
  "Price on body filler", 
  "Kinshofer pin kit"
];

// Mock product results that would be found for each query
const mockProductResults = {
  "Need a pump for my Cifa mixer": [
    {
      title: "Cifa Concrete Pump Parts - Main Hydraulic Pump",
      url: "https://example.com/cifa-hydraulic-pump",
      content: "Replacement hydraulic pump for Cifa concrete pumps. Compatible with various Cifa models including KCP30, KCP35..."
    },
    {
      title: "Cifa Concrete Pump Seal Kit",
      url: "https://example.com/cifa-seal-kit", 
      content: "Complete seal kit for Cifa concrete pump maintenance. Includes all necessary seals and gaskets..."
    }
  ],
  "Price on body filler": [
    {
      title: "P38 Body Filler 1.5kg", 
      url: "https://example.com/p38-body-filler",
      content: "Professional grade automotive body filler. Easy to sand and shape. 1.5kg tin with hardener included..."
    },
    {
      title: "Fibreglass Body Filler 500g",
      url: "https://example.com/fibreglass-filler",
      content: "Strong fibreglass reinforced body filler for major repairs. Suitable for steel, aluminum and fibreglass..."
    }
  ],
  "Kinshofer pin kit": [
    {
      title: "Kinshofer Quick Coupling Pin Kit",
      url: "https://example.com/kinshofer-pin-kit",
      content: "Replacement pin kit for Kinshofer quick couplers. Includes safety pins, bushings and hardware..."
    }
  ]
};

// Analyze prompt characteristics
const analyzePrompt = (prompt: string, name: string) => {
  const lines = prompt.split('\n');
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = prompt.split(/\s+/).filter(w => w.length > 0);
  const instructions = prompt.toLowerCase().match(/\b(never|always|must|critical|mandatory|forbidden)\b/g) || [];
  const bulletPoints = prompt.match(/^\s*[-•]/gm) || [];
  
  return {
    name,
    characterCount: prompt.length,
    lineCount: lines.length,
    sentenceCount: sentences.length,
    wordCount: words.length,
    strongInstructions: instructions.length,
    bulletPointCount: bulletPoints.length,
    avgWordsPerSentence: Math.round(words.length / sentences.length),
    complexityScore: calculateComplexityScore(prompt)
  };
};

// Calculate a complexity score based on various factors
const calculateComplexityScore = (prompt: string): number => {
  let score = 0;
  
  // Length penalty (longer = more complex)
  score += Math.min(prompt.length / 100, 50);
  
  // Nested structure penalty
  const nestedBlocks = prompt.match(/\s{4,}/g) || [];
  score += nestedBlocks.length * 2;
  
  // Strong directive words increase complexity
  const directives = prompt.toLowerCase().match(/\b(never|always|must|critical|mandatory|forbidden|important)\b/g) || [];
  score += directives.length * 3;
  
  // Multiple sections increase complexity
  const sections = prompt.match(/^[A-Z][A-Z\s]+:$/gm) || [];
  score += sections.length * 5;
  
  return Math.round(score);
};

// Simulate expected response characteristics based on prompt
const simulateResponseCharacteristics = (prompt: string, query: string) => {
  const products = mockProductResults[query as keyof typeof mockProductResults] || [];
  
  // Analyze what the prompt would likely produce
  const isVerbose = prompt.includes('CRITICAL') || prompt.includes('MANDATORY') || prompt.length > 1000;
  const hasDetailedFormatting = prompt.includes('bullet point') && prompt.includes('line breaks');
  const hasStrictRules = prompt.toLowerCase().includes('never') && prompt.toLowerCase().includes('always');
  const encouragesShowing = prompt.includes('ALWAYS show') || prompt.includes('present ALL');
  
  // Simulate response length and structure
  let estimatedLength = 0;
  const responseStructure: string[] = [];
  
  if (isVerbose) {
    // Verbose prompt likely produces longer responses
    estimatedLength += 200; // Base verbose response
    responseStructure.push("Detailed introduction");
    
    if (encouragesShowing && products.length > 0) {
      estimatedLength += products.length * 80; // ~80 chars per product with formatting
      responseStructure.push(`${products.length} products with detailed descriptions`);
    }
    
    if (hasDetailedFormatting) {
      estimatedLength += 100; // Extra formatting
      responseStructure.push("Detailed bullet formatting with spacing");
    }
    
    if (hasStrictRules) {
      estimatedLength += 150; // Disclaimers and rule following
      responseStructure.push("Compliance statements and disclaimers");
    }
  } else {
    // Simple prompt produces concise responses
    estimatedLength += 80; // Base simple response
    responseStructure.push("Brief introduction");
    
    if (products.length > 0) {
      estimatedLength += products.length * 40; // ~40 chars per product, minimal formatting
      responseStructure.push(`${products.length} products listed concisely`);
    }
  }
  
  return {
    estimatedLength,
    responseStructure,
    likelyVerbose: isVerbose,
    wouldShowProducts: encouragesShowing || products.length > 0,
    productCount: products.length,
    complianceStatements: hasStrictRules
  };
};

// Generate a mock response based on prompt characteristics
const generateMockResponse = (prompt: string, query: string): string => {
  const products = mockProductResults[query as keyof typeof mockProductResults] || [];
  const chars = simulateResponseCharacteristics(prompt, query);
  
  let response = "";
  
  if (chars.likelyVerbose) {
    response += "I'd be happy to help you find what you're looking for. ";
    response += "Let me show you the available options we have in stock:\n\n";
    
    products.forEach((product, i) => {
      response += `• [${product.title}](${product.url})\n\n`;
    });
    
    if (prompt.includes('customer service')) {
      response += "If you need specific pricing or technical details, please contact our customer service team for assistance. ";
    }
    
    if (prompt.includes('FORBIDDEN')) {
      response += "I don't have specific pricing information available right now. ";
    }
    
    response += "Is there a particular model or specification you're looking for?";
  } else {
    response += "Here's what we have:\n\n";
    
    products.forEach(product => {
      response += `• [${product.title}](${product.url})\n`;
    });
    
    response += "\nNeed specific details? Contact us.";
  }
  
  return response;
};

// Check current OpenAI API limits
const checkCurrentApiLimits = (): any => {
  const filePath = join(process.cwd(), 'app/api/chat/route.ts');
  const content = readFileSync(filePath, 'utf8');
  
  // Extract GPT-4 limits
  const gpt4Match = content.match(/model: 'gpt-4\.1'[^}]+max_tokens:\s*(\d+)/);
  const gpt5Match = content.match(/max_completion_tokens:\s*(\d+)/);
  
  return {
    gpt4MaxTokens: gpt4Match ? parseInt(gpt4Match[1]) : null,
    gpt5MaxTokens: gpt5Match ? parseInt(gpt5Match[1]) : null,
    hasLimits: !!(gpt4Match || gpt5Match)
  };
};

// Main test execution
const runTest = async () => {
  console.log('🧪 System Prompt Verbosity Impact Test\n');
  console.log('=' .repeat(60));
  
  // Extract and analyze current prompt
  const currentPrompt = extractCurrentSystemPrompt();
  const simplifiedPrompt = createSimplifiedPrompt();
  
  const currentAnalysis = analyzePrompt(currentPrompt, "Current System Prompt");
  const simplifiedAnalysis = analyzePrompt(simplifiedPrompt, "Simplified System Prompt");
  
  console.log('\n📊 PROMPT ANALYSIS COMPARISON\n');
  
  console.log('Current System Prompt:');
  console.log(`  • Character count: ${currentAnalysis.characterCount}`);
  console.log(`  • Word count: ${currentAnalysis.wordCount}`);
  console.log(`  • Sentence count: ${currentAnalysis.sentenceCount}`);
  console.log(`  • Strong directives: ${currentAnalysis.strongInstructions}`);
  console.log(`  • Bullet points: ${currentAnalysis.bulletPointCount}`);
  console.log(`  • Complexity score: ${currentAnalysis.complexityScore}`);
  
  console.log('\nSimplified System Prompt:');
  console.log(`  • Character count: ${simplifiedAnalysis.characterCount}`);
  console.log(`  • Word count: ${simplifiedAnalysis.wordCount}`);
  console.log(`  • Sentence count: ${simplifiedAnalysis.sentenceCount}`);
  console.log(`  • Strong directives: ${simplifiedAnalysis.strongInstructions}`);
  console.log(`  • Bullet points: ${simplifiedAnalysis.bulletPointCount}`);
  console.log(`  • Complexity score: ${simplifiedAnalysis.complexityScore}`);
  
  console.log('\n📈 REDUCTION ACHIEVED:');
  const charReduction = Math.round(((currentAnalysis.characterCount - simplifiedAnalysis.characterCount) / currentAnalysis.characterCount) * 100);
  const complexityReduction = Math.round(((currentAnalysis.complexityScore - simplifiedAnalysis.complexityScore) / currentAnalysis.complexityScore) * 100);
  
  console.log(`  • Character reduction: ${charReduction}% (${currentAnalysis.characterCount} → ${simplifiedAnalysis.characterCount})`);
  console.log(`  • Complexity reduction: ${complexityReduction}% (${currentAnalysis.complexityScore} → ${simplifiedAnalysis.complexityScore})`);
  
  // Test response characteristics for each query
  console.log('\n🎯 RESPONSE SIMULATION TESTS\n');
  
  for (const query of testQueries) {
    console.log(`Query: "${query}"`);
    console.log('-'.repeat(40));
    
    const currentResponse = simulateResponseCharacteristics(currentPrompt, query);
    const simplifiedResponse = simulateResponseCharacteristics(simplifiedPrompt, query);
    
    console.log(`Current prompt would generate:`);
    console.log(`  • Estimated length: ${currentResponse.estimatedLength} characters`);
    console.log(`  • Structure: ${currentResponse.responseStructure.join(', ')}`);
    console.log(`  • Would show products: ${currentResponse.wouldShowProducts}`);
    console.log(`  • Compliance statements: ${currentResponse.complianceStatements}`);
    
    console.log(`Simplified prompt would generate:`);
    console.log(`  • Estimated length: ${simplifiedResponse.estimatedLength} characters`);
    console.log(`  • Structure: ${simplifiedResponse.responseStructure.join(', ')}`);
    console.log(`  • Would show products: ${simplifiedResponse.wouldShowProducts}`);
    console.log(`  • Compliance statements: ${simplifiedResponse.complianceStatements}`);
    
    const lengthReduction = Math.round(((currentResponse.estimatedLength - simplifiedResponse.estimatedLength) / currentResponse.estimatedLength) * 100);
    console.log(`  • Estimated response reduction: ${lengthReduction}%`);
    
    console.log('\n--- Mock Responses ---');
    console.log('CURRENT PROMPT RESPONSE:');
    console.log(generateMockResponse(currentPrompt, query));
    
    console.log('\nSIMPLIFIED PROMPT RESPONSE:');
    console.log(generateMockResponse(simplifiedPrompt, query));
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  // Check API limits
  console.log('⚙️  CURRENT API CONFIGURATION\n');
  const limits = checkCurrentApiLimits();
  
  console.log('Response Length Limits:');
  if (limits.gpt4MaxTokens) {
    console.log(`  • GPT-4.1 max_tokens: ${limits.gpt4MaxTokens} (~${limits.gpt4MaxTokens * 4} characters)`);
  }
  if (limits.gpt5MaxTokens) {
    console.log(`  • GPT-5-mini max_completion_tokens: ${limits.gpt5MaxTokens} (~${limits.gpt5MaxTokens * 4} characters)`);
  }
  
  if (!limits.hasLimits) {
    console.log('  • No explicit limits found in configuration');
  }
  
  // Critical rules preservation check
  console.log('\n🛡️  CRITICAL RULES PRESERVATION CHECK\n');
  
  const criticalRules = {
    'No external links': {
      current: currentPrompt.includes('Never recommend or link to external'),
      simplified: simplifiedPrompt.includes('Never link externally')
    },
    'Show products': {
      current: currentPrompt.includes('ALWAYS show available options'),
      simplified: simplifiedPrompt.includes('Show products available')
    },
    'Customer service fallback': {
      current: currentPrompt.includes('contact customer service'),
      simplified: simplifiedPrompt.includes('direct to customer service')
    }
  };
  
  console.log('Rule preservation in simplified prompt:');
  for (const [rule, status] of Object.entries(criticalRules)) {
    const preserved = status.simplified;
    console.log(`  • ${rule}: ${preserved ? '✅ PRESERVED' : '❌ MISSING'}`);
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS\n');
  
  if (charReduction > 80) {
    console.log('✅ Excellent simplification achieved - significant verbosity reduction likely');
  } else if (charReduction > 50) {
    console.log('⚠️  Good simplification - moderate verbosity reduction expected');
  } else {
    console.log('❌ Limited simplification - minimal impact on verbosity expected');
  }
  
  const allRulesPreserved = Object.values(criticalRules).every(rule => rule.simplified);
  if (allRulesPreserved) {
    console.log('✅ All critical business rules preserved in simplified version');
  } else {
    console.log('⚠️  Some critical rules may be weakened - test carefully');
  }
  
  console.log('\nNext steps:');
  console.log('1. Test the simplified prompt with real queries');
  console.log('2. Monitor response length changes in production');
  console.log('3. Ensure critical business rules are still followed');
  console.log('4. Consider A/B testing if results are promising');
  
  console.log('\n📋 SIMPLIFIED PROMPT FOR TESTING:');
  console.log('-'.repeat(40));
  console.log(`"${simplifiedPrompt}"`);
  console.log('-'.repeat(40));
};

// Execute the test
if (require.main === module) {
  runTest().catch(console.error);
}

export { 
  extractCurrentSystemPrompt, 
  createSimplifiedPrompt, 
  analyzePrompt, 
  simulateResponseCharacteristics,
  checkCurrentApiLimits
};