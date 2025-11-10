/**
 * Autonomous Agent Base Class
 *
 * Generic framework for autonomous AI agents that execute tasks via browser automation.
 * All service-specific agents (WooCommerce, Stripe, Shopify) extend this class.
 *
 * @module lib/autonomous/core/base-agent
 */

import { Browser, Page } from 'playwright';
import { getAuditLogger } from '../security/audit-logger';
import { BrowserManager } from './browser-manager';
import { DatabaseOperations } from './database-operations';
import { AICommander } from './ai-commander';
import type { TaskStep, ExecutionContext, OperationResult, StepExecutionResult } from './base-agent-types';

export type { TaskStep, ExecutionContext, OperationResult, StepExecutionResult } from './base-agent-types';

// ============================================================================
// Abstract Base Agent
// ============================================================================

export abstract class AutonomousAgent {
  protected browser?: Browser;
  protected page?: Page;
  protected aiCommander: AICommander;
  protected context?: ExecutionContext;
  protected startTime: number = 0;
  protected dbOps: DatabaseOperations;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable required');
    }

    this.aiCommander = new AICommander(apiKey);
    this.dbOps = new DatabaseOperations();
  }

  // ============================================================================
  // Abstract Methods (Must be implemented by subclasses)
  // ============================================================================

  /**
   * Get the workflow steps for this agent
   * Should load from WorkflowRegistry or define custom steps
   */
  abstract getWorkflow(): Promise<TaskStep[]>;

  /**
   * Extract the final result from the page after workflow completes
   *
   * @example
   * async extractResult(page: Page): Promise<{ apiKey: string }> {
   *   const key = await page.locator('.api-key').textContent();
   *   return { apiKey: key };
   * }
   */
  abstract extractResult(page: Page): Promise<any>;

  /**
   * Get credentials needed for this agent
   *
   * @example
   * async getCredentials(organizationId: string): Promise<Record<string, string>> {
   *   const password = await getCredential(organizationId, 'woocommerce', 'password');
   *   return { password: password.value };
   * }
   */
  abstract getCredentials(organizationId: string): Promise<Record<string, string>>;

  // ============================================================================
  // Main Execution Flow
  // ============================================================================

  /**
   * Execute the autonomous operation
   *
   * This is the main entry point called by the job processor
   */
  async execute(context: ExecutionContext): Promise<OperationResult> {
    this.context = context;
    this.startTime = Date.now();

    let stepsExecuted = 0;
    let stepsSucceeded = 0;
    let stepsFailed = 0;

    try {
      // 1. Verify consent
      await this.dbOps.verifyConsent(context.organizationId, context.service, context.operation);

      // 2. Update operation status to in_progress
      await this.dbOps.updateOperationStatus(context.operationId, 'in_progress');

      // 3. Get credentials
      const credentials = context.credentials || await this.getCredentials(context.organizationId);

      // 4. Initialize browser
      await this.initializeBrowser();

      // 5. Get workflow
      const workflow = await this.getWorkflow();

      // 6. Update total steps
      await this.dbOps.updateOperationSteps(context.operationId, workflow.length);

      // 7. Execute each step
      for (const step of workflow) {
        stepsExecuted++;

        const result = await this.executeStep(step, credentials);

        if (result.success) {
          stepsSucceeded++;
        } else {
          stepsFailed++;
          throw new Error(`Step ${step.order} failed: ${result.error}`);
        }

        // Update current step
        await this.dbOps.updateCurrentStep(context.operationId, step.order);
      }

      // 8. Extract result
      const data = await this.extractResult(this.page!);

      // 9. Update operation status to completed
      const duration = Date.now() - this.startTime;
      await this.dbOps.updateOperationStatus(context.operationId, 'completed', { success: true, data });

      return {
        success: true,
        data,
        duration,
        stepsExecuted,
        stepsSucceeded,
        stepsFailed
      };

    } catch (error) {
      const duration = Date.now() - this.startTime;
      const errorMessage = (error as Error).message;

      // Update operation status to failed
      await this.dbOps.updateOperationStatus(this.context!.operationId, 'failed', {
        success: false,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        duration,
        stepsExecuted,
        stepsSucceeded,
        stepsFailed
      };

    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  // ============================================================================
  // Step Execution
  // ============================================================================

  /**
   * Execute a single workflow step with AI guidance
   */
  protected async executeStep(
    step: TaskStep,
    credentials: Record<string, string>
  ): Promise<StepExecutionResult> {
    const stepStartTime = Date.now();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      // Take screenshot for AI vision
      const screenshot = await this.page.screenshot({ fullPage: false });
      const screenshotBase64 = screenshot.toString('base64');

      // Get current page state
      const pageUrl = this.page.url();

      // Ask AI what to do
      const aiCommand = await this.aiCommander.getCommand(step, screenshotBase64, pageUrl);

      console.log(`[AutonomousAgent] Step ${step.order}: ${step.intent}`);
      console.log(`[AutonomousAgent] AI Command: ${aiCommand}`);

      // Execute the command
      await this.executeCommand(aiCommand, credentials);

      // Wait for page to settle
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await this.page.waitForTimeout(1000);

      const duration = Date.now() - stepStartTime;

      // Upload screenshot and get URL
      const screenshotUrl = await this.dbOps.uploadScreenshot(
        this.context!.operationId,
        screenshotBase64,
        step.order
      );

      // Log to audit trail
      await getAuditLogger().logStep({
        operationId: this.context!.operationId,
        stepNumber: step.order,
        intent: step.intent,
        action: aiCommand,
        success: true,
        screenshotUrl,
        pageUrl,
        durationMs: duration
      });

      return {
        stepNumber: step.order,
        success: true,
        duration,
        screenshot: screenshotBase64
      };

    } catch (error) {
      const duration = Date.now() - stepStartTime;
      const errorMessage = (error as Error).message;

      // Log failure to audit trail
      await getAuditLogger().logStep({
        operationId: this.context!.operationId,
        stepNumber: step.order,
        intent: step.intent,
        action: 'Failed',
        success: false,
        error: errorMessage,
        durationMs: duration
      });

      return {
        stepNumber: step.order,
        success: false,
        duration,
        error: errorMessage
      };
    }
  }

  /**
   * Execute Playwright command safely with credential replacement
   */
  protected async executeCommand(
    command: string,
    credentials: Record<string, string>
  ): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await BrowserManager.executeCommand(this.page, command, credentials);
  }

  // ============================================================================
  // Browser Management
  // ============================================================================

  protected async initializeBrowser(): Promise<void> {
    const { browser, page } = await BrowserManager.initializeBrowser(this.context);
    this.browser = browser;
    this.page = page;
  }

  protected async cleanup(): Promise<void> {
    await BrowserManager.cleanup(this.browser);
  }
}
