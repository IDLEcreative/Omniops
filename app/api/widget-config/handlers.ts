/**
 * Widget Configuration Request Handlers
 *
 * HTTP request handlers for widget config API endpoints
 * Multi-tenant, brand-agnostic request processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, validateSupabaseEnv } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { CreateWidgetConfigSchema, UpdateWidgetConfigSchema } from './validators'
import {
  fetchWidgetConfig,
  checkExistingConfig,
  createWidgetConfig,
  fetchExistingConfig,
  mergeSettingsUpdates,
  updateWidgetConfig,
  deleteWidgetConfig,
} from './services'

/**
 * GET handler - Retrieve widget configuration
 */
export async function handleGet(request: NextRequest): Promise<NextResponse> {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerConfigId = searchParams.get('customerConfigId')
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const includeVariants = searchParams.get('includeVariants') === 'true'

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await fetchWidgetConfig(
      supabase,
      customerConfigId,
      includeHistory,
      includeVariants
    )

    return NextResponse.json({
      success: true,
      data: result,
    })

  } catch (error) {
    logger.error('GET /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Create new widget configuration
 */
export async function handlePost(request: NextRequest): Promise<NextResponse> {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const json = await request.json()
    const parsed = CreateWidgetConfigSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const exists = await checkExistingConfig(supabase, body.customerConfigId)
    if (exists) {
      return NextResponse.json(
        { error: 'Configuration already exists for this customer. Use PUT to update.' },
        { status: 409 }
      )
    }

    const config = await createWidgetConfig(supabase, body, user.id)

    return NextResponse.json({
      success: true,
      data: config,
    }, { status: 201 })

  } catch (error) {
    logger.error('POST /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT handler - Update existing widget configuration
 */
export async function handlePut(request: NextRequest): Promise<NextResponse> {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    const json = await request.json()
    const parsed = UpdateWidgetConfigSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const existing = await fetchExistingConfig(supabase, configId)
    const { updateData, changedFields } = mergeSettingsUpdates(existing, body, user.id)
    const updated = await updateWidgetConfig(
      supabase,
      configId,
      updateData,
      changedFields,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: updated,
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Configuration not found') {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    logger.error('PUT /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler - Soft delete widget configuration
 */
export async function handleDelete(request: NextRequest): Promise<NextResponse> {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await deleteWidgetConfig(supabase, configId, user.id)

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
    })

  } catch (error) {
    logger.error('DELETE /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
