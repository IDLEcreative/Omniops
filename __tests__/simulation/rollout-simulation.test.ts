/**
 * Rollout Simulation Test Suite - Orchestrator
 *
 * Main entry point for all rollout simulation tests.
 * Individual phase tests are in the ./rollout/ directory.
 *
 * Run: npm test -- rollout-simulation
 *
 * Test structure:
 * - Phase 1: Basic persistence (1000 users) - rollout/phase1.test.ts
 * - Phase 2: Multi-tab sync (100 users) - rollout/phase2.test.ts
 * - Phase 3: Cross-page persistence (100 users) - rollout/phase3.test.ts
 * - Error handling - rollout/error-scenarios.test.ts
 * - Performance - rollout/performance-load.test.ts
 * - Verification - rollout/rollout-verification.test.ts
 */

// Import all test modules to register with Jest
import './rollout/phase1.test';
import './rollout/phase2.test';
import './rollout/phase3.test';
import './rollout/error-scenarios.test';
import './rollout/performance-load.test';
import './rollout/rollout-verification.test';
