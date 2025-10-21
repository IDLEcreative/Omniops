import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const acceptInvitationSchema = z.object({
  token: z.string(),
});

/**
 * GET /api/invitations/accept?token=xxx
 * Get invitation details (for showing info before user accepts)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Fetch invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('id, organization_id, email, role, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 410 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Fetch organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', invitation.organization_id)
      .single();

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organization_name: organization?.name || 'Unknown',
        organization_slug: organization?.slug || '',
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/invitations/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations/accept
 * Accept an invitation and join the organization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to accept an invitation' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = acceptInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Fetch invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 410 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Verify email matches (case-insensitive)
    // Email is already available in the user object from auth.getUser()
    const userEmail = user.email;

    if (!userEmail || userEmail.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      // Mark invitation as accepted anyway
      await supabase
        .from('organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'You are already a member of this organization' },
        { status: 409 }
      );
    }

    // Add user to organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error adding member:', memberError);
      return NextResponse.json(
        { error: 'Failed to join organization' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) {
      console.warn('Warning: Failed to mark invitation as accepted:', updateError);
      // Don't fail the request, membership was created successfully
    }

    // Get organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', invitation.organization_id)
      .single();

    return NextResponse.json(
      {
        message: 'Successfully joined organization',
        organization: {
          ...organization,
          user_role: invitation.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/invitations/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
