/**
 * Variant B: Balanced Refinement Approach
 *
 * Strategy: Reduce verbosity by 50%, keep critical rules only
 * - Simplified language
 * - Concrete examples
 * - Remove conflicting instructions
 * - Natural language prioritized
 *
 * Target context size: 600-900 chars (vs current 1,793)
 */

import { ConversationMetadataManager } from './conversation-metadata';
import { getCustomerServicePrompt } from './system-prompts';

export function getEnhancedCustomerServicePromptVariantB(
  metadataManager?: ConversationMetadataManager
): string {
  const basePrompt = getCustomerServicePrompt();

  if (!metadataManager) {
    return basePrompt;
  }

  const contextSummary = metadataManager.generateContextSummary();

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
