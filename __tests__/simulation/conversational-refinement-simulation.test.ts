/**
 * Conversational Refinement Simulation Test Suite - Orchestrator
 *
 * Main entry point for all conversational refinement simulation tests.
 * Individual scenario tests are in the ./conversational-refinement/ directory.
 *
 * Run: npm test -- conversational-refinement-simulation
 *
 * Test structure:
 * - Grouping Scenarios - conversational-refinement/grouping-scenarios.test.ts
 *   (Broad query, category, price, stock, match quality grouping)
 * - Progressive Narrowing & Exceptions - conversational-refinement/progressive-and-exceptions.test.ts
 *   (Multi-turn conversations, when NOT to refine)
 * - Ranking & Integration - conversational-refinement/ranking-and-integration.test.ts
 *   (Ranking data integration, conversational tone, complete user journey)
 */

// Import all test modules to register with Jest
import './conversational-refinement/grouping-scenarios.test';
import './conversational-refinement/progressive-and-exceptions.test';
import './conversational-refinement/ranking-and-integration.test';
