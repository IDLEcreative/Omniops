#!/usr/bin/env npx tsx

/**
 * Validates GitHub workflow changes and optimizations
 * Ensures workflow files are correctly configured after refactoring
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface WorkflowConfig {
  name: string;
  on: any;
  jobs: any;
}

interface ValidationResult {
  workflow: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

class WorkflowValidator {
  private workflowDir = '.github/workflows';
  private results: ValidationResult[] = [];

  async validateAll(): Promise<void> {
    console.log('🔍 Validating GitHub Workflow Changes...\n');

    // Get all workflow files
    const files = fs.readdirSync(this.workflowDir).filter(f => f.endsWith('.yml'));

    for (const file of files) {
      await this.validateWorkflow(path.join(this.workflowDir, file));
    }

    this.printResults();
  }

  private async validateWorkflow(filepath: string): Promise<void> {
    const filename = path.basename(filepath);
    const result: ValidationResult = {
      workflow: filename,
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const config = yaml.load(content) as WorkflowConfig;

      // Validate based on workflow type
      switch (filename) {
        case 'test.yml':
          this.validateTestWorkflow(config, result);
          break;
        case 'e2e-tests.yml':
          this.validateE2EWorkflow(config, result);
          break;
        case 'brand-check.yml':
        case 'check-root-directory.yml':
        case 'performance-nightly.yml':
        case 'regenerate-agent-knowledge.yml':
          this.validateStandardWorkflow(config, result);
          break;
      }

      // Common validations
      this.validateCommon(config, result);

    } catch (error) {
      result.valid = false;
      result.errors.push(`Failed to parse YAML: ${error.message}`);
    }

    this.results.push(result);
  }

  private validateTestWorkflow(config: WorkflowConfig, result: ValidationResult): void {
    // Should be renamed to reflect unit/integration only
    if (config.name !== 'Unit & Integration Tests') {
      result.warnings.push('Workflow should be named "Unit & Integration Tests"');
    }

    // Should have path filters
    if (!config.on?.push?.['paths-ignore'] && !config.on?.pull_request?.['paths-ignore']) {
      result.warnings.push('Missing path-ignore filters for optimization');
    }

    // Should NOT have E2E test steps
    const jobSteps = config.jobs?.test?.steps || [];
    for (const step of jobSteps) {
      if (step.name?.toLowerCase().includes('playwright') ||
          step.name?.toLowerCase().includes('e2e')) {
        result.errors.push('E2E test steps found - these should be removed');
        result.valid = false;
      }
    }

    // Check for correct path ignores
    const pathsIgnore = config.on?.push?.['paths-ignore'] || [];
    const expectedIgnores = ['docs/**', '*.md', '__tests__/playwright/**'];
    for (const expected of expectedIgnores) {
      if (!pathsIgnore.includes(expected)) {
        result.warnings.push(`Consider adding '${expected}' to paths-ignore`);
      }
    }
  }

  private validateE2EWorkflow(config: WorkflowConfig, result: ValidationResult): void {
    // Should have workflow_run trigger for chaining
    if (!config.on?.workflow_run) {
      result.warnings.push('Missing workflow_run trigger for chaining with unit tests');
    } else {
      // Check it's configured correctly
      const workflowRun = config.on.workflow_run;
      if (!workflowRun.workflows?.includes('Unit & Integration Tests')) {
        result.errors.push('workflow_run should trigger on "Unit & Integration Tests"');
        result.valid = false;
      }
    }

    // Should have concurrency control
    if (!config.concurrency) {
      result.warnings.push('Missing concurrency control for duplicate run prevention');
    }

    // Should have sharding strategy
    const matrix = config.jobs?.['e2e-tests']?.strategy?.matrix;
    if (!matrix?.shard || !matrix?.['total-shards']) {
      result.warnings.push('Missing sharding strategy for parallel execution');
    }

    // Should have success condition for workflow_run
    const condition = config.jobs?.['e2e-tests']?.if;
    if (!condition) {
      result.warnings.push('Missing conditional execution for workflow_run triggers');
    }

    // Check comprehensive path filters
    const paths = config.on?.pull_request?.paths || [];
    const expectedPaths = ['app/**', 'components/**', 'lib/**', '__tests__/playwright/**'];
    for (const expected of expectedPaths) {
      if (!paths.includes(expected)) {
        result.warnings.push(`Consider adding '${expected}' to path triggers`);
      }
    }
  }

  private validateStandardWorkflow(config: WorkflowConfig, result: ValidationResult): void {
    // Standard validations for other workflows
    if (!config.name) {
      result.errors.push('Missing workflow name');
      result.valid = false;
    }

    if (!config.on) {
      result.errors.push('Missing trigger configuration');
      result.valid = false;
    }
  }

  private validateCommon(config: WorkflowConfig, result: ValidationResult): void {
    // Check for at least one job
    if (!config.jobs || Object.keys(config.jobs).length === 0) {
      result.errors.push('No jobs defined');
      result.valid = false;
    }

    // Check for Node.js version consistency
    for (const job of Object.values(config.jobs || {})) {
      const steps = (job as any).steps || [];
      for (const step of steps) {
        if (step.uses?.includes('setup-node')) {
          const nodeVersion = step.with?.['node-version'];
          if (nodeVersion && nodeVersion !== '20' && nodeVersion !== '${{ matrix.node-version }}' && nodeVersion !== '${{ env.NODE_VERSION }}' && nodeVersion !== '18') {
            result.warnings.push(`Inconsistent Node.js version: ${nodeVersion} (expected 20)`);
          }
        }
      }
    }
  }

  private printResults(): void {
    console.log('📊 Validation Results\n');
    console.log('=' .repeat(60));

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of this.results) {
      const status = result.valid ? '✅' : '❌';
      console.log(`\n${status} ${result.workflow}`);

      if (result.errors.length > 0) {
        console.log('  Errors:');
        result.errors.forEach(e => console.log(`    ❌ ${e}`));
        totalErrors += result.errors.length;
      }

      if (result.warnings.length > 0) {
        console.log('  Warnings:');
        result.warnings.forEach(w => console.log(`    ⚠️  ${w}`));
        totalWarnings += result.warnings.length;
      }

      if (result.errors.length === 0 && result.warnings.length === 0) {
        console.log('  ✨ All checks passed!');
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n📈 Summary:');
    console.log(`  Total workflows: ${this.results.length}`);
    console.log(`  Valid workflows: ${this.results.filter(r => r.valid).length}`);
    console.log(`  Total errors: ${totalErrors}`);
    console.log(`  Total warnings: ${totalWarnings}`);

    // Specific optimization checks
    console.log('\n🚀 Optimization Verification:');

    const testWorkflow = this.results.find(r => r.workflow === 'test.yml');
    const e2eWorkflow = this.results.find(r => r.workflow === 'e2e-tests.yml');

    if (testWorkflow?.valid && !testWorkflow.errors.some(e => e.includes('E2E'))) {
      console.log('  ✅ E2E tests successfully removed from test.yml');
    } else {
      console.log('  ❌ E2E tests still present in test.yml');
    }

    if (e2eWorkflow?.warnings.some(w => w.includes('workflow_run'))) {
      console.log('  ⚠️  Workflow chaining setup incomplete');
    } else {
      console.log('  ✅ Workflow chaining properly configured');
    }

    const hasPathFilters = testWorkflow?.warnings.filter(w => w.includes('path')).length === 0;
    if (hasPathFilters) {
      console.log('  ✅ Path filters properly configured');
    } else {
      console.log('  ⚠️  Path filters could be improved');
    }

    if (e2eWorkflow?.warnings.some(w => w.includes('sharding'))) {
      console.log('  ⚠️  Sharding not configured');
    } else {
      console.log('  ✅ Sharding enabled for parallel execution');
    }

    // Exit code
    if (totalErrors > 0) {
      console.log('\n❌ Validation failed with errors');
      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log('\n⚠️  Validation passed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ All validations passed!');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new WorkflowValidator();
validator.validateAll().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});