/**
 * Failure Test Helper Functions
 *
 * Utilities for tracking and reporting test errors and results.
 */

export interface ErrorRecord {
  type: string;
  error: any;
  timestamp: number;
}

export class ErrorTracker {
  private errors: ErrorRecord[] = [];
  private totalRequests = 0;
  private successfulRequests = 0;

  constructor() {
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    process.on('unhandledRejection', (reason) => {
      this.recordError('UNHANDLED_REJECTION', reason);
      console.error('❌ CRITICAL: Unhandled Promise Rejection detected!');
      console.error(reason);
    });

    process.on('uncaughtException', (error) => {
      this.recordError('UNCAUGHT_EXCEPTION', error);
      console.error('❌ CRITICAL: Uncaught Exception detected!');
      console.error(error);
    });
  }

  recordError(type: string, error: any): void {
    this.errors.push({
      type,
      error,
      timestamp: Date.now()
    });
  }

  recordRequest(success: boolean): void {
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    }
  }

  getErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return ((this.totalRequests - this.successfulRequests) / this.totalRequests) * 100;
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      errorRate: this.getErrorRate(),
      errors: this.errors,
      errorCount: this.errors.length
    };
  }

  getErrorsByType(type: string): ErrorRecord[] {
    return this.errors.filter(e => e.type === type);
  }

  reset(): void {
    this.errors = [];
    this.totalRequests = 0;
    this.successfulRequests = 0;
  }
}

/**
 * Print test section header
 */
export function printTestHeader(title: string): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(title);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Print test results
 */
export function printTestResults(passed: number, total: number, failureType: string): boolean {
  console.log(`\n📊 Results: ${passed}/${total} handled gracefully`);

  const failed = total - passed;
  if (failed > 0) {
    console.log(`❌ FAILED: ${failed} ${failureType} detected!\n`);
    return false;
  } else {
    console.log(`✅ PASSED: Zero ${failureType} (protection working)\n`);
    return true;
  }
}

/**
 * Print final summary
 */
export function printFinalSummary(
  testResults: Record<string, boolean>,
  tracker: ErrorTracker
): boolean {
  const stats = tracker.getStats();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('FINAL VALIDATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Red Flag Tests:');
  console.log(`  ${testResults.typeErrorTest ? '✅' : '❌'} TypeError Crashes: ${testResults.typeErrorTest ? 'PREVENTED' : 'DETECTED'}`);
  console.log(`  ${testResults.promiseRejectionTest ? '✅' : '❌'} Unhandled Rejections: ${testResults.promiseRejectionTest ? 'PREVENTED' : 'DETECTED'}`);
  console.log(`  ${testResults.jsonParseTest ? '✅' : '❌'} JSON.parse Crashes: ${testResults.jsonParseTest ? 'PREVENTED' : 'DETECTED'}`);
  console.log(`  ${testResults.errorRateTest ? '✅' : '❌'} Error Rate: ${stats.errorRate.toFixed(2)}% ${stats.errorRate < 5 ? '(< 5%)' : '(> 5%)'}`);

  console.log(`\nOverall Statistics:`);
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Successful: ${stats.successfulRequests}`);
  console.log(`  Error Rate: ${stats.errorRate.toFixed(2)}%`);
  console.log(`  Critical Errors: ${stats.errorCount}`);

  if (stats.errorCount > 0) {
    console.log(`\n⚠️  Critical Errors Detected:`);
    stats.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.type}: ${e.error}`);
    });
  }

  const allTestsPassed = Object.values(testResults).every(t => t === true);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (allTestsPassed && stats.errorCount === 0) {
    console.log('🎉 PRODUCTION READY: All red flag scenarios prevented!\n');
    console.log('✅ No TypeError crashes');
    console.log('✅ No unhandled promise rejections');
    console.log('✅ No JSON.parse crashes');
    console.log('✅ Error rate < 5%');
    console.log('\n🚀 System is resilient and production-ready\n');
    return true;
  } else {
    console.log('❌ PRODUCTION NOT READY: Red flag scenarios detected!\n');
    console.log('🔴 WOULD REQUIRE ROLLBACK IN PRODUCTION\n');
    return false;
  }
}
