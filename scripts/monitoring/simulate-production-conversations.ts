#!/usr/bin/env tsx
/**
 * Production Conversation Simulation
 *
 * Simulates 2 weeks of real user conversations to measure accuracy
 * improvement with the metadata tracking system.
 *
 * Tests both scenarios:
 * 1. WITHOUT metadata (baseline - old system)
 * 2. WITH metadata (new system)
 */

import { scenarios } from './modules/conversation-scenarios';
import { SimulationResults } from './modules/conversation-types';
import { simulateScenario, groupByCategory } from './modules/conversation-simulator';
import {
  printCategoryResults,
  printOverallSummary,
  printDetailedResults,
  printProductionInsights,
  printValidation
} from './modules/conversation-reporter';

async function main() {
  console.log('🔬 PRODUCTION CONVERSATION SIMULATION');
  console.log('═'.repeat(80));
  console.log('Simulating 2 weeks of real user conversations');
  console.log(`Testing ${scenarios.length} conversation scenarios`);
  console.log('═'.repeat(80));

  const results: SimulationResults[] = [];

  // Run all scenarios
  for (const scenario of scenarios) {
    const result = simulateScenario(scenario);
    results.push(result);
  }

  // Group results by category
  const byCategory = groupByCategory(results);

  // Print all reports
  printCategoryResults(byCategory);
  printOverallSummary(results);
  printDetailedResults(results);
  printProductionInsights(byCategory);
  printValidation();
}

main().catch(console.error);
