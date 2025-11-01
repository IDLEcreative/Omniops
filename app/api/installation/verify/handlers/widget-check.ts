/**
 * Widget page rendering check
 */

import type { VerificationResult } from '../types';

export async function checkWidgetPage(serverUrl: string, domain?: string): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    const widgetUrl = domain
      ? `${serverUrl}/embed?domain=${encodeURIComponent(domain)}`
      : `${serverUrl}/embed`;

    const response = await fetch(widgetUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        check: 'Widget Page',
        status: 'fail',
        message: `Widget page returned status ${response.status}`,
        duration: Date.now() - startTime,
      };
    }

    const html = await response.text();
    const hasApp = html.includes('<div') && html.includes('</div>');

    if (hasApp) {
      return {
        check: 'Widget Page',
        status: 'pass',
        message: 'Widget page renders successfully',
        duration: Date.now() - startTime,
      };
    }

    return {
      check: 'Widget Page',
      status: 'warning',
      message: 'Widget page accessible but may not render correctly',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      check: 'Widget Page',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Widget page not accessible',
      duration: Date.now() - startTime,
    };
  }
}
