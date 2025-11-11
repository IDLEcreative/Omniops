import { createServiceRoleClient } from '@/lib/supabase-server';
import { API_BASE_URL, TEST_DOMAIN } from './constants';
import { ChatResponse, TestResult } from './types';
import { recordExecutionTime } from './metrics';

const realFetch = globalThis.fetch;

async function getConversationMetadata(conversationId: string): Promise<any> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  return data?.metadata || {};
}

export async function sendChatMessage(
  message: string,
  options: { conversationId?: string; sessionId?: string } = {}
): Promise<TestResult> {
  const startTime = Date.now();

  const response = await realFetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: options.conversationId,
      session_id: options.sessionId || `agent4-session-${Date.now()}`,
      domain: TEST_DOMAIN,
      config: {
        allow_web_search: false,
        allow_woocommerce: false,
        allow_shopify: false,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat API error: ${response.status} ${errorText}`);
  }

  const responseText = await response.text();
  let data: ChatResponse;

  try {
    data = JSON.parse(responseText) as ChatResponse;
  } catch (parseError) {
    throw new Error('Failed to parse API response as JSON');
  }

  if (!data.message) {
    throw new Error('API response missing "message" field');
  }

  const metadata = await getConversationMetadata(data.conversation_id);
  const executionTime = Date.now() - startTime;
  recordExecutionTime(executionTime);

  return {
    response: data.message,
    conversationId: data.conversation_id,
    metadata,
  };
}
