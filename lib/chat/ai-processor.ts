/**
 * AI Processor
 *
 * Handles the complete AI conversation processing flow including:
 * - Model configuration (GPT-5-mini vs GPT-4)
 * - ReAct loop orchestration
 * - Tool execution and result formatting
 * - Response assembly and formatting
 */

import OpenAI from 'openai';
import { SearchResult } from '@/types';
import { ChatTelemetry } from '@/lib/chat-telemetry';
import { getAvailableTools, checkToolAvailability, getToolInstructions } from './get-available-tools';
import type { AIProcessorDependencies, AIProcessorResult, AIProcessorParams } from './ai-processor-types';
import { formatResponse, getModelConfig } from './ai-processor-formatter';
import { ShoppingProduct } from '@/types/shopping';
import { logger } from '@/lib/logger';
import { executeAndCollectTools, prepareShoppingProducts, logSearchSummary } from './ai-processor-helpers';

/**
 * Process AI conversation with ReAct loop and tool execution
 */
export async function processAIConversation(params: AIProcessorParams): Promise<AIProcessorResult> {
  const {
    conversationMessages,
    domain,
    config,
    widgetConfig,
    telemetry,
    openaiClient,
    useGPT5Mini,
    dependencies,
    isMobile
  } = params;

  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn, sanitizeOutboundLinks: sanitizeFn } = dependencies;

  logger.info('Starting conversation', {
    service: 'intelligent-chat',
    messageCount: conversationMessages.length,
    domain
  });

  // Log widget configuration settings
  if (widgetConfig?.integration_settings) {
    logger.debug('Widget integration settings', {
      service: 'intelligent-chat',
      enableWebSearch: widgetConfig.integration_settings.enableWebSearch,
      enableKnowledgeBase: widgetConfig.integration_settings.enableKnowledgeBase,
      dataSourcePriority: widgetConfig.integration_settings.dataSourcePriority,
      domain
    });

    // TODO: Implement web search tool integration
    // When enableWebSearch is true, add external web search tools to available tools
    // When enableWebSearch is false, only use knowledge base search
  }

  // Get available tools based on customer configuration
  const availableTools = await getAvailableTools(domain);
  const toolAvailability = await checkToolAvailability(domain);
  const toolInstructions = getToolInstructions(toolAvailability);

  // Add tool availability instructions to system message
  if (toolInstructions) {
    conversationMessages[0].content += `\n\n${toolInstructions}`;
  }

  // Configuration
  // Reduced to 3 iterations to prevent 60s timeout on complex queries
  // Most queries complete in 1-2 iterations anyway
  // Worst case: 3 × 20s = 60s (fits within timeout)
  const maxIterations = config?.ai?.maxSearchIterations || 3;
  const searchTimeout = config?.ai?.searchTimeout || 10000;

  let iteration = 0;
  const allSearchResults: SearchResult[] = [];
  const searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }> = [];
  const allProducts: any[] = []; // Collect products from all tool calls

  // Extract last user query for shopping context
  const lastUserMessage = conversationMessages.slice().reverse().find(m => m.role === 'user');
  const lastUserQuery = lastUserMessage?.content || '';

  // Initial AI call with tools
  const modelConfig = getModelConfig(useGPT5Mini, false, widgetConfig);

  telemetry?.log('info', 'ai', 'Getting initial completion', {
    messageCount: conversationMessages.length,
    toolCount: availableTools.length,
    hasWooCommerce: toolAvailability.hasWooCommerce,
    hasShopify: toolAvailability.hasShopify,
    iteration: 0
  });

  let completion = await openaiClient.chat.completions.create({
    ...modelConfig,
    messages: conversationMessages,
    tools: availableTools,
    tool_choice: availableTools.length > 0 ? 'required' : 'none'  // Force AI to search if tools available
  } as any);

  let finalResponse = '';
  let shouldContinue = true;

  // ReAct loop - iterate until AI stops calling tools or max iterations reached
  while (shouldContinue && iteration < maxIterations) {
    iteration++;
    logger.info('Processing iteration', {
      service: 'intelligent-chat',
      iteration,
      maxIterations,
      domain
    });

    const choice = completion.choices[0];
    if (!choice?.message) break;

    // Check if AI wants to call tools
    const toolCalls = choice.message.tool_calls;

    // Track iteration in telemetry
    telemetry?.trackIteration(iteration, toolCalls?.length || 0);

    if (!toolCalls || toolCalls.length === 0) {
      // No tool calls - AI is ready to respond
      finalResponse = choice.message.content || 'I apologize, but I was unable to generate a response.';
      shouldContinue = false;
      logger.info('AI finished without tool calls', {
        service: 'intelligent-chat',
        iteration,
        domain
      });
      break;
    }

    // Log tool selection for debugging and monitoring
    logger.debug('AI selected tools', {
      service: 'tool-selection',
      toolCount: toolCalls.length,
      tools: toolCalls.map(tc => tc.function.name),
      iteration,
      domain
    });

    toolCalls.forEach((tc, idx) => {
      const toolName = tc.function.name;
      let args: any = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch (e) {
        // Ignore parse errors for logging
      }
      const userContext = conversationMessages[conversationMessages.length - 1]?.content?.substring(0, 100) || 'N/A';
      logger.debug('Tool selected', {
        service: 'tool-selection',
        toolIndex: idx + 1,
        toolName,
        args,
        userContextPreview: userContext,
        domain
      });
    });

    // Execute tool calls in parallel
    logger.info('Executing tools in parallel', {
      service: 'intelligent-chat',
      toolCount: toolCalls.length,
      iteration,
      domain
    });

    const { toolResults, allSearchResults: newResults, allProducts: newProducts, searchLog: newSearchLog } = await executeAndCollectTools(
      toolCalls,
      domain,
      searchTimeout,
      telemetry,
      dependencies,
      conversationMessages
    );

    allSearchResults.push(...newResults);
    allProducts.push(...newProducts);
    searchLog.push(...newSearchLog);

    // Add tool results to conversation
    conversationMessages.push({
      role: 'assistant' as const,
      content: choice.message.content,
      tool_calls: toolCalls
    } as any);

    toolResults.forEach(result => {
      conversationMessages.push({
        role: 'tool' as const,
        tool_call_id: result.tool_call_id,
        content: result.content
      } as any);
    });

    // Get AI's next response
    try {
      const iterationConfig = getModelConfig(useGPT5Mini, true, widgetConfig);

      completion = await openaiClient.chat.completions.create({
        ...iterationConfig,
        messages: conversationMessages,
        tools: availableTools,
        tool_choice: 'auto'
      } as any);
    } catch (error) {
      // Enhanced error logging to capture OpenAI API errors
      console.error('[Intelligent Chat] Error in follow-up completion:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorType: (error as any)?.type,
        errorStatus: (error as any)?.status,
        errorParam: (error as any)?.param,
        iteration,
        messageCount: conversationMessages.length,
        hasTools: availableTools.length > 0
      });
      finalResponse = 'I found some information but encountered an error processing it. Please try again.';
      break;
    }
  }

  // If we hit max iterations, use last completion's content (avoid redundant API call)
  if (iteration >= maxIterations && shouldContinue) {
    console.log('[Intelligent Chat] Max iterations reached, using last response');

    // Extract search context from the conversation to make fallback message helpful
    let searchContext = '';
    const lastToolCalls = completion.choices[0]?.message?.tool_calls;
    if (lastToolCalls && lastToolCalls.length > 0) {
      const queries: string[] = [];
      for (const tc of lastToolCalls) {
        try {
          const args = JSON.parse(tc.function.arguments);
          const query = args.query || args.productQuery || args.orderId || args.category || '';
          if (query) queries.push(query);
        } catch {
          // Ignore parse errors
        }
      }
      if (queries.length > 0) {
        searchContext = ` for "${queries[0]}"`;
      }
    }

    finalResponse = completion.choices[0]?.message?.content ||
      `I'm having trouble finding complete information${searchContext}. This could be due to:\n\n` +
      `- The item might not be in our current catalog\n` +
      `- There might be a temporary connection issue\n` +
      `- The search is taking longer than expected\n\n` +
      `To help you faster, please provide:\n` +
      `- The exact product name or description, OR\n` +
      `- A link to the product page, OR\n` +
      `- A photo of the product or label\n\n` +
      `Would any of these alternatives work for you?`;
  }

  // If no final response yet, get it from the last completion
  if (!finalResponse) {
    finalResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
  }

  // Format and sanitize response
  finalResponse = formatResponse(finalResponse, domain, sanitizeFn);

  // Transform products for shopping feed if available
  const { shoppingProducts, shoppingContext } = prepareShoppingProducts(
    allProducts,
    searchLog,
    finalResponse,
    lastUserQuery,
    isMobile
  );

  // Log search activity
  logSearchSummary(iteration, maxIterations, searchLog, allSearchResults, allProducts, shoppingProducts);

  return {
    finalResponse,
    allSearchResults,
    searchLog,
    iteration,
    shoppingProducts,
    shoppingContext
  };
}
