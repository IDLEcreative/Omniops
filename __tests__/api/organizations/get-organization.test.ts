/**
 * Orchestrator for GET /api/organizations/[id] Tests
 * Combines all test suites for the organization retrieval endpoint
 *
 * Test Organization:
 * - auth.test.ts: Authentication & service availability (2 tests)
 * - success.test.ts: Successful retrieval & role handling (2 tests)
 * - errors.test.ts: Error scenarios & access control (3 tests)
 * - response-shape.test.ts: Response structure & data accuracy (2 tests)
 * - security.test.ts: Multi-tenant isolation (1 test)
 *
 * Total: 10 tests, all preserved from original
 */

import '@/__tests__/api/organizations/get-organization/auth.test';
import '@/__tests__/api/organizations/get-organization/success.test';
import '@/__tests__/api/organizations/get-organization/errors.test';
import '@/__tests__/api/organizations/get-organization/response-shape.test';
import '@/__tests__/api/organizations/get-organization/security.test';
