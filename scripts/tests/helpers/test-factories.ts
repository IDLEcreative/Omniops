/**
 * Test factory functions to reduce code repetition
 */

import { authenticateUser, makeRequest } from './auth-helpers';

export interface TestConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  baseUrl: string;
}

export function createAuthTests(config: TestConfig, userEmail: string, userPassword: string) {
  return {
    async testUnauthenticated(path: string, expectedStatus: number = 401) {
      const response = await makeRequest(path, config.baseUrl);
      return {
        passed: response.status === expectedStatus,
        message: response.status === expectedStatus
          ? `Correctly returned ${expectedStatus}`
          : `Expected ${expectedStatus}, got ${response.status}`
      };
    },

    async testAuthenticated(
      path: string,
      expectedStatus: number = 200,
      validateData?: (data: any) => boolean
    ) {
      const token = await authenticateUser(userEmail, userPassword, config.supabaseUrl, config.supabaseAnonKey);

      if (!token) {
        return { passed: false, message: 'Failed to authenticate user' };
      }

      const response = await makeRequest(path, config.baseUrl, {}, token);

      if (response.status !== expectedStatus) {
        return {
          passed: false,
          message: `Expected ${expectedStatus}, got ${response.status}`
        };
      }

      if (validateData && response.status === 200) {
        const data = await response.json();
        const isValid = validateData(data);
        return {
          passed: isValid,
          message: isValid ? 'Data validation passed' : 'Data validation failed'
        };
      }

      return { passed: true, message: `Successfully returned ${expectedStatus}` };
    },

    async testRateLimit(path: string, maxRequests: number) {
      const token = await authenticateUser(userEmail, userPassword, config.supabaseUrl, config.supabaseAnonKey);

      if (!token) {
        return { passed: false, message: 'Failed to authenticate user' };
      }

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        await makeRequest(path, config.baseUrl, {}, token);
      }

      // This one should be rate limited
      const response = await makeRequest(path, config.baseUrl, {}, token);

      return {
        passed: response.status === 429,
        message: response.status === 429
          ? 'Correctly rate limited after threshold'
          : `Expected 429, got ${response.status}`
      };
    }
  };
}
