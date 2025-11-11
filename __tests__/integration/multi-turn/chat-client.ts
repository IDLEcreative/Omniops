import { API_BASE_URL, TEST_DOMAIN } from './config';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { ChatResponse } from './types';

export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<{ response: string; conversationId: string; metadata: any }> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      domain: TEST_DOMAIN,
      conversation_id: conversationId,
      session_id: `test_e2e_${Date.now()}_${Math.random()}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }

  const data: ChatResponse = await response.json();
  const metadata = await fetchMetadataFromDB(data.conversation_id);

  return { response: data.message, conversationId: data.conversation_id, metadata };
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
