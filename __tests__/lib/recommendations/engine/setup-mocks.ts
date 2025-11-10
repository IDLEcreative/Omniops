/**
 * Mock Setup Module for Recommendation Engine Tests
 *
 * This module sets up all Jest mocks that must be configured before
 * importing the code under test. This file is imported first in all
 * recommendation engine test files.
 *
 * Jest execution order:
 * 1. This file runs and sets up mocks
 * 2. Module imports happen with mocks in place
 * 3. Tests run with properly mocked dependencies
 */

import { jest } from '@jest/globals';

// Setup all mocks BEFORE any imports
jest.mock('@/lib/recommendations/vector-similarity', () => ({
  vectorSimilarityRecommendations: jest.fn(),
}));

jest.mock('@/lib/recommendations/collaborative-filter', () => ({
  collaborativeFilterRecommendations: jest.fn(),
}));

jest.mock('@/lib/recommendations/content-filter', () => ({
  contentBasedRecommendations: jest.fn(),
}));

jest.mock('@/lib/recommendations/hybrid-ranker', () => ({
  hybridRanker: jest.fn(),
}));

jest.mock('@/lib/recommendations/context-analyzer', () => ({
  analyzeContext: jest.fn(),
}));

jest.mock('@/lib/supabase/server');

// Mock OpenAI to prevent actual API calls
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify({}) } }],
          }),
        },
      },
    })),
  };
});
