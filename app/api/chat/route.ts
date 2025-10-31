import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { validateSupabaseEnv } from '@/lib/supabase-server';
import { ChatResponse, SearchResult } from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';
import { ChatTelemetry, telemetryManager } from '@/lib/chat-telemetry';

// Extracted modules for cleaner code organization
import { SEARCH_TOOLS, validateToolArguments, runWithTimeout } from '@/lib/chat/tool-definitions';
import {
  executeSearchProducts,
  executeSearchByCategory,
  executeGetProductDetails,
  executeLookupOrder
} from '@/lib/chat/tool-handlers';
import {
  lookupDomain,
  getOrCreateConversation,
  saveUserMessage,
  saveAssistantMessage,
  getConversationHistory,
  loadWidgetConfig
} from '@/lib/chat/conversation-manager';
import { processAIConversation } from '@/lib/chat/ai-processor';
import { getCustomerServicePrompt, buildConversationMessages } from '@/lib/chat/system-prompts';
import { getOpenAIClient } from '@/lib/chat/openai-client';
import { ChatRequestSchema } from '@/lib/chat/request-validator';
import { RouteDependencies, defaultDependencies } from '@/lib/chat/route-types';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';

// Dependencies interface and defaults imported from route-types module


export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, never>> } & { deps?: Partial<RouteDependencies> }
) {
  // Extract deps from context (defaults to defaultDependencies if not provided)
  const deps = context.deps || defaultDependencies;

  // Merge with defaults for any missing dependencies
  const {
    checkDomainRateLimit: rateLimitFn,
    searchSimilarContent: searchFn,
    getCommerceProvider: getProviderFn,
    sanitizeOutboundLinks: sanitizeFn,
    createServiceRoleClient: createSupabaseClient,
  } = { ...defaultDependencies, ...deps };

  // Initialize telemetry at the very start
  let telemetry: ChatTelemetry | null = null;

  try {
    // Check critical environment variables
    if (!validateSupabaseEnv() || !process.env.OPENAI_API_KEY) {
      console.error('[Chat API] Service configuration incomplete');
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          message: 'The chat service is currently undergoing maintenance. Please try again later.'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);
    const { message, conversation_id, session_id, domain, config } = validatedData;

    // Check if GPT-5 mini is enabled
    const useGPT5Mini = process.env.USE_GPT5_MINI === 'true';

    // Initialize telemetry with session data
    try {
      telemetry = telemetryManager.createSession(
        session_id,
        useGPT5Mini ? 'gpt-5-mini' : 'gpt-4',
        {
          metricsEnabled: true,
          detailedLogging: process.env.NODE_ENV === 'development',
          persistToDatabase: true
        }
      );

      // Log initial request data
      telemetry.log('info', 'performance', 'Chat request started', {
        message: message.substring(0, 100),
        domain,
        hasConversationId: !!conversation_id
      });
    } catch (telemetryError) {
      // Telemetry should not break the main flow
      console.warn('Failed to initialize telemetry:', telemetryError);
    }

    // Check rate limit
    const rateLimitDomain = domain || request.headers.get('host') || 'unknown';
    const { allowed, resetTime } = rateLimitFn(rateLimitDomain);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
          }
        }
      );
    }

    // Initialize Supabase client (uses injected dependency for testing)
    const adminSupabase = await createSupabaseClient();

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // OPTIMIZATION: Parallel database operations to reduce latency
    // Step 1: Domain lookup (must be first - other operations depend on domainId)
    const perfStart = performance.now();
    const domainId = await lookupDomain(domain, adminSupabase);
    const domainLookupTime = performance.now() - perfStart;

    telemetry?.log('info', 'performance', 'Domain lookup completed', {
      duration: `${domainLookupTime.toFixed(2)}ms`,
      domainId: domainId || 'null'
    });

    // Step 2: Parallel operations that depend on domainId
    const parallelStart = performance.now();
    const [widgetConfig, conversationId] = await Promise.all([
      // Load widget configuration (depends on domainId)
      loadWidgetConfig(domainId, adminSupabase),
      // Get or create conversation (depends on domainId)
      getOrCreateConversation(
        conversation_id,
        session_id,
        domainId,
        adminSupabase
      )
    ]);
    const parallelTime = performance.now() - parallelStart;

    telemetry?.log('info', 'performance', 'Parallel operations completed', {
      duration: `${parallelTime.toFixed(2)}ms`,
      operations: ['loadWidgetConfig', 'getOrCreateConversation']
    });

    // Log config loading for debugging
    if (widgetConfig) {
      telemetry?.log('info', 'ai', 'Widget config loaded', {
        hasPersonality: !!widgetConfig.ai_settings?.personality,
        hasLanguage: !!widgetConfig.ai_settings?.language,
        hasCustomPrompt: !!widgetConfig.ai_settings?.customSystemPrompt,
      });
    }

    // Step 3: Parallel operations that depend on conversationId
    const conversationOpsStart = performance.now();
    const [, historyData, convMetadata] = await Promise.all([
      // Save user message (depends on conversationId)
      saveUserMessage(conversationId, message, adminSupabase),
      // Get conversation history (depends on conversationId)
      getConversationHistory(conversationId, 20, adminSupabase),
      // Load conversation metadata (depends on conversationId)
      adminSupabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single()
        .then((result: { data: any }) => result.data)
    ]);
    const conversationOpsTime = performance.now() - conversationOpsStart;

    telemetry?.log('info', 'performance', 'Conversation operations completed', {
      duration: `${conversationOpsTime.toFixed(2)}ms`,
      operations: ['saveUserMessage', 'getConversationHistory', 'loadMetadata']
    });

    // Load or create metadata manager (convMetadata is now available from parallel ops)
    const metadataManager = convMetadata?.metadata
      ? ConversationMetadataManager.deserialize(JSON.stringify(convMetadata.metadata))
      : new ConversationMetadataManager();

    // Increment turn counter
    metadataManager.incrementTurn();

    // Generate enhanced context for AI (always enabled - production-ready)
    const enhancedContext = metadataManager.generateContextSummary();

    // Build conversation messages for OpenAI with enhanced system prompt
    // Metadata context is always injected for improved conversation accuracy
    const conversationMessages = buildConversationMessages(
      getCustomerServicePrompt(widgetConfig) + enhancedContext,
      historyData,
      message
    );

    // Get OpenAI client
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      throw new Error('OpenAI client not available');
    }

    // Process AI conversation with ReAct loop and tool execution
    const { finalResponse, allSearchResults, searchLog, iteration } = await processAIConversation({
      conversationMessages,
      domain,
      config,
      widgetConfig, // Pass widget configuration for AI settings
      telemetry,
      openaiClient,
      useGPT5Mini,
      dependencies: {
        getCommerceProvider: getProviderFn,
        searchSimilarContent: searchFn,
        sanitizeOutboundLinks: sanitizeFn
      }
    });

    // Save assistant response
    await saveAssistantMessage(conversationId, finalResponse, adminSupabase);

    // Parse and track entities from this conversation turn
    await parseAndTrackEntities(finalResponse, message, metadataManager);

    // Save metadata back to database
    await adminSupabase
      .from('conversations')
      .update({ metadata: JSON.parse(metadataManager.serialize()) })
      .eq('id', conversationId);

    // Complete telemetry with success
    await telemetry?.complete(finalResponse);

    // Return response with search metadata
    return NextResponse.json<ChatResponse & { searchMetadata?: any }>({
      message: finalResponse,
      conversation_id: conversationId!,
      sources: allSearchResults.slice(0, 10).map(r => ({
        url: r.url,
        title: r.title,
        relevance: r.similarity
      })),
      searchMetadata: {
        iterations: iteration,
        totalSearches: searchLog.length,
        searchLog: searchLog
      }
    });

  } catch (error) {
    console.error('[Intelligent Chat API] Error:', error);

    // DEBUG: Enhanced error logging for tests
    if (process.env.NODE_ENV === 'test') {
      console.error('[TEST DEBUG] Full error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error?.constructor?.name,
        error
      });
    }

    // Complete telemetry with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await telemetry?.complete(undefined, errorMessage);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: 'An unexpected error occurred. Please try again.',
        // Only include debug info in development (SECURITY: Never expose stack traces in production)
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
            timestamp: new Date().toISOString()
          }
        })
      },
      { status: 500 }
    );
  }
}
