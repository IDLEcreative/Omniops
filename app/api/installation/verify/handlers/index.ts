/**
 * Installation verification orchestration
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkServerAccessibility } from './server-check';
import { checkEmbedScript } from './embed-check';
import { checkWidgetPage } from './widget-check';
import { checkOpenAIEmbeddings } from './openai-check';
import { checkChatAPI } from './chat-check';
import { checkEnvironmentVariables } from './env-check';
import type { VerificationResult, VerificationResponse } from '../types';

export async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const results: VerificationResult[] = [];

  try {
    const body = await request.json();
    const { domain } = body;

    // Get server URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const serverUrl = `${protocol}://${host}`;

    // Run all checks in sequence
    results.push(await checkServerAccessibility(serverUrl));
    results.push(await checkEmbedScript(serverUrl));
    results.push(await checkWidgetPage(serverUrl, domain));
    results.push(await checkOpenAIEmbeddings(domain));
    results.push(await checkChatAPI(serverUrl, domain));
    results.push(await checkEnvironmentVariables());

    // Calculate summary
    const failed = results.filter((r) => r.status === 'fail').length;
    const warnings = results.filter((r) => r.status === 'warning').length;
    const passed = results.filter((r) => r.status === 'pass').length;
    const overall = failed > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass';

    const response: VerificationResponse = {
      success: true,
      status: overall,
      serverUrl,
      domain,
      summary: {
        total: results.length,
        passed,
        warnings,
        failed,
      },
      checks: results,
      totalDuration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Verification error:', error);

    const response: VerificationResponse = {
      success: false,
      status: 'fail',
      serverUrl: '',
      summary: { total: 0, passed: 0, warnings: 0, failed: 0 },
      checks: results,
      totalDuration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Verification failed',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
