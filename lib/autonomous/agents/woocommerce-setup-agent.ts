/**
 * WooCommerce Setup Agent
 *
 * Autonomous agent that automatically configures WooCommerce integration.
 * Generates API keys and synchronizes product catalog.
 *
 * @module lib/autonomous/agents/woocommerce-setup-agent
 */

import { Page } from 'playwright';
import { AutonomousAgent, TaskStep } from '../core/base-agent';
import { WorkflowRegistry } from '../core/workflow-registry';
import { getCredential } from '../security/credential-vault';

// ============================================================================
// Types
// ============================================================================

export interface WooCommerceSetupResult {
  success: boolean;
  apiKey?: string;
  storeUrl?: string;
  productCount?: number;
  error?: string;
}

// ============================================================================
// WooCommerce Setup Agent
// ============================================================================

export class WooCommerceSetupAgent extends AutonomousAgent {
  private storeUrl: string;

  constructor(storeUrl: string) {
    super();
    this.storeUrl = storeUrl;
  }

  /**
   * Get workflow from E2E test knowledge base
   */
  async getWorkflow(): Promise<TaskStep[]> {
    // Load workflow from E2E tests
    // This workflow was automatically generated from integration tests
    const workflowId = 'should-complete-woocommerce-setup-and-enable-product-search';

    try {
      return WorkflowRegistry.get(workflowId);
    } catch (error) {
      // Fallback: Define manual workflow if knowledge base not available
      console.warn('[WooCommerceSetupAgent] Using fallback workflow');
      return this.getFallbackWorkflow();
    }
  }

  /**
   * Get credentials needed for WooCommerce setup
   */
  async getCredentials(organizationId: string): Promise<Record<string, string>> {
    try {
      // Get admin credentials from vault
      const adminUser = await getCredential(organizationId, 'woocommerce', 'password');
      const adminPass = await getCredential(organizationId, 'woocommerce', 'password');

      if (!adminUser || !adminPass) {
        throw new Error('WooCommerce admin credentials not found in vault');
      }

      return {
        adminUsername: adminUser.value,
        adminPassword: adminPass.value,
        storeUrl: this.storeUrl
      };
    } catch (error) {
      console.error('[WooCommerceSetupAgent] Failed to get credentials:', error);
      throw error;
    }
  }

  /**
   * Extract API key and setup results from final page
   */
  async extractResult(page: Page): Promise<WooCommerceSetupResult> {
    try {
      // Try to find API key on the page
      // WooCommerce shows API keys in <code> elements or specific classes
      let apiKey: string | undefined;

      // Method 1: Look for consumer key element
      const consumerKeyElement = await page.locator('code:has-text("ck_")').first().textContent({ timeout: 5000 }).catch(() => null);
      if (consumerKeyElement) {
        apiKey = consumerKeyElement;
      }

      // Method 2: Check input fields
      if (!apiKey) {
        const keyInput = await page.locator('input[value^="ck_"]').first().inputValue({ timeout: 5000 }).catch(() => null);
        if (keyInput) {
          apiKey = keyInput;
        }
      }

      // Method 3: Check table cells
      if (!apiKey) {
        const tableCell = await page.locator('td:has-text("ck_")').first().textContent({ timeout: 5000 }).catch(() => null);
        if (tableCell) {
          apiKey = tableCell.trim();
        }
      }

      // Get product count if available
      let productCount: number | undefined;
      const productCountText = await page.locator('text=/\\d+ products?/i').first().textContent({ timeout: 3000 }).catch(() => null);
      if (productCountText) {
        const match = productCountText.match(/(\d+)/);
        if (match && match[1]) {
          productCount = parseInt(match[1], 10);
        }
      }

      if (!apiKey) {
        console.warn('[WooCommerceSetupAgent] Could not extract API key from page');
      }

      return {
        success: true,
        apiKey,
        storeUrl: this.storeUrl,
        productCount
      };
    } catch (error) {
      console.error('[WooCommerceSetupAgent] Failed to extract result:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Fallback workflow if knowledge base is unavailable
   * Manually defined workflow for WooCommerce API key generation
   */
  private getFallbackWorkflow(): TaskStep[] {
    return [
      {
        order: 1,
        intent: 'Navigate to WooCommerce admin',
        action: 'goto',
        target: `${this.storeUrl}/wp-admin`,
        expectedResult: 'Admin login page loads'
      },
      {
        order: 2,
        intent: 'Enter admin username',
        action: 'fill',
        target: '#user_login',
        value: '{adminUsername}',
        expectedResult: 'Username entered'
      },
      {
        order: 3,
        intent: 'Enter admin password',
        action: 'fill',
        target: '#user_pass',
        value: '{adminPassword}',
        expectedResult: 'Password entered'
      },
      {
        order: 4,
        intent: 'Click login button',
        action: 'click',
        target: '#wp-submit',
        expectedResult: 'Admin dashboard loads'
      },
      {
        order: 5,
        intent: 'Navigate to WooCommerce settings',
        action: 'goto',
        target: `${this.storeUrl}/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys`,
        expectedResult: 'API Keys page loads'
      },
      {
        order: 6,
        intent: 'Click Add Key button',
        action: 'click',
        target: 'a.button:has-text("Add key")',
        expectedResult: 'Add Key form appears'
      },
      {
        order: 7,
        intent: 'Fill key description',
        action: 'fill',
        target: '#key_description',
        value: 'OmniOps Integration',
        expectedResult: 'Description entered'
      },
      {
        order: 8,
        intent: 'Select Read/Write permissions',
        action: 'selectOption',
        target: '#key_permissions',
        value: 'read_write',
        expectedResult: 'Permissions selected'
      },
      {
        order: 9,
        intent: 'Click Generate API Key button',
        action: 'click',
        target: '.button-primary:has-text("Generate")',
        expectedResult: 'API keys generated and displayed'
      }
    ];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create WooCommerce setup agent
 *
 * @example
 * const agent = createWooCommerceSetupAgent('https://shop.example.com');
 * const result = await agent.execute({
 *   operationId: 'op-123',
 *   organizationId: 'customer-456',
 *   service: 'woocommerce',
 *   operation: 'api_key_generation'
 * });
 */
export function createWooCommerceSetupAgent(storeUrl: string): WooCommerceSetupAgent {
  return new WooCommerceSetupAgent(storeUrl);
}
