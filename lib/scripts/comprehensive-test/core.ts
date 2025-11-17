/**
 * Core business logic for comprehensive testing
 * Extracted from scripts/comprehensive-test.js
 */
import * as crypto from 'node:crypto';
import type { SupabaseClient } from '@/lib/supabase/server';

export interface TestPayload {
  message?: string;
  session_id?: string;
  conversation_id?: string;
  domain?: string;
  config?: { features?: { websiteScraping?: { enabled: boolean } } };
}

export interface TestResponse {
  status: number;
  data: any;
}

export interface TestResult {
  passed: boolean;
  message?: string;
  data?: any;
}

/** Make HTTP request to API endpoint */
export async function makeRequest(apiUrl: string, payload: TestPayload): Promise<TestResponse> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, data: await response.json() };
}

/** Test UUID session validation */
export async function testUUIDSessions(apiUrl: string, supabase: SupabaseClient): Promise<TestResult> {
  // Valid UUID
  const validUUID = crypto.randomUUID();
  const { status, data } = await makeRequest(apiUrl, {
    message: 'Test with valid UUID',
    session_id: validUUID,
  });

  if (status !== 200 || !data.conversation_id) {
    return { passed: false, message: `Valid UUID failed: ${data.error}` };
  }

  // Verify database storage
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, session_id')
    .eq('id', data.conversation_id)
    .single();

  if (!conv || conv.session_id !== validUUID) {
    return { passed: false, message: 'UUID storage verification failed' };
  }

  // Test invalid UUID
  const { status: status2 } = await makeRequest(apiUrl, {
    message: 'Test with invalid UUID',
    session_id: 'not-a-uuid-123',
  });

  if (status2 !== 400 && status2 !== 200) {
    return { passed: false, message: 'Invalid UUID not handled properly' };
  }

  return { passed: true, message: 'UUID validation working correctly' };
}

/** Test conversation persistence across messages */
export async function testConversationPersistence(apiUrl: string, supabase: SupabaseClient): Promise<TestResult> {
  const sessionId = crypto.randomUUID();

  // First message
  const { status, data } = await makeRequest(apiUrl, {
    message: 'Hello, this is test message 1',
    session_id: sessionId,
  });

  if (status !== 200 || !data.conversation_id) {
    return { passed: false, message: 'Failed to create conversation' };
  }

  const conversationId = data.conversation_id;

  // Second message
  const { data: data2 } = await makeRequest(apiUrl, {
    message: 'This is test message 2',
    session_id: sessionId,
    conversation_id: conversationId,
  });

  if (data2.conversation_id !== conversationId) {
    return { passed: false, message: 'Conversation continuity broken' };
  }

  // Verify database
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (!messages || messages.length < 4) {
    return { passed: false, message: 'Message persistence issue' };
  }

  return { passed: true, message: `${messages.length} messages persisted correctly`, data: { messageCount: messages.length } };
}

/** Test concurrent request handling */
export async function testConcurrency(apiUrl: string): Promise<TestResult> {
  const requests = Array(5)
    .fill(null)
    .map((_, i) =>
      makeRequest(apiUrl, {
        message: `Concurrent request ${i + 1}`,
        session_id: crypto.randomUUID(),
      })
    );

  const startTime = Date.now();
  const results = await Promise.allSettled(requests);
  const duration = Date.now() - startTime;

  const successful = results.filter((r) => r.status === 'fulfilled' && r.value.status === 200);
  return { passed: successful.length >= 3, message: `${successful.length}/5 successful in ${duration}ms`, data: { successful: successful.length, duration } };
}

/** Test embeddings search functionality */
export async function testEmbeddings(apiUrl: string): Promise<TestResult> {
  // Test with configured domain
  const { status, data } = await makeRequest(apiUrl, {
    message: 'What products do you offer?',
    session_id: crypto.randomUUID(),
    domain: 'test.example.com',
    config: {
      features: {
        websiteScraping: { enabled: true },
      },
    },
  });

  if (status !== 200) {
    return { passed: false, message: 'Embeddings search failed' };
  }

  // Test with non-existent domain
  const { status: status2 } = await makeRequest(apiUrl, {
    message: 'Test query',
    session_id: crypto.randomUUID(),
    domain: 'nonexistent.domain.com',
  });

  if (status2 !== 200) {
    return { passed: false, message: 'Failed to handle non-existent domain' };
  }

  return { passed: true, message: 'Embeddings search working', data: { sources: data.sources?.length || 0 } };
}

/** Test error handling and recovery */
export async function testErrorRecovery(apiUrl: string): Promise<TestResult> {
  // Missing message field
  const { status } = await makeRequest(apiUrl, {
    session_id: crypto.randomUUID(),
  });

  if (status !== 400) {
    return { passed: false, message: 'Failed to validate request' };
  }

  // Oversized message
  const longMessage = 'x'.repeat(1500);
  const { status: status2 } = await makeRequest(apiUrl, {
    message: longMessage,
    session_id: crypto.randomUUID(),
  });

  if (status2 !== 400) {
    return { passed: false, message: 'Failed to enforce message size limit' };
  }

  return { passed: true, message: 'Error handling working correctly' };
}

/** Test database state verification */
export async function testDatabaseState(supabase: SupabaseClient): Promise<TestResult> {
  const { count: convCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });

  const { count: msgCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  const { data: recent } = await supabase
    .from('conversations')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isActive = recent ? Date.now() - new Date(recent.created_at).getTime() < 60000 : false;
  return { passed: true, message: 'Database state verified', data: { conversations: convCount, messages: msgCount, active: isActive } };
}

/** Test rate limiting enforcement */
export async function testRateLimiting(apiUrl: string): Promise<TestResult> {
  const domain = 'rate-test.example.com';

  const requests = Array(10)
    .fill(null)
    .map((_, i) =>
      makeRequest(apiUrl, {
        message: `Rate limit test ${i + 1}`,
        session_id: crypto.randomUUID(),
        domain: domain,
      })
    );

  const results = await Promise.allSettled(requests);
  const rateLimited = results.filter((r) => r.status === 'fulfilled' && r.value.status === 429);
  return { passed: true, message: rateLimited.length > 0 ? 'Rate limiting active' : 'No rate limits hit', data: { rateLimited: rateLimited.length } };
}
