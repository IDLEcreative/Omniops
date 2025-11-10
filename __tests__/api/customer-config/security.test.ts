/**
 * Customer Config API Security Tests - Main Orchestrator
 *
 * Tests for authentication and authorization vulnerabilities (GitHub Issue #9)
 * This file imports and runs all security test suites for customer config API
 *
 * Test Coverage:
 * - GET /api/customer/config endpoint security
 * - POST /api/customer/config endpoint security
 * - PUT /api/customer/config endpoint security
 * - DELETE /api/customer/config endpoint security
 * - RLS Policy Verification at database level
 *
 * @jest-environment node
 */

import dotenv from 'dotenv';

// Mark as E2E test to use real credentials (not mocks)
process.env.E2E_TEST = 'true';

// Load real environment variables for security testing
// The Jest setup file overrides these with mocks, but security tests need real credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('birugqyuqhiahxvxeyqg')) {
  // Force-load from .env.local (override=true)
  dotenv.config({ path: '.env.local', override: true });
}

// Import all test suites
import './security/get.test';
import './security/post.test';
import './security/put.test';
import './security/delete.test';
import './security/rls.test';
