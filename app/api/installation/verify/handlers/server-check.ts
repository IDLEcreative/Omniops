/**
 * Server accessibility check
 */

import type { VerificationResult } from '../types';

export async function checkServerAccessibility(serverUrl: string): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return {
        check: 'Server Accessibility',
        status: 'pass',
        message: 'Server is accessible and responding',
        duration: Date.now() - startTime,
      };
    }

    return {
      check: 'Server Accessibility',
      status: 'fail',
      message: `Server returned status ${response.status}`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      check: 'Server Accessibility',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Server not accessible',
      duration: Date.now() - startTime,
    };
  }
}
