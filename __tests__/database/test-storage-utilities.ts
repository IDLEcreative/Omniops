/**
 * Comprehensive test suite for localStorage utilities - ORCHESTRATOR
 *
 * Individual test suites are in storage-tests/ directory.
 */

import { beforeEach, afterEach, jest } from '@jest/globals';

// Mock logger to prevent console spam during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Import all test suites
import './storage-tests/get-storage.test';
import './storage-tests/set-storage.test';
import './storage-tests/remove-clear.test';
import './storage-tests/availability-types.test';

console.log('✅ All storage utility tests defined');
console.log('Run with: npm test test-storage-utilities.ts');
