import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = await createServiceRoleClient();
    const resolvedParams = await params;
    
    // Delete associated embeddings first
    const { error: embeddingError } = await adminSupabase
      .from('content_embeddings')
      .delete()
      .eq('content_id', resolvedParams.id);

    if (embeddingError) {
      console.error('Error deleting embeddings:', embeddingError);
    }

    // Delete training data
    const { error } = await adminSupabase
      .from('training_data')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training data:', error);
    return NextResponse.json(
      { error: 'Failed to delete training data' },
      { status: 500 }
    );
  }
}
