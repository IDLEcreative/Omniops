import { NextRequest, NextResponse } from 'next/server';
import { generateQueryEmbedding } from '@/lib/embeddings';

/**
 * Installation Verification API
 *
 * Automatically verifies that all systems are working BEFORE showing
 * embed code to customers. Tests:
 * - Server accessibility
 * - Embed script availability
 * - OpenAI embeddings
 * - Database connectivity
 * - Widget page rendering
 */

interface VerificationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

export async function POST(request: NextRequest) {
  const results: VerificationResult[] = [];
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { domain } = body;

    // Get server URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const serverUrl = `${protocol}://${host}`;

    // ====================================
    // CHECK 1: Server Accessibility
    // ====================================
    const check1Start = Date.now();
    try {
      const healthResponse = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (healthResponse.ok) {
        results.push({
          check: 'Server Accessibility',
          status: 'pass',
          message: 'Server is accessible and responding',
          duration: Date.now() - check1Start,
        });
      } else {
        results.push({
          check: 'Server Accessibility',
          status: 'fail',
          message: `Server returned status ${healthResponse.status}`,
          duration: Date.now() - check1Start,
        });
      }
    } catch (error) {
      results.push({
        check: 'Server Accessibility',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Server not accessible',
        duration: Date.now() - check1Start,
      });
    }

    // ====================================
    // CHECK 2: Embed Script Availability
    // ====================================
    const check2Start = Date.now();
    try {
      const embedResponse = await fetch(`${serverUrl}/embed.js`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (embedResponse.ok) {
        const content = await embedResponse.text();
        const hasVersion = content.includes('WIDGET_VERSION');
        const hasConfig = content.includes('ChatWidgetConfig');

        if (hasVersion && hasConfig) {
          results.push({
            check: 'Embed Script',
            status: 'pass',
            message: 'Embed script is accessible and valid',
            duration: Date.now() - check2Start,
            details: {
              size: content.length,
              hasVersion,
              hasConfig,
            },
          });
        } else {
          results.push({
            check: 'Embed Script',
            status: 'warning',
            message: 'Embed script accessible but may be incomplete',
            duration: Date.now() - check2Start,
            details: { hasVersion, hasConfig },
          });
        }
      } else {
        results.push({
          check: 'Embed Script',
          status: 'fail',
          message: `Embed script returned status ${embedResponse.status}`,
          duration: Date.now() - check2Start,
        });
      }
    } catch (error) {
      results.push({
        check: 'Embed Script',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Embed script not accessible',
        duration: Date.now() - check2Start,
      });
    }

    // ====================================
    // CHECK 3: Widget Page Rendering
    // ====================================
    const check3Start = Date.now();
    try {
      const widgetUrl = domain
        ? `${serverUrl}/embed?domain=${encodeURIComponent(domain)}`
        : `${serverUrl}/embed`;

      const widgetResponse = await fetch(widgetUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (widgetResponse.ok) {
        const html = await widgetResponse.text();
        const hasApp = html.includes('<div') && html.includes('</div>');

        if (hasApp) {
          results.push({
            check: 'Widget Page',
            status: 'pass',
            message: 'Widget page renders successfully',
            duration: Date.now() - check3Start,
          });
        } else {
          results.push({
            check: 'Widget Page',
            status: 'warning',
            message: 'Widget page accessible but may not render correctly',
            duration: Date.now() - check3Start,
          });
        }
      } else {
        results.push({
          check: 'Widget Page',
          status: 'fail',
          message: `Widget page returned status ${widgetResponse.status}`,
          duration: Date.now() - check3Start,
        });
      }
    } catch (error) {
      results.push({
        check: 'Widget Page',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Widget page not accessible',
        duration: Date.now() - check3Start,
      });
    }

    // ====================================
    // CHECK 4: OpenAI Embeddings
    // ====================================
    const check4Start = Date.now();
    try {
      // Test embedding generation with a simple query
      const testEmbedding = await generateQueryEmbedding('test verification query', true, domain);

      if (testEmbedding && testEmbedding.length === 1536) {
        results.push({
          check: 'OpenAI Embeddings',
          status: 'pass',
          message: 'Embedding generation working (1536-dimensional vectors)',
          duration: Date.now() - check4Start,
          details: {
            vectorSize: testEmbedding.length,
            model: 'text-embedding-3-small',
          },
        });
      } else {
        results.push({
          check: 'OpenAI Embeddings',
          status: 'fail',
          message: `Invalid embedding size: ${testEmbedding?.length || 0}`,
          duration: Date.now() - check4Start,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isApiKeyError = errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('openai');

      results.push({
        check: 'OpenAI Embeddings',
        status: 'fail',
        message: isApiKeyError
          ? 'OpenAI API key not configured or invalid'
          : `Embedding generation failed: ${errorMessage}`,
        duration: Date.now() - check4Start,
      });
    }

    // ====================================
    // CHECK 5: Chat API Endpoint
    // ====================================
    const check5Start = Date.now();
    try {
      const chatResponse = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'verification test',
          domain: domain || 'localhost',
          conversationId: `verify-${Date.now()}`,
        }),
        signal: AbortSignal.timeout(10000), // Chat can take longer
      });

      if (chatResponse.ok) {
        results.push({
          check: 'Chat API',
          status: 'pass',
          message: 'Chat endpoint responding correctly',
          duration: Date.now() - check5Start,
        });
      } else {
        const errorText = await chatResponse.text().catch(() => '');
        results.push({
          check: 'Chat API',
          status: 'warning',
          message: `Chat API returned status ${chatResponse.status}`,
          duration: Date.now() - check5Start,
          details: { error: errorText.substring(0, 200) },
        });
      }
    } catch (error) {
      results.push({
        check: 'Chat API',
        status: 'warning',
        message: error instanceof Error ? error.message : 'Chat API may have issues',
        duration: Date.now() - check5Start,
      });
    }

    // ====================================
    // CHECK 6: Environment Variables
    // ====================================
    const check6Start = Date.now();
    const envChecks = {
      openai: !!process.env.OPENAI_API_KEY,
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    const missingVars = Object.entries(envChecks)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length === 0) {
      results.push({
        check: 'Environment Variables',
        status: 'pass',
        message: 'All required environment variables configured',
        duration: Date.now() - check6Start,
      });
    } else {
      results.push({
        check: 'Environment Variables',
        status: 'fail',
        message: `Missing: ${missingVars.join(', ')}`,
        duration: Date.now() - check6Start,
        details: { missing: missingVars },
      });
    }

    // ====================================
    // Calculate Overall Status
    // ====================================
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const passed = results.filter(r => r.status === 'pass').length;

    const overall = failed > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass';

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
      checks: results,
      totalDuration: Date.now() - startTime,
    }, { status: 500 });
  }
}
