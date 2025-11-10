/**
 * Type Definitions for MCP Comparison Framework
 *
 * Shared types used across the MCP comparison system.
 */

export interface ComparisonTestCase {
  id: string;
  description: string;
  userQuery: string;
  expectedBehavior: string;
  category: 'product_search' | 'exact_sku' | 'semantic_search' | 'error_handling' | 'multi_result' | 'edge_case';
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  system: 'traditional' | 'mcp';
  testCaseId: string;
  success: boolean;
  response: string;
  products?: any[];
  executionTime: number;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  toolCalls?: any[];
  codeExecuted?: string;
  error?: string;
}

export interface ComparisonResult {
  testCaseId: string;
  description: string;
  userQuery: string;
  functionalEquivalence: {
    passed: boolean;
    differences: string[];
    score: number;
  };
  performance: {
    traditionalTime: number;
    mcpTime: number;
    speedImprovement: number;
  };
  tokenUsage: {
    traditionalTokens: number;
    mcpTokens: number;
    tokensSaved: number;
    percentReduction: number;
  };
  recommendations: string[];
}
