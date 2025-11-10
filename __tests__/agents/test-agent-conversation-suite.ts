#!/usr/bin/env npx tsx
/**
 * Comprehensive Agent Conversation Test Suite Orchestrator
 * Entry point that delegates to modular conversation test suite
 *
 * Refactored from 525 LOC to:
 * - This file: 20 LOC (orchestrator)
 * - conversation-suite/: 8 scenario files (~50 LOC each)
 * - utils/agents/: 3 utility modules (~50 LOC each)
 */

import { runAllTests } from './conversation-suite/test-runner';

runAllTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
