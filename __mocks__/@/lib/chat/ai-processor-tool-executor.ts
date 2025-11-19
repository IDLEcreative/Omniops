/**
 * Manual Mock: ai-processor-tool-executor
 * Used by Jest tests
 */

const executeToolCallsParallel = jest.fn();
const formatToolResultsForAI = jest.fn();

module.exports = {
  executeToolCallsParallel,
  formatToolResultsForAI
};
