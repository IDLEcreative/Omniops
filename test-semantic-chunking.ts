#!/usr/bin/env npx tsx
/**
 * Test Suite for Semantic Chunking System
 * Tests boundary detection, context preservation, and chunk quality
 */

import { SemanticChunker } from './lib/semantic-chunker';
import { config } from 'dotenv';

// Load environment variables
config();

// Test content samples
const testContents = [
  {
    name: "Product Documentation",
    content: `
# Installation Guide

## Prerequisites
Before installing the motor, ensure you have the following tools:
- Socket wrench set
- Torque wrench
- Safety goggles

## Step 1: Preparation
Remove the old motor carefully. Disconnect all electrical connections first.
Make sure the power is completely off before proceeding.

## Step 2: Installation
Mount the new motor using the provided brackets.
Align the motor shaft with the coupling.
Tighten all bolts to the specified torque values.

## Step 3: Testing
After installation, perform the following tests:
1. Check for proper alignment
2. Verify electrical connections
3. Run a test cycle at low speed

## Troubleshooting
If the motor doesn't start:
- Check power supply
- Verify wiring connections
- Ensure safety switches are engaged

## Specifications
- Power: 5HP
- Voltage: 220V
- RPM: 1750
- Weight: 45 lbs
`,
    html: `
<h1>Installation Guide</h1>
<h2>Prerequisites</h2>
<p>Before installing the motor, ensure you have the following tools:</p>
<ul>
<li>Socket wrench set</li>
<li>Torque wrench</li>
<li>Safety goggles</li>
</ul>
<h2>Step 1: Preparation</h2>
<p>Remove the old motor carefully. Disconnect all electrical connections first.</p>
<p>Make sure the power is completely off before proceeding.</p>
<h2>Step 2: Installation</h2>
<p>Mount the new motor using the provided brackets.</p>
<p>Align the motor shaft with the coupling.</p>
<p>Tighten all bolts to the specified torque values.</p>
<h2>Step 3: Testing</h2>
<p>After installation, perform the following tests:</p>
<ol>
<li>Check for proper alignment</li>
<li>Verify electrical connections</li>
<li>Run a test cycle at low speed</li>
</ol>
<h2>Troubleshooting</h2>
<p>If the motor doesn't start:</p>
<ul>
<li>Check power supply</li>
<li>Verify wiring connections</li>
<li>Ensure safety switches are engaged</li>
</ul>
<h2>Specifications</h2>
<ul>
<li>Power: 5HP</li>
<li>Voltage: 220V</li>
<li>RPM: 1750</li>
<li>Weight: 45 lbs</li>
</ul>
`,
    expectedFeatures: {
      hasHeadings: true,
      hasList: true,
      preservesContext: true,
      minChunks: 3
    }
  },
  {
    name: "FAQ Content",
    content: `
Q: What is the warranty period for this motor?
A: The motor comes with a 2-year manufacturer warranty covering defects in materials and workmanship.

Q: Can this motor be used outdoors?
A: Yes, this motor has an IP65 rating making it suitable for outdoor use. However, it should be protected from direct exposure to heavy rain.

Q: What maintenance is required?
A: Regular maintenance includes:
- Monthly: Check for unusual noises or vibrations
- Quarterly: Inspect and clean air vents
- Annually: Replace bearings and check alignment

Q: Is professional installation required?
A: While not mandatory, professional installation is recommended to ensure proper setup and maintain warranty coverage.

Q: What safety features are included?
A: The motor includes thermal overload protection, emergency stop capability, and automatic shutdown on overheating.
`,
    expectedFeatures: {
      hasQA: true,
      preservesContext: true,
      minChunks: 2
    }
  }
];

