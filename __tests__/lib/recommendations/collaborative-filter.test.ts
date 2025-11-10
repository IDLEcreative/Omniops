/**
 * Collaborative Filtering Tests - Orchestrator
 *
 * This file orchestrates all collaborative filtering algorithm tests.
 * Individual test modules are located in ./collaborative-filter/ subdirectory.
 *
 * Refactored from 516 LOC original file to focused test modules.
 * See ./collaborative-filter/README.md for detailed breakdown.
 *
 * Test Modules:
 * - user-similarity.test.ts (7 tests) - User similarity and Jaccard calculation
 * - product-ranking.test.ts (8 tests) - Product scoring and filtering
 * - cold-start-handling.test.ts (11 tests) - Edge cases and error recovery
 * - integration.test.ts (7 tests) - Complete end-to-end workflows
 *
 * Total: 33 tests across 4 focused modules
 * Last Updated: 2025-11-10
 */

import './collaborative-filter/user-similarity.test';
import './collaborative-filter/product-ranking.test';
import './collaborative-filter/cold-start-handling.test';
import './collaborative-filter/integration.test';
