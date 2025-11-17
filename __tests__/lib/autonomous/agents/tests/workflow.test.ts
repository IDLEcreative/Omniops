/**
 * Tests for Shopify Setup Agent workflow retrieval
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Create mock function at module level
const mockWorkflowRegistryGet = jest.fn<typeof import('@/lib/autonomous/core/workflow-registry').WorkflowRegistry.get>();

// Mock the module before any imports
jest.mock('@/lib/autonomous/core/workflow-registry', () => ({
  WorkflowRegistry: {
    get: (...args: Parameters<typeof mockWorkflowRegistryGet>) => mockWorkflowRegistryGet(...args)
  }
}));

jest.mock('@/lib/autonomous/security/credential-vault-helpers');
jest.mock('@/lib/autonomous/security/credential-vault');
jest.mock('@/lib/supabase/server');

// Import after mocking
import { ShopifySetupAgent } from '@/lib/autonomous/agents/shopify-setup-agent';
import { setupMocks } from './setup';

describe('ShopifySetupAgent - Workflow', () => {
  let agent: ShopifySetupAgent;
  const mockStoreUrl = 'https://teststore.myshopify.com';

  beforeEach(() => {
    setupMocks();
    // Reset modules to ensure our mock is used
    jest.resetModules();
    // Clear mock calls before each test
    mockWorkflowRegistryGet.mockClear();
    // Re-import after resetting modules
    const FreshAgent = await import('@/lib/autonomous/agents/shopify-setup-agent').then(m => m.ShopifySetupAgent);
    agent = new FreshAgent(mockStoreUrl);
  });

  it('should retrieve workflow from knowledge base', async () => {
    const mockWorkflow = [
      {
        order: 1,
        intent: 'Navigate to Shopify admin',
        action: 'goto',
        target: `${mockStoreUrl}/admin`,
        expectedResult: 'Login page loads'
      }
    ];

    // Setup the mock to return our test workflow
    mockWorkflowRegistryGet.mockReturnValue(mockWorkflow);

    const workflow = await agent.getWorkflow();

    expect(mockWorkflowRegistryGet).toHaveBeenCalledWith('should-complete-shopify-api-credential-generation');
    expect(workflow).toEqual(mockWorkflow);
  });

  it('should use fallback workflow when knowledge base unavailable', async () => {
    // Mock the function to throw an error
    mockWorkflowRegistryGet.mockImplementation(() => {
      throw new Error('Workflow not found');
    });

    const workflow = await agent.getWorkflow();

    expect(workflow).toBeDefined();
    expect(Array.isArray(workflow)).toBe(true);
    expect(workflow.length).toBeGreaterThan(0);
    expect(workflow[0]).toHaveProperty('intent');
    expect(workflow[0]).toHaveProperty('action');
  });

  it('should have complete fallback workflow steps', async () => {
    // Mock the function to throw an error
    mockWorkflowRegistryGet.mockImplementation(() => {
      throw new Error('Workflow not found');
    });

    const workflow = await agent.getWorkflow();

    const intents = workflow.map(step => step.intent);
    expect(intents).toContain('Navigate to Shopify admin login');
    expect(intents).toContain('Enter admin email');
    expect(intents).toContain('Enter admin password');
    expect(intents).toContain('Click Create an app button');
    expect(intents).toContain('Install app to generate credentials');
  });
});
