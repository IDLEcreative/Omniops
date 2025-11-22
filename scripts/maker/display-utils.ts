/**
 * MAKER Framework - Display Utilities
 *
 * @purpose Shared display and formatting functions for MAKER scripts
 *
 * @flow
 *   1. Import display functions
 *   2. → Pass data to format/display
 *   3. → Output formatted console displays
 *
 * @keyFunctions
 *   - displayScenarioResults (line 40): Format test scenario results
 *   - displaySummaryTable (line 75): Display results summary table
 *   - displayFileInfo (line 105): Show file deployment information
 *   - displayMicroAgent (line 130): Show microagent details
 *
 * @handles
 *   - Console output formatting
 *   - Table generation
 *   - Progress indicators
 *
 * @returns Formatted console output
 *
 * @dependencies
 *   - ./types.ts (TestResults, DeploymentFile, MicroAgent types)
 *
 * @consumers
 *   - scripts/maker/battle-test.ts
 *   - scripts/maker/manual-deployment.ts
 *   - scripts/maker/real-codebase-test.ts
 *
 * @totalLines 165
 * @estimatedTokens 580 (without header), 680 (with header - 15% savings)
 */

export interface TestResults {
  scenario: string;
  runs: number;
  successCount: number;
  consensusCount: number;
  escalationCount: number;
  avgAttempts: number;
  avgCost: number;
  successRate: number;
  consensusRate: number;
  escalationRate: number;
  costVsSonnet: number;
  costVsOpus: number;
}

export interface DeploymentFile {
  path: string;
  task: string;
  microagents: MicroAgent[];
  estimatedCost: { traditional: number; maker: number };
  estimatedTime: { traditional: number; maker: number };
}

export interface MicroAgent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  verification: string;
  expectedTokens: number;
  expectedSuccess: number;
}

export interface FileAnalysis {
  path: string;
  loc: number;
  makerSuitability: number;
  recommendedTask: string;
}

/**
 * Display test scenario results
 */
export function displayScenarioResults(results: TestResults[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log();

  console.log('Scenario                  | Success | Consensus | Escalation | Avg Attempts | Cost vs Opus');
  console.log('-'.repeat(95));

  results.forEach((r) => {
    const name = r.scenario.padEnd(25);
    const success = `${r.successRate.toFixed(0)}%`.padStart(7);
    const consensus = `${r.consensusRate.toFixed(0)}%`.padStart(9);
    const escalation = `${r.escalationRate.toFixed(0)}%`.padStart(10);
    const attempts = r.avgAttempts.toFixed(1).padStart(12);
    const cost = `${r.costVsOpus.toFixed(0)}%`.padStart(12);

    console.log(`${name} | ${success} | ${consensus} | ${escalation} | ${attempts} | ${cost}`);
  });
}

/**
 * Display summary table for file candidates
 */
export function displayCandidatesTable(candidates: FileAnalysis[]): void {
  console.log('Rank | File | LOC | Suitability | Task');
  console.log('-'.repeat(95));

  candidates.forEach((candidate, i) => {
    const shortPath = candidate.path.replace(process.cwd(), '.').slice(0, 35);
    const rank = (i + 1).toString().padStart(2);
    const loc = candidate.loc.toString().padStart(3);
    const suitability = (candidate.makerSuitability * 100).toFixed(0).padStart(3) + '%';
    const task = candidate.recommendedTask.slice(0, 35);

    console.log(`${rank}   | ${shortPath.padEnd(35)} | ${loc} | ${suitability} | ${task}`);
  });
}

/**
 * Display deployment file information
 */
export function displayFileInfo(file: DeploymentFile): void {
  console.log('\n' + '='.repeat(80));
  console.log(`FILE: ${file.path}`);
  console.log('='.repeat(80));
  console.log(`\n📋 Task: ${file.task}`);
  console.log(`\n🔧 Decomposition: ${file.microagents.length} microagents`);

  file.microagents.forEach((micro, i) => {
    console.log(`   ${i + 1}. ${micro.name}`);
    console.log(`      ${micro.description}`);
  });

  console.log(`\n💰 Estimated Cost:`);
  console.log(`   Traditional (Opus): $${file.estimatedCost.traditional.toFixed(4)}`);
  console.log(`   MAKER (3× Haiku):   $${file.estimatedCost.maker.toFixed(4)}`);
  const savings = ((1 - file.estimatedCost.maker / file.estimatedCost.traditional) * 100).toFixed(0);
  console.log(`   Savings: ${savings}%`);

  console.log(`\n⏱️  Estimated Time:`);
  console.log(`   Traditional: ${file.estimatedTime.traditional} minutes`);
  console.log(`   MAKER:       ${file.estimatedTime.maker} minutes`);
}

/**
 * Display microagent details
 */
export function displayMicroAgent(micro: MicroAgent, index: number): void {
  console.log('\n' + '-'.repeat(80));
  console.log(`MICROAGENT ${index + 1}: ${micro.name}`);
  console.log('-'.repeat(80));
  console.log(`\n📝 Description: ${micro.description}`);
  console.log(`\n🤖 Prompt for Haiku:`);
  console.log('```');
  console.log(micro.prompt);
  console.log('```');
  console.log(`\n✅ Verification: ${micro.verification}`);
  console.log(`\n📊 Expected:`);
  console.log(`   Tokens: ${micro.expectedTokens}`);
  console.log(`   Success Rate: ${(micro.expectedSuccess * 100).toFixed(0)}%`);
  console.log(`   Cost (3 attempts): $${((micro.expectedTokens * 3 * 0.00025) / 1000).toFixed(6)}`);
}

/**
 * Display deployment summary
 */
export function displayDeploymentSummary(results: any[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('DEPLOYMENT SUMMARY');
  console.log('='.repeat(80));

  let totalCost = 0;
  let totalTime = 0;
  let successCount = 0;

  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.file}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Cost: $${result.actualCost.toFixed(4)} (estimated: $${result.estimatedCost.toFixed(4)})`);
    console.log(`   Time: ${result.actualTime} min (estimated: ${result.estimatedTime} min)`);

    totalCost += result.actualCost;
    totalTime += result.actualTime;
    if (result.success) successCount++;
  });

  console.log(`\n📊 TOTALS:`);
  console.log(`   Files Processed: ${results.length}`);
  console.log(`   Successful: ${successCount}/${results.length}`);
  console.log(`   Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`   Total Time: ${totalTime} minutes`);

  const traditionalCost = results.reduce((sum, r) => sum + r.traditionalCost, 0);
  const savings = ((1 - totalCost / traditionalCost) * 100).toFixed(1);
  console.log(`\n💰 Cost Savings: ${savings}% vs traditional approach`);
}
