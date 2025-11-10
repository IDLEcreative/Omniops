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

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface WorkflowStep {
  lineNumber: number;
  stepNumber?: number;
  action: string;
  target?: string;
  value?: string;
  expectedOutcome?: string;
  code: string;
}

interface Workflow {
  testFile: string;
  testName: string;
  description: string;
  steps: WorkflowStep[];
  totalSteps: number;
  apiEndpoints: string[];
  uiElements: string[];
}

interface ExtractionResult {
  workflows: Workflow[];
  totalTests: number;
  totalSteps: number;
  coverage: {
    apiEndpoints: Set<string>;
    uiElements: Set<string>;
  };
}

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

    // Collect coverage data
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
 * Extract workflows from a single test file
 */
async function extractWorkflowsFromFile(filePath: string): Promise<Workflow[]> {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const workflows: Workflow[] = [];

  function visit(node: ts.Node) {
    // Look for test() calls
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      if (ts.isPropertyAccessExpression(expression)) {
        // test.only(), test.skip(), etc.
        if (expression.name.text === 'only' || expression.name.text === 'skip') {
          const workflow = extractWorkflowFromTestNode(node, sourceFile, filePath);
          if (workflow) workflows.push(workflow);
        }
      } else if (ts.isIdentifier(expression) && expression.text === 'test') {
        // Regular test()
        const workflow = extractWorkflowFromTestNode(node, sourceFile, filePath);
        if (workflow) workflows.push(workflow);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return workflows;
}

/**
 * Extract workflow from a test() call node
 */
function extractWorkflowFromTestNode(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  filePath: string
): Workflow | null {
  const args = node.arguments;
  if (args.length < 2) return null;

  // Test name is first argument
  const testNameArg = args[0];
  if (!ts.isStringLiteral(testNameArg)) return null;
  const testName = testNameArg.text;

  // Test callback is second argument
  const testCallback = args[1];
  if (!ts.isArrowFunction(testCallback) && !ts.isFunctionExpression(testCallback)) {
    return null;
  }

  // Extract description from comments above test
  const description = extractDescriptionFromComments(node, sourceFile);

  // Extract steps from test body
  const { steps, apiEndpoints, uiElements } = extractStepsFromCallback(
    testCallback,
    sourceFile
  );

  return {
    testFile: path.relative(process.cwd(), filePath),
    testName,
    description,
    steps,
    totalSteps: steps.length,
    apiEndpoints: Array.from(apiEndpoints),
    uiElements: Array.from(uiElements)
  };
}

/**
 * Extract description from JSDoc or comments above test
 */
function extractDescriptionFromComments(
  node: ts.Node,
  sourceFile: ts.SourceFile
): string {
  const fullText = sourceFile.getFullText();
  const nodeStart = node.getFullStart();
  const leadingComments = ts.getLeadingCommentRanges(fullText, nodeStart);

  if (!leadingComments || leadingComments.length === 0) {
    return '';
  }

  // Get the last comment block (most relevant)
  const lastComment = leadingComments[leadingComments.length - 1];
  const commentText = fullText.substring(lastComment.pos, lastComment.end);

  // Clean up comment markers
  return commentText
    .replace(/\/\*\*?|\*\/|^\s*\*\s?/gm, '')
    .trim();
}

/**
 * Extract steps from test callback function
 */
function extractStepsFromCallback(
  callback: ts.ArrowFunction | ts.FunctionExpression,
  sourceFile: ts.SourceFile
): {
  steps: WorkflowStep[];
  apiEndpoints: Set<string>;
  uiElements: Set<string>;
} {
  const steps: WorkflowStep[] = [];
  const apiEndpoints = new Set<string>();
  const uiElements = new Set<string>();
  let stepCounter = 0;

  function visitStatement(node: ts.Node) {
    if (ts.isExpressionStatement(node)) {
      const step = parseStep(node, sourceFile);
      if (step) {
        stepCounter++;
        step.stepNumber = stepCounter;
        steps.push(step);

        // Track API endpoints
        if (step.action === 'navigate' && step.target) {
          const match = step.target.match(/\/api\/[^\s'"]+/);
          if (match) apiEndpoints.add(match[0]);
        }
        if (step.code.includes('/api/')) {
          const matches = step.code.match(/\/api\/[^\s'"]+/g);
          if (matches) matches.forEach(ep => apiEndpoints.add(ep));
        }

        // Track UI elements
        if (step.target) {
          uiElements.add(step.target);
        }
      }
    }

    ts.forEachChild(node, visitStatement);
  }

  if (callback.body) {
    if (ts.isBlock(callback.body)) {
      callback.body.statements.forEach(visitStatement);
    }
  }

  return { steps, apiEndpoints, uiElements };
}

/**
 * Parse a single statement into a workflow step
 */
function parseStep(node: ts.ExpressionStatement, sourceFile: ts.SourceFile): WorkflowStep | null {
  const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const code = node.getText(sourceFile).trim();

  // Parse await expressions (most Playwright actions)
  if (ts.isAwaitExpression(node.expression)) {
    const awaitedExpr = node.expression.expression;

    if (ts.isCallExpression(awaitedExpr)) {
      return parseAwaitExpression(awaitedExpr, lineNumber, code, sourceFile);
    }
  }

  // Parse console.log statements (step markers)
  if (ts.isCallExpression(node.expression)) {
    const expr = node.expression;
    if (ts.isPropertyAccessExpression(expr.expression)) {
      if (expr.expression.expression.getText(sourceFile) === 'console' &&
          expr.expression.name.text === 'log') {

        const logArg = expr.arguments[0];
        if (logArg && ts.isStringLiteral(logArg)) {
          const logText = logArg.text;

          // Check for step markers
          if (logText.includes('Step') || logText.includes('STEP')) {
            return {
              lineNumber,
              action: 'log',
              expectedOutcome: logText,
              code
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Parse Playwright actions from await expressions
 */
function parseAwaitExpression(
  callExpr: ts.CallExpression,
  lineNumber: number,
  code: string,
  sourceFile: ts.SourceFile
): WorkflowStep | null {
  const expr = callExpr.expression;

  // Handle page.goto(), page.click(), etc.
  if (ts.isPropertyAccessExpression(expr)) {
    const methodName = expr.name.text;
    const args = callExpr.arguments;

    switch (methodName) {
      case 'goto':
        return {
          lineNumber,
          action: 'navigate',
          target: args[0] ? getStringValue(args[0], sourceFile) : undefined,
          code
        };

      case 'click':
        return {
          lineNumber,
          action: 'click',
          target: args[0] ? getStringValue(args[0], sourceFile) : undefined,
          code
        };

      case 'fill':
      case 'type':
        return {
          lineNumber,
          action: 'fill',
          target: args[0] ? getStringValue(args[0], sourceFile) : undefined,
          value: args[1] ? getStringValue(args[1], sourceFile) : undefined,
          code
        };

      case 'waitFor':
      case 'waitForSelector':
      case 'waitForTimeout':
        return {
          lineNumber,
          action: 'wait',
          target: args[0] ? getStringValue(args[0], sourceFile) : undefined,
          code
        };

      case 'reload':
        return {
          lineNumber,
          action: 'reload',
          code
        };

      case 'screenshot':
        return {
          lineNumber,
          action: 'screenshot',
          code
        };
    }
  }

  // Handle expect() assertions
  if (ts.isIdentifier(expr) && expr.text === 'expect') {
    return {
      lineNumber,
      action: 'verify',
      expectedOutcome: code.replace(/^await\s+/, ''),
      code
    };
  }

  // Handle iframe.locator() chains
  if (code.includes('iframe.locator') || code.includes('page.locator')) {
    if (code.includes('.fill(')) {
      return {
        lineNumber,
        action: 'fill',
        target: extractLocator(code),
        value: extractFillValue(code),
        code
      };
    }
    if (code.includes('.click(')) {
      return {
        lineNumber,
        action: 'click',
        target: extractLocator(code),
        code
      };
    }
  }

  return null;
}

/**
 * Extract string value from expression
 */
function getStringValue(expr: ts.Expression, sourceFile: ts.SourceFile): string {
  if (ts.isStringLiteral(expr)) {
    return expr.text;
  }
  if (ts.isTemplateExpression(expr)) {
    return expr.getText(sourceFile);
  }
  return expr.getText(sourceFile);
}

/**
 * Extract locator from code string
 */
function extractLocator(code: string): string | undefined {
  const match = code.match(/locator\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : undefined;
}

/**
 * Extract fill value from code string
 */
function extractFillValue(code: string): string | undefined {
  const match = code.match(/\.fill\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : undefined;
}

/**
 * Generate markdown documentation from extracted workflows
 */
function generateMarkdownDocs(result: ExtractionResult): string {
  const { workflows, totalTests, totalSteps, coverage } = result;

  let markdown = `# Application Workflows (Auto-Generated from E2E Tests)

**Generated:** ${new Date().toISOString()}
**Source:** Playwright E2E test files in \`__tests__/playwright/\`

## Summary

- **Total Tests:** ${totalTests}
- **Total Steps:** ${totalSteps}
- **API Endpoints Documented:** ${coverage.apiEndpoints.size}
- **UI Elements Documented:** ${coverage.uiElements.size}

---

## Table of Contents

`;

  // Generate TOC
  workflows.forEach((wf, idx) => {
    markdown += `${idx + 1}. [${wf.testName}](#${slugify(wf.testName)})\n`;
  });

  markdown += '\n---\n\n';

  // Generate workflow documentation
  workflows.forEach((wf, idx) => {
    markdown += `## ${idx + 1}. ${wf.testName}\n\n`;
    markdown += `**Source:** [\`${wf.testFile}\`](/${wf.testFile})\n\n`;

    if (wf.description) {
      markdown += `**Description:**\n${wf.description}\n\n`;
    }

    markdown += `**Total Steps:** ${wf.totalSteps}\n\n`;

    if (wf.apiEndpoints.length > 0) {
      markdown += `**API Endpoints Used:**\n`;
      wf.apiEndpoints.forEach(ep => {
        markdown += `- \`${ep}\`\n`;
      });
      markdown += '\n';
    }

    markdown += '**Workflow Steps:**\n\n';
    markdown += '| Step | Action | Target | Value | Expected Outcome |\n';
    markdown += '|------|--------|--------|-------|------------------|\n';

    wf.steps.forEach(step => {
      const stepNum = step.stepNumber || '';
      const action = step.action || '';
      const target = step.target ? `\`${step.target}\`` : '';
      const value = step.value ? `\`${step.value}\`` : '';
      const outcome = step.expectedOutcome ? step.expectedOutcome.substring(0, 100) : '';

      markdown += `| ${stepNum} | ${action} | ${target} | ${value} | ${outcome} |\n`;
    });

    markdown += '\n**Code Reference:**\n\n```typescript\n';
    wf.steps.slice(0, 10).forEach(step => {
      markdown += `// Line ${step.lineNumber}\n${step.code}\n\n`;
    });
    if (wf.steps.length > 10) {
      markdown += `// ... ${wf.steps.length - 10} more steps ...\n`;
    }
    markdown += '```\n\n';

    markdown += '---\n\n';
  });

  // Add coverage summary
  markdown += '## Coverage Summary\n\n';
  markdown += '### API Endpoints\n\n';
  Array.from(coverage.apiEndpoints).sort().forEach(ep => {
    markdown += `- \`${ep}\`\n`;
  });

  markdown += '\n### UI Elements\n\n';
  markdown += '<details>\n<summary>Click to expand UI element catalog</summary>\n\n';
  Array.from(coverage.uiElements).sort().forEach(el => {
    markdown += `- \`${el}\`\n`;
  });
  markdown += '\n</details>\n\n';

  markdown += '---\n\n';
  markdown += '**Note:** This document is auto-generated from E2E tests. ';
  markdown += 'To update, run `npx tsx scripts/extract-workflows-from-e2e.ts`\n';

  return markdown;
}

/**
 * Convert string to slug for anchor links
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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
