/**
 * Chat API endpoint check
 */

import type { VerificationResult } from '../types';

export async function checkChatAPI(serverUrl: string, domain?: string): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'verification test',
        domain: domain || 'localhost',
        conversationId: `verify-${Date.now()}`,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return {
        check: 'Chat API',
        status: 'pass',
        message: 'Chat endpoint responding correctly',
        duration: Date.now() - startTime,
      };
    }

    const errorText = await response.text().catch(() => '');
    return {
      check: 'Chat API',
      status: 'warning',
      message: `Chat API returned status ${response.status}`,
      duration: Date.now() - startTime,
      details: { error: errorText.substring(0, 200) },
    };
  } catch (error) {
    return {
      check: 'Chat API',
      status: 'warning',
      message: error instanceof Error ? error.message : 'Chat API may have issues',
      duration: Date.now() - startTime,
    };
  }
}
