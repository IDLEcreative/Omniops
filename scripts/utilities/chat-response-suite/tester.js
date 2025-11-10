import { API_URL, TARGET_DOMAIN, TEST_QUERIES } from './config.js';
import { analyzeResponse } from './analyzer.js';
import { displayAnalysis, summarizeResults } from './report.js';

export class ChatTester {
  constructor() {
    this.results = [];
  }

  async testQuery(query, index) {
    const sessionId = `test-session-${Date.now()}-${index}`;

    console.log(`\n🔍 Testing Query ${index + 1}: "${query}"`);
    console.log('━'.repeat(60));

    const requestBody = {
      message: query,
      session_id: sessionId,
      domain: TARGET_DOMAIN,
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    };

    try {
      const startTime = Date.now();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      const message = data.message || '';

      console.log(`✅ Response received in ${responseTime}ms`);

      const analysis = analyzeResponse(message);
      this.results.push({
        query,
        response: message,
        analysis,
        responseTime,
        sessionId,
        conversationId: data.conversation_id,
        sources: data.sources || []
      });

      displayAnalysis(analysis, message);
      return true;
    } catch (error) {
      console.error(`❌ Error testing query: ${error.message}`);
      this.results.push({
        query,
        response: '',
        analysis: { error: error.message },
        responseTime: 0,
        sessionId,
        conversationId: null,
        sources: []
      });
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Chat Response Analysis');
    console.log(`Testing against: ${API_URL}`);
    console.log(`Target domain: ${TARGET_DOMAIN}`);
    console.log(`Total queries: ${TEST_QUERIES.length}`);
    console.log('═'.repeat(80));

    let successCount = 0;

    for (let i = 0; i < TEST_QUERIES.length; i++) {
      const success = await this.testQuery(TEST_QUERIES[i], i);
      if (success) successCount++;
      if (i < TEST_QUERIES.length - 1) {
        await sleep(1000);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY REPORT');
    console.log('═'.repeat(80));
    console.log(`\n✅ Successful requests: ${successCount}/${TEST_QUERIES.length}`);
    summarizeResults(this.results);
    console.log('\n' + '═'.repeat(80));
    console.log('Test completed at', new Date().toISOString());
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
