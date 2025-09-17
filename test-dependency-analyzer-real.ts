#!/usr/bin/env npx tsx
/**
 * Test Dependency Analyzer on real project
 */

import { DependencyAnalyzer } from './lib/dev-tools/dependency-analyzer.js';

async function testOnRealProject() {
  console.log('🏠 Testing Dependency Analyzer on Real Project...\n');

  const analyzer = new DependencyAnalyzer({
    rootPath: process.cwd(),
    includeGlobs: [
      'lib/**/*.ts',
      'app/**/*.ts',
      'app/**/*.tsx',
      'components/**/*.tsx'
    ],
    excludeGlobs: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/test*/**',
      '**/__tests__/**'
    ],
    detectCircularDependencies: true,
    analyzeImpact: true,
    findUnusedDependencies: true,
    generateVisualization: false,
    exportFormats: ['json'],
    maxFiles: 100, // Limit to avoid huge analysis
    verbose: false
  });

  const startTime = Date.now();
  
  try {
    console.log('🔍 Analyzing project structure...');
    const report = await analyzer.analyze();
    const duration = Date.now() - startTime;
    
    console.log('\n📊 Analysis Complete!');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Files analyzed: ${report.summary.totalFiles}`);
    console.log(`   Dependencies: ${report.summary.totalDependencies}`);
    console.log(`   External packages: ${report.summary.externalPackages}`);
    console.log(`   Circular dependencies: ${report.summary.circularDependencies}`);
    console.log(`   Unused dependencies: ${report.summary.unusedDependencies}`);
    console.log(`   Health grade: ${report.summary.healthGrade}`);
    console.log(`   Risk score: ${report.summary.riskScore}/100`);

    // Show top files by fan-out (most dependencies)
    if (report.stats.fanOut.files.length > 0) {
      console.log('\n📈 Files with Most Dependencies:');
      report.stats.fanOut.files.slice(0, 5).forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.file} (${file.count} deps)`);
      });
    }

    // Show top files by fan-in (most depended upon)
    if (report.stats.fanIn.files.length > 0) {
      console.log('\n📊 Most Depended Upon Files:');
      report.stats.fanIn.files.slice(0, 5).forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.file} (${file.count} dependents)`);
      });
    }

    // Show circular dependencies
    if (report.cycles.length > 0) {
      console.log('\n🔄 Circular Dependencies:');
      report.cycles.slice(0, 3).forEach((cycle, i) => {
        const fileNames = cycle.nodes.map(n => n.split('/').pop());
        console.log(`  ${i + 1}. ${fileNames.join(' → ')} (${cycle.severity}, length: ${cycle.length})`);
      });
      
      if (report.cycles.length > 3) {
        console.log(`  ... and ${report.cycles.length - 3} more`);
      }
    }

    // Show some unused dependencies
    if (report.unusedDependencies.length > 0) {
      console.log('\n🚫 Sample Unused Dependencies:');
      report.unusedDependencies.slice(0, 5).forEach(dep => {
        console.log(`  • ${dep.package} (${dep.type}, ${Math.round(dep.confidence * 100)}% confidence)`);
      });
      
      if (report.unusedDependencies.length > 5) {
        console.log(`  ... and ${report.unusedDependencies.length - 5} more`);
      }
    }

    // Performance metrics
    const filesPerSecond = Math.round((report.summary.totalFiles / duration) * 1000);
    console.log('\n⚡ Performance:');
    console.log(`  • Analysis speed: ${filesPerSecond} files/second`);
    console.log(`  • Average per file: ${Math.round(duration / Math.max(1, report.summary.totalFiles))}ms`);
    console.log(`  • Bundle size: ${Math.round(report.stats.bundleSize.total / 1024)}KB`);

    // Impact analysis sample
    if (report.impactAnalysis.length > 0) {
      console.log('\n💥 High Impact Files:');
      report.impactAnalysis
        .sort((a, b) => b.totalImpact - a.totalImpact)
        .slice(0, 3)
        .forEach((analysis, i) => {
          console.log(`  ${i + 1}. ${analysis.file} (${analysis.totalImpact} total impact, risk: ${analysis.riskScore})`);
        });
    }

    // Recommendations
    if (Object.values(report.recommendations).some(recs => recs.length > 0)) {
      console.log('\n💡 Top Recommendations:');
      ['immediate', 'refactoring', 'architecture'].forEach(category => {
        const recs = report.recommendations[category as keyof typeof report.recommendations];
        if (recs.length > 0) {
          console.log(`  ${category.toUpperCase()}: ${recs[0]}`);
        }
      });
    }

    // Overall assessment
    console.log('\n🏆 Assessment:');
    console.log(`  • Complexity Level: ${report.stats.depth.max > 10 ? 'High' : report.stats.depth.max > 5 ? 'Medium' : 'Low'}`);
    console.log(`  • Maintainability: ${report.summary.healthGrade}`);
    console.log(`  • Architecture Quality: ${report.summary.riskScore < 25 ? 'Good' : report.summary.riskScore < 50 ? 'Fair' : 'Needs Work'}`);

    return {
      success: true,
      totalFiles: report.summary.totalFiles,
      performance: filesPerSecond,
      healthGrade: report.summary.healthGrade,
      riskScore: report.summary.riskScore
    };

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  const result = await testOnRealProject();
  
  console.log('\n' + '='.repeat(80));
  if (result.success) {
    console.log('✅ REAL PROJECT ANALYSIS: SUCCESS');
    console.log(`📈 Project analyzed: ${result.totalFiles} files at ${result.performance} files/sec`);
    console.log(`🏥 Health Grade: ${result.healthGrade}`);
    console.log(`⚠️  Risk Score: ${result.riskScore}/100`);
    
    const productionReady = result.totalFiles > 0 && result.performance > 5;
    console.log(`🏭 Production Ready: ${productionReady ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log('❌ REAL PROJECT ANALYSIS: FAILED');
    if (result.error) {
      console.log(`💥 Error: ${result.error}`);
    }
  }
  console.log('='.repeat(80));
}

if (require.main === module) {
  main().catch(console.error);
}