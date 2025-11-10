/**
 * Workflow Extraction from E2E Tests
 *
 * Parses Playwright E2E test files and extracts executable workflows that
 * can be used to train AI agents on how to use the application.
 *
 * Usage:
 *   npx tsx scripts/extract-workflows-from-e2e.ts
 *
 * Output:
 *   docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { extractWorkflowsFromFile, type Workflow } from './modules/e2e-extraction/typescript-parser';
import { generateMarkdownDocs, type ExtractionResult } from './modules/e2e-extraction/markdown-formatter';

/**
 * Extract all workflows from E2E test files
 */
async function extractAllWorkflows(): Promise<ExtractionResult> {
  const testFiles = await glob('__tests__/playwright/**/*.spec.ts', {
    cwd: process.cwd(),
    absolute: true
  });

  console.log(`📁 Found ${testFiles.length} E2E test files\n`);

  const workflows: Workflow[] = [];
  const apiEndpoints = new Set<string>();
  const uiElements = new Set<string>();

  for (const file of testFiles) {
    console.log(`📄 Processing: ${path.relative(process.cwd(), file)}`);
    const fileWorkflows = await extractWorkflowsFromFile(file);

    workflows.push(...fileWorkflows);

    fileWorkflows.forEach(wf => {
      wf.apiEndpoints.forEach(ep => apiEndpoints.add(ep));
      wf.uiElements.forEach(el => uiElements.add(el));
    });

    console.log(`  ✅ Extracted ${fileWorkflows.length} workflow(s)\n`);
  }

  const totalSteps = workflows.reduce((sum, wf) => sum + wf.totalSteps, 0);

  return {
    workflows,
    totalTests: workflows.length,
    totalSteps,
    coverage: {
      apiEndpoints,
      uiElements
    }
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Extracting workflows from E2E tests...\n');

  const result = await extractAllWorkflows();

  console.log('\n📊 Extraction Summary:');
  console.log(`   Tests: ${result.totalTests}`);
  console.log(`   Steps: ${result.totalSteps}`);
  console.log(`   API Endpoints: ${result.coverage.apiEndpoints.size}`);
  console.log(`   UI Elements: ${result.coverage.uiElements.size}\n`);

  const markdown = generateMarkdownDocs(result);

  const outputPath = path.join(process.cwd(), 'docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md');
  fs.writeFileSync(outputPath, markdown, 'utf-8');

  console.log(`✅ Documentation generated: ${outputPath}\n`);
  console.log('🎯 Next steps:');
  console.log('   1. Review the generated documentation');
  console.log('   2. Run: npx tsx scripts/generate-agent-training-data.ts');
  console.log('   3. Update CLAUDE.md with E2E documentation guidelines\n');
}

main().catch(console.error);
