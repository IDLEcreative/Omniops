import { TEST_CONFIG } from './config';
import { TEST_SCENARIOS } from './scenarios';
import { analyzeResponse, detectConcerns, type ResponseAnalysis } from './analysis';
import { makeApiRequest } from './api';
import {
  printComprehensiveReport,
  printSummaryStatistics,
  printKeyFindings,
  type ScenarioTestResult
} from './reporting';

function createEmptyAnalysis(): ResponseAnalysis {
  return {
    wordCount: 0,
    characterCount: 0,
    bulletPoints: 0,
    externalLinks: [],
    internalLinks: [],
    currency: { gbp: 0, usd: 0, euro: 0 },
    productCount: 0,
    questionsAsked: 0,
    immediateProductShow: false,
    responseTime: 0
  };
}

export async function runTestSuite(): Promise<void> {
  console.log('🚀 Starting Chat Response Test Suite');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Domain: ${TEST_CONFIG.domain}`);
  console.log(`Session ID: ${TEST_CONFIG.sessionId}`);
  console.log('');

  const results: ScenarioTestResult[] = [];

  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    console.log(`\n[${i + 1}/${TEST_SCENARIOS.length}] Testing: ${scenario.id}`);
    console.log(`Query: "${scenario.query}"`);

    try {
      const { response, time } = await makeApiRequest(scenario.query);
      const analysis = analyzeResponse(response.message, time);
      const concerns = detectConcerns(scenario, analysis, response.message);

      results.push({
        scenario,
        analysis,
        concerns,
        response: response.message,
        success: concerns.length === 0
      });

      console.log(`✓ Completed in ${time}ms`);
    } catch (error) {
      console.error('✗ Failed:', error);
      results.push({
        scenario,
        analysis: createEmptyAnalysis(),
        concerns: [`API request failed: ${error}`],
        response: '',
        success: false
      });
    }
  }

  printComprehensiveReport(results);
  printSummaryStatistics(results);
  printKeyFindings(results);

  console.log('\n' + '='.repeat(80));
  console.log('Test suite completed!');

  if (results.some(result => !result.success)) {
    process.exitCode = 1;
  }
}
