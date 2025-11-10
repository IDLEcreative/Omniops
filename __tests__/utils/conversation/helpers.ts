/**
 * Multi-Turn Conversation Test Helpers
 *
 * Shared utilities for all conversation test modules.
 * Extracted from monolithic multi-turn-conversation-e2e.test.ts
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Configuration
// ============================================================================

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
export const TEST_DOMAIN = 'test.localhost';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Send a chat message and return response with metadata
 */
export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<MessageTestResult> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      domain: TEST_DOMAIN,
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

/**
 * Fetch conversation metadata from database
 */
export async function fetchMetadataFromDB(conversationId: string): Promise<any> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  return data?.metadata || {};
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  }
}

/**
 * Setup test domain and return domain ID
 */
export async function setupTestDomain(): Promise<string> {
  const supabase = await createServiceRoleClient();
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', TEST_DOMAIN)
    .single();

  if (!domain) {
    throw new Error(`Test domain not found. Please create ${TEST_DOMAIN} domain first.`);
  }

  console.log('✅ Test environment ready, domain:', domain.id);
  return domain.id;
}

/**
 * Cleanup test conversations
 */
export async function cleanupConversations(conversationIds: string[]): Promise<void> {
  if (conversationIds.length === 0) return;

  const supabase = await createServiceRoleClient();
  await supabase
    .from('conversations')
    .delete()
    .in('id', conversationIds);

  console.log(`🧹 Cleaned up ${conversationIds.length} test conversations`);
}
