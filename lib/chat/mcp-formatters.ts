/**
 * MCP Result Formatters
 *
 * Formats MCP execution results for user presentation
 */

import { ExecutionResult } from '@/lib/mcp/types';
import { SearchResult } from '@/types';

/**
 * Format successful MCP execution result for user
 */
export function formatMCPExecutionResult(result: ExecutionResult): string {
  if (!result.data) {
    return "I found the information but couldn't format it properly. Please try rephrasing your question.";
  }

  // If data contains SearchResult[], format as product list
  if (result.data.results && Array.isArray(result.data.results)) {
    return formatSearchResultsForUser(result.data.results, result.data.totalMatches, result.data.source);
  }

  // If data is a simple object with output property
  if (result.data.output) {
    return result.data.output;
  }

  // Otherwise return JSON stringified
  try {
    return JSON.stringify(result.data, null, 2);
  } catch {
    return "I found the information but had trouble formatting it.";
  }
}

/**
 * Format search results for user presentation
 */
export function formatSearchResultsForUser(
  results: SearchResult[],
  totalMatches?: number,
  source?: string
): string {
  if (!results || results.length === 0) {
    return "I couldn't find any products matching your search. Could you provide more details or try different keywords?";
  }

  // Build response header
  let response = totalMatches
    ? `I found ${totalMatches} ${totalMatches === 1 ? 'product' : 'products'}:\n\n`
    : `Here's what I found:\n\n`;

  // Format each result
  results.slice(0, 10).forEach((result, index) => {
    const title = result.title || 'Product';
    const url = result.url;
    const similarity = result.similarity ? ` (${Math.round(result.similarity * 100)}% match)` : '';

    // Format as markdown link if URL available
    if (url) {
      response += `${index + 1}. [${title}](${url})${similarity}\n`;
    } else {
      response += `${index + 1}. ${title}${similarity}\n`;
    }

    // Add content preview if available
    if (result.content && result.content.length > 100) {
      const preview = result.content.substring(0, 100).trim() + '...';
      response += `   ${preview}\n`;
    }

    response += '\n';
  });

  // Add footer note if there are more results
  if (totalMatches && totalMatches > 10) {
    response += `\n_Showing 10 of ${totalMatches} results. Would you like to see more or refine your search?_`;
  }

  // Add source attribution
  if (source && source !== 'error') {
    const sourceLabel = {
      'exact-match': 'exact SKU match',
      'woocommerce': 'WooCommerce',
      'shopify': 'Shopify',
      'semantic': 'semantic search'
    }[source] || source;

    response += `\n\n_Source: ${sourceLabel}_`;
  }

  return response;
}

/**
 * Format MCP execution error for user
 */
export function formatMCPExecutionError(result: ExecutionResult): string {
  const error = result.error;

  if (!error) {
    return "I encountered an unknown error. Please try again.";
  }

  // Validation errors (security-related)
  if (error.code === 'VALIDATION_FAILED') {
    console.warn('[MCP Integration] Validation failed:', error.details);
    return "I tried to search for that but encountered a security issue with my search method. Let me try a different approach.";
  }

  // Execution errors (runtime failures)
  if (error.code === 'EXECUTION_ERROR') {
    console.error('[MCP Integration] Execution error:', error.message);

    // Check for specific error types
    if (error.message.includes('timeout')) {
      return "The search is taking longer than expected. Please try a more specific query.";
    }

    if (error.message.includes('not found') || error.message.includes('INVALID_DOMAIN')) {
      return "I couldn't access the product catalog. Please make sure you're on the correct website.";
    }

    return `I encountered an error while searching: ${error.message}. Please try rephrasing your question.`;
  }

  // Generic error
  return `I encountered an unexpected error (${error.code}). Please try again or rephrase your question.`;
}
