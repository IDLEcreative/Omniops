/**
 * Public Widget Configuration API
 *
 * Returns public-safe configuration for the chat widget.
 * NO authentication required - this is a public endpoint.
 * NO credentials exposed - only feature flags and branding.
 */

import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import {
  validateQueryParams,
  isEmptyQuery,
  loadCompleteConfig,
  transformConfig,
  buildSuccessResponse,
  buildDefaultConfigResponse,
  buildConfigNotFoundResponse,
  buildValidationErrorResponse,
  buildInternalErrorResponse,
  buildOptionsResponse,
  extractDomainFromReferer,
  applyDomainAlias,
} from '@/lib/widget-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return buildOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    // Parse and validate parameters
    const { searchParams } = new URL(request.url);
    let domain = searchParams.get('domain') || '';
    const appId = searchParams.get('id') || '';

    // Extract domain from referer if needed
    domain = extractDomainFromReferer(request, domain);

    // Apply domain alias if configured (TEMPORARY WORKAROUND)
    domain = applyDomainAlias(domain);

    // Validate query parameters
    const validatedQuery = validateQueryParams({ domain, id: appId });

    // Return default config if no domain or app_id provided
    if (isEmptyQuery(validatedQuery)) {
      console.log('[Widget Config API] No domain provided, returning default config');
      return buildDefaultConfigResponse();
    }

    // Create Supabase client
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    // Load complete configuration
    const { customerConfig, widgetConfig } = await loadCompleteConfig(supabase, {
      domain: validatedQuery.domain,
      appId: validatedQuery.id,
    });

    // Return minimal config if customer config not found
    if (!customerConfig) {
      console.error('[Widget Config API] Config not found for domain:', validatedQuery.domain);
      return buildConfigNotFoundResponse(validatedQuery.domain || '');
    }

    // Transform and return configuration
    const transformedConfig = transformConfig(customerConfig, widgetConfig);
    return buildSuccessResponse(transformedConfig);

  } catch (error) {
    console.error('[Widget Config API] Error:', error);

    if (error instanceof z.ZodError) {
      return buildValidationErrorResponse(error);
    }

    return buildInternalErrorResponse();
  }
}
