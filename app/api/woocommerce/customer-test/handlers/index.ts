/**
 * Test handler orchestration
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSchemaTest } from './schema-test';
import { runVerificationTest } from './verification-test';
import { runCustomerTest } from './customer-test';
import { runMaskingTest } from './masking-test';
import { runLoggingTest } from './logging-test';
import { runCachingTest } from './caching-test';
import type { TestResults, TestType } from '../types';

export async function handleRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = (searchParams.get('test') || 'all') as TestType;
    const email = searchParams.get('email') || undefined;
    const domain = searchParams.get('domain') || undefined;

    const results: TestResults = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Run requested tests
    if (testType === 'all' || testType === 'schema') {
      results.tests.schema = await runSchemaTest();
    }

    if (testType === 'all' || testType === 'verification') {
      results.tests.verification = await runVerificationTest(email);
    }

    if (testType === 'all' || testType === 'customer') {
      const { search, orders } = await runCustomerTest(email, domain);
      results.tests.customerSearch = search;
      results.tests.customerOrders = orders;
    }

    if (testType === 'all' || testType === 'masking') {
      results.tests.masking = await runMaskingTest();
    }

    if (testType === 'all' || testType === 'logging') {
      results.tests.logging = await runLoggingTest(email);
    }

    if (testType === 'all' || testType === 'caching') {
      results.tests.caching = await runCachingTest(email);
    }

    // Calculate summary
    const allTests = Object.values(results.tests);
    const successCount = allTests.filter((t) => t.success).length;

    results.summary = {
      totalTests: allTests.length,
      passed: successCount,
      failed: allTests.length - successCount,
      success: successCount === allTests.length,
    };

    return NextResponse.json(results, {
      status: results.summary.success ? 200 : 207,
    });
  } catch (error: any) {
    console.error('Customer test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
