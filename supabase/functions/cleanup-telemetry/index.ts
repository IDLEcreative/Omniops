// Supabase Edge Function: Cleanup Telemetry Data
//
// Scheduled function to automatically clean up old telemetry data from lookup_failures table.
// Runs weekly via cron job to prevent unbounded growth.
//
// Environment Variables:
//   SUPABASE_URL - Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY - Service role key for database access
//
// Schedule:
//   Configured in cron.yaml - runs every Sunday at 2 AM UTC
//
// Response:
//   {
//     "success": true,
//     "deletedCount": 1234,
//     "oldestDeleted": "2024-08-01T00:00:00Z",
//     "newestDeleted": "2024-10-31T23:59:59Z",
//     "executionTimeMs": 523,
//     "retentionDays": 90
//   }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for manual invocations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  success: boolean;
  deletedCount: number;
  oldestDeleted?: string;
  newestDeleted?: string;
  executionTimeMs: number;
  retentionDays: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body for custom retention days (optional)
    let retentionDays = 90; // Default
    try {
      const body = await req.json();
      if (body.retentionDays && typeof body.retentionDays === 'number') {
        retentionDays = body.retentionDays;
      }
    } catch {
      // Use default if no body or invalid JSON
    }

    console.log(`Starting telemetry cleanup with ${retentionDays} day retention`);

    // Call the PostgreSQL cleanup function
    const { data, error } = await supabase.rpc('cleanup_old_telemetry', {
      retention_days: retentionDays,
    });

    if (error) {
      console.error('Cleanup function error:', error);
      throw error;
    }

    // Extract results from function return
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;

    const response: CleanupResult = {
      success: true,
      deletedCount: result.deleted_count || 0,
      oldestDeleted: result.oldest_deleted,
      newestDeleted: result.newest_deleted,
      executionTimeMs: result.execution_time_ms || 0,
      retentionDays,
    };

    console.log('Cleanup completed successfully:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cleanup failed:', error);

    const errorResponse: CleanupResult = {
      success: false,
      deletedCount: 0,
      executionTimeMs: 0,
      retentionDays: 90,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
