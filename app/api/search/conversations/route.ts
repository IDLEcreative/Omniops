import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchConversations, SearchFiltersSchema } from '@/lib/search/conversation-search';
import { hybridSearch, hybridSearchPaginated } from '@/lib/search/hybrid-search';
import { createClient } from '@/lib/supabase/server';

const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  filters: SearchFiltersSchema.partial().optional(),
  searchType: z.enum(['full_text', 'semantic', 'hybrid']).default('hybrid'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional() // Cursor for pagination
});

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = SearchRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { query, filters, searchType, page, limit, cursor } = validation.data;

    // Perform search based on type
    let results;
    let executionTime: number;

    if (searchType === 'hybrid') {
      const startTime = performance.now();

      // Use cursor-based pagination if cursor is provided
      if (cursor) {
        const searchResults = await hybridSearchPaginated(
          query,
          filters,
          {},
          { limit, cursor }
        );
        executionTime = performance.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            results: searchResults.results,
            pagination: {
              limit,
              hasMore: searchResults.pagination.hasMore,
              nextCursor: searchResults.pagination.nextCursor,
              totalCount: searchResults.pagination.totalCount
            },
            performance: {
              executionTime,
              searchType,
              searchMetrics: searchResults.searchMetrics
            }
          }
        });
      }

      // Fallback to offset-based for backward compatibility
      const offset = (page - 1) * limit;
      const searchResults = await hybridSearch(query, {
        ...filters,
        limit,
        offset
      });
      executionTime = performance.now() - startTime;

      results = {
        results: searchResults.results,
        totalCount: searchResults.totalCount,
        executionTime,
        searchMetrics: searchResults.searchMetrics
      };
    } else {
      // Use standard search (non-hybrid)
      const offset = (page - 1) * limit;
      results = await searchConversations({
        query,
        ...filters,
        searchType,
        limit,
        offset
      });
    }

    // Calculate pagination metadata (offset-based)
    const totalPages = Math.ceil(results.totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        results: results.results,
        pagination: {
          page,
          limit,
          totalCount: results.totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        },
        performance: {
          executionTime: results.executionTime,
          searchType,
          searchMetrics: (results as any).searchMetrics
        }
      }
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for search suggestions/autocomplete
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('q') || '';

    if (!prefix || prefix.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get popular search terms that match the prefix
    const { data: suggestions, error } = await supabase
      .from('popular_search_terms')
      .select('search_term, search_count')
      .ilike('search_term', `${prefix}%`)
      .order('search_count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Suggestions error:', error);
      return NextResponse.json({ suggestions: [] });
    }

    return NextResponse.json({
      suggestions: suggestions?.map(s => ({
        term: s.search_term,
        count: s.search_count
      })) || []
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
