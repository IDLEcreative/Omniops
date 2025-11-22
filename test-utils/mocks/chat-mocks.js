/**
 * Chat Module Mocks Configuration
 *
 * Provides mock implementations for chat-related modules:
 * - get-available-tools
 * - ai-processor-tool-executor
 */

export const chatMocks = {
  '@/lib/chat/get-available-tools': {
    getAvailableTools: jest.fn().mockResolvedValue([]),
    checkToolAvailability: jest.fn().mockResolvedValue({
      hasWooCommerce: false,
      hasShopify: false
    }),
    getToolInstructions: jest.fn().mockReturnValue('')
  },
  '@/lib/chat/ai-processor-tool-executor': {
    executeToolCallsParallel: jest.fn().mockResolvedValue([]),
    formatToolResultsForAI: jest.fn().mockReturnValue([])
  }
};
