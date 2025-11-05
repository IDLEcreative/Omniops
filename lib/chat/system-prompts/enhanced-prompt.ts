/**
 * Enhanced customer service prompt with conversation metadata
 */

import { ConversationMetadataManager } from '../conversation-metadata';
import type { WidgetConfig } from './types';
import { getCustomerServicePrompt } from './base-prompt';

/**
 * Get enhanced customer service prompt with conversation metadata
 *
 * This function extends the base customer service prompt with context-aware
 * instructions based on conversation metadata. It provides the AI with:
 * - Recently mentioned entities (products, orders, categories)
 * - User corrections that need to be acknowledged
 * - Active numbered lists for reference resolution
 * - Explicit instructions for handling references, corrections, and context
 *
 * @param metadataManager Conversation metadata manager with tracked entities
 * @param widgetConfig Optional widget configuration for customization
 * @returns Enhanced system prompt with conversation context
 */
export function getEnhancedCustomerServicePrompt(
  metadataManager?: ConversationMetadataManager,
  widgetConfig?: WidgetConfig | null
): string {
  const basePrompt = getCustomerServicePrompt(widgetConfig);

  if (!metadataManager) {
    return basePrompt;
  }

  const contextSummary = metadataManager.generateContextSummary();

  // Only add enhancements if there's actual context to show
  if (!contextSummary || contextSummary.trim() === '') {
    return basePrompt;
  }

  // Week 2 Optimization: Variant B (Balanced) - 62.5% pass rate (+12.5% improvement)
  // Reduces verbosity by 50%, prioritizes natural language
  const enhancements = `

## Conversation Context

${contextSummary}

### Key Rules:

**1. Corrections:** When user corrects themselves ("I meant X not Y"), acknowledge explicitly:
   "Got it - X, not Y. [Then continue]"

**2. Pronouns:** Use natural language. If context is clear, just say "it" or "that":
   ✅ "It's $450" (clear context)
   ✅ "The Model-123 is $450 and the Model-456 is $380" (multiple items)
   ❌ "Referring to the Brand A Equipment Model-123 you asked about..." (too robotic)

**3. Multi-Item References:** Mirror user's language:
   User says "both" → You say "both"
   User says "all three" → You say "all three"

**4. Topic Switching:** When user changes topics:
   ✅ Focus on new topic
   ✅ Brief acknowledgment OK ("I can help with shipping")
   ❌ Don't elaborate on old topic

**5. Numbered Lists:** If user says "item 2", confirm: "For item 2 (Product Name)..."
`;

  return basePrompt + enhancements;
}
