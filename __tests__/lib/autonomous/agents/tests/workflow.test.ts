/**
 * Tests for Shopify Setup Agent workflow retrieval
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifySetupAgent } from '@/lib/autonomous/agents/shopify-setup-agent';
import { WorkflowRegistry } from '@/lib/autonomous/core/workflow-registry';
import { setupMocks } from './setup';

jest.mock('@/lib/autonomous/core/workflow-registry', () => ({
  WorkflowRegistry: { get: jest.fn() }
}));

jest.mock('@/lib/autonomous/security/credential-vault-helpers');
jest.mock('@/lib/autonomous/security/credential-vault');
jest.mock('@/lib/supabase/server');

describe('ShopifySetupAgent - Workflow', () => {
  let agent: ShopifySetupAgent;
  const mockStoreUrl = 'https://teststore.myshopify.com';

  beforeEach(() => {
    setupMocks();
    agent = new ShopifySetupAgent(mockStoreUrl);
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

    (WorkflowRegistry.get as any) = jest.fn().mockReturnValue(mockWorkflow);

    const workflow = await agent.getWorkflow();

    expect(WorkflowRegistry.get).toHaveBeenCalledWith('should-complete-shopify-api-credential-generation');
    expect(workflow).toEqual(mockWorkflow);
  });

  it('should use fallback workflow when knowledge base unavailable', async () => {
    (WorkflowRegistry.get as any) = jest.fn().mockImplementation(() => {
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
    const mockGet = WorkflowRegistry.get as jest.MockedFunction<typeof WorkflowRegistry.get>;
    mockGet.mockImplementation(() => {
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
