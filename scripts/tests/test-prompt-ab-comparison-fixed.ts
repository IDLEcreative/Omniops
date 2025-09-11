#!/usr/bin/env npx tsx
/**
 * A/B Prompt Comparison Test
 * 
 * This script creates side-by-side comparison of current vs simplified prompts
 * and provides a practical implementation for testing the simplified version.
 */

import { extractCurrentSystemPrompt, createSimplifiedPrompt } from './test-prompt-verbosity';

// Create a production-ready simplified prompt that maintains all critical business rules
const createProductionSimplifiedPrompt = (): string => {
  return `You are a helpful customer service assistant. Be brief and helpful.

CRITICAL RULES:
- Never link to external sites - only same-domain links
- Always show available products first
- When unsure, direct to customer service

Keep responses under 4 sentences. Show products immediately when found.`;
};

// Create an even more minimal version for extreme testing
const createMinimalPrompt = (): string => {
  return `Brief customer service. Show products. No external links. Contact service when unsure.`;
};

// Test different prompt versions
const testPromptVersions = () => {
  const versions = [
    { name: 'Current Production', prompt: extractCurrentSystemPrompt() },
    { name: 'Simplified Production', prompt: createProductionSimplifiedPrompt() },
    { name: 'Original Simplified', prompt: createSimplifiedPrompt() },
    { name: 'Minimal Version', prompt: createMinimalPrompt() }
  ];

  console.log('🔬 A/B PROMPT COMPARISON TEST\n');
  console.log('Comparing different prompt versions:\n');

  // Analyze each version
  versions.forEach((version, index) => {
    const charCount = version.prompt.length;
    const wordCount = version.prompt.split(/\s+/).length;
    const sentences = version.prompt.split(/[.!?]+/).filter(s => s.trim()).length;
    const hasExternalLinkRule = version.prompt.toLowerCase().includes('external');
    const hasShowProductsRule = version.prompt.toLowerCase().includes('show') && version.prompt.toLowerCase().includes('product');
    const hasContactServiceRule = version.prompt.toLowerCase().includes('contact') || version.prompt.toLowerCase().includes('service');
    
    console.log(`${index + 1}. ${version.name}`);
    console.log(`   Characters: ${charCount}`);
    console.log(`   Words: ${wordCount}`);
    console.log(`   Sentences: ${sentences}`);
    console.log(`   ✓ No external links: ${hasExternalLinkRule ? '✅' : '❌'}`);
    console.log(`   ✓ Show products: ${hasShowProductsRule ? '✅' : '❌'}`);
    console.log(`   ✓ Contact service: ${hasContactServiceRule ? '✅' : '❌'}`);
    
    const promptPreview = version.prompt.substring(0, 100);
    const ellipsis = version.prompt.length > 100 ? '...' : '';
    console.log(`   Prompt: "${promptPreview}${ellipsis}"`);
    console.log('');
  });

  // Calculate reduction percentages
  const current = versions[0];
  console.log('📊 REDUCTION COMPARISON (vs Current Production):\n');

  versions.slice(1).forEach((version) => {
    const reduction = Math.round(((current.prompt.length - version.prompt.length) / current.prompt.length) * 100);
    console.log(`${version.name}: ${reduction}% shorter (${current.prompt.length} → ${version.prompt.length} chars)`);
  });
};

// Generate implementation code for testing
const generateTestImplementation = () => {
  const simplifiedPrompt = createProductionSimplifiedPrompt();
  
  console.log('\n🛠️  IMPLEMENTATION FOR TESTING\n');
  console.log('To test the simplified prompt, modify the chat route as follows:\n');
  
  console.log('// In app/api/chat/route.ts, around line 659, replace the systemContext assignment:');
  console.log('```typescript');
  console.log('// A/B TEST - Simplified prompt version');
  console.log('const useSimplifiedPrompt = process.env.USE_SIMPLIFIED_PROMPT === "true";');
  console.log('');
  console.log('systemContext = useSimplifiedPrompt ? `');
  console.log(simplifiedPrompt);
  console.log('` : `');
  console.log('// ... existing long prompt ...');
  console.log('`;');
  console.log('```');
  
  console.log('\nThen add to your .env.local:');
  console.log('```');
  console.log('USE_SIMPLIFIED_PROMPT=true');
  console.log('```');
  
  console.log('\n📋 TESTING CHECKLIST:\n');
  const testCases = [
    'Product search: "need pump parts"',
    'Vague query: "body filler"', 
    'Specific part: "Kinshofer pin kit"',
    'Contact request: "how to contact you"',
    'Pricing query: "price for concrete mixer"',
    'Technical question: "what horsepower is the pump"',
    'Availability: "is this in stock"'
  ];
  
  testCases.forEach((test, i) => {
    console.log(`${i + 1}. Test: ${test}`);
    console.log(`   Expected: Brief response, shows products, no external links`);
  });
  
  console.log('\n🎯 SUCCESS METRICS:\n');
  console.log('Monitor these metrics during A/B test:');
  console.log('• Average response length (should decrease by 60-80%)');
  console.log('• Response time (should improve slightly)');
  console.log('• Customer satisfaction (should maintain or improve)');
  console.log('• Product click-through rate (should maintain)');
  console.log('• External link violations (should remain at 0)');
  console.log('• Customer service escalations (should remain stable)');
};

// Generate specific test scenarios
const generateTestScenarios = () => {
  console.log('\n🧪 DETAILED TEST SCENARIOS\n');
  
  const scenarios = [
    {
      query: "Need a pump for my Cifa mixer",
      expectedCurrent: "Verbose response with detailed introduction, bullet formatting, disclaimers (~400-600 chars)",
      expectedSimplified: "Brief response listing available pumps (~100-150 chars)"
    },
    {
      query: "Price on body filler", 
      expectedCurrent: "Long explanation about pricing policies, suggests contacting service (~300-500 chars)",
      expectedSimplified: "Shows available fillers, brief note to contact for pricing (~80-120 chars)"
    },
    {
      query: "What's included with the pin kit?",
      expectedCurrent: "Detailed explanation about not making assumptions, suggests customer service (~200-400 chars)", 
      expectedSimplified: "Brief statement about contacting service for details (~50-80 chars)"
    }
  ];
  
  scenarios.forEach((scenario, i) => {
    console.log(`Scenario ${i + 1}: "${scenario.query}"`);
    console.log(`Current prompt expected: ${scenario.expectedCurrent}`);
    console.log(`Simplified prompt expected: ${scenario.expectedSimplified}`);
    console.log('');
  });
};

// Main execution
const runABTest = () => {
  testPromptVersions();
  generateTestImplementation();
  generateTestScenarios();
  
  console.log('\n⚠️  IMPORTANT CONSIDERATIONS:\n');
  console.log('• Test with real customer queries for 24-48 hours');
  console.log('• Monitor for any increase in customer confusion');
  console.log('• Ensure all critical business rules are still followed');
  console.log('• Check that product visibility doesn\'t decrease');
  console.log('• Verify external link policy compliance');
  console.log('• Test edge cases (no products found, errors, etc.)');
  
  console.log('\n✅ EXPECTED BENEFITS:\n');
  console.log('• 60-80% reduction in response length');
  console.log('• Faster response generation');
  console.log('• Reduced API costs');
  console.log('• Cleaner, more scannable responses');
  console.log('• Maintained functionality and compliance');
};

// Execute if run directly
if (require.main === module) {
  runABTest();
}

export { 
  createProductionSimplifiedPrompt,
  createMinimalPrompt,
  testPromptVersions 
};