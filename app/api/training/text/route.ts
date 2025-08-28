import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { generateEmbeddings } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const adminSupabase = await createServiceRoleClient();
    
    // Create training data entry
    const { data: trainingData, error: insertError } = await adminSupabase
      .from('training_data')
      .insert({
        user_id: user.id,
        type: 'text',
        content: content.substring(0, 200), // Store preview
        metadata: { fullContent: content },
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Process embeddings asynchronously for better performance
    // This allows the UI to update immediately while processing continues
    (async () => {
      try {
        await generateEmbeddings({
          contentId: trainingData.id,
          content,
          url: `training-text-${trainingData.id}`,
          title: 'Custom Training Text',
        });

        // Update status to completed
        await adminSupabase
          .from('training_data')
          .update({ status: 'completed' })
          .eq('id', trainingData.id);

      } catch (embeddingError) {
        console.error('Error generating embeddings:', embeddingError);
        
        // Update status to error
        await adminSupabase
          .from('training_data')
          .update({ 
            status: 'error',
            metadata: { 
              ...trainingData.metadata,
              error: 'Failed to generate embeddings' 
            }
          })
          .eq('id', trainingData.id);
      }
    })();
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: trainingData.id,
        type: 'text',
        content: content.substring(0, 200),
        status: 'processing',
        createdAt: trainingData.created_at,
        metadata: { fullContent: content }
      }
    });
  } catch (error) {
    console.error('Error creating text training data:', error);
    return NextResponse.json(
      { error: 'Failed to create training data' },
      { status: 500 }
    );
  }
}