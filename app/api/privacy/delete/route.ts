import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { withCSRF } from '@/lib/middleware/csrf';

/**
 * POST /api/privacy/delete
 * Delete all user data for GDPR/CCPA compliance
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 */
async function handlePost(request: NextRequest) {
  // Initialize Supabase client inside the function
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({
      error: 'Database service is currently unavailable'
    }, { status: 503 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete user's chat messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', userId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw messagesError;
    }

    // Delete user's conversations
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('session_id', userId);

    if (conversationsError) {
      console.error('Error deleting conversations:', conversationsError);
      throw conversationsError;
    }

    // Log the deletion request for compliance
    await supabase.from('privacy_requests').insert({
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