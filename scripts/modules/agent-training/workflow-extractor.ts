/**
 * Workflow Extractor
 * Extracts workflows from E2E test files using TypeScript AST parsing
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface WorkflowStep {
  lineNumber: number;
  stepNumber?: number;
  action: string;
  target?: string;
  value?: string;
  expectedOutcome?: string;
  code: string;
}

export interface Workflow {
  testFile: string;
  testName: string;
  description: string;
  steps: WorkflowStep[];
  totalSteps: number;
  apiEndpoints: string[];
  uiElements: string[];
}

/**
 * Re-extract workflows from test files
 */
export async function extractWorkflows(): Promise<Workflow[]> {
  const testFiles = await glob('__tests__/playwright/**/*.spec.ts', {
    cwd: process.cwd(),
    absolute: true
  });

  const workflows: Workflow[] = [];

  for (const file of testFiles) {
    const fileWorkflows = await extractWorkflowsFromFile(file);
    workflows.push(...fileWorkflows);
  }

  return workflows;
}

/**
 * Extract workflows from a single test file
 */
export async function extractWorkflowsFromFile(filePath: string): Promise<Workflow[]> {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const workflows: Workflow[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      if (ts.isPropertyAccessExpression(expression)) {
        if (expression.name.text === 'only' || expression.name.text === 'skip') {
          const workflow = extractWorkflowFromTestNode(node, sourceFile, filePath);
          if (workflow) workflows.push(workflow);
        }
      } else if (ts.isIdentifier(expression) && expression.text === 'test') {
        const workflow = extractWorkflowFromTestNode(node, sourceFile, filePath);
        if (workflow) workflows.push(workflow);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return workflows;
}

function extractWorkflowFromTestNode(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  filePath: string
): Workflow | null {
  const args = node.arguments;
  if (args.length < 2) return null;

  const testNameArg = args[0];
  if (!ts.isStringLiteral(testNameArg)) return null;
  const testName = testNameArg.text;

  const testCallback = args[1];
  if (!ts.isArrowFunction(testCallback) && !ts.isFunctionExpression(testCallback)) {
    return null;
  }

  const description = extractDescriptionFromComments(node, sourceFile);
  const { steps, apiEndpoints, uiElements } = extractStepsFromCallback(testCallback, sourceFile);

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

function extractDescriptionFromComments(node: ts.Node, sourceFile: ts.SourceFile): string {
  const fullText = sourceFile.getFullText();
  const nodeStart = node.getFullStart();
  const leadingComments = ts.getLeadingCommentRanges(fullText, nodeStart);

  if (!leadingComments || leadingComments.length === 0) return '';

  const lastComment = leadingComments[leadingComments.length - 1];
  const commentText = fullText.substring(lastComment.pos, lastComment.end);

  return commentText.replace(/\/\*\*?|\*\/|^\s*\*\s?/gm, '').trim();
}

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
      const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const code = node.getText(sourceFile).trim();

      let action = 'unknown';
      let target: string | undefined;

      if (code.includes('page.goto') || code.includes('.goto(')) {
        action = 'navigate';
        const match = code.match(/goto\(['"`]([^'"`]+)['"`]\)/);
        target = match ? match[1] : undefined;
      } else if (code.includes('.click(')) {
        action = 'click';
        const match = code.match(/locator\(['"`]([^'"`]+)['"`]\)/);
        target = match ? match[1] : undefined;
        if (target) uiElements.add(target);
      } else if (code.includes('.fill(')) {
        action = 'fill';
        const match = code.match(/locator\(['"`]([^'"`]+)['"`]\)/);
        target = match ? match[1] : undefined;
        if (target) uiElements.add(target);
      } else if (code.includes('console.log')) {
        action = 'log';
      } else if (code.includes('expect(')) {
        action = 'verify';
      } else if (code.includes('.waitFor')) {
        action = 'wait';
      }

      if (action !== 'unknown') {
        stepCounter++;
        steps.push({
          lineNumber,
          stepNumber: stepCounter,
          action,
          target,
          code
        });
      }

      const apiMatches = code.match(/\/api\/[^\s'"]+/g);
      if (apiMatches) {
        apiMatches.forEach(ep => apiEndpoints.add(ep));
      }
    }

    ts.forEachChild(node, visitStatement);
  }

  if (callback.body && ts.isBlock(callback.body)) {
    callback.body.statements.forEach(visitStatement);
  }

  return { steps, apiEndpoints, uiElements };
}
