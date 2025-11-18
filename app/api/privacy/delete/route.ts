import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { withCSRF } from '@/lib/middleware/csrf';
import { z } from 'zod';

// Input validation schema
const PrivacyDeleteSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  confirmationToken: z.string().min(32).optional(),
});

/**
 * POST /api/privacy/delete
 * Delete all user data for GDPR/CCPA compliance
 *
 * Security: Requires authentication AND CSRF token
 * Users can only delete their own data
 */
async function handlePost(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({
      error: 'Database service is currently unavailable'
    }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Get service role client for data deletion
  const serviceSupabase = await createServiceRoleClient();

  if (!serviceSupabase) {
    return NextResponse.json({
      error: 'Database service is currently unavailable'
    }, { status: 503 });
  }

  try {
    const body = await request.json();

    // 3. Validate input using Zod schema
    const validationResult = PrivacyDeleteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { userId } = validationResult.data;

    // 4. Verify user can only delete their own data
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - you can only delete your own data' },
        { status: 403 }
      );
    }

    // 5. Delete user's chat messages
    const { error: messagesError } = await serviceSupabase
      .from('messages')
      .delete()
      .eq('session_id', userId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw messagesError;
    }

    // 6. Delete user's conversations
    const { error: conversationsError } = await serviceSupabase
      .from('conversations')
      .delete()
      .eq('session_id', userId);

    if (conversationsError) {
      console.error('Error deleting conversations:', conversationsError);
      throw conversationsError;
    }

    // 7. Log the deletion request for compliance
    await serviceSupabase.from('privacy_requests').insert({
      user_id: userId,
      request_type: 'deletion',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'All user data has been deleted successfully',
    });

  } catch (error) {
    console.error('Privacy deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}

// Export POST handler with CSRF protection
export const POST = withCSRF(handlePost);