/**
 * Widget Configuration Response Builder
 *
 * Builds API responses with proper CORS headers.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { TransformedConfig } from './config-transformer';
import { getDefaultAppearance, getDefaultBehavior } from './defaults';

/**
 * Add CORS headers to response
 */
export function withCors<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Vary', 'Origin');
  return response;
}

/**
 * Build success response
 */
export function buildSuccessResponse(config: TransformedConfig): NextResponse {
  return withCors(NextResponse.json({
    success: true,
    config,
  }));
}

/**
 * Build default config response (no domain provided)
 */
export function buildDefaultConfigResponse(): NextResponse {
  const defaults = getDefaultBehavior();

  return withCors(NextResponse.json(
    {
      success: false,
      message: 'No domain provided - using default configuration',
      config: {
        domain: '',
        woocommerce_enabled: false,
        shopify_enabled: false,
        branding: null,
        appearance: getDefaultAppearance(),
        behavior: {
          welcomeMessage: defaults.welcomeMessage,
          placeholderText: defaults.placeholderText,
          botName: defaults.botName,
        },
      },
    },
    { status: 200 }
  ));
}

/**
 * Build config not found response
 */
export function buildConfigNotFoundResponse(domain: string): NextResponse {
  return withCors(NextResponse.json(
    {
      success: false,
      config: {
        domain,
        woocommerce_enabled: false,
        shopify_enabled: false,
        branding: null,
        appearance: getDefaultAppearance(),
      },
    },
    { status: 200 }
  ));
}

/**
 * Build validation error response
 */
export function buildValidationErrorResponse(error: z.ZodError): NextResponse {
  return withCors(NextResponse.json(
    {
      success: false,
      error: 'Invalid domain parameter',
      details: error.errors,
    },
    { status: 400 }
  ));
}

/**
 * Build internal error response
 */
export function buildInternalErrorResponse(): NextResponse {
  return withCors(NextResponse.json(
    {
      success: false,
      error: 'Failed to fetch widget configuration',
    },
    { status: 500 }
  ));
}

/**
 * Build OPTIONS response
 */
export function buildOptionsResponse(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}
