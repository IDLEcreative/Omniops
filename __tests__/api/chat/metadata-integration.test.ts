/**
 * Chat Route Metadata Integration Tests
 *
 * This orchestrator file imports all metadata integration test modules.
 * Individual test modules are located in ./metadata-integration/
 *
 * Refactored from 563 LOC monolithic file to 7 focused modules.
 * See ./metadata-integration/README.md for details.
 */

// Import all test modules
import './metadata-integration/metadata-loading.test';
import './metadata-integration/turn-counter.test';
import './metadata-integration/entity-parsing.test';
import './metadata-integration/context-enhancement.test';
import './metadata-integration/persistence.test';
import './metadata-integration/complete-flow.test';
import './metadata-integration/error-handling.test';

// All tests are now organized in focused modules
// Run this file to execute all metadata integration tests
