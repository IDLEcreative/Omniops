/**
 * Variant A: Minimal Context Approach
 *
 * Strategy: Reduce verbosity by 75%
 * - Only provide raw metadata (no instructions)
 * - Trust AI's natural capabilities
 * - Hypothesis: Current instructions may be hurting more than helping
 *
 * Target context size: 200-400 chars (vs current 1,793)
 */

import { ConversationMetadataManager } from './conversation-metadata';
import { getCustomerServicePrompt } from './system-prompts';
import type { WidgetConfig, CustomerProfile } from './system-prompts';

export function getEnhancedCustomerServicePromptVariantA(
  metadataManager?: ConversationMetadataManager,
  widgetConfig?: WidgetConfig | null,
  customerProfile?: CustomerProfile | null
): string {
  const basePrompt = getCustomerServicePrompt(widgetConfig, customerProfile);

  if (!metadataManager) {
    return basePrompt;
  }

  // Generate MINIMAL context - just the facts, no instructions
  const corrections = metadataManager['corrections'] || [];
  const entities = Array.from(metadataManager['entities'].values() || []);
  const lists = Array.from(metadataManager['lists'].values() || []);

  // Get only most recent 2-3 entities (last 3 turns)
  const currentTurn = metadataManager['currentTurn'] || 0;
  const recentEntities = entities
    .filter(e => currentTurn - e.turnNumber <= 3)
    .slice(-3);

  // Build minimal context string
  const parts: string[] = [];

  // Only include if corrections exist
  if (corrections.length > 0) {
    const latestCorrection = corrections[corrections.length - 1];
    parts.push(`Correction: ${latestCorrection.originalValue} → ${latestCorrection.correctedValue}`);
  }

  // Only include if recent entities exist
  if (recentEntities.length > 0) {
    const entityList = recentEntities
      .map(e => `${e.type}: ${e.value}`)
      .join(', ');
    parts.push(`Recent: ${entityList}`);
  }

  // Only include if active numbered list exists
  if (lists.length > 0) {
    const latestList = lists[lists.length - 1];
    const listItems = latestList.items.map((item, idx) => `${idx + 1}:${item.text}`).join(', ');
    parts.push(`List: ${listItems}`);
  }

  // Return base prompt + minimal context (no instructions!)
  if (parts.length === 0) {
    return basePrompt; // No metadata to add
  }

  const minimalContext = `\n\n[Context: ${parts.join(' | ')}]`;

  return basePrompt + minimalContext;
}
