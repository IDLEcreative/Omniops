/**
 * Phase 3 Enhancements Integration Tests
 *
 * Orchestrator for Phase 3 test suites covering:
 * - Tab synchronization
 * - Performance optimization
 * - Session tracking
 * - Analytics engine
 *
 * Individual test suites are organized in phase3/ subdirectory for maintainability.
 * Import and run tests through this orchestrator to ensure all suites execute.
 */

// Import all Phase 3 test suites
import './phase3/tab-sync.test';
import './phase3/performance-optimizer.test';
import './phase3/session-tracker.test';
import './phase3/analytics-engine.test';

// Re-export for documentation purposes
export const PHASE3_TEST_SUITES = {
  tabSync: 'phase3/tab-sync.test.ts',
  performanceOptimizer: 'phase3/performance-optimizer.test.ts',
  sessionTracker: 'phase3/session-tracker.test.ts',
  analyticsEngine: 'phase3/analytics-engine.test.ts',
};
