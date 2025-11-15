/**
 * Excel Export API Endpoint
 *
 * Built in ~15 minutes by:
 * - Copying CSV endpoint structure
 * - Swapping in Excel generator (which reuses tested modules)
 * - Demonstrates modularity = rapid feature development
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchConversations } from '@/lib/search/conversation-search';
import { exportToExcel } from '@/lib/exports/excel-generator';
import { createClient } from '@/lib/supabase/server';

const toBodyInit = (value: Uint8Array): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(value.byteLength);
  new Uint8Array(arrayBuffer).set(value);
  return arrayBuffer;
};

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
  includeMetadata: z.boolean().default(true),
  sheetName: z.string().default('Conversations')
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
      includeMetadata,
      sheetName
    } = validation.data;

    // Perform search (get all results for export)
    const searchResults = await searchConversations({
      query,
      ...filters,
      limit: 1000, // Max for export
      offset: 0,
      searchType: 'hybrid'
    });

    // Generate Excel file (reuses groupByConversation + stripHtml!)
    const excelBuffer = exportToExcel(
      searchResults.results,
      query,
      {
        includeMetadata,
        sheetName
      }
    );

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `search-export-${timestamp}.xlsx`;

    // Return Excel response
    return new NextResponse(toBodyInit(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Excel export error:', error);
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
