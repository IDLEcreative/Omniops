/**
 * Get complete page details for a specific URL or query
 *
 * USE THIS when you've found something relevant in scattered chunks and need
 * COMPLETE information from that specific page (all chunks from one source).
 *
 * Perfect for:
 * - Getting full product details after finding it in search results
 * - Reading complete documentation page
 * - Getting all FAQ content from a specific page
 */

import { searchAndReturnFullPage } from '@/lib/full-page-retrieval';
import { normalizeDomain } from './domain-utils';
import type { ToolResult } from './types';

export async function executeGetCompletePageDetails(
  pageQuery: string,
  domain: string
): Promise<ToolResult> {

  try {
    const browseDomain = normalizeDomain(domain);

    if (!browseDomain) {
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // Use full page retrieval to get ALL chunks from best-matching page
    const fullPageResult = await searchAndReturnFullPage(pageQuery, browseDomain, 15, 0.3);

    if (fullPageResult.success && fullPageResult.source === 'full_page') {
      return {
        success: true,
        results: fullPageResult.results,
        source: 'full-page',
        pageInfo: fullPageResult.pageInfo
      };
    }

    // If full page retrieval fails, return error (don't fall back)
    return {
      success: false,
      results: [],
      source: 'failed'
    };

  } catch (error) {
    console.error('[Function Call] get_complete_page_details error:', error);
    return {
      success: false,
      results: [],
      source: 'error'
    };
  }
}
