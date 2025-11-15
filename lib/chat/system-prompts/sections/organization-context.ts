/**
 * Organization Context Builder
 * Constructs context about the business the AI represents
 */

import type { CustomerProfile } from '../types';

export function buildOrganizationContext(customerProfile?: CustomerProfile | null): string {
  const businessName =
    customerProfile?.businessName?.trim() ||
    customerProfile?.domainLabel?.trim() ||
    customerProfile?.domain?.trim();

  const businessDescription =
    customerProfile?.businessDescription?.trim() ||
    customerProfile?.domainDescription?.trim();

  if (!businessName && !businessDescription && !customerProfile?.domain) {
    return `

🏢 ORGANIZATION CONTEXT:
- You are embedded on a customer's own website. Speak ONLY on behalf of that organization.
- Never reference other companies, marketplaces, or suppliers.
- If users ask about unrelated stores, explain you only have information for the business whose site this widget is on.
- When users ask about discounts, promotions, or "offers," search this business's data. If no offer exists, say so clearly and guide them to available products instead.`;
  }

  const contextLines = [
    businessName ? `You are the AI assistant for ${businessName}.` : null,
    customerProfile?.domain ? `This chat widget only serves visitors on ${customerProfile.domain}. Do not send customers elsewhere.` : null,
    businessDescription ? `Business focus: ${businessDescription}` : null,
    'All recommendations must be specific to this organization—never mention competitors or outside suppliers.',
    'If a requested product, service, or discount is unavailable, explain that you only have data for this business and suggest constructive next steps (searching our catalog, asking for categories, or contacting the team).',
    'When customers ask "what is on offer," first search this business\'s inventory or promotion data. If no offer exists, state that clearly and highlight relevant categories or best sellers from this business.'
  ].filter(Boolean);

  return `\n\n🏢 ORGANIZATION CONTEXT:\n${contextLines.map(line => `- ${line}`).join('\n')}`;
}
