/**
 * Workflow Converter
 * Converts extracted workflows to agent-optimized format
 */

import { Workflow, WorkflowStep } from './workflow-extractor';

export interface AgentWorkflow {
  id: string;
  name: string;
  intent: string;
  preconditions: string[];
  steps: AgentStep[];
  postconditions: string[];
  successIndicators: string[];
  errorRecovery: string[];
}

export interface AgentStep {
  order: number;
  intent: string;
  action: string;
  target?: string;
  value?: string;
  expectedResult: string;
  waitTime?: number;
  alternatives?: string[];
}

/**
 * Convert workflow to agent-optimized format
 */
export function convertToAgentWorkflow(workflow: Workflow): AgentWorkflow {
  const id = slugify(workflow.testName);
  const intent = inferIntent(workflow.testName, workflow.description);
  const preconditions = extractPreconditions(workflow);
  const agentSteps = workflow.steps.map((step, idx) => convertToAgentStep(step, idx + 1));
  const postconditions = extractPostconditions(workflow);
  const successIndicators = extractSuccessIndicators(workflow);
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
 * Utility: slugify string
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
