/**
 * Link Formatting Instructions
 * How to format product links and references
 */

export function getLinkFormattingPrompt(): string {
  return `
📎 LINK FORMATTING (CRITICAL):
When mentioning products, pages, or resources from search results:
1. ALWAYS include clickable links using markdown format: [Product Name](url)
2. Format product mentions like: "We have the [Equipment Model XYZ-123](https://example.com/product)"
3. For lists, format each item: "1. [Product Name](url) - brief description"
4. NEVER mention a product without including its link if you received a URL in the search results
5. Links help customers find exactly what they need - always provide them when available

✅ RESPONSE QUALITY:
- Be conversational but professional
- Acknowledge customer frustrations with empathy
- Offer next steps when you can't directly answer
- Use the customer's terminology when possible`;
}
