// ✅ AFTER (Fixed Code - Testable & Consistent)

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';  // ✅ Correct import, will be used
import type { SupabaseClient } from '@/types/supabase';
import type { Redis } from 'ioredis';

// ✅ NEW: Define dependencies interface
interface RouteDependencies {
  supabase?: SupabaseClient;
  redis?: Redis;
}

// ✅ NEW: Accept optional dependencies for testing
export async function POST(
  req: NextRequest,
  { params }: { params?: any } = {},
  deps?: RouteDependencies
) {
  try {
    // ✅ Use injected dependency OR create real one
    const redis = deps?.redis || await getRedisClient();
    const supabase = deps?.supabase || await createServiceRoleClient();

    // Same business logic, now testable!
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

// ✅ TESTING IS NOW EASY:
/*
import { createTestRouteDeps } from '@/test-utils/create-test-dependencies';

test('should log demo attempt to Supabase', async () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: 'test-id' } })
        }))
      }))
    }))
  };

  const mockRedis = {
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn(),
    setex: jest.fn()
  };

  const response = await POST(mockRequest, {}, {
    supabase: mockSupabase,
    redis: mockRedis
  });

  expect(response.status).toBe(200);
  expect(mockSupabase.from).toHaveBeenCalledWith('demo_attempts');
});

// Test runs in milliseconds, no real infrastructure needed!
*/
