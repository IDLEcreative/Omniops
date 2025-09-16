#!/usr/bin/env tsx
/**
 * Test SKU Regex Patterns
 * Validates that our SKU extraction correctly identifies various SKU formats
 */

// Current pattern from metadata-extractor.ts
const currentPattern = /\b(?:SKU[\s]?[\d]+|(?:[A-Z]{2,}[-])?[A-Z]{2,}[\d]+(?:[-\/][A-Z0-9]+)*(?:-V\d+)?)\b/gi;

// Improved pattern that handles more cases
const improvedPattern = /\b(?:SKU[\s]?[\d]+|[A-Z]{2,}(?:[\d]+)?(?:[-\/][A-Z0-9]+)+|[A-Z]{2,}[\d]+)\b/gi;

// Test cases
const testCases = [
  // Should match
  { text: 'DC66-10P', shouldMatch: true, expectedSku: 'DC66-10P' },
  { text: 'DC66-10P-24-V2', shouldMatch: true, expectedSku: 'DC66-10P-24-V2' },
  { text: 'RLY-DC66-10P-V2', shouldMatch: true, expectedSku: 'RLY-DC66-10P-V2' },
  { text: 'SKU12345', shouldMatch: true, expectedSku: 'SKU12345' },
  { text: 'SKU 12345', shouldMatch: true, expectedSku: 'SKU 12345' },
  { text: 'ABC-123', shouldMatch: true, expectedSku: 'ABC-123' },
  { text: 'DC66', shouldMatch: true, expectedSku: 'DC66' },
  { text: 'XR-500', shouldMatch: true, expectedSku: 'XR-500' },
  { text: 'Part #DC66-10P', shouldMatch: true, expectedSku: 'DC66-10P' },
  { text: 'Model DC66-10P-V1', shouldMatch: true, expectedSku: 'DC66-10P-V1' },
  
  // Edge cases
  { text: 'DC-10P', shouldMatch: true, expectedSku: 'DC-10P' },
  { text: 'A1-B2-C3', shouldMatch: true, expectedSku: 'A1-B2-C3' },
  { text: 'TEST-SKU-123-ABC', shouldMatch: true, expectedSku: 'TEST-SKU-123-ABC' },
  
  // Should not match
  { text: 'hello world', shouldMatch: false },
  { text: '123', shouldMatch: false },
  { text: 'abc', shouldMatch: false },
];

console.log('🧪 Testing SKU Regex Patterns\n');
console.log('=' .repeat(60));

// Test current pattern
console.log('\n📌 CURRENT PATTERN TEST:');
console.log(`Pattern: ${currentPattern.source}\n`);

let currentPassCount = 0;
let currentFailCount = 0;

for (const testCase of testCases) {
  // Reset regex
  currentPattern.lastIndex = 0;
  const matches = testCase.text.match(currentPattern);
  const matched = matches && matches.length > 0;
  const matchedSku = matches ? matches[0] : null;
  
  const passed = matched === testCase.shouldMatch && 
                 (!testCase.shouldMatch || matchedSku === testCase.expectedSku);
  
  if (passed) {
    currentPassCount++;
    console.log(`✅ "${testCase.text}"`);
    if (matched) console.log(`   Found: ${matchedSku}`);
  } else {
    currentFailCount++;
    console.log(`❌ "${testCase.text}"`);
    console.log(`   Expected: ${testCase.shouldMatch ? testCase.expectedSku : 'no match'}`);
    console.log(`   Got: ${matched ? matchedSku : 'no match'}`);
  }
}

console.log(`\nResults: ${currentPassCount} passed, ${currentFailCount} failed`);

// Test improved pattern
console.log('\n' + '=' .repeat(60));
console.log('\n🚀 IMPROVED PATTERN TEST:');
console.log(`Pattern: ${improvedPattern.source}\n`);

let improvedPassCount = 0;
let improvedFailCount = 0;

for (const testCase of testCases) {
  // Reset regex
  improvedPattern.lastIndex = 0;
  const matches = testCase.text.match(improvedPattern);
  const matched = matches && matches.length > 0;
  const matchedSku = matches ? matches[0] : null;
  
  const passed = matched === testCase.shouldMatch && 
                 (!testCase.shouldMatch || matchedSku === testCase.expectedSku);
  
  if (passed) {
    improvedPassCount++;
    console.log(`✅ "${testCase.text}"`);
    if (matched) console.log(`   Found: ${matchedSku}`);
  } else {
    improvedFailCount++;
    console.log(`❌ "${testCase.text}"`);
    console.log(`   Expected: ${testCase.shouldMatch ? testCase.expectedSku : 'no match'}`);
    console.log(`   Got: ${matched ? matchedSku : 'no match'}`);
  }
}

console.log(`\nResults: ${improvedPassCount} passed, ${improvedFailCount} failed`);

// Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 SUMMARY:');
console.log(`Current Pattern: ${currentPassCount}/${testCases.length} passed`);
console.log(`Improved Pattern: ${improvedPassCount}/${testCases.length} passed`);

if (improvedPassCount > currentPassCount) {
  console.log('\n✨ The improved pattern performs better!');
} else if (improvedPassCount === currentPassCount) {
  console.log('\n🤝 Both patterns perform equally well.');
} else {
  console.log('\n⚠️ The current pattern performs better.');
}

// Test real content
console.log('\n' + '=' .repeat(60));
console.log('📦 TESTING WITH REAL CONTENT:\n');

const realContent = `
The DC66-10P is our flagship relay module designed for industrial automation.
This DC66-10P-24-V2 variant operates at 24V with enhanced features.
Compatible models include RLY-DC66-10P-V2 and the standard DC66 series.
Order using SKU 12345 or reference Part #DC66-10P for specifications.
`;

console.log('Content:', realContent.trim().substring(0, 100) + '...\n');

currentPattern.lastIndex = 0;
const currentMatches = realContent.match(currentPattern) || [];
console.log('Current pattern found:', currentMatches);

improvedPattern.lastIndex = 0;
const improvedMatches = realContent.match(improvedPattern) || [];
console.log('Improved pattern found:', improvedMatches);

console.log('\n✅ Test complete!');