import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { OrderModificationService } from '@/lib/woocommerce-order-modifications';

// Request validation schema
const OrderModificationRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  domain: z.string(),
  modification_type: z.enum(['cancel', 'update_address', 'add_note', 'request_refund']),
  order_id: z.number(),
  customer_email: z.string().email(),
  confirmation_token: z.string().optional(), // For two-step confirmation
  data: z.object({
    reason: z.string().optional(),
    address: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().optional(),
      address_2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    note: z.string().optional(),
    refund_amount: z.number().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = OrderModificationRequestSchema.parse(body);
    
    // Verify the conversation exists and is valid
    const supabase = await createServiceRoleClient();
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, verified_customer_email, verification_status')
      .eq('id', validatedData.conversation_id)
      .single();
    
    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Invalid conversation' },
        { status: 400 }
      );
    }
    
    // Check if customer is verified
    if (conversation.verification_status !== 'verified' || 
        conversation.verified_customer_email !== validatedData.customer_email) {
      return NextResponse.json(
        { error: 'Customer verification required' },
        { status: 403 }
      );
    }
    
    // Get WooCommerce client for the domain
    const wc = await getDynamicWooCommerceClient(validatedData.domain);
    if (!wc) {
      return NextResponse.json(
        { error: 'WooCommerce not configured for this domain' },
        { status: 400 }
      );
    }
    
    // Create modification service
    const modService = new OrderModificationService(wc, validatedData.domain);
    
    // Process the modification based on type
    let result;
    const modRequest = {
      type: validatedData.modification_type,
      orderId: validatedData.order_id,
      customerEmail: validatedData.customer_email,
      conversationId: validatedData.conversation_id,
      domain: validatedData.domain,
      data: validatedData.data,
    };
    
    switch (validatedData.modification_type) {
      case 'cancel':
        result = await modService.cancelOrder(modRequest);
        break;
      
      case 'update_address':
        if (!validatedData.data?.address) {
          return NextResponse.json(
            { error: 'Address data is required for address update' },
            { status: 400 }
          );
        }
        result = await modService.updateShippingAddress(modRequest);
        break;
      
      case 'add_note':
        if (!validatedData.data?.note) {
          return NextResponse.json(
            { error: 'Note content is required' },
            { status: 400 }
          );
        }
        result = await modService.addOrderNote(modRequest);
        break;
      
      case 'request_refund':
        result = await modService.requestRefund(modRequest);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid modification type' },
          { status: 400 }
        );
    }
    
    // Log the modification result in conversation
    await supabase
      .from('messages')
      .insert({
        conversation_id: validatedData.conversation_id,
        role: 'system',
        content: result.success 
          ? `Order modification completed: ${result.message}`
          : `Order modification failed: ${result.message}`,
        metadata: {
          modification_type: validatedData.modification_type,
          order_id: validatedData.order_id,
          success: result.success,
        }
      });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      confirmation_required: result.confirmationRequired,
      confirmation_data: result.confirmationData,
    });
    
  } catch (error) {
    console.error('Order modification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check modification status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const conversationId = searchParams.get('conversation_id');
  const orderId = searchParams.get('order_id');
  
  if (!conversationId || !orderId) {
    return NextResponse.json(
      { error: 'conversation_id and order_id are required' },
      { status: 400 }
    );
  }
  
  try {
    const supabase = await createServiceRoleClient();
    
    // Get modification history for this order in this conversation
    const { data: modifications, error } = await supabase
      .from('order_modifications_log')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('order_id', parseInt(orderId))
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      modifications: modifications || [],
    });
    
  } catch (error) {
    console.error('Error fetching modification history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}