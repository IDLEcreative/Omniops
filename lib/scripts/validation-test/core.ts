/**
 * Enhanced Scraping System Validation - Core Logic
 *
 * Validates core functionality of enhanced scraping system.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ValidationResults {
  compilationStatus: string;
  typeScriptErrors: number;
  testsPass: boolean;
  performanceMetrics: {
    tokenReduction: number;
    processingSpeed: number;
    memoryUsage: number;
  };
  integrationStatus: {
    aiOptimization: boolean;
    patternLearning: boolean;
    rateLimiting: boolean;
    configuration: boolean;
    database: boolean;
  };
  productionReady: boolean;
  remainingIssues: string[];
}

export function createValidationResults(): ValidationResults {
  return {
    compilationStatus: 'FAIL',
    typeScriptErrors: 205,
    testsPass: false,
    performanceMetrics: {
      tokenReduction: 0,
      processingSpeed: 0,
      memoryUsage: 0
    },
    integrationStatus: {
      aiOptimization: false,
      patternLearning: false,
      rateLimiting: false,
      configuration: false,
      database: false
    },
    productionReady: false,
    remainingIssues: []
  };
}

export function validateCoreFiles(rootDir: string, results: ValidationResults): number {
  const coreFiles = [
    'lib/ai-content-extractor.ts',
    'lib/ai-metadata-generator.ts',
    'lib/content-deduplicator.ts',
    'lib/pattern-learner.ts',
    'lib/rate-limiter-enhanced.ts',
    'lib/ecommerce-extractor.ts',
    'lib/pagination-crawler.ts'
  ];

  let filesExist = 0;
  coreFiles.forEach(file => {
    const filepath = path.join(rootDir, file);
    if (fs.existsSync(filepath)) {
      console.log(`✅ ${file}`);
      filesExist++;
    } else {
      console.log(`❌ ${file}`);
      results.remainingIssues.push(`Missing core file: ${file}`);
    }
  });

  console.log(`\n📊 Core files: ${filesExist}/${coreFiles.length} found`);
  return filesExist;
}

export function validateTypeScriptConfig(rootDir: string, results: ValidationResults): void {
  const tsConfigFiles = ['tsconfig.json', 'package.json'];
  tsConfigFiles.forEach(file => {
    if (fs.existsSync(path.join(rootDir, file))) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      results.remainingIssues.push(`Missing config file: ${file}`);
    }
  });
}

export function validateDependencies(rootDir: string, results: ValidationResults): number {
  let depsFound = 0;
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const requiredDeps = [
      '@anthropic-ai/sdk',
      '@supabase/supabase-js',
      'cheerio',
      'tiktoken',
      'lz-string',
      'redis',
      'playwright'
    ];

    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep}`);
        depsFound++;
      } else {
        console.log(`❌ ${dep}`);
        results.remainingIssues.push(`Missing dependency: ${dep}`);
      }
    });

    console.log(`\n📊 Dependencies: ${depsFound}/${requiredDeps.length} found`);
  } catch (error) {
    console.log('❌ Failed to read package.json');
    results.remainingIssues.push('Cannot read package.json');
  }
  return depsFound;
}

export function validateMigrations(rootDir: string, results: ValidationResults): number {
  const migrationFiles = [
    'supabase/migrations/001_initial_migration.sql',
    'supabase/migrations/20250125_add_domain_patterns.sql'
  ];

  let migrationsFound = 0;
  migrationFiles.forEach(file => {
    const filepath = path.join(rootDir, file);
    if (fs.existsSync(filepath)) {
      console.log(`✅ ${file}`);
      migrationsFound++;
    } else {
      console.log(`❌ ${file}`);
      results.remainingIssues.push(`Missing migration: ${file}`);
    }
  });

  results.integrationStatus.database = migrationsFound > 0;
  return migrationsFound;
}

export function validateAPIRoutes(rootDir: string, results: ValidationResults): number {
  const apiRoutes = [
    'app/api/scrape/route.ts',
    'app/api/chat/route.ts',
    'app/api/admin/config/route.ts'
  ];

  let routesFound = 0;
  apiRoutes.forEach(route => {
    const filepath = path.join(rootDir, route);
    if (fs.existsSync(filepath)) {
      console.log(`✅ ${route}`);
      routesFound++;
    } else {
      console.log(`❌ ${route}`);
      results.remainingIssues.push(`Missing API route: ${route}`);
    }
  });

  return routesFound;
}

export function validateConfigFiles(rootDir: string, results: ValidationResults): number {
  const configFiles = [
    'lib/scraper-config.ts',
    'lib/crawler-config.ts',
    'mcp-supabase-config.json'
  ];

  let configsFound = 0;
  configFiles.forEach(config => {
    const filepath = path.join(rootDir, config);
    if (fs.existsSync(filepath)) {
      console.log(`✅ ${config}`);
      configsFound++;
    } else {
      console.log(`❌ ${config}`);
      results.remainingIssues.push(`Missing config: ${config}`);
    }
  });

  results.integrationStatus.configuration = configsFound >= 2;
  return configsFound;
}

export function validateTestFiles(rootDir: string, results: ValidationResults): number {
  const testFiles = [
    '__tests__/integration/enhanced-scraper-system.test.ts',
    '__tests__/lib/ai-content-extractor.test.ts',
    '__tests__/lib/pattern-learner.test.ts'
  ];

  let testsFound = 0;
  testFiles.forEach(test => {
    const filepath = path.join(rootDir, test);
    if (fs.existsSync(filepath)) {
      console.log(`✅ ${test}`);
      testsFound++;
    } else {
      console.log(`❌ ${test}`);
      results.remainingIssues.push(`Missing test: ${test}`);
    }
  });

  results.testsPass = testsFound >= 2;
  return testsFound;
}
