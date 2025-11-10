/**
 * Parallel Database Operations for Chat Route
 * Optimizes latency by running independent operations concurrently
 */

import type { SupabaseClient } from '@/types/supabase';
import { ChatTelemetry } from '@/lib/chat-telemetry';
import {
  lookupDomain,
  loadWidgetConfig,
  getOrCreateConversation,
  updateConversationMetadata,
  saveUserMessage,
  getConversationHistory
} from './conversation-manager';

export async function performDomainLookup(
  domain: string,
  supabase: SupabaseClient,
  telemetry: ChatTelemetry | null
) {
  const perfStart = performance.now();
  const domainId = await lookupDomain(domain, supabase);
  const domainLookupTime = performance.now() - perfStart;

  telemetry?.log('info', 'performance', 'Domain lookup completed', {
    duration: `${domainLookupTime.toFixed(2)}ms`,
    domainId: domainId || 'null'
  });

  return domainId;
}

export async function performParallelConfigAndConversation(
  domainId: string | null,
  conversationId: string | undefined,
  sessionId: string,
  supabase: SupabaseClient,
  telemetry: ChatTelemetry | null,
  sessionMetadata?: any
) {
  const parallelStart = performance.now();
  const results = await Promise.allSettled([
    loadWidgetConfig(domainId, supabase),
    getOrCreateConversation(conversationId, sessionId, domainId, supabase, sessionMetadata)
  ]);
  const parallelTime = performance.now() - parallelStart;

  const widgetConfig = results[0].status === 'fulfilled' ? results[0].value : null;
  const finalConversationId = results[1].status === 'fulfilled' ? results[1].value : null;

  if (results[0].status === 'rejected') {
    telemetry?.log('error', 'config', 'Failed to load widget config, using defaults', {
      error: results[0].reason?.message
    });
  }
  if (results[1].status === 'rejected') {
    telemetry?.log('error', 'conversation', 'Failed to get/create conversation', {
      error: results[1].reason?.message
    });
    throw new Error('Failed to initialize conversation');
  }

  telemetry?.log('info', 'performance', 'Parallel operations completed', {
    duration: `${parallelTime.toFixed(2)}ms`,
    operations: ['loadWidgetConfig', 'getOrCreateConversation']
  });

  if (widgetConfig) {
    telemetry?.log('info', 'ai', 'Widget config loaded', {
      hasPersonality: !!widgetConfig.ai_settings?.personality,
      hasLanguage: !!widgetConfig.ai_settings?.language,
      hasCustomPrompt: !!widgetConfig.ai_settings?.customSystemPrompt,
    });
  }

  return { widgetConfig, conversationId: finalConversationId };
}

export async function performConversationOperations(
  conversationId: string,
  message: string,
  supabase: SupabaseClient,
  telemetry: ChatTelemetry | null
) {
  const conversationOpsStart = performance.now();
  const results = await Promise.allSettled([
    saveUserMessage(conversationId, message, supabase),
    getConversationHistory(conversationId, 20, supabase),
    supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single()
      .then((result: { data: any }) => result.data)
  ]);
  const conversationOpsTime = performance.now() - conversationOpsStart;

  const historyData = results[1].status === 'fulfilled' ? results[1].value : [];
  const convMetadata = results[2].status === 'fulfilled' ? results[2].value : null;

  if (results[0].status === 'rejected') {
    telemetry?.log('error', 'conversation', 'Failed to save user message', {
      error: results[0].reason?.message
    });
    throw new Error('Failed to save user message');
  }
  if (results[1].status === 'rejected') {
    telemetry?.log('warn', 'conversation', 'Failed to load history, using empty', {
      error: results[1].reason?.message
    });
  }
  if (results[2].status === 'rejected') {
    telemetry?.log('warn', 'conversation', 'Failed to load metadata, creating new', {
      error: results[2].reason?.message
    });
  }

  telemetry?.log('info', 'performance', 'Conversation operations completed', {
    duration: `${conversationOpsTime.toFixed(2)}ms`,
    operations: ['saveUserMessage', 'getConversationHistory', 'loadMetadata'],
    successCount: results.filter(r => r.status === 'fulfilled').length
  });

  return { historyData, convMetadata };
}
