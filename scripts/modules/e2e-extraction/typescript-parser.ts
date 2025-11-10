/**
 * TypeScript Parser
 * Parses TypeScript test files to extract workflows using AST analysis
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

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

/**
 * Extract workflow from a test() call node
 */
export function extractWorkflowFromTestNode(
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

/**
 * Extract description from JSDoc or comments above test
 */
function extractDescriptionFromComments(node: ts.Node, sourceFile: ts.SourceFile): string {
  const fullText = sourceFile.getFullText();
  const nodeStart = node.getFullStart();
  const leadingComments = ts.getLeadingCommentRanges(fullText, nodeStart);

  if (!leadingComments || leadingComments.length === 0) return '';

  const lastComment = leadingComments[leadingComments.length - 1];
  const commentText = fullText.substring(lastComment.pos, lastComment.end);

  return commentText.replace(/\/\*\*?|\*\/|^\s*\*\s?/gm, '').trim();
}

/**
 * Extract steps from test callback function
 */
export function extractStepsFromCallback(
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

        if (step.action === 'navigate' && step.target) {
          const match = step.target.match(/\/api\/[^\s'"]+/);
          if (match) apiEndpoints.add(match[0]);
        }
        if (step.code.includes('/api/')) {
          const matches = step.code.match(/\/api\/[^\s'"]+/g);
          if (matches) matches.forEach(ep => apiEndpoints.add(ep));
        }

        if (step.target) {
          uiElements.add(step.target);
        }
      }
    }

    ts.forEachChild(node, visitStatement);
  }

  if (callback.body && ts.isBlock(callback.body)) {
    callback.body.statements.forEach(visitStatement);
  }

  return { steps, apiEndpoints, uiElements };
}

function parseStep(node: ts.ExpressionStatement, sourceFile: ts.SourceFile): WorkflowStep | null {
  const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const code = node.getText(sourceFile).trim();

  if (ts.isAwaitExpression(node.expression)) {
    const awaitedExpr = node.expression.expression;
    if (ts.isCallExpression(awaitedExpr)) {
      return parseAwaitExpression(awaitedExpr, lineNumber, code, sourceFile);
    }
  }

  if (ts.isCallExpression(node.expression)) {
    const expr = node.expression;
    if (ts.isPropertyAccessExpression(expr.expression)) {
      if (expr.expression.expression.getText(sourceFile) === 'console' &&
          expr.expression.name.text === 'log') {
        const logArg = expr.arguments[0];
        if (logArg && ts.isStringLiteral(logArg)) {
          const logText = logArg.text;
          if (logText.includes('Step') || logText.includes('STEP')) {
            return { lineNumber, action: 'log', expectedOutcome: logText, code };
          }
        }
      }
    }
  }

  return null;
}

function parseAwaitExpression(
  callExpr: ts.CallExpression,
  lineNumber: number,
  code: string,
  sourceFile: ts.SourceFile
): WorkflowStep | null {
  const expr = callExpr.expression;

  if (ts.isPropertyAccessExpression(expr)) {
    const methodName = expr.name.text;
    const args = callExpr.arguments;

    switch (methodName) {
      case 'goto':
        return { lineNumber, action: 'navigate', target: args[0] ? getStringValue(args[0], sourceFile) : undefined, code };
      case 'click':
        return { lineNumber, action: 'click', target: args[0] ? getStringValue(args[0], sourceFile) : undefined, code };
      case 'fill':
      case 'type':
        return { lineNumber, action: 'fill', target: args[0] ? getStringValue(args[0], sourceFile) : undefined, value: args[1] ? getStringValue(args[1], sourceFile) : undefined, code };
      case 'waitFor':
      case 'waitForSelector':
      case 'waitForTimeout':
        return { lineNumber, action: 'wait', target: args[0] ? getStringValue(args[0], sourceFile) : undefined, code };
      case 'reload':
        return { lineNumber, action: 'reload', code };
      case 'screenshot':
        return { lineNumber, action: 'screenshot', code };
    }
  }

  if (ts.isIdentifier(expr) && expr.text === 'expect') {
    return { lineNumber, action: 'verify', expectedOutcome: code.replace(/^await\s+/, ''), code };
  }

  if (code.includes('iframe.locator') || code.includes('page.locator')) {
    if (code.includes('.fill(')) {
      return { lineNumber, action: 'fill', target: extractLocator(code), value: extractFillValue(code), code };
    }
    if (code.includes('.click(')) {
      return { lineNumber, action: 'click', target: extractLocator(code), code };
    }
  }

  return null;
}

function getStringValue(expr: ts.Expression, sourceFile: ts.SourceFile): string {
  if (ts.isStringLiteral(expr)) return expr.text;
  if (ts.isTemplateExpression(expr)) return expr.getText(sourceFile);
  return expr.getText(sourceFile);
}

function extractLocator(code: string): string | undefined {
  const match = code.match(/locator\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : undefined;
}

function extractFillValue(code: string): string | undefined {
  const match = code.match(/\.fill\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : undefined;
}
