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
import { SEARCH_TOOLS } from './tool-definitions';
import type { AIProcessorDependencies, AIProcessorResult, AIProcessorParams } from './ai-processor-types';
import { executeToolCallsParallel, formatToolResultsForAI } from './ai-processor-tool-executor';
import { formatResponse, getModelConfig } from './ai-processor-formatter';

/**
 * Process AI conversation with ReAct loop and tool execution
 */
export async function processAIConversation(params: AIProcessorParams): Promise<AIProcessorResult> {
  const {
    conversationMessages,
    domain,
    config,
    telemetry,
    openaiClient,
    useGPT5Mini,
    dependencies
  } = params;

  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn, sanitizeOutboundLinks: sanitizeFn } = dependencies;

  console.log(`[Intelligent Chat] Starting conversation with ${conversationMessages.length} messages`);

  // Configuration
  const maxIterations = config?.ai?.maxSearchIterations || 3;
  const searchTimeout = config?.ai?.searchTimeout || 10000;

  let iteration = 0;
  const allSearchResults: SearchResult[] = [];
  const searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }> = [];

  // Initial AI call with tools
  const modelConfig = getModelConfig(useGPT5Mini, false);

  let completion = await openaiClient.chat.completions.create({
    ...modelConfig,
    messages: conversationMessages,
    tools: SEARCH_TOOLS,
    tool_choice: 'required'  // Force AI to search instead of hallucinating from training data
  } as any);

  let finalResponse = '';
  let shouldContinue = true;

  // ReAct loop - iterate until AI stops calling tools or max iterations reached
  while (shouldContinue && iteration < maxIterations) {
    iteration++;
    console.log(`[Intelligent Chat] Iteration ${iteration}/${maxIterations}`);

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
      console.log('[Intelligent Chat] AI finished without tool calls');
      break;
    }

    // Execute tool calls in parallel
    console.log(`[Intelligent Chat] Executing ${toolCalls.length} tools in parallel for comprehensive search`);
    const toolExecutionResults = await executeToolCallsParallel(
      toolCalls,
      domain,
      searchTimeout,
      telemetry,
      dependencies
    );

    // Collect search results and log
    for (const execResult of toolExecutionResults) {
      const { toolName, toolArgs, result } = execResult;

      searchLog.push({
        tool: toolName,
        query: toolArgs.query || toolArgs.category || toolArgs.productQuery || '',
        resultCount: result.results.length,
        source: result.source
      });

      allSearchResults.push(...result.results);
    }

    // Format results for AI
    const toolResults = formatToolResultsForAI(toolExecutionResults);

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
      const iterationConfig = getModelConfig(useGPT5Mini, true);

      completion = await openaiClient.chat.completions.create({
        ...iterationConfig,
        messages: conversationMessages,
        tools: SEARCH_TOOLS,
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
        hasTools: !!SEARCH_TOOLS,
        model: (iterationConfig as any)?.model,
        maxTokens: (iterationConfig as any)?.max_completion_tokens || (iterationConfig as any)?.max_tokens
      });
      finalResponse = 'I found some information but encountered an error processing it. Please try again.';
      break;
    }
  }

  // If we hit max iterations, use last completion's content (avoid redundant API call)
  if (iteration >= maxIterations && shouldContinue) {
    console.log('[Intelligent Chat] Max iterations reached, using last response');
    finalResponse = completion.choices[0]?.message?.content ||
      'I apologize, but I need more time to gather all the information. Please try asking more specifically.';
  }

  // If no final response yet, get it from the last completion
  if (!finalResponse) {
    finalResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
  }

  // Format and sanitize response
  finalResponse = formatResponse(finalResponse, domain, sanitizeFn);

  // Log search activity
  console.log('[Intelligent Chat] Search Summary:', {
    totalIterations: iteration,
    totalSearches: searchLog.length,
    totalResults: allSearchResults.length,
    searchBreakdown: searchLog,
    uniqueUrlsFound: Array.from(new Set(allSearchResults.map(r => r.url))).length
  });

  return {
    finalResponse,
    allSearchResults,
    searchLog,
    iteration
  };
}
