/**
 * Catalog Builder
 * Builds UI catalog, API reference, and identifies common patterns
 */

import { Workflow } from './workflow-extractor';

export interface UICatalogEntry {
  selector: string;
  semanticName: string;
  purpose: string;
  usedInWorkflows: string[];
  interactionType: string;
}

export interface APIReference {
  endpoint: string;
  purpose: string;
  usedInWorkflows: string[];
  expectedResponseTime?: string;
}

export interface CommonPattern {
  name: string;
  description: string;
  example: string;
  frequency: number;
}

/**
 * Build UI catalog from all workflows
 */
export function buildUICatalog(workflows: Workflow[]): UICatalogEntry[] {
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
 * Build API reference from workflows
 */
export function buildAPIReference(workflows: Workflow[]): APIReference[] {
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
 * Identify common patterns across workflows
 */
export function identifyCommonPatterns(workflows: Workflow[]): CommonPattern[] {
  const patterns: CommonPattern[] = [];

  const navigateCount = workflows.filter(w =>
    w.steps.some(s => s.action === 'navigate')
  ).length;

  patterns.push({
    name: 'Page Navigation',
    description: 'Navigate to a URL and wait for page load',
    example: 'await page.goto(url, { waitUntil: "networkidle" })',
    frequency: navigateCount
  });

  const fillCount = workflows.filter(w =>
    w.steps.filter(s => s.action === 'fill').length >= 2
  ).length;

  patterns.push({
    name: 'Form Filling',
    description: 'Fill multiple form fields and submit',
    example: 'await input.fill(value); await submitButton.click();',
    frequency: fillCount
  });

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

function inferSemanticName(selector: string): string {
  const cleaned = selector
    .replace(/button:has-text\("([^"]+)"\)/, '$1 Button')
    .replace(/input\[name="([^"]+)"\]/, '$1 Input Field')
    .replace(/\[data-testid="([^"]+)"\]/, '$1')
    .replace(/[#.]/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return cleaned || selector;
}

function inferPurpose(selector: string, workflow: Workflow): string {
  const lower = selector.toLowerCase();

  if (lower.includes('submit') || lower.includes('save')) {
    return 'Submit form data to server';
  }
  if (lower.includes('cancel') || lower.includes('close')) {
    return 'Cancel action or close dialog';
  }
  if (lower.includes('email')) return 'Input email address';
  if (lower.includes('password')) return 'Input password securely';
  if (lower.includes('search')) return 'Search for content or products';
  if (lower.includes('cart')) return 'Add item to shopping cart';
  if (lower.includes('checkout')) return 'Proceed to checkout';

  return 'Interact with application';
}

function inferInteractionType(selector: string, workflow: Workflow): string {
  const lower = selector.toLowerCase();

  if (lower.includes('button') || lower.includes('submit')) return 'click';
  if (lower.includes('input') || lower.includes('textarea')) return 'fill';
  if (lower.includes('select') || lower.includes('dropdown')) return 'select';
  if (lower.includes('checkbox')) return 'toggle';
  if (lower.includes('link') || lower.includes('href')) return 'navigate';

  const step = workflow.steps.find(s => s.target === selector);
  if (step) return step.action;

  return 'click';
}

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
