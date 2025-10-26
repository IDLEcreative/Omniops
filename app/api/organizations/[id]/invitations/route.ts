import { NextRequest, NextResponse } from 'next/server';
import { handleGetInvitations, handleCreateInvitation } from '@/lib/api/invitations';

/**
 * GET /api/organizations/[id]/invitations
 * List pending invitations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    return await handleGetInvitations(request, organizationId);
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/invitations
 * Create a new invitation with seat limit validation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    return await handleCreateInvitation(request, organizationId);
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
