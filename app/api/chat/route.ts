import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { validateSupabaseEnv } from '@/lib/supabase-server';
import { ChatTelemetry, telemetryManager } from '@/lib/chat-telemetry';

// Core chat modules
import { processAIConversation } from '@/lib/chat/ai-processor';
import { getCustomerServicePrompt, buildConversationMessages } from '@/lib/chat/system-prompts';
import { getOpenAIClient } from '@/lib/chat/openai-client';
import { ChatRequestSchema } from '@/lib/chat/request-validator';
import { RouteDependencies, defaultDependencies } from '@/lib/chat/route-types';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { ChatErrorHandler } from '@/lib/chat/errors/chat-error-handler';

// Extracted helper modules for code organization (all <300 LOC)
import { getCorsHeaders, checkRateLimit, initializeDatabase } from '@/lib/chat/route-helpers';
import {
  performDomainLookup,
  performParallelConfigAndConversation,
  performConversationOperations
} from '@/lib/chat/parallel-operations';
import { handleMCPExecution } from '@/lib/chat/mcp-handler';
import { saveFinalResponse, buildChatResponse } from '@/lib/chat/response-handler';

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, never>> } & { deps?: Partial<RouteDependencies> }
) {
  // Get origin for CORS
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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
        { status: 503, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);
    const { message, conversation_id, session_id, domain, config, session_metadata } = validatedData;

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

    // Check rate limit (uses extracted helper)
    const rateLimitError = await checkRateLimit(
      domain,
      request.headers.get('host'),
      rateLimitFn,
      corsHeaders
    );
    if (rateLimitError) return rateLimitError;

    // Initialize Supabase client (uses extracted helper)
    const { client: adminSupabase, error: dbError } = await initializeDatabase(
      createSupabaseClient,
      corsHeaders
    );
    if (dbError) return dbError;

    // OPTIMIZATION: Parallel database operations to reduce latency
    const perfStart = performance.now();

    // Step 1: Domain lookup (must be first - other operations depend on domainId)
    const domainId = await performDomainLookup(domain, adminSupabase!, telemetry);

    // Step 2: Parallel config and conversation operations
    const { widgetConfig, conversationId } = await performParallelConfigAndConversation(
      domainId,
      conversation_id,
      session_id,
      adminSupabase!,
      telemetry,
      session_metadata
    );

    // Step 3: Parallel conversation operations (save message, get history, load metadata)
    const { historyData, convMetadata } = await performConversationOperations(
      conversationId!,
      message,
      adminSupabase!,
      telemetry
    );

    // Load or create metadata manager
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
    const { finalResponse: aiResponse, allSearchResults, searchLog, iteration } = await processAIConversation({
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

    // MCP CODE EXECUTION: Check if AI response contains executable code (uses extracted handler)
    const { finalResponse, mcpExecutionMetadata } = await handleMCPExecution(
      aiResponse,
      domain,
      domainId ?? null,
      conversationId ?? null,
      session_id,
      telemetry
    );

    // Save assistant response and metadata (uses extracted helper)
    await saveFinalResponse(
      conversationId!,
      finalResponse,
      message,
      metadataManager,
      adminSupabase!,
      domainId ?? null,
      perfStart,
      telemetry
    );

    // Complete telemetry with success
    await telemetry?.complete(finalResponse);

    // Build and return response (uses extracted helper)
    return buildChatResponse(
      finalResponse,
      conversationId!,
      allSearchResults,
      searchLog,
      iteration,
      mcpExecutionMetadata,
      corsHeaders
    );

  } catch (error) {
    const errorHandler = new ChatErrorHandler({ telemetry });
    return await errorHandler.handleError(error, corsHeaders);
  }
}
