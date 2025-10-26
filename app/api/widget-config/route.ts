/**
 * Widget Configuration API
 *
 * Manages chat widget configurations for customers
 * Supports multi-tenant, brand-agnostic customization
 */

import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { handleGet, handlePost, handlePut, handleDelete } from './handlers'

/**
 * GET /api/widget-config
 * Retrieve widget configuration for a customer
 *
 * Query Parameters:
 * - customerConfigId: UUID of customer configuration (optional)
 * - includeHistory: Include configuration history (boolean, default: false)
 * - includeVariants: Include A/B test variants (boolean, default: false)
 */
export async function GET(request: NextRequest) {
  return handleGet(request)
}

/**
 * POST /api/widget-config
 * Create new widget configuration
 *
 * Request Body: CreateWidgetConfigSchema
 * - customerConfigId: UUID (required)
 * - themeSettings: Theme customization (optional)
 * - positionSettings: Widget positioning (optional)
 * - aiSettings: AI behavior configuration (optional)
 * - behaviorSettings: Widget behavior (optional)
 * - integrationSettings: External integrations (optional)
 * - analyticsSettings: Analytics preferences (optional)
 * - advancedSettings: Advanced options (optional)
 * - brandingSettings: Branding customization (optional)
 */
export async function POST(request: NextRequest) {
  return handlePost(request)
}

/**
 * PUT /api/widget-config
 * Update existing widget configuration
 *
 * Query Parameters:
 * - id: Configuration ID (required)
 *
 * Request Body: UpdateWidgetConfigSchema (partial)
 * All fields are optional and will be merged with existing configuration
 */
export async function PUT(request: NextRequest) {
  return handlePut(request)
}

/**
 * DELETE /api/widget-config
 * Soft delete widget configuration (sets is_active to false)
 *
 * Query Parameters:
 * - id: Configuration ID (required)
 */
export async function DELETE(request: NextRequest) {
  return handleDelete(request)
}
