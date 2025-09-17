/**
 * Intelligent Chat Context Enhancer
 * Trusts AI's capability to understand context, typos, and intent
 */

import { searchSimilarContentEnhanced } from './enhanced-embeddings';

interface ContextChunk {
  content: string;
  url: string;
  title: string;
  similarity: number;
}

interface EnhancedContext {
  chunks: ContextChunk[];
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

/**
 * Get context for chat queries - simplified to trust AI intelligence
 */
export async function getIntelligentChatContext(
  message: string,
  domain: string,
  domainId: string,
  options: {
    maxChunks?: number;
    conversationHistory?: Array<{ role: string; content: string }>;
  } = {}
): Promise<EnhancedContext> {
  const {
    maxChunks = 20,
    conversationHistory = []
  } = options;

  console.log(`[Intelligent Context] Processing: "${message.substring(0, 50)}..."`);
  
  try {
    // Single embedding search with the raw user message
    // Trust the AI to understand typos, context, and intent
    const chunks = await searchSimilarContentEnhanced(
      message,
      domain,
      maxChunks,
      0.15  // Low threshold for maximum recall
    );
    
    console.log(`[Intelligent Context] Found ${chunks.length} chunks`);
    
    // Return everything to the AI - let it decide what's relevant
    return {
      chunks: chunks || [],
      userMessage: message,
      conversationHistory
    };
    
  } catch (error) {
    console.error('[Intelligent Context] Error:', error);
    return {
      chunks: [],
      userMessage: message,
      conversationHistory
    };
  }
}

/**
 * Format context for AI - minimal formatting, maximum trust
 */
export function formatIntelligentContext(context: EnhancedContext): string {
  if (context.chunks.length === 0) {
    return '';
  }
  
  // Simple, clear formatting without prescriptive instructions
  let formatted = `## Available Information:\n\n`;
  
  context.chunks.forEach((chunk, i) => {
    formatted += `### ${i + 1}. ${chunk.title || 'Information'}\n`;
    formatted += `${chunk.content}\n`;
    formatted += `Source: ${chunk.url}\n`;
    formatted += `Relevance: ${(chunk.similarity * 100).toFixed(0)}%\n\n`;
  });
  
  return formatted;
}