async function runTests() {
  console.log('🧪 Semantic Chunking Test Suite\n');
  console.log('=' .repeat(80));
  
  let totalTests = 0;
  let passedTests = 0;

  for (const testContent of testContents) {
    console.log(`\n📄 Testing: ${testContent.name}`);
    console.log('-'.repeat(40));
    
    try {
      // Test with HTML if available
      const chunks = await SemanticChunker.chunkContent(
        testContent.content,
        testContent.html
      );
      
      console.log(`\n📊 Chunking Results:`);
      console.log(`  Total chunks created: ${chunks.length}`);
      console.log(`  Average chunk size: ${Math.round(testContent.content.length / chunks.length)} chars`);
      
      // Test chunk quality
      const tests: Record<string, boolean> = {};
      
      // Test 1: Minimum chunks created
      if (testContent.expectedFeatures.minChunks) {
        tests.minChunks = chunks.length >= testContent.expectedFeatures.minChunks;
        totalTests++;
        if (tests.minChunks) passedTests++;
        console.log(`  ✓ Minimum chunks (${testContent.expectedFeatures.minChunks}): ${tests.minChunks ? '✅' : '❌'}`);
      }
      
      // Test 2: Context preservation (overlaps exist)
      if (testContent.expectedFeatures.preservesContext) {
        const hasOverlaps = chunks.some(c => c.overlap_with_next || c.overlap_with_previous);
        tests.context = hasOverlaps;
        totalTests++;
        if (tests.context) passedTests++;
        console.log(`  ✓ Context preservation (overlaps): ${tests.context ? '✅' : '❌'}`);
      }
      
      // Test 3: Heading detection
      if (testContent.expectedFeatures.hasHeadings) {
        const hasHeadings = chunks.some(c => c.parent_heading !== '');
        tests.headings = hasHeadings;
        totalTests++;
        if (tests.headings) passedTests++;
        console.log(`  ✓ Heading detection: ${tests.headings ? '✅' : '❌'}`);
      }
      
      // Test 4: List detection
      if (testContent.expectedFeatures.hasList) {
        const hasLists = chunks.some(c => c.metadata.contains_list);
        tests.lists = hasLists;
        totalTests++;
        if (tests.lists) passedTests++;
        console.log(`  ✓ List detection: ${tests.lists ? '✅' : '❌'}`);
      }
      
      // Test 5: Semantic completeness
      const avgCompleteness = chunks.reduce((sum, c) => sum + c.semantic_completeness, 0) / chunks.length;
      tests.completeness = avgCompleteness > 0.6;
      totalTests++;
      if (tests.completeness) passedTests++;
      console.log(`  ✓ Semantic completeness (avg): ${(avgCompleteness * 100).toFixed(0)}% ${tests.completeness ? '✅' : '❌'}`);
      
      // Test 6: Size constraints
      const sizesValid = chunks.every(c => c.metadata.char_count >= 100 && c.metadata.char_count <= 3000);
      tests.sizes = sizesValid;
      totalTests++;
      if (tests.sizes) passedTests++;
      console.log(`  ✓ Size constraints (100-3000 chars): ${tests.sizes ? '✅' : '❌'}`);
      
      // Display chunk details
      console.log('\n📋 Chunk Details:');
      chunks.forEach((chunk, idx) => {
        console.log(`\n  Chunk ${idx + 1}/${chunks.length}:`);
        console.log(`    Type: ${chunk.type}`);
        console.log(`    Parent: ${chunk.parent_heading || '(root)'}`);
        console.log(`    Size: ${chunk.metadata.char_count} chars, ${chunk.metadata.word_count} words`);
        console.log(`    Completeness: ${(chunk.semantic_completeness * 100).toFixed(0)}%`);
        console.log(`    Features: ${[
          chunk.metadata.has_complete_sentences && 'complete sentences',
          chunk.metadata.contains_list && 'list',
          chunk.metadata.contains_code && 'code',
          chunk.metadata.contains_table && 'table'
        ].filter(Boolean).join(', ') || 'none'}`);
        
        // Show preview
        const preview = chunk.content.substring(0, 100).replace(/\n/g, ' ');
        console.log(`    Preview: "${preview}${chunk.content.length > 100 ? '...' : ''}"`);
        
        // Show overlaps
        if (chunk.overlap_with_previous) {
          console.log(`    Overlap (prev): "${chunk.overlap_with_previous.substring(0, 50)}..."`);
        }
        if (chunk.overlap_with_next) {
          console.log(`    Overlap (next): "${chunk.overlap_with_next.substring(0, 50)}..."`);
        }
      });
      
    } catch (error) {
      console.log('❌ ERROR:', error);
    }
  }
  
  // Test edge cases
  console.log('\n' + '='.repeat(80));
  console.log('🔬 Edge Case Testing\n');
  
  const edgeCases = [
    {
      name: "Very short content",
      content: "This is a short piece of text.",
      expectSingleChunk: true
    },
    {
      name: "No structure",
      content: "Just a long paragraph without any structure or headings that goes on and on about various topics without clear boundaries or sections making it challenging to chunk semantically but the system should still handle it gracefully and create reasonable chunks based on sentence boundaries and natural breaks in the content flow even when there's no explicit structure to guide the chunking process.",
      expectFallback: true
    },
    {
      name: "Code heavy content",
      content: `
Here's how to use the API:

\`\`\`javascript
const motor = new Motor({
  power: 5,
  voltage: 220
});

motor.start();
motor.setSpeed(1750);
\`\`\`

The motor will automatically adjust to the specified parameters.
`,
      expectCodeDetection: true
    }
  ];
  
  for (const edgeCase of edgeCases) {
    console.log(`\n🧩 ${edgeCase.name}`);
    
    try {
      const chunks = await SemanticChunker.chunkContent(edgeCase.content);
      
      if (edgeCase.expectSingleChunk) {
        const passed = chunks.length === 1;
        totalTests++;
        if (passed) passedTests++;
        console.log(`  Single chunk: ${passed ? '✅' : '❌'} (got ${chunks.length})`);
      }
      
      if (edgeCase.expectFallback) {
        const passed = chunks.length > 0;
        totalTests++;
        if (passed) passedTests++;
        console.log(`  Handled gracefully: ${passed ? '✅' : '❌'}`);
      }
      
      if (edgeCase.expectCodeDetection) {
        const hasCode = chunks.some(c => c.metadata.contains_code || c.type === 'code');
        totalTests++;
        if (hasCode) passedTests++;
        console.log(`  Code detection: ${hasCode ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
  }
  
  // Performance test
  console.log('\n' + '='.repeat(80));
  console.log('⚡ Performance Testing\n');
  
  const perfContent = testContents[0].content.repeat(10); // ~5000 chars
  const startTime = Date.now();
  
  for (let i = 0; i < 10; i++) {
    await SemanticChunker.chunkContent(perfContent);
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / 10;
  
  console.log(`Content size: ${perfContent.length} chars`);
  console.log(`Average chunking time: ${avgTime.toFixed(2)}ms`);
  console.log(`Performance: ${avgTime < 100 ? '✅ Excellent' : avgTime < 500 ? '⚠️ Good' : '❌ Needs optimization'}`);
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary\n');
  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n✨ Semantic Chunking Testing Complete!\n');
}

// Run the tests
runTests().catch(console.error);