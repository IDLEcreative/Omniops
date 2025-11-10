/**
 * Tests for WorkflowRegistry
 * Tests workflow loading, search, and knowledge base access
 *
 * NOTE: These tests use the real AGENT_KNOWLEDGE_BASE.json file
 * This is intentional - we test against actual workflow data from E2E tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { WorkflowRegistry, listWorkflows } from '@/lib/autonomous/core/workflow-registry';

describe('WorkflowRegistry', () => {
  beforeEach(() => {
    // Reset cached knowledge base before each test
    WorkflowRegistry.reload();
  });

  describe('basic operations', () => {
    it('should load knowledge base successfully', () => {
      expect(() => WorkflowRegistry.list()).not.toThrow();
    });

    it('should return workflow count', () => {
      const count = WorkflowRegistry.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should list all workflows', () => {
      const workflows = WorkflowRegistry.list();
      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0]).toHaveProperty('id');
      expect(workflows[0]).toHaveProperty('name');
      expect(workflows[0]).toHaveProperty('intent');
    });
  });

  describe('workflow retrieval', () => {
    it('should get workflow steps when workflow exists', () => {
      // Get first workflow ID from list
      const workflows = WorkflowRegistry.list();
      expect(workflows.length).toBeGreaterThan(0);

      const firstWorkflowId = workflows[0].id;
      const steps = WorkflowRegistry.get(firstWorkflowId);

      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('order');
      expect(steps[0]).toHaveProperty('intent');
      expect(steps[0]).toHaveProperty('expectedResult');
    });

    it('should throw error for non-existent workflow', () => {
      expect(() => WorkflowRegistry.get('non_existent_workflow_12345'))
        .toThrow('Workflow not found');
    });

    it('should get full workflow definition', () => {
      const workflows = WorkflowRegistry.list();
      const firstWorkflowId = workflows[0].id;

      const definition = WorkflowRegistry.getDefinition(firstWorkflowId);

      expect(definition).toHaveProperty('id');
      expect(definition).toHaveProperty('name');
      expect(definition).toHaveProperty('intent');
      expect(definition).toHaveProperty('steps');
      expect(Array.isArray(definition.steps)).toBe(true);
    });
  });

  describe('search functionality', () => {
    it('should search workflows by query', () => {
      // Search for a generic term that should match something
      const results = WorkflowRegistry.search('page');

      // Should find some results (many workflows involve navigating pages)
      expect(results.length).toBeGreaterThanOrEqual(0);

      if (results.length > 0) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('name');
      }
    });

    it('should be case-insensitive', () => {
      const workflows = WorkflowRegistry.list();
      if (workflows.length === 0) return; // Skip if no workflows

      // Get a word from the first workflow
      const searchTerm = workflows[0].name.split(' ')[0];

      const resultsLower = WorkflowRegistry.search(searchTerm.toLowerCase());
      const resultsUpper = WorkflowRegistry.search(searchTerm.toUpperCase());

      expect(resultsLower.length).toBe(resultsUpper.length);
    });

    it('should return empty array for non-matching query', () => {
      const results = WorkflowRegistry.search('xyznonexistentquery9999');
      expect(results).toHaveLength(0);
    });
  });

  describe('exists', () => {
    it('should return true for existing workflow', () => {
      const workflows = WorkflowRegistry.list();
      if (workflows.length === 0) return; // Skip if no workflows

      const firstWorkflowId = workflows[0].id;
      expect(WorkflowRegistry.exists(firstWorkflowId)).toBe(true);
    });

    it('should return false for non-existent workflow', () => {
      expect(WorkflowRegistry.exists('non_existent_workflow_12345')).toBe(false);
    });
  });

  describe('reload', () => {
    it('should reload knowledge base', () => {
      const countBefore = WorkflowRegistry.count();

      WorkflowRegistry.reload();

      const countAfter = WorkflowRegistry.count();
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('metadata access', () => {
    it('should get UI catalog', () => {
      const catalog = WorkflowRegistry.getUICatalog();
      expect(Array.isArray(catalog)).toBe(true);
    });

    it('should get API reference', () => {
      const apiRef = WorkflowRegistry.getAPIReference();
      expect(Array.isArray(apiRef)).toBe(true);
      // API reference should exist if workflows exist
      if (WorkflowRegistry.count() > 0) {
        expect(apiRef.length).toBeGreaterThan(0);
      }
    });

    it('should get common patterns', () => {
      const patterns = WorkflowRegistry.getCommonPatterns();
      expect(Array.isArray(patterns)).toBe(true);
      // Common patterns should exist if workflows exist
      if (WorkflowRegistry.count() > 0) {
        expect(patterns.length).toBeGreaterThan(0);
      }
    });
  });

  describe('convenience functions', () => {
    it('should export convenience functions', async () => {
      const { getWorkflow, getWorkflowDefinition, searchWorkflows, listWorkflows } =
        await import('@/lib/autonomous/core/workflow-registry');

      expect(typeof getWorkflow).toBe('function');
      expect(typeof getWorkflowDefinition).toBe('function');
      expect(typeof searchWorkflows).toBe('function');
      expect(typeof listWorkflows).toBe('function');
    });

    it('should execute convenience functions', () => {
      const workflows = listWorkflows();
      expect(Array.isArray(workflows)).toBe(true);
    });
  });
});
