import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchConversations } from '@/lib/search/conversation-search';
import { exportToCSV, generateSearchSummaryCSV } from '@/lib/exports/csv-generator';
import { createClient } from '@/lib/supabase/server';

const ExportRequestSchema = z.object({
  query: z.string().min(1),
  filters: z.object({
    domainId: z.string().uuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    productMentions: z.array(z.string()).optional(),
    customerEmail: z.string().email().optional()
  }).optional(),
  format: z.enum(['standard', 'summary', 'threads']).default('standard'),
  includeHeaders: z.boolean().default(true),
  includeSentiment: z.boolean().default(true),
  includeScore: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = ExportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      query,
      filters,
      format,
      includeHeaders,
      includeSentiment,
      includeScore
    } = validation.data;

    // Perform search (get all results for export)
    const searchResults = await searchConversations({
      query,
      ...filters,
      limit: 1000, // Max for export
      offset: 0,
      searchType: 'hybrid'
    });

    // Generate CSV based on format
    let csvContent: string;

    if (format === 'summary') {
      // Generate summary report
      csvContent = generateSearchSummaryCSV(
        searchResults.results,
        query,
        filters,
        searchResults.executionTime
      );
    } else if (format === 'threads') {
      // Group by conversation threads
      const conversations = new Map<string, typeof searchResults.results>();
      searchResults.results.forEach(result => {
        const conv = conversations.get(result.conversationId) || [];
        conv.push(result);
        conversations.set(result.conversationId, conv);
      });

      // Export as threads (requires implementation in csv-generator)
      const { exportConversationThreadsToCSV } = await import('@/lib/exports/csv-generator');
      csvContent = await exportConversationThreadsToCSV(conversations, {
        includeHeaders,
        includeSentiment,
        includeScore
      });
    } else {
      // Standard export
      csvContent = exportToCSV(searchResults.results, {
        includeHeaders,
        includeSentiment,
        includeScore
      });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `search-export-${timestamp}.csv`;

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      {
        error: 'Export failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS endpoint for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}