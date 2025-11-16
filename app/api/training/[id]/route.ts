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
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = await createServiceRoleClient();
    
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }
    
    const resolvedParams = await params;

    // Delete associated embeddings first (works for both training_data and scraped_pages)
    const { error: embeddingError } = await adminSupabase
      .from('page_embeddings')
      .delete()
      .eq('page_id', resolvedParams.id);

    if (embeddingError) {
      console.error('Error deleting embeddings:', embeddingError);
    }

    // Try to delete from training_data first (has user_id constraint for security)
    const { error: trainingError, data: trainingData } = await adminSupabase
      .from('training_data')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .select();

    // If no rows deleted from training_data, try scraped_pages
    if (!trainingData || trainingData.length === 0) {
      // For scraped_pages, verify user owns this through organization membership
      // First get the scraped page to find its domain
      const { data: scrapedPage } = await adminSupabase
        .from('scraped_pages')
        .select('domain_id')
        .eq('id', resolvedParams.id)
        .single();

      if (scrapedPage) {
        // Get domain's organization
        const { data: domain } = await adminSupabase
          .from('domains')
          .select('organization_id')
          .eq('id', scrapedPage.domain_id)
          .single();

        if (domain?.organization_id) {
          // Verify user is member of this organization
          const { data: membership } = await adminSupabase
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', domain.organization_id)
            .single();

          if (membership) {
            // User has permission, delete the scraped page
            const { error: scrapedError } = await adminSupabase
              .from('scraped_pages')
              .delete()
              .eq('id', resolvedParams.id);

            if (scrapedError) throw scrapedError;
          } else {
            return NextResponse.json(
              { error: 'Unauthorized to delete this item' },
              { status: 403 }
            );
          }
        }
      }
    }

    // If we had an error from training_data and it wasn't "no rows", throw it
    if (trainingError && !trainingError.message?.includes('0 rows')) {
      throw trainingError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training data:', error);
    return NextResponse.json(
      { error: 'Failed to delete training data' },
      { status: 500 }
    );
  }
}
