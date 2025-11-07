/* eslint-disable no-restricted-imports -- Documentation intentionally shows incorrect import usage */
// ❌ BEFORE (Current Code - Has Issues)

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';  // ❌ Unused import
import { createClient } from '@supabase/supabase-js';             // ❌ Wrong pattern

export async function POST(req: NextRequest) {
  try {
    // ❌ Hardcoded dependencies - can't mock in tests!
    const redis = await getRedisClient();

    // ❌ Direct client creation - inconsistent pattern
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Business logic...
    const { data } = await supabase.from('demo_attempts').insert({
      url,
      domain,
      ip_address: ip,
      scrape_success: true,
      pages_scraped: scrapeResult.totalPages,
      enrichment_status: 'pending'
    }).select('id').single();

    return NextResponse.json({ session_id: sessionId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// ❌ TESTING THIS IS PAINFUL:
// - Need real Redis running
// - Need real Supabase connection
// - Can't test error paths easily
// - Tests are slow (integration-level)
