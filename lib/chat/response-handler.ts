/**
 * Chat Response Handler
 * Handles final response operations: saving, events, metadata
 */

import type { SupabaseClient } from '@/types/supabase';
import { NextResponse } from 'next/server';
import { ChatResponse } from '@/types';
import { ChatTelemetry } from '@/lib/chat-telemetry';
import { ConversationMetadataManager } from './conversation-metadata';
import { saveAssistantMessage } from './conversation-manager';
import { parseAndTrackEntities } from './response-parser';
import { emitMessageEvent } from '@/lib/analytics/supabase-events';
import type { ShoppingProduct } from '@/types/shopping';

export async function saveFinalResponse(
  conversationId: string,
  finalResponse: string,
  message: string,
  metadataManager: ConversationMetadataManager,
  supabase: SupabaseClient,
  domainId: string | null,
  perfStart: number,
  telemetry: ChatTelemetry | null,
  shoppingProducts?: ShoppingProduct[],
  shoppingContext?: string
): Promise<string | null> {
  // Build message metadata with shopping data if available
  const messageMetadata: any = {};
  if (shoppingProducts && shoppingProducts.length > 0) {
    messageMetadata.shoppingProducts = shoppingProducts;
    if (shoppingContext) {
      messageMetadata.shoppingContext = shoppingContext;
    }
  }

  // Save assistant response with metadata
  const assistantMessageId = await saveAssistantMessage(
    conversationId,
    finalResponse,
    supabase,
    Object.keys(messageMetadata).length > 0 ? messageMetadata : undefined
  );

  // Emit real-time analytics events
  if (domainId) {
    await emitMessageEvent(domainId.toString(), {
      conversationId,
      messageId: assistantMessageId || 'unknown',
      role: 'assistant',
      content: finalResponse,
      responseTime: telemetry ? (Date.now() - perfStart) / 1000 : undefined,
      timestamp: new Date(),
    }).catch(err => {
      console.warn('[Chat API] Failed to emit message event:', err);
    });
  }

  // Parse and track entities
  await parseAndTrackEntities(finalResponse, message, metadataManager);

  // Save metadata back to database
  try {
    await supabase
      .from('conversations')
      .update({ metadata: JSON.parse(metadataManager.serialize()) })
      .eq('id', conversationId);
  } catch (error) {
    console.error('[Chat] Failed to save metadata:', error);
  }

  return assistantMessageId;
}

export function buildChatResponse(
  finalResponse: string,
  conversationId: string,
  allSearchResults: any[],
  searchLog: any[],
  iteration: number,
  mcpExecutionMetadata: { executionTime?: number; tokensSaved?: number } | undefined,
  corsHeaders: Record<string, string>,
  shoppingProducts?: ShoppingProduct[],
  shoppingContext?: string
): NextResponse<ChatResponse & { searchMetadata?: any; mcpMetadata?: any; shoppingMetadata?: any }> {
  const response: ChatResponse & { searchMetadata?: any; mcpMetadata?: any; shoppingMetadata?: any } = {
    message: finalResponse,
    conversation_id: conversationId,
    sources: (allSearchResults || []).slice(0, 10).map(r => ({
      url: r.url,
      title: r.title,
      relevance: r.similarity
    })),
    searchMetadata: {
      iterations: iteration,
      totalSearches: (searchLog || []).length,
      searchLog: searchLog || []
    }
  };

  // Add MCP metadata if available
  if (mcpExecutionMetadata) {
    response.mcpMetadata = {
      executed: true,
      executionTime: mcpExecutionMetadata.executionTime,
      tokensSaved: mcpExecutionMetadata.tokensSaved
    };
  }

  // Add shopping metadata if available
  if (shoppingProducts && shoppingProducts.length > 0) {
    response.shoppingMetadata = {
      products: shoppingProducts,
      context: shoppingContext,
      productCount: shoppingProducts.length
    };
    console.log('[Response Handler] ✅ Shopping metadata added to response:', {
      productCount: shoppingProducts.length,
      context: shoppingContext,
      firstProductName: shoppingProducts[0]?.name
    });
  } else {
    console.log('[Response Handler] ❌ No shopping products - products:', shoppingProducts);
  }

  console.log('[Response Handler] Final API response keys:', Object.keys(response));
  console.log('[Response Handler] Has shoppingMetadata?', !!response.shoppingMetadata);

  return NextResponse.json(response, { headers: corsHeaders });
}
