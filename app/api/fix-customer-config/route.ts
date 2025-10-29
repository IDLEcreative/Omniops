import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * DEBUG/SETUP ENDPOINT - Development use only
 *
 * Fixes customer configuration issues
 *
 * Usage:
 *   POST /api/fix-customer-config (body: {domain: "example.com", action: "reset" | "update"})
 */

export async function POST(request: Request) {
  // Prevent use in production without explicit flag
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Debug endpoints disabled in production' },
      { status: 403 }
    );
  }

      const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Extract domain and action from request body
  let domain: string | null = null;
  let action: string = 'reset';
  try {
    const body = await request.json();
    domain = body.domain;
    action = body.action || 'reset';
  } catch {
    // Body parsing failed
  }

  if (!domain) {
    return NextResponse.json(
      {
        error: 'domain parameter required',
        usage: {
          POST: '/api/fix-customer-config with body: {domain: "example.com", action: "reset" | "update"}'
        },
        note: 'This is a development/testing endpoint'
      },
      { status: 400 }
    );
  }

  try {
    // First, check existing entries
    const { data: existing } = await supabase
      .from('customer_configs')
      .select('*')
      .limit(1);

    console.log('Sample existing config:', existing?.[0]);

    // Try to insert with minimal required fields
    const { data: newConfig, error: configError } = await supabase
      .from('customer_configs')
      .insert({
        domain: domain,
        business_name: `Business ${domain}`,
        woocommerce_enabled: false
      })
      .select()
      .single();

    if (configError) {
      // If domain already exists, update it
      if (configError.message.includes('duplicate')) {
        const { data: updatedConfig, error: updateError } = await supabase
          .from('customer_configs')
          .update({
            business_name: `Business ${domain}`,
            woocommerce_enabled: false
          })
          .eq('domain', domain)
          .select()
          .single();
        
        return NextResponse.json({
          success: true,
          domain,
          action: 'updated',
          config: updatedConfig,
          error: updateError?.message
        });
      }

      return NextResponse.json({
        success: false,
        domain,
        error: configError.message,
        hint: 'Check the exact column names in your database'
      });
    }

    return NextResponse.json({
      success: true,
      domain,
      action: 'created',
      config: newConfig
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: err.message
    }, { status: 500 });
  }
}