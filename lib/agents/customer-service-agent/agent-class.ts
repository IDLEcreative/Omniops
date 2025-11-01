/**
 * Customer Service Agent implementation
 */

import type { ECommerceAgent } from './types';
import { getEnhancedSystemPrompt } from './system-prompts';
import { getActionPrompt } from './action-prompts';
import { formatOrdersForAI } from './formatters';

/**
 * Generic Customer Service Agent instructions and orchestration.
 * Provider-agnostic by default; can work with different e-commerce agents.
 */
export class CustomerServiceAgent implements ECommerceAgent {
  // Instance implementation (satisfies ECommerceAgent)
  getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boolean): string {
    return getEnhancedSystemPrompt(verificationLevel, hasCustomerData);
  }

  getActionPrompt(query: string, verificationLevel?: string): string {
    return getActionPrompt(query, verificationLevel);
  }

  formatOrdersForAI(orders: any[]): string {
    return formatOrdersForAI(orders);
  }

  buildCompleteContext(
    verificationLevel: string,
    customerContext: string,
    verificationPrompt: string,
    userQuery: string
  ): string {
    return CustomerServiceAgent.buildCompleteContext(
      verificationLevel,
      customerContext,
      verificationPrompt,
      userQuery
    );
  }

  // Static convenience API (mirrors legacy usage)
  /**
   * Get enhanced system prompt based on verification level (provider-agnostic)
   */
  static getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boolean): string {
    return getEnhancedSystemPrompt(verificationLevel, hasCustomerData);
  }

  /**
   * Format order data for AI consumption
   */
  static formatOrdersForAI(orders: any[]): string {
    return formatOrdersForAI(orders);
  }

  /**
   * Get action prompts for specific queries
   */
  static getActionPrompt(query: string, verificationLevel?: string): string {
    return getActionPrompt(query, verificationLevel);
  }

  /**
   * Build complete context for AI
   */
  static buildCompleteContext(
    verificationLevel: string,
    customerContext: string,
    verificationPrompt: string,
    userQuery: string
  ): string {
    const systemPrompt = getEnhancedSystemPrompt(
      verificationLevel,
      customerContext.includes('Recent Orders:')
    );

    const actionPrompt = getActionPrompt(userQuery, verificationLevel);

    let fullContext = systemPrompt;

    if (customerContext) {
      fullContext += `\n\n${customerContext}`;
    }

    if (verificationPrompt) {
      fullContext += `\n\n${verificationPrompt}`;
    }

    if (actionPrompt) {
      fullContext += `\n\nAction Required: ${actionPrompt}`;
    }

    return fullContext;
  }
}
