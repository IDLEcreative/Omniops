import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
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
        domain: 'thompsonseparts.co.uk',
        business_name: 'Thompson eParts',
        woocommerce_enabled: true,
        woocommerce_url: 'https://www.thompsonseparts.co.uk'
      })
      .select()
      .single();
    
    if (configError) {
      // If domain already exists, update it
      if (configError.message.includes('duplicate')) {
        const { data: updatedConfig, error: updateError } = await supabase
          .from('customer_configs')
          .update({
            business_name: 'Thompson eParts',
            woocommerce_enabled: true,
            woocommerce_url: 'https://www.thompsonseparts.co.uk'
          })
          .eq('domain', 'thompsonseparts.co.uk')
          .select()
          .single();
        
        return NextResponse.json({
          success: true,
          action: 'updated',
          config: updatedConfig,
          error: updateError?.message
        });
      }
      
      return NextResponse.json({
        success: false,
        error: configError.message,
        hint: 'Check the exact column names in your database'
      });
    }
    
    return NextResponse.json({
      success: true,
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