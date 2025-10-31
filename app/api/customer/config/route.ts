/**
 * Customer Configuration API Routes
 *
 * Handles customer website configuration including:
 * - Adding/updating website URLs
 * - Validating domains
 * - Automatically triggering scraping
 * - Managing customer scraping settings
 */

import { NextRequest } from 'next/server'
import { handleGet } from './get-handler'
import { handlePost } from './create-handler'
import { handlePut } from './update-handler'
import { handleDelete } from './delete-handler'
import { withCSRF } from '@/lib/middleware/csrf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/customer/config
 * Get customer configurations (optionally filtered by customer ID or domain)
 *
 * Query Parameters:
 * - customerId: Filter by customer ID
 * - domain: Filter by domain
 * - includeStatus: Include scraping status (default: false)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  return handleGet(request)
}

/**
 * POST /api/customer/config
 * Create a new customer configuration and trigger automatic scraping
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 *
 * Request Body:
 * {
 *   domain: string (required)
 *   customerId?: string
 *   settings?: {
 *     autoScrape?: boolean (default: true)
 *     scrapingFrequency?: 'daily' | 'weekly' | 'monthly' (default: 'weekly')
 *     priority?: 'high' | 'normal' | 'low' (default: 'normal')
 *     maxPages?: number (default: 50, max: 100000)
 *     includeSubdomains?: boolean (default: false)
 *   }
 *   metadata?: Record<string, any>
 * }
 */
export const POST = withCSRF(handlePost)

/**
 * PUT /api/customer/config?id={configId}
 * Update an existing customer configuration
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 *
 * Query Parameters:
 * - id: Configuration ID (required)
 *
 * Request Body:
 * {
 *   domain?: string
 *   settings?: {
 *     autoScrape?: boolean
 *     scrapingFrequency?: 'daily' | 'weekly' | 'monthly'
 *     priority?: 'high' | 'normal' | 'low'
 *     maxPages?: number
 *     includeSubdomains?: boolean
 *   }
 *   metadata?: Record<string, any>
 * }
 */
export const PUT = withCSRF(handlePut)

/**
 * DELETE /api/customer/config?id={configId}
 * Delete a customer configuration and cancel any pending scraping
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 *
 * Query Parameters:
 * - id: Configuration ID (required)
 */
export const DELETE = withCSRF(handleDelete)
