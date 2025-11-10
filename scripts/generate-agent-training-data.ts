/**
 * Agent Training Data Generator
 *
 * Converts extracted E2E workflows into AI-optimized training data that
 * agents can use to learn how to operate the application autonomously.
 *
 * Usage:
 *   npx tsx scripts/generate-agent-training-data.ts
 *
 * Outputs:
 *   docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md - Human-readable guide
 *   docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json - Machine-readable data
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

interface AgentKnowledge {
  workflows: AgentWorkflow[];
  uiCatalog: UICatalogEntry[];
  apiReference: APIReference[];
  commonPatterns: CommonPattern[];
  generatedAt: string;
}

interface AgentWorkflow {
  id: string;
  name: string;
  intent: string;
  preconditions: string[];
  steps: AgentStep[];
  postconditions: string[];
  successIndicators: string[];
  errorRecovery: string[];
}

interface AgentStep {
  order: number;
  intent: string;
  action: string;
  target?: string;
  value?: string;
  expectedResult: string;
  waitTime?: number;
  alternatives?: string[];
}

interface UICatalogEntry {
  selector: string;
  semanticName: string;
  purpose: string;
  usedInWorkflows: string[];
  interactionType: string;
}

interface APIReference {
  endpoint: string;
  purpose: string;
  usedInWorkflows: string[];
  expectedResponseTime?: string;
}

interface CommonPattern {
  name: string;
  description: string;
  example: string;
  frequency: number;
}

/**
 * Main generation function
 */
async function generateAgentTrainingData(): Promise<AgentKnowledge> {
  console.log('🤖 Generating AI Agent Training Data...\n');

  // Read extracted workflows
  const workflowsPath = path.join(process.cwd(), 'docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md');

  if (!fs.existsSync(workflowsPath)) {
    console.error('❌ Workflows file not found. Run extract-workflows-from-e2e.ts first.');
    process.exit(1);
  }

  // Re-extract workflows programmatically for processing
  const workflows = await extractWorkflows();

  console.log(`📄 Processing ${workflows.length} workflows\n`);

  // Generate agent-optimized data
  const agentWorkflows = workflows.map(convertToAgentWorkflow);
  const uiCatalog = buildUICatalog(workflows);
  const apiReference = buildAPIReference(workflows);
  const commonPatterns = identifyCommonPatterns(workflows);

  const knowledge: AgentKnowledge = {
    workflows: agentWorkflows,
    uiCatalog,
    apiReference,
    commonPatterns,
    generatedAt: new Date().toISOString()
  };

  console.log('✅ Generated:');
  console.log(`   ${agentWorkflows.length} agent workflows`);
  console.log(`   ${uiCatalog.length} UI elements`);
  console.log(`   ${apiReference.length} API endpoints`);
  console.log(`   ${commonPatterns.length} common patterns\n`);

  return knowledge;
}

/**
 * Re-extract workflows from test files
 */
