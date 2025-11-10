/**
 * Shared utilities for conversation E2E testing
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{ url: string; title: string; relevance: number }>;
}

export interface MessageTestResult {
  response: string;
  conversationId: string;
  metadata: any;
  contextResolvedCorrectly?: boolean;
}

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
export const testConversations: string[] = [];

export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<MessageTestResult> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      domain: 'test.localhost',
      conversation_id: conversationId
    })
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }

  const data: ChatResponse = await response.json();
  const metadata = await fetchMetadataFromDB(data.conversation_id);

  return {
    response: data.message,
    conversationId: data.conversation_id,
    metadata
  };
}

export async function fetchMetadataFromDB(conversationId: string): Promise<any> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  return data?.metadata || {};
}

export async function setupTestDomain(): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  }

  const supabase = await createServiceRoleClient();
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'test.localhost')
    .single();

  if (!domain) {
    throw new Error('Test domain not found. Please create test.localhost domain first.');
  }

  console.log('✅ Test environment ready, domain:', domain.id);
  return domain.id;
}

export async function cleanupTestConversations(): Promise<void> {
  if (testConversations.length > 0) {
    const supabase = await createServiceRoleClient();
    await supabase
      .from('conversations')
      .delete()
      .in('id', testConversations);
    console.log(`🧹 Cleaned up ${testConversations.length} test conversations`);
  }
}
