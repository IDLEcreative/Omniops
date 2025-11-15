/**
 * Protected Endpoints Integration Tests Orchestrator
 *
 * This file orchestrates CSRF protection tests across all endpoints.
 * Actual test implementations are in ./tests/ subdirectory.
 *
 * Test Categories:
 * - Token Generation: tests/csrf-token-generation.test.ts
 * - Endpoint Protection: tests/endpoint-protection.test.ts
 * - Attack Scenarios: tests/csrf-attack-scenarios.test.ts
 *
 * Shared Utilities:
 * - Test Helpers: shared/csrf-test-helpers.ts
 */

import './tests/csrf-token-generation.test'
import './tests/endpoint-protection.test'
import './tests/csrf-attack-scenarios.test'
