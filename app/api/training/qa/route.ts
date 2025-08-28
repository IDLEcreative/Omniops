import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { generateEmbeddings } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, answer } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const adminSupabase = await createServiceRoleClient();
    
    // Create training data entry
    const { data: trainingData, error: insertError } = await adminSupabase
      .from('training_data')
      .insert({
        user_id: user.id,
        type: 'qa',
        content: question, // Store question as content
        metadata: { question, answer },
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Process embeddings asynchronously for better performance
    // This allows the UI to update immediately while processing continues
    (async () => {
      try {
        const qaContent = `Question: ${question}\n\nAnswer: ${answer}`;
        
        await generateEmbeddings({
          contentId: trainingData.id,
          content: qaContent,
          url: `training-qa-${trainingData.id}`,
          title: 'Q&A Training Data',
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
        type: 'qa',
        content: question,
        status: 'processing',
        createdAt: trainingData.created_at,
        metadata: { question, answer }
      }
    });
  } catch (error) {
    console.error('Error creating Q&A training data:', error);
    return NextResponse.json(
      { error: 'Failed to create training data' },
      { status: 500 }
    );
  }
}
