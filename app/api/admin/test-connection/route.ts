import { NextRequest, NextResponse } from 'next/server';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { z } from 'zod';

// Test connection schema
const TestConnectionSchema = z.object({
  type: z.enum(['woocommerce', 'shopify']),
  config: z.object({
    url: z.string().optional(),
    consumer_key: z.string().optional(),
    consumer_secret: z.string().optional(),
    domain: z.string().optional(),
    access_token: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, config } = TestConnectionSchema.parse(body);

    if (type === 'woocommerce') {
      if (!config.url || !config.consumer_key || !config.consumer_secret) {
        return NextResponse.json(
          { success: false, error: 'Missing WooCommerce credentials' },
          { status: 400 }
        );
      }

      // Test WooCommerce connection
      const wc = new WooCommerceRestApi({
        url: config.url,
        consumerKey: config.consumer_key,
        consumerSecret: config.consumer_secret,
        version: 'wc/v3',
        queryStringAuth: true,
      });

      try {
        // Try to fetch system status (lightweight endpoint)
        const response = await wc.get('system_status');
        
        if (response.status === 200) {
          return NextResponse.json({
            success: true,
            message: 'Successfully connected to WooCommerce',
            store_info: {
              name: response.data.environment?.site_title,
              version: response.data.environment?.version,
              currency: response.data.settings?.currency,
            },
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Failed to connect to WooCommerce',
          });
        }
      } catch (wcError: any) {
        console.error('WooCommerce connection error:', wcError);
        
        // Parse error message
        let errorMessage = 'Failed to connect to WooCommerce';
        if (wcError.response?.status === 401) {
          errorMessage = 'Invalid API credentials. Please check your Consumer Key and Secret.';
        } else if (wcError.response?.status === 404) {
          errorMessage = 'WooCommerce REST API not found. Please ensure it\'s enabled.';
        } else if (wcError.code === 'ECONNREFUSED') {
          errorMessage = 'Could not connect to the store. Please check the URL.';
        }

        return NextResponse.json({
          success: false,
          error: errorMessage,
        });
      }
    } else if (type === 'shopify') {
      // Shopify test connection (placeholder for now)
      return NextResponse.json({
        success: false,
        error: 'Shopify integration coming soon',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid integration type',
    });
  } catch (error) {
    console.error('Test connection error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}