#!/usr/bin/env npx tsx
/**
 * Debug dependency analyzer file discovery
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { DependencyAnalyzer } from './lib/dev-tools/dependency-analyzer.js';

async function debugDependencyAnalyzer() {
  console.log('🔧 Debugging Dependency Analyzer...\n');

  const testDir = '/tmp/dependency-test';
  
  // Check if test directory exists
  console.log('📁 Test directory:', testDir);
  console.log('   Exists:', existsSync(testDir));
  
  if (existsSync(testDir)) {
    console.log('   Contents:', readdirSync(testDir, { recursive: true }));
  }

  console.log('\n🔍 Testing analyzer with minimal options...');

  const analyzer = new DependencyAnalyzer({
    rootPath: testDir,
    includeGlobs: ['**/*.{ts,js,json}'],
    excludeGlobs: ['**/node_modules/**'],
    verbose: true // Enable verbose logging
  });

  // Add event listeners to see what's happening
  analyzer.on('start', (data) => {
    console.log('📊 Analysis started:', data);
  });

  analyzer.on('filesDiscovered', (data) => {
    console.log('📂 Files discovered:', data);
  });

  analyzer.on('filesParsed', (data) => {
    console.log('📝 Files parsed:', data);
  });

  analyzer.on('progress', (data) => {
    console.log('⏳ Progress:', data);
  });

  analyzer.on('error', (data) => {
    console.error('❌ Error:', data);
  });

  analyzer.on('fileError', (data) => {
    console.error('🗂️ File error:', data);
  });

  analyzer.on('parseError', (data) => {
    console.error('📝 Parse error:', data);
  });

  try {
    const report = await analyzer.analyze();
    
    console.log('\n📊 Analysis complete!');
    console.log('   Total files:', report.summary.totalFiles);
    console.log('   Total dependencies:', report.summary.totalDependencies);
    console.log('   Analysis time:', report.summary.analysisTime + 'ms');

    if (report.graph.nodes.size > 0) {
      console.log('\n🔗 First few nodes:');
      let count = 0;
      for (const [path, node] of report.graph.nodes) {
        if (count++ >= 3) break;
        console.log(`   - ${node.relativePath} (${node.imports.length} imports, ${node.exports.length} exports)`);
      }
    }

  } catch (error) {
    console.error('💥 Analysis failed:', error);
  }
}

// Test the current project as well
async function testCurrentProject() {
  console.log('\n🏠 Testing current project (limited scope)...');

  const analyzer = new DependencyAnalyzer({
    rootPath: process.cwd(),
    includeGlobs: ['lib/dev-tools/*.ts'],
    excludeGlobs: ['**/node_modules/**'],
    maxFiles: 5,
    verbose: true
  });

  try {
    const report = await analyzer.analyze();
    
    console.log('\n📊 Current project analysis:');
    console.log('   Total files:', report.summary.totalFiles);
    console.log('   Total dependencies:', report.summary.totalDependencies);
    console.log('   Analysis time:', report.summary.analysisTime + 'ms');

  } catch (error) {
    console.error('💥 Current project analysis failed:', error);
  }
}

async function main() {
  await debugDependencyAnalyzer();
  await testCurrentProject();
}

if (require.main === module) {
  main().catch(console.error);
}