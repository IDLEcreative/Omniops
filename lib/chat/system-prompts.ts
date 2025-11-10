/**
 * System Prompts
 *
 * Contains system prompts and instructions for the AI chat assistant.
 * These prompts define the AI's behavior, personality, and critical rules.
 *
 * This file is a proxy to the refactored module structure.
 * All logic is now split into focused modules under system-prompts/
 */

export {
  getCustomerServicePrompt,
  getEnhancedCustomerServicePrompt,
  buildConversationMessages
} from './system-prompts/index';

export type { WidgetConfig, CustomerProfile } from './system-prompts/index';
