/**
 * AI Processor - Type Definitions
 *
 * Shared types and interfaces for AI conversation processing.
 */

import { SearchResult } from '@/types';
import { ChatTelemetry } from '@/lib/chat-telemetry';
import OpenAI from 'openai';
import type { WidgetConfig } from './conversation-manager';

export interface AIProcessorDependencies {
  getCommerceProvider: any;
  searchSimilarContent: any;
  sanitizeOutboundLinks: any;
}

export interface AIProcessorResult {
  finalResponse: string;
  allSearchResults: SearchResult[];
  searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }>;
  iteration: number;
}

export interface AIProcessorParams {
  conversationMessages: Array<any>;
  domain: string | undefined;
  config: any;
  widgetConfig?: WidgetConfig | null; // Widget configuration for AI settings
  telemetry: ChatTelemetry | null;
  openaiClient: OpenAI;
  useGPT5Mini: boolean;
  dependencies: AIProcessorDependencies;
}

export interface ToolExecutionResult {
  toolCall: any;
  toolName: string;
  toolArgs: Record<string, any>;
  result: { success: boolean; results: SearchResult[]; source: string };
  executionTime: number;
}

export interface ModelConfig {
  model: string;
  reasoning_effort?: string;
  max_completion_tokens?: number;
  temperature?: number;
  max_tokens?: number;
}