async function extractWorkflows(): Promise<Workflow[]> {
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
 * Extract workflows from a single test file (simplified version from extract-workflows-from-e2e.ts)
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

      // Simple parsing - extract basic info
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

      // Extract API endpoints
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

/**
 * Convert workflow to agent-optimized format
 */
function convertToAgentWorkflow(workflow: Workflow): AgentWorkflow {
  const id = slugify(workflow.testName);

  // Infer intent from test name
  const intent = inferIntent(workflow.testName, workflow.description);

  // Extract preconditions
  const preconditions = extractPreconditions(workflow);

  // Convert steps to agent steps
  const agentSteps = workflow.steps.map((step, idx) => convertToAgentStep(step, idx + 1));

  // Extract postconditions and success indicators
  const postconditions = extractPostconditions(workflow);
  const successIndicators = extractSuccessIndicators(workflow);

  // Infer error recovery
  const errorRecovery = extractErrorRecovery(workflow);

  return {
    id,
    name: workflow.testName,
    intent,
    preconditions,
    steps: agentSteps,
    postconditions,
    successIndicators,
    errorRecovery
  };
}

/**
 * Infer workflow intent from name and description
 */
function inferIntent(testName: string, description: string): string {
  const name = testName.toLowerCase();

  if (name.includes('purchase') || name.includes('checkout')) {
    return 'Complete a product purchase from discovery to order confirmation';
  }
  if (name.includes('woocommerce') && name.includes('setup')) {
    return 'Configure WooCommerce integration for product synchronization';
  }
  if (name.includes('export') || name.includes('gdpr')) {
    return 'Export user data in compliance with privacy regulations';
  }
  if (name.includes('delete') && name.includes('data')) {
    return 'Delete user data permanently with proper authorization';
  }
  if (name.includes('widget') && name.includes('install')) {
    return 'Install and configure chat widget on customer website';
  }
  if (name.includes('scrape') || name.includes('scraping')) {
    return 'Scrape website content and make it searchable';
  }
  if (name.includes('analytics') || name.includes('dashboard')) {
    return 'View analytics dashboard with key performance metrics';
  }
  if (name.includes('chat') && name.includes('multi-turn')) {
    return 'Conduct multi-turn conversation maintaining context';
  }

  return `Execute ${testName}`;
}

/**
 * Extract preconditions from workflow
 */
function extractPreconditions(workflow: Workflow): string[] {
  const preconditions: string[] = [];

  const firstSteps = workflow.steps.slice(0, 3);

  if (firstSteps.some(s => s.action === 'navigate')) {
    preconditions.push('User must have network access to application');
    preconditions.push('Application must be running and accessible');
  }

  if (workflow.testName.includes('woocommerce') || workflow.testName.includes('shopify')) {
    preconditions.push('E-commerce platform credentials must be available');
  }

  if (workflow.testName.includes('purchase')) {
    preconditions.push('Products must be available in catalog');
    preconditions.push('Payment processing must be configured');
  }

  if (workflow.testName.includes('widget')) {
    preconditions.push('Customer must have valid domain configuration');
  }

  return preconditions.length > 0 ? preconditions : ['None - workflow can start from any state'];
}

/**
 * Convert workflow step to agent step
 */
function convertToAgentStep(step: WorkflowStep, order: number): AgentStep {
  let intent = '';
  let expectedResult = '';

  switch (step.action) {
    case 'navigate':
      intent = `Navigate to ${step.target || 'target page'}`;
      expectedResult = 'Page loads successfully with expected content';
      break;
    case 'click':
      intent = `Click on ${step.target || 'element'}`;
      expectedResult = 'Element responds and triggers expected action';
      break;
    case 'fill':
      intent = `Enter ${step.value || 'data'} into ${step.target || 'field'}`;
      expectedResult = 'Field accepts input and validates correctly';
      break;
    case 'wait':
      intent = 'Wait for element or condition';
      expectedResult = 'Element appears or condition becomes true';
      break;
    case 'verify':
      intent = 'Verify expected state or outcome';
      expectedResult = step.expectedOutcome || 'Verification passes';
      break;
    case 'log':
      intent = 'Progress marker';
      expectedResult = step.expectedOutcome || 'Continue to next step';
      break;
    default:
      intent = `Perform ${step.action}`;
      expectedResult = 'Action completes successfully';
  }

  return {
    order,
    intent,
    action: step.action,
    target: step.target,
    value: step.value,
    expectedResult,
    alternatives: []
  };
}

/**
 * Extract postconditions from workflow
 */
function extractPostconditions(workflow: Workflow): string[] {
  const postconditions: string[] = [];
  const lastSteps = workflow.steps.slice(-3);

  if (workflow.testName.includes('purchase')) {
    postconditions.push('Order is created in database');
    postconditions.push('User receives order confirmation');
    postconditions.push('Analytics event is tracked');
  }

  if (workflow.testName.includes('woocommerce') && workflow.testName.includes('setup')) {
    postconditions.push('WooCommerce credentials are stored securely');
    postconditions.push('Products are synchronized from store');
    postconditions.push('Chat can search synchronized products');
  }

  if (lastSteps.some(s => s.action === 'verify')) {
    postconditions.push('All verification checks pass');
  }

  return postconditions.length > 0 ? postconditions : ['Workflow completes without errors'];
}

/**
 * Extract success indicators
 */
function extractSuccessIndicators(workflow: Workflow): string[] {
  const indicators: string[] = [];

  workflow.steps.forEach(step => {
    if (step.expectedOutcome) {
      indicators.push(step.expectedOutcome);
    }
  });

  // Add generic indicators based on workflow type
  if (workflow.testName.includes('error') || workflow.testName.includes('fail')) {
    indicators.push('Error message is displayed to user');
    indicators.push('System handles error gracefully');
  } else {
    indicators.push('No error messages displayed');
    indicators.push('All steps complete without exceptions');
  }

  return indicators;
}

/**
 * Extract error recovery patterns
 */
function extractErrorRecovery(workflow: Workflow): string[] {
  const recovery: string[] = [];

  if (workflow.testName.includes('error') || workflow.testName.includes('gracefully')) {
    recovery.push('Display clear error message to user');
    recovery.push('Provide actionable next steps');
    recovery.push('Do not lose user progress');
  }

  if (workflow.testName.includes('network') || workflow.testName.includes('timeout')) {
    recovery.push('Retry with exponential backoff');
    recovery.push('Show retry option to user');
  }

  return recovery.length > 0 ? recovery : ['Log error and notify user'];
}

/**
 * Build UI catalog from all workflows
 */
function buildUICatalog(workflows: Workflow[]): UICatalogEntry[] {
  const elementMap = new Map<string, UICatalogEntry>();

  workflows.forEach(workflow => {
    workflow.uiElements.forEach(selector => {
      if (!elementMap.has(selector)) {
        const semanticName = inferSemanticName(selector);
        const purpose = inferPurpose(selector, workflow);
        const interactionType = inferInteractionType(selector, workflow);

        elementMap.set(selector, {
          selector,
          semanticName,
          purpose,
          usedInWorkflows: [workflow.testName],
          interactionType
        });
      } else {
        const entry = elementMap.get(selector)!;
        if (!entry.usedInWorkflows.includes(workflow.testName)) {
          entry.usedInWorkflows.push(workflow.testName);
        }
      }
    });
  });

  return Array.from(elementMap.values()).sort((a, b) =>
    b.usedInWorkflows.length - a.usedInWorkflows.length
  );
}

/**
 * Infer semantic name from selector
 */
function inferSemanticName(selector: string): string {
  // Remove technical syntax to get human-readable name
  const cleaned = selector
    .replace(/button:has-text\("([^"]+)"\)/, '$1 Button')
    .replace(/input\[name="([^"]+)"\]/, '$1 Input Field')
    .replace(/\[data-testid="([^"]+)"\]/, '$1')
    .replace(/[#.]/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return cleaned || selector;
}

/**
 * Infer purpose from selector and workflow context
 */
function inferPurpose(selector: string, workflow: Workflow): string {
  const lower = selector.toLowerCase();

  if (lower.includes('submit') || lower.includes('save')) {
    return 'Submit form data to server';
  }
  if (lower.includes('cancel') || lower.includes('close')) {
    return 'Cancel action or close dialog';
  }
  if (lower.includes('email')) {
    return 'Input email address';
  }
  if (lower.includes('password')) {
    return 'Input password securely';
  }
  if (lower.includes('search')) {
    return 'Search for content or products';
  }
  if (lower.includes('cart')) {
    return 'Add item to shopping cart';
  }
  if (lower.includes('checkout')) {
    return 'Proceed to checkout';
  }

  return 'Interact with application';
}

/**
 * Infer interaction type
 */
function inferInteractionType(selector: string, workflow: Workflow): string {
  const lower = selector.toLowerCase();

  if (lower.includes('button') || lower.includes('submit')) return 'click';
  if (lower.includes('input') || lower.includes('textarea')) return 'fill';
  if (lower.includes('select') || lower.includes('dropdown')) return 'select';
  if (lower.includes('checkbox')) return 'toggle';
  if (lower.includes('link') || lower.includes('href')) return 'navigate';

  // Check workflow steps to determine interaction
  const step = workflow.steps.find(s => s.target === selector);
  if (step) return step.action;

  return 'click';
}

/**
 * Build API reference from workflows
 */
function buildAPIReference(workflows: Workflow[]): APIReference[] {
  const apiMap = new Map<string, APIReference>();

  workflows.forEach(workflow => {
    workflow.apiEndpoints.forEach(endpoint => {
      if (!apiMap.has(endpoint)) {
        apiMap.set(endpoint, {
          endpoint,
          purpose: inferAPIPurpose(endpoint),
          usedInWorkflows: [workflow.testName]
        });
      } else {
        const entry = apiMap.get(endpoint)!;
        if (!entry.usedInWorkflows.includes(workflow.testName)) {
          entry.usedInWorkflows.push(workflow.testName);
        }
      }
    });
  });

  return Array.from(apiMap.values());
}

/**
 * Infer API purpose from endpoint
 */
function inferAPIPurpose(endpoint: string): string {
  if (endpoint.includes('/chat')) return 'Process chat messages and return AI responses';
  if (endpoint.includes('/scrape')) return 'Initiate web scraping job';
  if (endpoint.includes('/woocommerce')) return 'Interact with WooCommerce integration';
  if (endpoint.includes('/shopify')) return 'Interact with Shopify integration';
  if (endpoint.includes('/analytics')) return 'Retrieve analytics data';
  if (endpoint.includes('/gdpr') || endpoint.includes('/privacy')) {
    return 'Handle privacy-related operations';
  }

  return 'Application API endpoint';
}

/**
 * Identify common patterns across workflows
 */
function identifyCommonPatterns(workflows: Workflow[]): CommonPattern[] {
  const patterns: CommonPattern[] = [];

  // Pattern 1: Navigation pattern
  const navigateCount = workflows.filter(w =>
    w.steps.some(s => s.action === 'navigate')
  ).length;

  patterns.push({
    name: 'Page Navigation',
    description: 'Navigate to a URL and wait for page load',
    example: 'await page.goto(url, { waitUntil: "networkidle" })',
    frequency: navigateCount
  });

  // Pattern 2: Form fill pattern
  const fillCount = workflows.filter(w =>
    w.steps.filter(s => s.action === 'fill').length >= 2
  ).length;

  patterns.push({
    name: 'Form Filling',
    description: 'Fill multiple form fields and submit',
    example: 'await input.fill(value); await submitButton.click();',
    frequency: fillCount
  });

  // Pattern 3: Verification pattern
  const verifyCount = workflows.filter(w =>
    w.steps.some(s => s.action === 'verify')
  ).length;

  patterns.push({
    name: 'State Verification',
    description: 'Verify expected state or element visibility',
    example: 'await expect(element).toBeVisible();',
    frequency: verifyCount
  });

  return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generate human-readable markdown knowledge base
 */
function generateMarkdownKnowledgeBase(knowledge: AgentKnowledge): string {
  let md = `# AI Agent Knowledge Base

**Generated:** ${knowledge.generatedAt}
**Purpose:** This document teaches AI agents how to operate the application autonomously

---

## 📚 How to Use This Guide

**For AI Agents:**
- Each workflow describes a complete user journey you can execute
- Preconditions tell you what must be true before starting
- Steps are ordered actions you should perform
- Success indicators tell you when you've succeeded
- Error recovery tells you how to handle failures

**For Humans:**
- This is auto-generated documentation of E2E tests
- Use it to understand user workflows
- Use it to train AI agents or automation scripts

---

## 🎯 Available Workflows (${knowledge.workflows.length})

`;

  knowledge.workflows.slice(0, 10).forEach((wf, idx) => {
    md += `### ${idx + 1}. ${wf.name}\n\n`;
    md += `**Intent:** ${wf.intent}\n\n`;

    md += `**Preconditions:**\n`;
    wf.preconditions.forEach(pre => md += `- ${pre}\n`);
    md += '\n';

    md += `**Steps (${wf.steps.length}):**\n\n`;
    wf.steps.slice(0, 8).forEach(step => {
      md += `${step.order}. **${step.intent}**\n`;
      md += `   - Action: \`${step.action}\`\n`;
      if (step.target) md += `   - Target: \`${step.target}\`\n`;
      if (step.value) md += `   - Value: \`${step.value}\`\n`;
      md += `   - Expected: ${step.expectedResult}\n\n`;
    });

    if (wf.steps.length > 8) {
      md += `   ... ${wf.steps.length - 8} more steps\n\n`;
    }

    md += `**Success Indicators:**\n`;
    wf.successIndicators.slice(0, 3).forEach(ind => md += `- ✅ ${ind}\n`);
    md += '\n';

    md += `**Error Recovery:**\n`;
    wf.errorRecovery.forEach(rec => md += `- ⚠️ ${rec}\n`);
    md += '\n---\n\n';
  });

  if (knowledge.workflows.length > 10) {
    md += `... ${knowledge.workflows.length - 10} more workflows available in JSON export\n\n`;
  }

  md += `## 🎨 UI Element Catalog (${knowledge.uiCatalog.length})\n\n`;
  md += 'Common UI elements you will interact with:\n\n';

  knowledge.uiCatalog.slice(0, 20).forEach(el => {
    md += `### ${el.semanticName}\n`;
    md += `- **Selector:** \`${el.selector}\`\n`;
    md += `- **Purpose:** ${el.purpose}\n`;
    md += `- **Interaction:** ${el.interactionType}\n`;
    md += `- **Used in:** ${el.usedInWorkflows.length} workflow(s)\n\n`;
  });

  md += `\n## 🔌 API Reference (${knowledge.apiReference.length})\n\n`;

  knowledge.apiReference.forEach(api => {
    md += `### \`${api.endpoint}\`\n`;
    md += `- **Purpose:** ${api.purpose}\n`;
    md += `- **Used in:** ${api.usedInWorkflows.join(', ')}\n\n`;
  });

  md += `\n## 🔄 Common Patterns\n\n`;

  knowledge.commonPatterns.forEach((pattern, idx) => {
    md += `### ${idx + 1}. ${pattern.name} (${pattern.frequency} uses)\n`;
    md += `${pattern.description}\n\n`;
    md += `**Example:**\n\`\`\`typescript\n${pattern.example}\n\`\`\`\n\n`;
  });

  return md;
}

/**
 * Utility: slugify string
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
  const knowledge = await generateAgentTrainingData();

  // Write JSON
  const jsonPath = path.join(process.cwd(), 'docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json');
  fs.writeFileSync(jsonPath, JSON.stringify(knowledge, null, 2), 'utf-8');
  console.log(`✅ JSON data: ${jsonPath}`);

  // Write Markdown
  const markdown = generateMarkdownKnowledgeBase(knowledge);
  const mdPath = path.join(process.cwd(), 'docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md');
  fs.writeFileSync(mdPath, markdown, 'utf-8');
  console.log(`✅ Markdown guide: ${mdPath}\n`);

  console.log('🎉 Agent training data generation complete!\n');
  console.log('📖 AI agents can now learn from:');
  console.log(`   - ${knowledge.workflows.length} executable workflows`);
  console.log(`   - ${knowledge.uiCatalog.length} UI element definitions`);
  console.log(`   - ${knowledge.apiReference.length} API endpoints`);
  console.log(`   - ${knowledge.commonPatterns.length} interaction patterns\n`);
}

main().catch(console.error);
