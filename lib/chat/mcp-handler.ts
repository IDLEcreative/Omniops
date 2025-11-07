/**
 * MCP Code Execution Handler
 * Handles detection and execution of MCP code in AI responses
 */

import { ChatTelemetry } from '@/lib/chat-telemetry';
import {
  isMCPExecutionEnabled,
  detectMCPCodeExecution,
  extractMCPCode,
  buildMCPExecutionContext,
  executeMCPCode,
  calculateTokenSavings
} from './mcp-integration';

export async function handleMCPExecution(
  aiResponse: string,
  domain: string,
  domainId: string | null,
  conversationId: string | null,
  sessionId: string,
  telemetry: ChatTelemetry | null
): Promise<{
  finalResponse: string;
  mcpExecutionMetadata?: { executionTime?: number; tokensSaved?: number };
}> {
  if (!isMCPExecutionEnabled() || !detectMCPCodeExecution(aiResponse)) {
    return { finalResponse: aiResponse };
  }

  const code = extractMCPCode(aiResponse);
  if (!code) {
    return { finalResponse: aiResponse };
  }

  telemetry?.log('info', 'mcp', 'Detected MCP code execution request', {
    codeLength: code.length,
    domain,
    conversationId
  });

  const execContext = buildMCPExecutionContext(
    domain,
    domainId ?? undefined,
    conversationId ?? null,
    sessionId
  );

  const mcpResult = await executeMCPCode(code, execContext, {
    timeout: 30000,
    allowedCategories: ['search']
  });

  if (mcpResult.success) {
    telemetry?.log('info', 'mcp', 'MCP execution successful', {
      executionTime: mcpResult.metadata?.executionTime,
      tokensSaved: mcpResult.metadata?.tokensSaved || calculateTokenSavings(),
      responseLength: mcpResult.response.length
    });

    return {
      finalResponse: mcpResult.response,
      mcpExecutionMetadata: mcpResult.metadata
    };
  } else {
    telemetry?.log('error', 'mcp', 'MCP execution failed, using error response', {
      executionTime: mcpResult.metadata?.executionTime
    });

    return { finalResponse: mcpResult.response };
  }
}
