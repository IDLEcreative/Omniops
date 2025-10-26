/**
 * WooCommerce API Proxy Route
 *
 * Dynamic proxy for all WooCommerce REST API endpoints
 * Handles GET, POST, PUT, DELETE operations with authentication
 *
 * LOC: ~115 (within 300 LOC requirement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';
import {
  authenticateUser,
  parsePath,
  getSearchParams,
  routeGetRequest,
  routePostRequest,
  routePutRequest,
  routeDeleteRequest
} from '@/lib/api/woocommerce-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Handle GET requests - Retrieve WooCommerce resources
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Authenticate user
    const auth = await authenticateUser();
    if (!auth.success) return auth.error;

    // Parse request
    const resolvedParams = await params;
    const { path, pathParts } = parsePath(resolvedParams);
    const searchParams = getSearchParams(request);

    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route request to appropriate handler
    const result = await routeGetRequest(path, pathParts, searchParams, wc);

    if (result === null) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests - Create WooCommerce resources
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Authenticate user
    const auth = await authenticateUser();
    if (!auth.success) return auth.error;

    // Parse request
    const resolvedParams = await params;
    const { path, pathParts } = parsePath(resolvedParams);
    const body = await request.json();

    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route request to appropriate handler
    const result = await routePostRequest(path, pathParts, body, wc);

    if (result === null) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle PUT requests - Update WooCommerce resources
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Authenticate user
    const auth = await authenticateUser();
    if (!auth.success) return auth.error;

    // Parse request
    const resolvedParams = await params;
    const { path, pathParts } = parsePath(resolvedParams);
    const body = await request.json();

    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route request to appropriate handler
    const result = await routePutRequest(path, pathParts, body, wc);

    if (result === null) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle DELETE requests - Remove WooCommerce resources
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Authenticate user
    const auth = await authenticateUser();
    if (!auth.success) return auth.error;

    // Parse request
    const resolvedParams = await params;
    const { path, pathParts } = parsePath(resolvedParams);
    const searchParams = getSearchParams(request);
    const force = searchParams.force === 'true';

    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route request to appropriate handler
    const result = await routeDeleteRequest(path, pathParts, force, wc);

    if (result === null) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
