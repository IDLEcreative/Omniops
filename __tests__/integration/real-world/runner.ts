import chalk from 'chalk';
import { REAL_WORLD_SCENARIOS } from './scenarios';
import { RealWorldTester } from './tester';

export async function runRealWorldValidator(scenarioFilter?: string) {
  console.log(chalk.bold('\n🌍 REAL-WORLD CONVERSATION VALIDATOR\n'));
  console.log(chalk.gray('Testing with realistic customer scenarios\n'));
  console.log(chalk.gray('═'.repeat(70)));

  const scenariosToRun = scenarioFilter
    ? REAL_WORLD_SCENARIOS.filter((s) => s.name.toLowerCase().includes(scenarioFilter.toLowerCase()))
    : REAL_WORLD_SCENARIOS;

  if (scenariosToRun.length === 0) {
    console.log(chalk.red(`\n❌ No scenarios found matching: ${scenarioFilter}\n`));
    return;
  }

  console.log(chalk.gray(`\nRunning ${scenariosToRun.length} scenario(s)...\n`));

  const tester = new RealWorldTester();
  const scenarioResults = [];

  for (const scenario of scenariosToRun) {
    tester.reset();
    const result = await tester.runScenario(scenario);
    scenarioResults.push({ name: scenario.name, ...result });
  }

  console.log(chalk.bold('\n═'.repeat(70)));
  console.log(chalk.bold('📊 REAL-WORLD TEST SUMMARY\n'));

  scenarioResults.forEach((result) => {
    const percentage = Math.round((result.totalScore / result.maxScore) * 100);
    const status = result.passed ? chalk.green('✅ PASS') : chalk.yellow('⚠️  PARTIAL');
    console.log(`${status} ${result.name} (${percentage}%)`);
  });

  const totalScore = scenarioResults.reduce((sum, r) => sum + r.totalScore, 0);
  const maxScore = scenarioResults.reduce((sum, r) => sum + r.maxScore, 0);
  const overallPercentage = Math.round((totalScore / maxScore) * 100);

  console.log(chalk.gray('─'.repeat(70)));
  console.log(chalk.bold(`Overall Quality: ${overallPercentage}%\n`));

  if (overallPercentage >= 80) {
    console.log(chalk.green('🎉 Excellent! Production ready.'));
  } else if (overallPercentage >= 60) {
    console.log(chalk.yellow('👍 Good! Some room for improvement.'));
  } else {
    console.log(chalk.red('⚠️  Needs work before production.'));
  }

  console.log('');
}
