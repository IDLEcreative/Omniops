/**
 * Embed script availability check
 */

import type { VerificationResult } from '../types';

export async function checkEmbedScript(serverUrl: string): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${serverUrl}/embed.js`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        check: 'Embed Script',
        status: 'fail',
        message: `Embed script returned status ${response.status}`,
        duration: Date.now() - startTime,
      };
    }

    const content = await response.text();
    const hasVersion = content.includes('WIDGET_VERSION');
    const hasConfig = content.includes('ChatWidgetConfig');

    if (hasVersion && hasConfig) {
      return {
        check: 'Embed Script',
        status: 'pass',
        message: 'Embed script is accessible and valid',
        duration: Date.now() - startTime,
        details: {
          size: content.length,
          hasVersion,
          hasConfig,
        },
      };
    }

    return {
      check: 'Embed Script',
      status: 'warning',
      message: 'Embed script accessible but may be incomplete',
      duration: Date.now() - startTime,
      details: { hasVersion, hasConfig },
    };
  } catch (error) {
    return {
      check: 'Embed Script',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Embed script not accessible',
      duration: Date.now() - startTime,
    };
  }
}
