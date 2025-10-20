import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { OrganizationRole } from '@/types/organizations';

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

/**
 * PATCH /api/organizations/[id]/members/[userId]
 * Update a member's role (admin/owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createServerClient();
    const organizationId = params.id;
    const targetUserId = params.userId;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is admin or owner
    const { data: currentMembership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !currentMembership) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    if (!['owner', 'admin'].includes(currentMembership.role)) {
      return NextResponse.json(
        { error: 'Only admins and owners can update member roles' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { role: newRole } = validation.data;

    // Only owners can assign owner role
    if (newRole === 'owner' && currentMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can assign the owner role' },
        { status: 403 }
      );
    }

    // Get target member
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Admins cannot modify owners
    if (targetMember.role === 'owner' && currentMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can modify other owners' },
        { status: 403 }
      );
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      member: updatedMember,
    });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]/members/[userId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/members/[userId]
 * Remove a member from organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = createServerClient();
    const organizationId = params.id;
    const targetUserId = params.userId;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's membership
    const { data: currentMembership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !currentMembership) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is removing themselves
    const isSelfRemoval = targetUserId === user.id;

    // Get target member
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!isSelfRemoval) {
      // Only admins and owners can remove others
      if (!['owner', 'admin'].includes(currentMembership.role)) {
        return NextResponse.json(
          { error: 'Only admins and owners can remove members' },
          { status: 403 }
        );
      }

      // Admins cannot remove owners
      if (targetMember.role === 'owner' && currentMembership.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only owners can remove other owners' },
          { status: 403 }
        );
      }
    }

    // The database trigger will prevent removing the last owner
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      // Check if it's the last owner error
      if (deleteError.message.includes('last owner')) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner from an organization' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Member removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/members/[userId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
