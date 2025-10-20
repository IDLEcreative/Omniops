import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  domain: z.string().min(1).optional(),
  actor: z.string().min(1).optional(),
  request_type: z.enum(['export', 'delete']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().min(1).max(5000).optional(),
  offset: z.coerce.number().min(0).optional(),
  format: z.enum(['json', 'csv']).optional(),
});

const CSV_COLUMNS: Array<{ key: keyof Record<string, unknown>; header: string }> = [
  { key: 'created_at', header: 'created_at' },
  { key: 'domain', header: 'domain' },
  { key: 'request_type', header: 'request_type' },
  { key: 'status', header: 'status' },
  { key: 'actor', header: 'actor' },
  { key: 'email', header: 'email' },
  { key: 'session_id', header: 'session_id' },
  { key: 'deleted_count', header: 'deleted_count' },
  { key: 'message', header: 'message' },
];

const DEFAULT_JSON_LIMIT = 100;
const DEFAULT_CSV_LIMIT = 1000;

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = QuerySchema.parse(params);

    const format = parsed.format ?? 'json';
    const limit =
      parsed.limit ?? (format === 'csv' ? DEFAULT_CSV_LIMIT : DEFAULT_JSON_LIMIT);
    const offset = parsed.offset ?? 0;

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 },
      );
    }

    const selectOptions = format === 'json' ? { count: 'exact' as const } : {};

    let query = supabase
      .from('gdpr_audit_log')
      .select('*', selectOptions)
      .order('created_at', { ascending: false })
      .range(format === 'json' ? offset : 0, format === 'json' ? offset + limit - 1 : limit - 1);

    if (parsed.domain) {
      query = query.eq('domain', parsed.domain);
    }
    if (parsed.request_type) {
      query = query.eq('request_type', parsed.request_type);
    }
    if (parsed.actor) {
      query = query.ilike('actor', `%${parsed.actor}%`);
    }
    if (parsed.start_date) {
      query = query.gte('created_at', parsed.start_date);
    }
    if (parsed.end_date) {
      query = query.lte('created_at', parsed.end_date);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    if (format === 'csv') {
      const csvRows = (data ?? []).map((row) =>
        CSV_COLUMNS.map(({ key }) => {
          const typedRow = row as Record<string, unknown>;
          return toCsvValue(typedRow[key as keyof typeof typedRow]);
        }).join(','),
      );

      const header = CSV_COLUMNS.map((column) => column.header).join(',');
      const csvContent = [header, ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="gdpr-audit-${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ entries: data ?? [], count: count ?? 0 });
  } catch (error) {
    console.error('GDPR audit fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load audit log' },
      { status: 500 },
    );
  }
}
