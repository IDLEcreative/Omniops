import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchConversations } from '@/lib/search/conversation-search';
import { exportToPDF, generateConversationReport } from '@/lib/exports/pdf-generator';
import { createClient } from '@/lib/supabase/server';

const PDFExportRequestSchema = z.object({
  query: z.string().min(1).optional(),
  conversationId: z.string().uuid().optional(),
  filters: z.object({
    domainId: z.string().uuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    productMentions: z.array(z.string()).optional(),
    customerEmail: z.string().email().optional()
  }).optional(),
  format: z.enum(['search_results', 'conversation_transcript']).default('search_results'),
  includeFilters: z.boolean().default(true),
  includeSummary: z.boolean().default(true)
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
    const validation = PDFExportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      query,
      conversationId,
      filters,
      format,
      includeFilters,
      includeSummary
    } = validation.data;

    let pdfBuffer: Uint8Array;

    if (format === 'conversation_transcript' && conversationId) {
      // Export single conversation transcript
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          role,
          created_at,
          sentiment,
          conversation_id,
          conversations!inner(
            id,
            customer_email,
            domain_id,
            domains(name)
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at');

      if (error || !messages || messages.length === 0) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // Map to SearchResult format
      const searchResults = messages.map((msg: any) => ({
        conversationId: msg.conversation_id,
        messageId: msg.id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.created_at,
        sentiment: msg.sentiment,
        relevanceScore: 1,
        highlight: msg.content,
        customerEmail: msg.conversations?.customer_email,
        domainName: msg.conversations?.domains?.name
      }));

      // Get conversation metadata
      const metadata = {
        customerEmail: messages[0].conversations?.customer_email,
        domain: messages[0].conversations?.domains?.name,
        startTime: messages[0].created_at
      };

      pdfBuffer = generateConversationReport(
        conversationId,
        searchResults,
        metadata
      );
    } else if (query) {
      // Export search results
      const searchResults = await searchConversations({
        query,
        ...filters,
        limit: 100, // Reasonable limit for PDF
        offset: 0,
        searchType: 'hybrid'
      });

      pdfBuffer = exportToPDF(
        searchResults.results,
        query,
        filters,
        {
          includeFilters,
          includeSummary,
          title: 'Conversation Search Results'
        }
      );
    } else {
      return NextResponse.json(
        { error: 'Either query or conversationId must be provided' },
        { status: 400 }
      );
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = format === 'conversation_transcript'
      ? `conversation-${conversationId?.substring(0, 8)}-${timestamp}.pdf`
      : `search-results-${timestamp}.pdf`;

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('PDF export error:', error);
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