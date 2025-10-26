/**
 * Synonym Query Expansion Endpoint
 * Test query expansion with synonyms
 */

import { NextRequest, NextResponse } from 'next/server';
import { synonymLoader } from '@/lib/synonym-loader';

/**
 * POST /api/synonyms/expand
 * Expand a query with synonyms (for testing)
 * Body: { domainId, query, maxExpansions? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId, query, maxExpansions = 3 } = body;

    if (!domainId || !query) {
      return NextResponse.json(
        { error: 'domainId and query are required' },
        { status: 400 }
      );
    }

    const expandedQuery = await synonymLoader.expandQuery(domainId, query, maxExpansions);

    return NextResponse.json({
      original: query,
      expanded: expandedQuery,
      addedTerms: expandedQuery.split(' ').filter(t => !query.toLowerCase().includes(t))
    });
  } catch (error) {
    console.error('[Synonyms API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to expand query' },
      { status: 500 }
    );
  }
}
