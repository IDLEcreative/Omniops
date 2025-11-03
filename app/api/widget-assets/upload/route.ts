/**
 * Widget Asset Upload API
 *
 * Handles uploading of widget customization assets (logos, minimized icons)
 * to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'
import crypto from 'crypto'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Maximum file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024

// Optimized dimensions for widget icons (128x128 = 64x64 @2x for retina)
const ICON_SIZE = 128

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon'
]

const uploadSchema = z.object({
  type: z.enum(['logo', 'minimized-icon']),
  organizationId: z.string().uuid().optional(),
  customerConfigId: z.string().uuid()
})

/**
 * Process and optimize image for widget use
 * - Resizes to 128x128 (64x64 @2x for retina displays)
 * - Generates both WebP (modern) and PNG (fallback) versions
 * - Preserves transparency
 * - Optimizes file size
 */
async function processImage(buffer: Buffer, mimeType: string): Promise<{
  webp: Buffer
  png: Buffer
  error?: string
}> {
  try {
    // Handle SVG files specially - don't resize, just pass through
    if (mimeType === 'image/svg+xml') {
      // Return original SVG as-is (no WebP conversion for SVG)
      return { webp: buffer, png: buffer }
    }

    // Create sharp instance with the input buffer
    const image = sharp(buffer)

    // Resize to optimal dimensions with transparency preservation
    const resizeOptions: sharp.ResizeOptions = {
      width: ICON_SIZE,
      height: ICON_SIZE,
      fit: 'contain', // Maintain aspect ratio, don't crop
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
    }

    // Generate WebP version (modern browsers, better compression)
    const webpBuffer = await image
      .clone()
      .resize(resizeOptions)
      .webp({
        quality: 90, // High quality
        alphaQuality: 100, // Preserve transparency quality
        effort: 6 // Good balance of size vs speed
      })
      .toBuffer()

    // Generate PNG version (universal fallback, lossless)
    const pngBuffer = await image
      .clone()
      .resize(resizeOptions)
      .png({
        compressionLevel: 9, // Maximum compression
        adaptiveFiltering: true,
        palette: false // Keep as RGBA for quality
      })
      .toBuffer()

    return { webp: webpBuffer, png: pngBuffer }
  } catch (error) {
    console.error('[Image Processing] Error:', error)
    return {
      webp: buffer,
      png: buffer,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string
    const customerConfigId = formData.get('customerConfigId') as string
    const organizationId = formData.get('organizationId') as string | null

    // Validate input
    const validationResult = uploadSchema.safeParse({
      type,
      customerConfigId,
      organizationId
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 2MB limit' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Storage service unavailable' },
        { status: 503 }
      )
    }

    // Get customer config to determine organization
    const { data: configData, error: configError } = await supabase
      .from('customer_configs')
      .select('id, organization_id, domain')
      .eq('id', customerConfigId)
      .single()

    if (configError || !configData) {
      return NextResponse.json(
        { success: false, error: 'Customer configuration not found' },
        { status: 404 }
      )
    }

    // Use organization ID from config if not provided
    const orgId = organizationId || configData.organization_id || customerConfigId

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process image to generate optimized versions
    const processedImages = await processImage(buffer, file.type)

    // Check if processing had errors (will still have buffers for fallback)
    if (processedImages.error) {
      console.warn('[Widget Asset Upload] Image processing warning:', processedImages.error)
    }

    // Generate unique filename base with timestamp and random string
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const baseFileName = `${type}-${timestamp}-${randomString}`

    // Construct base path: organizations/{orgId}/widgets/
    const basePath = `organizations/${orgId}/widgets/`

    // Upload both WebP and PNG versions
    const webpFileName = `${baseFileName}.webp`
    const pngFileName = `${baseFileName}.png`
    const webpPath = `${basePath}${webpFileName}`
    const pngPath = `${basePath}${pngFileName}`

    // Upload WebP version
    const { data: webpUploadData, error: webpUploadError } = await supabase.storage
      .from('widget-assets')
      .upload(webpPath, processedImages.webp, {
        contentType: 'image/webp',
        upsert: false
      })

    if (webpUploadError) {
      console.error('[Widget Asset Upload] WebP storage error:', webpUploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload WebP image' },
        { status: 500 }
      )
    }

    // Upload PNG version (fallback)
    const { data: pngUploadData, error: pngUploadError } = await supabase.storage
      .from('widget-assets')
      .upload(pngPath, processedImages.png, {
        contentType: 'image/png',
        upsert: false
      })

    if (pngUploadError) {
      console.error('[Widget Asset Upload] PNG storage error:', pngUploadError)
      // Clean up WebP if PNG fails
      await supabase.storage.from('widget-assets').remove([webpPath])
      return NextResponse.json(
        { success: false, error: 'Failed to upload PNG fallback image' },
        { status: 500 }
      )
    }

    // Get public URLs for both versions
    const { data: { publicUrl: webpUrl } } = supabase.storage
      .from('widget-assets')
      .getPublicUrl(webpPath)

    const { data: { publicUrl: pngUrl } } = supabase.storage
      .from('widget-assets')
      .getPublicUrl(pngPath)

    return NextResponse.json({
      success: true,
      data: {
        webpUrl,
        pngUrl,
        webpPath,
        pngPath,
        type: validationResult.data.type,
        baseFileName,
        originalSize: file.size,
        optimizedSize: {
          webp: processedImages.webp.length,
          png: processedImages.png.length
        },
        dimensions: {
          width: ICON_SIZE,
          height: ICON_SIZE
        },
        mimeType: file.type
      }
    })

  } catch (error) {
    console.error('[Widget Asset Upload] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove uploaded assets
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      )
    }

    const supabase = await createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Storage service unavailable' },
        { status: 503 }
      )
    }

    // Delete the file from storage
    const { error } = await supabase.storage
      .from('widget-assets')
      .remove([path])

    if (error) {
      console.error('[Widget Asset Delete] Storage error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('[Widget Asset Delete] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}