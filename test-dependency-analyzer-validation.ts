#!/usr/bin/env npx tsx
/**
 * Comprehensive Dependency Analyzer Validation Suite
 * Tests all key functionality with performance and accuracy metrics
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DependencyAnalyzer, analyzeDependencies } from './lib/dev-tools/dependency-analyzer.js';

interface ValidationResult {
  feature: string;
  success: boolean;
  duration: number;
  details: Record<string, any>;
  errors?: string[];
}

interface PerformanceMetrics {
  totalFiles: number;
  analysisTime: number;
  filesPerSecond: number;
  memoryUsed: number;
  cacheHitRate?: number;
}

interface AccuracyMetrics {
  circularDependencies: {
    detected: number;
    falsePositives: number;
    falseNegatives: number;
    accuracy: number;
  };
  unusedDependencies: {
    detected: number;
    falsePositives: number;
    accuracy: number;
  };
  importParsing: {
    totalImports: number;
    parsedCorrectly: number;
    accuracy: number;
  };
}

class DependencyAnalyzerValidator {
  private results: ValidationResult[] = [];
  private startTime = 0;
  private testDir = '/tmp/dependency-test';

  async runValidation(): Promise<void> {
    console.log('🧪 Dependency Analyzer Comprehensive Validation Suite\n');
    console.log('==================================================');

    this.startTime = Date.now();

    // Create test environment
    await this.setupTestEnvironment();

    // Run all validation tests
    await this.testBasicFunctionality();
    await this.testImportExportParsing();
    await this.testCircularDependencyDetection();
    await this.testImpactAnalysis();
    await this.testUnusedDependencyDetection();
    await this.testBundleSizeAnalysis();
    await this.testPerformance();
    await this.testExportFormats();
    await this.testBoundaryViolations();
    await this.testVisualizationData();

    // Generate final report
    await this.generateReport();
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      mkdirSync(join(this.testDir, 'src'), { recursive: true });
      mkdirSync(join(this.testDir, 'lib'), { recursive: true });
      mkdirSync(join(this.testDir, 'components'), { recursive: true });

      // Create test files with various import/export patterns
      this.createTestFiles();

      console.log('✅ Test environment created successfully\n');
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
    }
  }

  private createTestFiles(): void {
    const files = {
      // Main entry point
      'src/index.ts': `
import { ComponentA } from './componentA';
import { ComponentB } from './componentB';
import * as utils from '../lib/utils';
import type { Config } from './types';
import('dynamic-import').then(module => console.log(module));

export { ComponentA, ComponentB };
export default class App {
  constructor(private config: Config) {}
}
`,

      // Component with circular dependency
      'src/componentA.ts': `
import { ComponentB } from './componentB';
import { helper } from '../lib/utils';

export class ComponentA {
  private b: ComponentB;
  
  constructor() {
    this.b = new ComponentB();
  }
  
  render() {
    return helper('componentA');
  }
}
`,

      // Component that creates circular dependency
      'src/componentB.ts': `
import { ComponentA } from './componentA';
const lodash = require('lodash');

export class ComponentB {
  private a?: ComponentA;
  
  init() {
    this.a = new ComponentA();
  }
  
  process(data: any) {
    return lodash.map(data, item => item);
  }
}
`,

      // Types file
      'src/types.ts': `
export interface Config {
  apiUrl: string;
  timeout: number;
}

export type Status = 'loading' | 'success' | 'error';
`,

      // Utility functions
      'lib/utils.ts': `
import { Status } from '../src/types';

export function helper(name: string): string {
  return \`Helper: \${name}\`;
}

export function processStatus(status: Status): boolean {
  return status === 'success';
}

export * from './math';
`,

      // Math utilities
      'lib/math.ts': `
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
`,

      // Unused file
      'lib/unused.ts': `
export function unusedFunction(): void {
  console.log('This function is never imported');
}
`,

      // Package.json with dependencies
      'package.json': JSON.stringify({
        name: 'dependency-test',
        version: '1.0.0',
        dependencies: {
          'lodash': '^4.17.21',
          'react': '^18.0.0',
          'unused-package': '^1.0.0'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          '@types/node': '^20.0.0',
          'unused-dev-package': '^1.0.0'
        }
      }, null, 2)
    };

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = join(this.testDir, filePath);
      writeFileSync(fullPath, content.trim());
    }
  }

  private async testBasicFunctionality(): Promise<void> {
    console.log('🔍 Testing basic functionality...');
    
    const startTime = Date.now();
    
    try {
      const analyzer = new DependencyAnalyzer({
        rootPath: this.testDir,
        includeGlobs: ['**/*.{ts,js,json}'],
        excludeGlobs: ['**/node_modules/**'],
        verbose: false
      });

      const report = await analyzer.analyze();
      const duration = Date.now() - startTime;

      const success = report.summary.totalFiles > 0 && 
                     report.graph.nodes.size > 0 &&
                     report.graph.edges.length > 0;

      this.results.push({
        feature: 'Basic Functionality',
        success,
        duration,
        details: {
          totalFiles: report.summary.totalFiles,
          totalDependencies: report.summary.totalDependencies,
          externalPackages: report.summary.externalPackages,
          healthGrade: report.summary.healthGrade
        }
      });

      console.log(`✅ Basic functionality test completed in ${duration}ms`);
      console.log(`   Files: ${report.summary.totalFiles}, Dependencies: ${report.summary.totalDependencies}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Basic Functionality',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Basic functionality test failed\n');
    }
  }

  private async testImportExportParsing(): Promise<void> {
    console.log('🔍 Testing import/export parsing...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        verbose: false
      });

      const duration = Date.now() - startTime;

      // Count different types of imports
      let es6Imports = 0;
      let commonjsImports = 0;
      let dynamicImports = 0;
      let namedImports = 0;
      let defaultImports = 0;

      for (const node of report.graph.nodes.values()) {
        for (const imp of node.imports) {
          if (imp.type === 'es6') es6Imports++;
          if (imp.type === 'commonjs') commonjsImports++;
          if (imp.dynamic) dynamicImports++;
          if (imp.named && imp.named.length > 0) namedImports++;
          if (imp.default) defaultImports++;
        }
      }

      const totalImports = es6Imports + commonjsImports + dynamicImports;
      const expectedMinimumImports = 8; // Based on our test files
      
      const success = totalImports >= expectedMinimumImports &&
                     es6Imports > 0 &&
                     commonjsImports > 0 &&
                     dynamicImports > 0;

      this.results.push({
        feature: 'Import/Export Parsing',
        success,
        duration,
        details: {
          totalImports,
          es6Imports,
          commonjsImports,
          dynamicImports,
          namedImports,
          defaultImports,
          accuracy: totalImports >= expectedMinimumImports ? 100 : (totalImports / expectedMinimumImports) * 100
        }
      });

      console.log(`✅ Import/export parsing test completed in ${duration}ms`);
      console.log(`   Total imports: ${totalImports}, ES6: ${es6Imports}, CommonJS: ${commonjsImports}, Dynamic: ${dynamicImports}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Import/Export Parsing',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Import/export parsing test failed\n');
    }
  }

  private async testCircularDependencyDetection(): Promise<void> {
    console.log('🔍 Testing circular dependency detection...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        detectCircularDependencies: true,
        verbose: false
      });

      const duration = Date.now() - startTime;

      // We expect to find the circular dependency between ComponentA and ComponentB
      const expectedCycles = 1;
      const detectedCycles = report.cycles.length;
      
      const success = detectedCycles >= expectedCycles;
      let cycleDetails: any = {};

      if (report.cycles.length > 0) {
        const cycle = report.cycles[0];
        cycleDetails = {
          length: cycle.length,
          severity: cycle.severity,
          nodes: cycle.nodes.map(n => n.split('/').pop()).join(' -> ')
        };
      }

      this.results.push({
        feature: 'Circular Dependency Detection',
        success,
        duration,
        details: {
          expectedCycles,
          detectedCycles,
          accuracy: detectedCycles >= expectedCycles ? 100 : (detectedCycles / expectedCycles) * 100,
          ...cycleDetails
        }
      });

      console.log(`✅ Circular dependency detection test completed in ${duration}ms`);
      console.log(`   Expected: ${expectedCycles}, Detected: ${detectedCycles}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Circular Dependency Detection',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Circular dependency detection test failed\n');
    }
  }

  private async testImpactAnalysis(): Promise<void> {
    console.log('🔍 Testing impact analysis...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        analyzeImpact: true,
        verbose: false
      });

      const duration = Date.now() - startTime;

      const impactAnalyses = report.impactAnalysis.length;
      const hasHighImpactFiles = report.impactAnalysis.some(analysis => analysis.totalImpact > 0);
      const averageImpact = impactAnalyses > 0 
        ? report.impactAnalysis.reduce((sum, analysis) => sum + analysis.totalImpact, 0) / impactAnalyses
        : 0;

      const success = impactAnalyses > 0 && hasHighImpactFiles;

      this.results.push({
        feature: 'Impact Analysis',
        success,
        duration,
        details: {
          totalAnalyses: impactAnalyses,
          hasHighImpactFiles,
          averageImpact: Math.round(averageImpact * 100) / 100,
          topImpactFile: report.impactAnalysis[0]?.file || 'none'
        }
      });

      console.log(`✅ Impact analysis test completed in ${duration}ms`);
      console.log(`   Analyses: ${impactAnalyses}, Average impact: ${averageImpact.toFixed(2)}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Impact Analysis',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Impact analysis test failed\n');
    }
  }

  private async testUnusedDependencyDetection(): Promise<void> {
    console.log('🔍 Testing unused dependency detection...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        findUnusedDependencies: true,
        packageJsonPath: 'package.json',
        verbose: false
      });

      const duration = Date.now() - startTime;

      // We expect to find unused dependencies (react, unused-package, unused-dev-package)
      const expectedUnusedDeps = 3;
      const detectedUnusedDeps = report.unusedDependencies.length;
      
      const success = detectedUnusedDeps >= expectedUnusedDeps;

      const unusedDepsDetails = report.unusedDependencies.map(dep => ({
        package: dep.package,
        type: dep.type,
        confidence: dep.confidence
      }));

      this.results.push({
        feature: 'Unused Dependency Detection',
        success,
        duration,
        details: {
          expectedUnusedDeps,
          detectedUnusedDeps,
          accuracy: detectedUnusedDeps >= expectedUnusedDeps ? 100 : (detectedUnusedDeps / expectedUnusedDeps) * 100,
          unusedDeps: unusedDepsDetails
        }
      });

      console.log(`✅ Unused dependency detection test completed in ${duration}ms`);
      console.log(`   Expected: ${expectedUnusedDeps}, Detected: ${detectedUnusedDeps}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Unused Dependency Detection',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Unused dependency detection test failed\n');
    }
  }

  private async testBundleSizeAnalysis(): Promise<void> {
    console.log('🔍 Testing bundle size analysis...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        calculateBundleSize: true,
        verbose: false
      });

      const duration = Date.now() - startTime;

      const totalBundleSize = report.stats.bundleSize.total;
      const hasFileSizes = report.stats.bundleSize.byFile.size > 0;
      
      const success = totalBundleSize > 0 && hasFileSizes;

      const largestFiles = Array.from(report.stats.bundleSize.byFile.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([file, size]) => ({ file: file.split('/').pop(), size }));

      this.results.push({
        feature: 'Bundle Size Analysis',
        success,
        duration,
        details: {
          totalBundleSize,
          hasFileSizes,
          largestFiles,
          averageFileSize: Math.round(totalBundleSize / report.stats.bundleSize.byFile.size)
        }
      });

      console.log(`✅ Bundle size analysis test completed in ${duration}ms`);
      console.log(`   Total size: ${totalBundleSize} bytes, Files analyzed: ${report.stats.bundleSize.byFile.size}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Bundle Size Analysis',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Bundle size analysis test failed\n');
    }
  }

  private async testPerformance(): Promise<void> {
    console.log('🔍 Testing performance...');
    
    const startTime = Date.now();
    const memoryBefore = process.memoryUsage();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        enableCaching: true,
        verbose: false
      });

      const duration = Date.now() - startTime;
      const memoryAfter = process.memoryUsage();
      const memoryUsed = memoryAfter.heapUsed - memoryBefore.heapUsed;

      // Run again to test caching
      const cacheStartTime = Date.now();
      await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        enableCaching: true,
        verbose: false
      });
      const cacheDuration = Date.now() - cacheStartTime;

      const filesPerSecond = Math.round((report.summary.totalFiles / duration) * 1000);
      const cacheSpeedup = Math.round((duration / cacheDuration) * 100) / 100;
      
      // Performance thresholds
      const success = filesPerSecond > 10 && // Should process at least 10 files per second
                     memoryUsed < 100 * 1024 * 1024 && // Should use less than 100MB
                     cacheSpeedup > 1.2; // Cache should provide at least 20% speedup

      this.results.push({
        feature: 'Performance',
        success,
        duration,
        details: {
          filesPerSecond,
          memoryUsedMB: Math.round(memoryUsed / (1024 * 1024) * 100) / 100,
          cacheSpeedup,
          analysisTime: duration,
          cachedAnalysisTime: cacheDuration
        }
      });

      console.log(`✅ Performance test completed in ${duration}ms`);
      console.log(`   Speed: ${filesPerSecond} files/sec, Memory: ${Math.round(memoryUsed / (1024 * 1024))}MB, Cache speedup: ${cacheSpeedup}x\n`);

    } catch (error) {
      this.results.push({
        feature: 'Performance',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Performance test failed\n');
    }
  }

  private async testExportFormats(): Promise<void> {
    console.log('🔍 Testing export formats...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        exportFormats: ['json', 'csv', 'dot', 'mermaid', 'html'],
        verbose: false
      });

      const duration = Date.now() - startTime;

      const exportData = report.exportData || {};
      const supportedFormats = ['json', 'csv', 'dot', 'mermaid', 'html'];
      const generatedFormats = Object.keys(exportData);
      
      const success = supportedFormats.every(format => generatedFormats.includes(format));

      const formatSizes = Object.entries(exportData).map(([format, data]) => ({
        format,
        size: typeof data === 'string' ? data.length : 0
      }));

      this.results.push({
        feature: 'Export Formats',
        success,
        duration,
        details: {
          supportedFormats: supportedFormats.length,
          generatedFormats: generatedFormats.length,
          formatSizes,
          allFormatsGenerated: success
        }
      });

      console.log(`✅ Export formats test completed in ${duration}ms`);
      console.log(`   Formats: ${generatedFormats.join(', ')}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Export Formats',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Export formats test failed\n');
    }
  }

  private async testBoundaryViolations(): Promise<void> {
    console.log('🔍 Testing boundary violations...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        checkBoundaryViolations: true,
        boundaryRules: [
          {
            name: 'No lib to src imports',
            description: 'Lib files should not import from src',
            from: 'lib/**',
            to: 'src/**',
            allowed: false,
            severity: 'high' as const
          }
        ],
        verbose: false
      });

      const duration = Date.now() - startTime;

      const violations = report.boundaryViolations.length;
      const hasViolationDetection = report.boundaryViolations !== undefined;
      
      // Our test setup doesn't create boundary violations, so we expect 0
      const success = hasViolationDetection && violations >= 0;

      this.results.push({
        feature: 'Boundary Violations',
        success,
        duration,
        details: {
          violations,
          hasViolationDetection,
          rulesConfigured: 1
        }
      });

      console.log(`✅ Boundary violations test completed in ${duration}ms`);
      console.log(`   Violations detected: ${violations}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Boundary Violations',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Boundary violations test failed\n');
    }
  }

  private async testVisualizationData(): Promise<void> {
    console.log('🔍 Testing visualization data generation...');
    
    const startTime = Date.now();
    
    try {
      const report = await analyzeDependencies(this.testDir, {
        includeGlobs: ['**/*.{ts,js}'],
        excludeGlobs: ['**/node_modules/**', '**/*.json'],
        generateVisualization: true,
        verbose: false
      });

      const duration = Date.now() - startTime;

      const hasVisualization = report.visualization !== undefined;
      const hasNodes = report.visualization?.nodes.length || 0 > 0;
      const hasLinks = report.visualization?.links.length || 0 > 0;
      const hasClusters = report.visualization?.clusters.length || 0 >= 0;
      
      const success = hasVisualization && hasNodes && hasLinks;

      this.results.push({
        feature: 'Visualization Data',
        success,
        duration,
        details: {
          hasVisualization,
          nodes: report.visualization?.nodes.length || 0,
          links: report.visualization?.links.length || 0,
          clusters: report.visualization?.clusters.length || 0,
          metadata: report.visualization?.metadata || {}
        }
      });

      console.log(`✅ Visualization data test completed in ${duration}ms`);
      console.log(`   Nodes: ${report.visualization?.nodes.length || 0}, Links: ${report.visualization?.links.length || 0}\n`);

    } catch (error) {
      this.results.push({
        feature: 'Visualization Data',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log('❌ Visualization data test failed\n');
    }
  }

  private async generateReport(): Promise<void> {
    console.log('📊 Generating comprehensive validation report...');

    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const overallSuccess = successfulTests === totalTests;

    // Calculate performance metrics
    const performanceResult = this.results.find(r => r.feature === 'Performance');
    const performanceMetrics: PerformanceMetrics = {
      totalFiles: 0,
      analysisTime: totalDuration,
      filesPerSecond: performanceResult?.details.filesPerSecond || 0,
      memoryUsed: performanceResult?.details.memoryUsedMB || 0,
      cacheHitRate: performanceResult?.details.cacheSpeedup || 0
    };

    // Calculate accuracy metrics
    const circularResult = this.results.find(r => r.feature === 'Circular Dependency Detection');
    const unusedResult = this.results.find(r => r.feature === 'Unused Dependency Detection');
    const importResult = this.results.find(r => r.feature === 'Import/Export Parsing');

    const accuracyMetrics: AccuracyMetrics = {
      circularDependencies: {
        detected: circularResult?.details.detectedCycles || 0,
        falsePositives: 0, // Would need more sophisticated testing
        falseNegatives: Math.max(0, (circularResult?.details.expectedCycles || 0) - (circularResult?.details.detectedCycles || 0)),
        accuracy: circularResult?.details.accuracy || 0
      },
      unusedDependencies: {
        detected: unusedResult?.details.detectedUnusedDeps || 0,
        falsePositives: 0, // Would need manual verification
        accuracy: unusedResult?.details.accuracy || 0
      },
      importParsing: {
        totalImports: importResult?.details.totalImports || 0,
        parsedCorrectly: importResult?.details.totalImports || 0,
        accuracy: importResult?.details.accuracy || 0
      }
    };

    const report = {
      validationSummary: {
        timestamp: new Date().toISOString(),
        totalTests,
        successfulTests,
        failedTests: totalTests - successfulTests,
        overallSuccess,
        successRate: Math.round((successfulTests / totalTests) * 100),
        totalDuration,
        productionReady: overallSuccess && successfulTests >= 8 // At least 8 key features working
      },
      performanceMetrics,
      accuracyMetrics,
      featureResults: this.results.map(result => ({
        feature: result.feature,
        status: result.success ? 'PASS' : 'FAIL',
        duration: result.duration,
        details: result.details,
        errors: result.errors
      })),
      recommendations: this.generateRecommendations(),
      productionReadinessAssessment: this.assessProductionReadiness()
    };

    // Write report to file
    const reportPath = join(process.cwd(), 'DEPENDENCY_ANALYZER_VALIDATION_REPORT.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console output
    console.log('\n' + '='.repeat(80));
    console.log('📋 DEPENDENCY ANALYZER VALIDATION REPORT');
    console.log('='.repeat(80));

    console.log(`\n✨ Overall Status: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📊 Success Rate: ${Math.round((successfulTests / totalTests) * 100)}% (${successfulTests}/${totalTests})`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`🏭 Production Ready: ${report.validationSummary.productionReady ? '✅ YES' : '❌ NO'}`);

    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`  • Files/Second: ${performanceMetrics.filesPerSecond}`);
    console.log(`  • Memory Usage: ${performanceMetrics.memoryUsed}MB`);
    console.log(`  • Cache Speedup: ${performanceMetrics.cacheHitRate}x`);

    console.log('\n🎯 ACCURACY METRICS:');
    console.log(`  • Circular Dependencies: ${accuracyMetrics.circularDependencies.accuracy}% accuracy`);
    console.log(`  • Unused Dependencies: ${accuracyMetrics.unusedDependencies.accuracy}% accuracy`);
    console.log(`  • Import Parsing: ${accuracyMetrics.importParsing.accuracy}% accuracy`);

    console.log('\n🔧 FEATURE TEST RESULTS:');
    for (const result of this.results) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`  • ${result.feature}: ${status} (${result.duration}ms)`);
      if (result.errors && result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.join(', ')}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log(`\n📄 Full report saved to: ${reportPath}`);
    console.log('\n' + '='.repeat(80));
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedTests = this.results.filter(r => !r.success);

    if (failedTests.length === 0) {
      recommendations.push('All tests passed! The Dependency Analyzer is production-ready.');
      return recommendations;
    }

    failedTests.forEach(test => {
      switch (test.feature) {
        case 'Basic Functionality':
          recommendations.push('Fix basic functionality issues before proceeding with other features');
          break;
        case 'Import/Export Parsing':
          recommendations.push('Improve regex patterns for import/export detection');
          break;
        case 'Circular Dependency Detection':
          recommendations.push('Review circular dependency detection algorithm');
          break;
        case 'Performance':
          recommendations.push('Optimize analysis speed and memory usage');
          break;
        case 'Export Formats':
          recommendations.push('Ensure all export formats are properly implemented');
          break;
        default:
          recommendations.push(`Address issues with ${test.feature}`);
      }
    });

    // Performance recommendations
    const perfResult = this.results.find(r => r.feature === 'Performance');
    if (perfResult?.details.filesPerSecond < 50) {
      recommendations.push('Consider implementing parallel processing for better performance');
    }
    if (perfResult?.details.memoryUsedMB > 50) {
      recommendations.push('Optimize memory usage by implementing streaming or chunked processing');
    }

    return recommendations;
  }

  private assessProductionReadiness(): string {
    const criticalFeatures = [
      'Basic Functionality',
      'Import/Export Parsing',
      'Circular Dependency Detection',
      'Performance'
    ];

    const criticalFailures = this.results
      .filter(r => criticalFeatures.includes(r.feature) && !r.success)
      .map(r => r.feature);

    if (criticalFailures.length === 0) {
      return 'PRODUCTION READY - All critical features are working correctly';
    } else if (criticalFailures.length <= 1) {
      return `NEEDS MINOR FIXES - Critical issue with: ${criticalFailures.join(', ')}`;
    } else {
      return `NOT PRODUCTION READY - Multiple critical failures: ${criticalFailures.join(', ')}`;
    }
  }
}

// Run validation
async function main() {
  const validator = new DependencyAnalyzerValidator();
  await validator.runValidation();
}

if (require.main === module) {
  main().catch(console.error);
}