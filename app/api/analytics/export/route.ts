/**
 * Analytics Export API
 *
 * Handles exporting analytics data in multiple formats:
 * - CSV: GET /api/analytics/export?format=csv
 * - Excel: GET /api/analytics/export?format=excel
 * - PDF: GET /api/analytics/export?format=pdf
 *
 * Query Parameters:
 * - format: 'csv' | 'excel' | 'pdf' (required)
 * - days: number of days to include (default: 7)
 * - includeMessage: boolean (default: true)
 * - includeUser: boolean (default: true)
 * - includeDailyMetrics: boolean (default: true)
 * - includeTopQueries: boolean (default: true)
 * - includeLanguages: boolean (default: true)
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyseMessages } from '@/lib/dashboard/analytics';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';
import { requireAuth } from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit } from '@/lib/middleware/analytics-rate-limit';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  generateCSVFilename,
  generateExcelFilename,
  generatePDFFilename,
  type ExportFormat,
} from '@/lib/analytics/export';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Converts Buffer/Uint8Array to ArrayBuffer for NextResponse body compatibility
 * Required for binary file downloads (Excel, PDF)
 */
const toBodyInit = (value: Buffer | Uint8Array): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(value.byteLength);
  new Uint8Array(arrayBuffer).set(value);
  return arrayBuffer;
};

const formatDate = (date: Date): string => {
  const [dayPart] = date.toISOString().split('T');
  return dayPart ?? date.toISOString();
};

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // 2. Rate Limiting: 10 exports per hour
    const rateLimitError = await checkAnalyticsRateLimit(user, 'export');
    if (rateLimitError) {
      return rateLimitError;
    }

    // 3. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as ExportFormat | null;
    const days = parseInt(searchParams.get('days') || '7');
    const includeMessage = searchParams.get('includeMessage') !== 'false';
    const includeUser = searchParams.get('includeUser') !== 'false';
    const includeDailyMetrics = searchParams.get('includeDailyMetrics') !== 'false';
    const includeTopQueries = searchParams.get('includeTopQueries') !== 'false';
    const includeLanguages = searchParams.get('includeLanguages') !== 'false';

    // Validate format
    if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, excel, or pdf' },
        { status: 400 }
      );
    }

    // 4. Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // 5. Get organization details for branding
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', membership.organization_id)
      .single();

    // 6. Get organization's domains
    const { data: configs } = await supabase
      .from('customer_configs')
      .select('domain')
      .eq('organization_id', membership.organization_id);

    const allowedDomains = configs?.map(c => c.domain) || [];

    // 7. Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // 8. Fetch analytics data
    const serviceSupabase = await createServiceRoleClient();

    // Fetch messages
    let messageAnalytics = null;
    if (includeMessage) {
      const { data: messages } = await serviceSupabase
        .from('messages')
        .select('content, role, created_at, metadata, conversations!inner(domain)')
        .gte('created_at', startDate.toISOString())
        .in('conversations.domain', allowedDomains)
        .order('created_at', { ascending: false });

      messageAnalytics = analyseMessages(messages || [], { days });
    }

    // Fetch user analytics
    let userAnalytics = null;
    if (includeUser) {
      const { data: conversations } = await serviceSupabase
        .from('conversations')
        .select('session_id, created_at, metadata')
        .in('domain', allowedDomains)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      userAnalytics = calculateUserAnalytics(conversations || [], { days });
    }

    // 9. Generate export based on format
    const dateRange = {
      start: formatDate(startDate),
      end: formatDate(endDate),
    };

    const exportOptions = {
      includeMessageAnalytics: includeMessage,
      includeUserAnalytics: includeUser,
      includeDailyMetrics,
      includeTopQueries,
      includeLanguageDistribution: includeLanguages,
      dateRange,
      organizationName: organization?.name || 'Analytics Report',
    };

    let fileBuffer: Buffer | string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'csv':
        fileBuffer = exportToCSV(messageAnalytics, userAnalytics, exportOptions);
        filename = generateCSVFilename();
        contentType = 'text/csv';
        break;

      case 'excel':
        fileBuffer = await exportToExcel(messageAnalytics, userAnalytics, exportOptions);
        filename = generateExcelFilename();
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case 'pdf':
        fileBuffer = await exportToPDF(messageAnalytics, userAnalytics, exportOptions);
        filename = generatePDFFilename();
        contentType = 'application/pdf';
        break;

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // 10. Return file as download
    // CSV is text, can return directly; Excel/PDF are binary and need ArrayBuffer conversion
    const body = typeof fileBuffer === 'string'
      ? fileBuffer
      : toBodyInit(fileBuffer);

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[Analytics Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
