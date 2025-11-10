/**
 * Widget Asset Upload API
 *
 * Handles uploading of widget customization assets (logos, minimized icons)
 * to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { uploadSchema, validateFile } from '@/lib/services/widget-assets/validation';
import { WidgetAssetUploadService } from '@/lib/services/widget-assets/upload-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;
    const customerConfigId = formData.get('customerConfigId') as string;
    const organizationId = formData.get('organizationId') as string | null;

    // Validate input
    const validationResult = uploadSchema.safeParse({
      type,
      customerConfigId,
      organizationId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, error: fileValidation.error },
        { status: 400 }
      );
    }

    // Upload using service
    const result = await WidgetAssetUploadService.uploadAsset({
      file,
      type: validationResult.data.type,
      customerConfigId: validationResult.data.customerConfigId,
      organizationId: validationResult.data.organizationId,
    });

    if (!result.success) {
      const statusCode = result.error === 'Storage service unavailable' ? 503 :
                         result.error === 'Customer configuration not found' ? 404 : 500;
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Widget Asset Upload] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove uploaded assets
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    const result = await WidgetAssetUploadService.deleteAsset(path);

    if (!result.success) {
      const statusCode = result.error === 'Storage service unavailable' ? 503 : 500;
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('[Widget Asset Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}