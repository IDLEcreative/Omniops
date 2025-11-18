/**
 * Shopify Setup Agent
 *
 * Autonomous agent that automatically configures Shopify integration.
 * Generates private app API credentials and configures necessary scopes.
 *
 * @module lib/autonomous/agents/shopify-setup-agent
 */

import { Page } from 'playwright';
import { AutonomousAgent, TaskStep } from '../core/base-agent';
import { WorkflowRegistry } from '../core/workflow-registry';
import { getCredential } from '@/lib/autonomous/security/credential-vault';

// ============================================================================
// Types
// ============================================================================

export interface ShopifySetupResult {
  success: boolean;
  accessToken?: string;
  apiKey?: string;
  apiSecret?: string;
  storeUrl?: string;
  scopes?: string[];
  error?: string;
}

// ============================================================================
// Shopify Setup Agent
// ============================================================================

export class ShopifySetupAgent extends AutonomousAgent {
  private storeUrl: string;

  constructor(storeUrl: string) {
    super();
    // Normalize store URL to myshopify.com format if needed
    this.storeUrl = this.normalizeStoreUrl(storeUrl);
  }

  /**
   * Normalize Shopify store URL
   * Converts various formats to standard https://storename.myshopify.com
   */
  private normalizeStoreUrl(url: string): string {
    // Remove protocol if present
    let normalized = url.replace(/^https?:\/\//, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // If it's just a store name, add myshopify.com
    if (!normalized.includes('.')) {
      normalized = `${normalized}.myshopify.com`;
    }

    // Add https protocol
    return `https://${normalized}`;
  }

  /**
   * Get workflow from E2E test knowledge base
   */
  async getWorkflow(): Promise<TaskStep[]> {
    // Load workflow from knowledge base
    // This workflow was specifically designed for Shopify API credential generation
    const workflowId = 'should-complete-shopify-api-credential-generation';

    try {
      return WorkflowRegistry.get(workflowId);
    } catch (error) {
      // Fallback: Define manual workflow if knowledge base not available
      console.warn('[ShopifySetupAgent] Using fallback workflow');
      return this.getFallbackWorkflow();
    }
  }

  /**
   * Get credentials needed for Shopify setup
   */
  async getCredentials(organizationId: string): Promise<Record<string, string>> {
    try {
      // Get admin credentials from vault
      const adminEmail = await getCredential(organizationId, 'shopify', 'password');
      const adminPass = await getCredential(organizationId, 'shopify', 'password');

      if (!adminEmail || !adminPass) {
        throw new Error('Shopify admin credentials not found in vault');
      }

      return {
        adminEmail: adminEmail.value,
        adminPassword: adminPass.value,
        storeUrl: this.storeUrl
      };
    } catch (error) {
      console.error('[ShopifySetupAgent] Failed to get credentials:', error);
      throw error;
    }
  }

  /**
   * Extract API credentials and setup results from final page
   */
  async extractResult(page: Page): Promise<ShopifySetupResult> {
    try {
      // Shopify access tokens start with 'shpat_' for Admin API
      let accessToken: string | undefined;
      let apiKey: string | undefined;
      let apiSecret: string | undefined;

      // Method 1: Look for access token in readonly input (most common)
      const tokenInput = await page
        .locator('input[readonly][value^="shpat_"]')
        .first()
        .inputValue({ timeout: 5000 })
        .catch(() => null);

      if (tokenInput) {
        accessToken = tokenInput;
      }

      // Method 2: Look for token in code block
      if (!accessToken) {
        const codeBlock = await page
          .locator('code:has-text("shpat_")')
          .first()
          .textContent({ timeout: 5000 })
          .catch(() => null);

        if (codeBlock) {
          // Extract token from code block
          const match = codeBlock.match(/shpat_[a-zA-Z0-9]+/);
          if (match) {
            accessToken = match[0];
          }
        }
      }

      // Method 3: Look for API key and secret (for older private apps)
      const apiKeyInput = await page
        .locator('input[readonly]:has-value(/^[a-f0-9]{32}$/)')
        .first()
        .inputValue({ timeout: 3000 })
        .catch(() => null);

      if (apiKeyInput) {
        apiKey = apiKeyInput;
      }

      const apiSecretInput = await page
        .locator('input[readonly][type="password"]')
        .first()
        .inputValue({ timeout: 3000 })
        .catch(() => null);

      if (apiSecretInput) {
        apiSecret = apiSecretInput;
      }

      // Extract configured scopes
      const scopes: string[] = [];
      const scopeElements = await page
        .locator('[data-polaris-permissions] input[type="checkbox"]:checked')
        .all();

      for (const elem of scopeElements) {
        const value = await elem.getAttribute('value');
        if (value) {
          scopes.push(value);
        }
      }

      // If no scopes found, try alternative method
      if (scopes.length === 0) {
        const scopeText = await page
          .locator('text=/read_|write_/')
          .allTextContents();

        scopeText.forEach(text => {
          const matches = text.match(/\b(read|write)_[a-z_]+\b/g);
          if (matches) {
            scopes.push(...matches);
          }
        });
      }

      if (!accessToken && !apiKey) {
        console.warn('[ShopifySetupAgent] Could not extract API credentials from page');
      }

      return {
        success: true,
        accessToken,
        apiKey,
        apiSecret,
        storeUrl: this.storeUrl,
        scopes: scopes.length > 0 ? scopes : undefined
      };
    } catch (error) {
      console.error('[ShopifySetupAgent] Failed to extract result:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Fallback workflow if knowledge base is unavailable
   * Manually defined workflow for Shopify API credential generation
   */
  private getFallbackWorkflow(): TaskStep[] {
    return [
      {
        order: 1,
        intent: 'Navigate to Shopify admin login',
        action: 'goto',
        target: `${this.storeUrl}/admin`,
        expectedResult: 'Login page loads'
      },
      {
        order: 2,
        intent: 'Enter admin email',
        action: 'fill',
        target: '#account_email',
        expectedResult: 'Email entered'
      },
      {
        order: 3,
        intent: 'Click continue button',
        action: 'click',
        target: 'button:has-text("Continue")',
        expectedResult: 'Password page appears'
      },
      {
        order: 4,
        intent: 'Enter admin password',
        action: 'fill',
        target: '#account_password',
        value: '{adminPassword}',
        expectedResult: 'Password entered'
      },
      {
        order: 5,
        intent: 'Click login button',
        action: 'click',
        target: 'button:has-text("Log in")',
        expectedResult: 'Admin dashboard loads'
      },
      {
        order: 6,
        intent: 'Navigate to Apps page',
        action: 'goto',
        target: `${this.storeUrl}/admin/apps`,
        expectedResult: 'Apps page loads'
      },
      {
        order: 7,
        intent: 'Click Develop apps link',
        action: 'click',
        target: 'a:has-text("Develop apps")',
        expectedResult: 'App development page loads'
      },
      {
        order: 8,
        intent: 'Click Create an app button',
        action: 'click',
        target: 'button:has-text("Create an app")',
        expectedResult: 'Create app modal appears'
      },
      {
        order: 9,
        intent: 'Enter app name',
        action: 'fill',
        target: 'input[name="name"]',
        value: 'OmniOps Integration',
        expectedResult: 'App name entered'
      },
      {
        order: 10,
        intent: 'Click create button',
        action: 'click',
        target: 'button:has-text("Create app")',
        expectedResult: 'App created'
      },
      {
        order: 11,
        intent: 'Navigate to Configuration',
        action: 'click',
        target: 'button:has-text("Configuration")',
        expectedResult: 'Configuration page loads'
      },
      {
        order: 12,
        intent: 'Click Configure Admin API scopes',
        action: 'click',
        target: 'button:has-text("Configure")',
        expectedResult: 'Scopes modal opens'
      },
      {
        order: 13,
        intent: 'Select read_products scope',
        action: 'click',
        target: 'input[value="read_products"]',
        expectedResult: 'Scope selected'
      },
      {
        order: 14,
        intent: 'Select write_products scope',
        action: 'click',
        target: 'input[value="write_products"]',
        expectedResult: 'Scope selected'
      },
      {
        order: 15,
        intent: 'Select read_orders scope',
        action: 'click',
        target: 'input[value="read_orders"]',
        expectedResult: 'Scope selected'
      },
      {
        order: 16,
        intent: 'Save scopes',
        action: 'click',
        target: 'button:has-text("Save")',
        expectedResult: 'Scopes saved'
      },
      {
        order: 17,
        intent: 'Install app to generate credentials',
        action: 'click',
        target: 'button:has-text("Install app")',
        expectedResult: 'Credentials displayed'
      }
    ];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create Shopify setup agent
 *
 * @example
 * const agent = createShopifySetupAgent('mystore.myshopify.com');
 * const result = await agent.execute({
 *   operationId: 'op-123',
 *   organizationId: 'org-456',
 *   service: 'shopify',
 *   operation: 'api_credential_generation'
 * });
 */
export function createShopifySetupAgent(storeUrl: string): ShopifySetupAgent {
  return new ShopifySetupAgent(storeUrl);
}
