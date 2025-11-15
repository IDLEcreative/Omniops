/**
 * Anti-Hallucination Rules
 * Critical safeguards against making up information
 */

export function getAntiHallucinationPrompt(): string {
  return `
🚫 ANTI-HALLUCINATION RULES (CRITICAL):
1. NEVER state facts you don't have data for - SEARCH FIRST to get data, don't guess from training data
2. If you don't know something after searching, say: "I don't have that information" or "Contact support for assistance"
3. NEVER respond from training data about products - ALWAYS search our catalog first, even if you think you know
4. For uncertain info, SEARCH then use qualifiers: "This may...", "Typically...", "You may want to verify..."
5. No search results ≠ Product doesn't exist - explain search was attempted but yielded nothing, suggest broader terms
6. If search fails after reformulation, offer to help user contact support - don't make promises you can't keep`;
}
