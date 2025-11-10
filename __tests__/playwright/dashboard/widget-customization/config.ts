/**
 * Shared configuration for widget customization E2E tests
 */

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const TEST_TIMEOUT = 120000; // 2 minutes
export const CUSTOMIZE_PAGE = `${BASE_URL}/dashboard/customize`;
