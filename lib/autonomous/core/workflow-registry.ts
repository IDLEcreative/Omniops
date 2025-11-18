/**
 * Workflow Registry
 *
 * Loads workflow definitions from AGENT_KNOWLEDGE_BASE.json
 * Workflows are automatically extracted from E2E tests.
 *
 * @module lib/autonomous/core/workflow-registry
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TaskStep } from './base-agent';

// ============================================================================
// Types
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  intent: string;
  preconditions: string[];
  steps: WorkflowStep[];
  postconditions: string[];
  successIndicators: string[];
  errorRecovery: string[];
}

export interface WorkflowStep {
  order: number;
  intent: string;
  action: string;
  target?: string;
  value?: string;
  expectedResult: string;
  alternatives: string[];
}

export interface AgentKnowledgeBase {
  workflows: WorkflowDefinition[];
  uiCatalog: any[];
  apiReference: any[];
  commonPatterns: any[];
}

// ============================================================================
// Workflow Registry
// ============================================================================

export class WorkflowRegistry {
  private static knowledgeBase: AgentKnowledgeBase | null = null;
  private static knowledgeBasePath = path.join(
    process.cwd(),
    'docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json'
  );

  /**
   * Load agent knowledge base from JSON file
   */
  private static loadKnowledgeBase(): AgentKnowledgeBase {
    if (this.knowledgeBase) {
      return this.knowledgeBase;
    }

    try {
      const fileContent = fs.readFileSync(this.knowledgeBasePath, 'utf-8');
      this.knowledgeBase = JSON.parse(fileContent);
      return this.knowledgeBase!;
    } catch (error) {
      console.error('[WorkflowRegistry] Failed to load knowledge base:', error);
      throw new Error('Failed to load agent knowledge base');
    }
  }

  /**
   * Get workflow by ID
   *
   * @example
   * const workflow = WorkflowRegistry.get('woocommerce_api_key_generation');
   */
  static get(workflowId: string): TaskStep[] {
    const knowledgeBase = this.loadKnowledgeBase();
    const workflow = knowledgeBase.workflows.find(w => w.id === workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Convert to TaskStep format
    return workflow.steps.map(step => ({
      order: step.order,
      intent: step.intent,
      action: step.action,
      target: step.target,
      value: step.value,
      expectedResult: step.expectedResult,
      alternatives: step.alternatives
    }));
  }

  /**
   * Get workflow definition (full metadata)
   */
  static getDefinition(workflowId: string): WorkflowDefinition {
    const knowledgeBase = this.loadKnowledgeBase();
    const workflow = knowledgeBase.workflows.find(w => w.id === workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return workflow;
  }

  /**
   * Search workflows by service or intent
   *
   * @example
   * const wooWorkflows = WorkflowRegistry.search('woocommerce');
   */
  static search(query: string): WorkflowDefinition[] {
    const knowledgeBase = this.loadKnowledgeBase();
    const lowerQuery = query.toLowerCase();

    return knowledgeBase.workflows.filter(w =>
      w.id.toLowerCase().includes(lowerQuery) ||
      w.name.toLowerCase().includes(lowerQuery) ||
      w.intent.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * List all available workflows
   */
  static list(): Array<{ id: string; name: string; intent: string }> {
    const knowledgeBase = this.loadKnowledgeBase();
    return knowledgeBase.workflows.map(w => ({
      id: w.id,
      name: w.name,
      intent: w.intent
    }));
  }

  /**
   * Check if workflow exists
   */
  static exists(workflowId: string): boolean {
    const knowledgeBase = this.loadKnowledgeBase();
    return knowledgeBase.workflows.some(w => w.id === workflowId);
  }

  /**
   * Get workflow count
   */
  static count(): number {
    const knowledgeBase = this.loadKnowledgeBase();
    return knowledgeBase.workflows.length;
  }

  /**
   * Reload knowledge base (useful after E2E test updates)
   */
  static reload(): void {
    this.knowledgeBase = null;
    this.loadKnowledgeBase();
  }

  /**
   * Get UI catalog (elements and selectors from E2E tests)
   */
  static getUICatalog(): any[] {
    const knowledgeBase = this.loadKnowledgeBase();
    return knowledgeBase.uiCatalog || [];
  }

  /**
   * Get API reference (endpoints discovered from E2E tests)
   */
  static getAPIReference(): any[] {
    const knowledgeBase = this.loadKnowledgeBase();
    return knowledgeBase.apiReference || [];
  }

  /**
   * Get common patterns (reusable workflows)
   */
  static getCommonPatterns(): any[] {
    const knowledgeBase = this.loadKnowledgeBase();
    return knowledgeBase.commonPatterns || [];
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get workflow (convenience function)
 */
export function getWorkflow(workflowId: string): TaskStep[] {
  return WorkflowRegistry.get(workflowId);
}

/**
 * Get workflow definition (convenience function)
 */
export function getWorkflowDefinition(workflowId: string): WorkflowDefinition {
  return WorkflowRegistry.getDefinition(workflowId);
}

/**
 * Search workflows (convenience function)
 */
export function searchWorkflows(query: string): WorkflowDefinition[] {
  return WorkflowRegistry.search(query);
}

/**
 * List workflows (convenience function)
 */
export function listWorkflows(): Array<{ id: string; name: string; intent: string }> {
  return WorkflowRegistry.list();
}
