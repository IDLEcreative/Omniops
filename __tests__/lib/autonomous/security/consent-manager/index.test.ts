/**
 * ConsentManager test suite orchestrator
 * Imports and re-exports all modular test suites
 *
 * This file serves as the main entry point for all ConsentManager tests.
 * Individual test files in this directory are organized by functionality:
 * - grant.test.ts: Consent granting and validation
 * - verify.test.ts: Consent verification and expiry checks
 * - revoke.test.ts: Consent revocation operations
 * - list-and-query.test.ts: Consent listing and querying
 * - permissions-and-stats.test.ts: Permission checks and statistics
 */

// Import all test suites
import './grant.test';
import './verify.test';
import './revoke.test';
import './list-and-query.test';
import './permissions-and-stats.test';
