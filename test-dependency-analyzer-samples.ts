/**
 * Test Dependency Analyzer on Sample Code Structure
 */

import { createDependencyAnalyzer } from './lib/dev-tools';
import { join } from 'path';

async function testSamples() {
  console.log('🧪 Testing Dependency Analyzer on Sample Code Structure\n');
  
  const samplePath = join(process.cwd(), 'test-samples');
  
  console.log(`📂 Sample path: ${samplePath}`);
  
  const analyzer = createDependencyAnalyzer({
    rootPath: samplePath,
    includeGlobs: ['*.ts', '*.json', '**/*.ts', '**/*.json'],
    excludeGlobs: [],
    detectCircularDependencies: true,
    analyzeImpact: true,
    findUnusedDependencies: false, // Skip for samples since package.json isn't in test-samples
    checkBoundaryViolations: false,
    generateVisualization: true,
    exportFormats: ['json', 'mermaid', 'html'],
    verbose: true
  });

  // Listen for events
  analyzer.on('start', ({ timestamp, rootPath }) => {
    console.log(`🚀 Started analysis of ${rootPath}`);
  });

  analyzer.on('filesDiscovered', ({ count }) => {
    console.log(`📄 Found ${count} files to analyze`);
  });

  analyzer.on('filesParsed', ({ count }) => {
    console.log(`✅ Successfully parsed ${count} files`);
  });

  analyzer.on('graphBuilt', ({ nodes, edges }) => {
    console.log(`🕸️  Dependency graph: ${nodes} nodes, ${edges} edges`);
  });

  const report = await analyzer.analyze();

  console.log('\n📊 Analysis Results:');
  console.log(`Files: ${report.summary.totalFiles}`);
  console.log(`Dependencies: ${report.summary.totalDependencies}`);
  console.log(`External packages: ${report.summary.externalPackages}`);
  console.log(`Circular dependencies: ${report.summary.circularDependencies}`);
  console.log(`Health grade: ${report.summary.healthGrade}`);
  console.log(`Risk score: ${report.summary.riskScore}/100`);

  // Show file dependencies
  console.log('\n📋 File Dependencies:');
  for (const [filePath, node] of report.graph.nodes) {
    const fileName = filePath.split('/').pop();
    console.log(`${fileName}:`);
    console.log(`  Dependencies: ${node.dependencies.length}`);
    console.log(`  Dependents: ${node.dependents.length}`);
    console.log(`  Size: ${node.size} bytes`);
    console.log(`  Type: ${node.type}`);
    console.log(`  Entry point: ${node.isEntryPoint ? 'Yes' : 'No'}`);
    
    if (node.imports.length > 0) {
      console.log('  Imports:');
      node.imports.forEach(imp => {
        const type = imp.isExternal ? '📦' : imp.isRelative ? '📄' : '🗂️';
        console.log(`    ${type} ${imp.specifier} (${imp.type})`);
      });
    }
    
    if (node.exports.length > 0) {
      console.log('  Exports:');
      node.exports.forEach(exp => {
        console.log(`    📤 ${exp.name} (${exp.type})`);
      });
    }
    console.log();
  }

  // Show circular dependencies
  if (report.cycles.length > 0) {
    console.log('🔄 Circular Dependencies Found:');
    report.cycles.forEach((cycle, i) => {
      console.log(`${i + 1}. Cycle length: ${cycle.length}, severity: ${cycle.severity}`);
      console.log(`   Files: ${cycle.nodes.map(n => n.split('/').pop()).join(' → ')}`);
      console.log(`   Impact score: ${cycle.impact}/100`);
      if (cycle.suggestions.length > 0) {
        console.log('   Suggestions:');
        cycle.suggestions.forEach(suggestion => console.log(`     • ${suggestion}`));
      }
      console.log();
    });
  }

  // Show impact analysis
  if (report.impactAnalysis.length > 0) {
    console.log('🎯 Impact Analysis (Top 3):');
    report.impactAnalysis.slice(0, 3).forEach((analysis, i) => {
      console.log(`${i + 1}. ${analysis.file}`);
      console.log(`   Total impact: ${analysis.totalImpact} files`);
      console.log(`   Direct impact: ${analysis.directImpact.length} files`);
      console.log(`   Indirect impact: ${analysis.indirectImpact.length} files`);
      console.log(`   Risk score: ${analysis.riskScore}/100`);
      
      if (analysis.criticalPaths.length > 0) {
        console.log('   Critical paths:');
        analysis.criticalPaths.slice(0, 2).forEach(path => {
          console.log(`     ${path.join(' → ')}`);
        });
      }
      
      if (analysis.suggestions.length > 0) {
        console.log('   Suggestions:');
        analysis.suggestions.forEach(suggestion => console.log(`     • ${suggestion}`));
      }
      console.log();
    });
  }

  // Show dependency statistics
  console.log('📈 Dependency Statistics:');
  console.log(`Average dependencies per file: ${report.stats.averageDependencies.toFixed(2)}`);
  console.log(`Maximum dependencies: ${report.stats.maxDependencies}`);
  console.log(`Maximum dependency depth: ${report.stats.depth.max}`);
  console.log(`Average dependency depth: ${report.stats.depth.avg.toFixed(2)}`);

  // Show top fan-out files
  if (report.stats.fanOut.files.length > 0) {
    console.log('\n📈 Files with Most Dependencies (Fan-Out):');
    report.stats.fanOut.files.forEach((file, i) => {
      console.log(`${i + 1}. ${file.file} (${file.count} dependencies)`);
    });
  }

  // Show top fan-in files
  if (report.stats.fanIn.files.length > 0) {
    console.log('\n🎯 Most Depended-Upon Files (Fan-In):');
    report.stats.fanIn.files.forEach((file, i) => {
      console.log(`${i + 1}. ${file.file} (${file.count} dependents)`);
    });
  }

  // Show recommendations
  const allRecommendations = [
    ...report.recommendations.immediate.map(r => `⚠️ Immediate: ${r}`),
    ...report.recommendations.refactoring.map(r => `🔧 Refactoring: ${r}`),
    ...report.recommendations.architecture.map(r => `🏗️ Architecture: ${r}`),
    ...report.recommendations.performance.map(r => `⚡ Performance: ${r}`),
    ...report.recommendations.maintenance.map(r => `🛠️ Maintenance: ${r}`)
  ];

  if (allRecommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    allRecommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  // Show Mermaid diagram
  if (report.exportData?.mermaid) {
    console.log('\n🎨 Mermaid Dependency Diagram:');
    console.log('```mermaid');
    console.log(report.exportData.mermaid);
    console.log('```');
  }

  console.log('\n📊 Performance Metrics:');
  console.log(`Analysis time: ${report.summary.analysisTime}ms`);
  console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

  console.log('\n✅ Sample analysis completed successfully!');
}

// Run the test
testSamples().catch(console.error);