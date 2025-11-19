import { jest } from '@jest/globals'

// NO default implementation - let tests configure the return value
// This allows mockReturnValue() and mockReturnValueOnce() to work properly
export const checkDomainRateLimit = jest.fn();
export const checkRateLimit = jest.fn();
export const checkExpensiveOpRateLimit = jest.fn();
export const resetRateLimit = jest.fn();
export const getRateLimitStatus = jest.fn();