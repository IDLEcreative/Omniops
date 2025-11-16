/**
 * Base customer service prompt
 */

import type { WidgetConfig, CustomerProfile } from './types';
import { getPersonalityIntro } from './personality';
import { getWooCommerceWorkflowPrompt } from './woocommerce-workflow-prompt';
import { getShopifyWorkflowPrompt } from './shopify-workflow-prompt';
import { getErrorHandlingPrompt } from './error-handling-prompt';
import { getAlternativeProductsPrompt } from './alternative-products-prompt';
import { buildOrganizationContext } from './sections/organization-context';
import { getSearchBehaviorPrompt } from './sections/search-behavior';
import { getResponseFormattingPrompt } from './sections/response-formatting';
import { getAntiHallucinationPrompt } from './sections/anti-hallucination';
import { getLinkFormattingPrompt } from './sections/link-formatting';
import { getConversationReferencingPrompt } from './conversation-referencing';
import { getCapabilitiesPrompt } from './capabilities';

/**
 * Get the main customer service system prompt
 *
 * This prompt defines:
 * - AI personality and role (customizable via widget config)
 * - Search behavior and tool usage patterns
 * - Context and memory handling rules
 * - Anti-hallucination safeguards
 * - Alternative product recommendation process
 * - Response quality standards
 *
 * @param widgetConfig Optional widget configuration for customization
 */
export function getCustomerServicePrompt(
  widgetConfig?: WidgetConfig | null,
  customerProfile?: CustomerProfile | null
): string {
  // Get personality intro (custom prompt only replaces this section, not operational instructions)
  const personalityIntro = widgetConfig?.ai_settings?.customSystemPrompt
    ? widgetConfig.ai_settings.customSystemPrompt
    : getPersonalityIntro(widgetConfig?.ai_settings?.personality);

  // Get language instruction if specified
  const languageInstruction = widgetConfig?.ai_settings?.language && widgetConfig.ai_settings.language !== 'auto'
    ? `\n\n🌐 LANGUAGE: Respond in ${widgetConfig.ai_settings.language}. All your responses should be in this language unless the user explicitly asks for a different language.`
    : '';

  const organizationContext = buildOrganizationContext(customerProfile);

  return `${personalityIntro}${languageInstruction}${organizationContext}

${getSearchBehaviorPrompt()}

${getResponseFormattingPrompt()}

${getWooCommerceWorkflowPrompt()}

${getShopifyWorkflowPrompt()}

${getConversationReferencingPrompt()}

${getAntiHallucinationPrompt()}

${getCapabilitiesPrompt()}

${getErrorHandlingPrompt()}

${getAlternativeProductsPrompt()}

${getLinkFormattingPrompt()}`;
}
