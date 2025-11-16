/**
 * Tool Executor - Result Formatters
 *
 * Handles formatting of tool execution results for AI consumption.
 * Provides conversational, user-friendly responses with proper error handling.
 */

import type { ToolExecutionResult } from './ai-processor-types';

/**
 * Format tool execution results for AI consumption
 */
export function formatToolResultsForAI(
  toolExecutionResults: ToolExecutionResult[]
): Array<{ tool_call_id: string; content: string }> {
  return toolExecutionResults.map(({ toolCall, toolName, toolArgs, result }) => {
    let toolResponse = '';

    // CRITICAL: Surface errorMessage prominently when present
    // This ensures AI explicitly communicates errors (e.g., "Product X not found") to users
    if (!result.success && result.errorMessage) {
      toolResponse = `⚠️ ERROR: ${result.errorMessage}\n\n`;
      console.log(`[Tool Executor] Surfacing error to AI: ${result.errorMessage}`);
    }

    if (result.success && result.results.length > 0) {
      toolResponse += formatSuccessResults(result);
    } else if (!result.errorMessage) {
      // Only provide generic fallback messages if no explicit errorMessage was set
      toolResponse += formatErrorMessage(result, toolName, toolArgs);
    }

    // Ensure we always return some content (even if just the error message)
    const finalContent = toolResponse.trim() || 'Search completed with no results.';

    return {
      tool_call_id: toolCall.id,
      content: finalContent
    };
  });
}

/**
 * Format successful search results
 */
function formatSuccessResults(result: { success: boolean; results: any[]; source: string }): string {
  let output = `Found ${result.results.length} results from ${result.source}:\n\n`;

  result.results.forEach((item, index) => {
    output += `${index + 1}. ${item.title}\n`;
    output += `   URL: ${item.url}\n`;

    // Show enriched information if available (from cross-referencing)
    if (item.metadata && typeof item.metadata === 'object') {
      output += formatMetadata(item);
    }

    output += `   Content: ${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}\n`;
    output += `   Relevance: ${(item.similarity * 100).toFixed(1)}%\n\n`;
  });

  return output;
}

/**
 * Format metadata (matched pages, sources, recommendations)
 */
function formatMetadata(item: any): string {
  let output = '';
  const meta = item.metadata as any;

  // Show matched page URL for "Learn more" links
  if (meta.matchedPageUrl && meta.matchedPageUrl !== item.url) {
    output += `   Learn more: ${meta.matchedPageUrl}\n`;
  }

  // Show sources
  if (meta.sources) {
    output += `   Sources: `;
    const sources = [];
    if (meta.sources.liveData) sources.push('Live catalog');
    if (meta.sources.scrapedContent) sources.push('Website content');
    if (meta.sources.relatedContent) sources.push('Related pages');
    output += sources.join(', ') + '\n';
  }

  // Show related pages for recommendations
  if (meta.relatedPages && Array.isArray(meta.relatedPages) && meta.relatedPages.length > 0) {
    output += `   Related pages:\n`;
    meta.relatedPages.forEach((related: any, idx: number) => {
      output += `      ${idx + 1}. ${related.title} (${(related.similarity * 100).toFixed(0)}% relevant)\n`;
    });
  }

  // Show product recommendations (conversational style)
  if (meta.recommendations && Array.isArray(meta.recommendations) && meta.recommendations.length > 0) {
    output += `\n   Since you're looking at ${item.title}, you might also like:\n`;
    meta.recommendations.forEach((rec: any, idx: number) => {
      const priceStr = rec.price ? ` — ${rec.price}` : '';
      const similarityPercent = (rec.similarity * 100).toFixed(0);
      output += `      ${idx + 1}. ${rec.name}${priceStr} (${similarityPercent}% similar)\n`;
      if (rec.recommendationReason) {
        output += `         → ${rec.recommendationReason}\n`;
      }
    });
  }

  return output;
}

/**
 * Format error messages based on tool type and failure reason
 */
function formatErrorMessage(
  result: { source: string },
  toolName: string,
  toolArgs: Record<string, any>
): string {
  // Provide contextual error messages based on tool type
  const queryTerm = toolArgs.query || toolArgs.category || toolArgs.productQuery || toolArgs.orderId || 'this search';

  if (result.source === 'invalid-arguments') {
    return formatInvalidArgumentsError(toolName);
  }

  if (result.source === 'invalid-domain') {
    return 'Cannot perform search - domain not configured properly.';
  }

  if (toolName === 'lookup_order') {
    return `I couldn't find any information about order ${queryTerm}. The order number might be incorrect, or it hasn't been entered into the system yet. Please ask the customer to double-check the order number.`;
  }

  return `I couldn't find any information about "${queryTerm}". This might mean:
- The search term needs to be more specific or spelled differently
- The item might not be in the current inventory
- Try using alternative terms or checking the spelling

Please let me know if you'd like to search for something else or need assistance finding what you're looking for.`;
}

/**
 * Format invalid arguments error messages by tool type
 */
function formatInvalidArgumentsError(toolName: string): string {
  switch (toolName) {
    case 'search_website_content':
      return 'I want to search our content for you, but I need keywords or a topic to look up. Could you share what information you are looking for?';
    case 'search_by_category':
      return 'I can browse our categories once I know which topic you want—shipping, returns, installation, etc. Let me know and I will pull it up.';
    case 'get_product_details':
      return 'To grab detailed specifications I need the product or item number you are checking on. Share that and I will verify the details.';
    case 'get_complete_page_details':
      return 'I need to know which specific page or item you want complete details for. Let me know what you are interested in and I will retrieve all available information about it.';
    case 'lookup_order':
      return 'I can check an order status once I have the order number. Please provide it and I will look it up right away.';
    default:
      return 'I need a little more detail to continue. Could you clarify what you want me to look up?';
  }
}
