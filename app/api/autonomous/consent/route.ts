/**
 * POST /api/autonomous/consent
 *
 * Grant or revoke consent for autonomous operations
 *
 * Grant Consent Request:
 * {
 *   "action": "grant",
 *   "service": "woocommerce",
 *   "operation": "api_key_generation",
 *   "permissions": ["read_products", "create_api_keys"],
 *   "expiresAt": "2025-12-31T00:00:00Z" (optional)
 * }
 *
 * Revoke Consent Request:
 * {
 *   "action": "revoke",
 *   "service": "woocommerce",
 *   "operation": "api_key_generation"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { grantConsent, revokeConsent } from '@/lib/autonomous/security/consent-manager';
import { getOperationService } from '@/lib/autonomous/core/operation-service';
import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// Validation Schemas
// ============================================================================

const GrantConsentSchema = z.object({
  action: z.literal('grant'),
  service: z.string().min(1),
  operation: z.string().min(1),
  permissions: z.array(z.string()).min(1),
  expiresAt: z.string().optional(),
  operationId: z.string().uuid().optional() // If granting for existing operation
});

const RevokeConsentSchema = z.object({
  action: z.literal('revoke'),
  service: z.string().min(1),
  operation: z.string().min(1)
});

const ConsentRequestSchema = z.union([GrantConsentSchema, RevokeConsentSchema]);

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const validatedData = ConsentRequestSchema.parse(body);

    // Get authenticated user
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const organizationId = userData.organization_id;

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (validatedData.action === 'grant') {
      // Grant consent
      const consentRecord = await grantConsent(
        organizationId,
        user.id,
        {
          service: validatedData.service,
          operation: validatedData.operation,
          permissions: validatedData.permissions,
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
          ipAddress,
          userAgent
        }
      );

      // If operationId provided, update that operation
      if (validatedData.operationId) {
        const operationService = getOperationService();
        await operationService.grantConsent(validatedData.operationId);
        // TODO: Enqueue job in BullMQ
      }

      return NextResponse.json({
        success: true,
        message: 'Consent granted successfully',
        consent: {
          id: consentRecord.id,
          service: consentRecord.service,
          operation: consentRecord.operation,
          permissions: consentRecord.permissions,
          grantedAt: consentRecord.grantedAt,
          expiresAt: consentRecord.expiresAt
        }
      });

    } else {
      // Revoke consent
      await revokeConsent(
        organizationId,
        validatedData.service,
        validatedData.operation
      );

      return NextResponse.json({
        success: true,
        message: 'Consent revoked successfully'
      });
    }

  } catch (error) {
    console.error('[POST /api/autonomous/consent] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - List consents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all consents for customer
    const { data: consents, error: consentsError } = await supabase
      .from('autonomous_consent')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('granted_at', { ascending: false });

    if (consentsError) {
      throw consentsError;
    }

    return NextResponse.json({
      consents: consents || []
    });

  } catch (error) {
    console.error('[GET /api/autonomous/consent] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
