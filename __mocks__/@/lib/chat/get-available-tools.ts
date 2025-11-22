/**
 * Manual Mock: get-available-tools
 * Used by Jest tests
 */

const getAvailableTools = jest.fn();
const checkToolAvailability = jest.fn();
const getToolInstructions = jest.fn();

module.exports = {
  getAvailableTools,
  checkToolAvailability,
  getToolInstructions
};
