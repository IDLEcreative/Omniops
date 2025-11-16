/**
 * Shared configuration for training dashboard E2E tests
 */

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const TEST_TIMEOUT = 120000; // 2 minutes
export const TRAINING_PAGE = `${BASE_URL}/dashboard/training`;
export const PROCESSING_TIMEOUT = 60000; // 60 seconds for embedding generation
