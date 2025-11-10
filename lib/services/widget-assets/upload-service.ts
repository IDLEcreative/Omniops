/**
 * Widget Asset Upload Service
 *
 * Handles storage operations for widget customization assets
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { ImageProcessor } from './image-processor';

export interface UploadResult {
  success: boolean;
  data?: {
    webpUrl: string;
    pngUrl: string;
    webpPath: string;
    pngPath: string;
    type: string;
    baseFileName: string;
    originalSize: number;
    optimizedSize: {
      webp: number;
      png: number;
    };
    dimensions: {
      width: number;
      height: number;
    };
    mimeType: string;
  };
  error?: string;
}

export class WidgetAssetUploadService {
  /**
   * Upload widget asset (logo or minimized icon) to Supabase Storage
   */
  static async uploadAsset(params: {
    file: File;
    type: string;
    customerConfigId: string;
    organizationId?: string | null;
  }): Promise<UploadResult> {
    const { file, type, customerConfigId, organizationId } = params;

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return { success: false, error: 'Storage service unavailable' };
    }

    // Get customer config to determine organization
    const { data: configData, error: configError } = await supabase
      .from('customer_configs')
      .select('id, organization_id, domain')
      .eq('id', customerConfigId)
      .single();

    if (configError || !configData) {
      return { success: false, error: 'Customer configuration not found' };
    }

    // Use organization ID from config if not provided
    const orgId = organizationId || configData.organization_id || customerConfigId;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image to generate optimized versions
    const processedImages = await ImageProcessor.processImage(buffer, file.type);

    if (processedImages.error) {
      console.warn('[WidgetAssetUpload] Image processing warning:', processedImages.error);
    }

    // Generate unique filename base
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const baseFileName = `${type}-${timestamp}-${randomString}`;

    // Construct paths
    const basePath = `organizations/${orgId}/widgets/`;
    const webpFileName = `${baseFileName}.webp`;
    const pngFileName = `${baseFileName}.png`;
    const webpPath = `${basePath}${webpFileName}`;
    const pngPath = `${basePath}${pngFileName}`;

    // Upload WebP version
    const { error: webpUploadError } = await supabase.storage
      .from('widget-assets')
      .upload(webpPath, processedImages.webp, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (webpUploadError) {
      console.error('[WidgetAssetUpload] WebP storage error:', webpUploadError);
      return { success: false, error: 'Failed to upload WebP image' };
    }

    // Upload PNG version (fallback)
    const { error: pngUploadError } = await supabase.storage
      .from('widget-assets')
      .upload(pngPath, processedImages.png, {
        contentType: 'image/png',
        upsert: false,
      });

    if (pngUploadError) {
      console.error('[WidgetAssetUpload] PNG storage error:', pngUploadError);
      // Clean up WebP if PNG fails
      await supabase.storage.from('widget-assets').remove([webpPath]);
      return { success: false, error: 'Failed to upload PNG fallback image' };
    }

    // Get public URLs
    const {
      data: { publicUrl: webpUrl },
    } = supabase.storage.from('widget-assets').getPublicUrl(webpPath);

    const {
      data: { publicUrl: pngUrl },
    } = supabase.storage.from('widget-assets').getPublicUrl(pngPath);

    return {
      success: true,
      data: {
        webpUrl,
        pngUrl,
        webpPath,
        pngPath,
        type,
        baseFileName,
        originalSize: file.size,
        optimizedSize: {
          webp: processedImages.webp.length,
          png: processedImages.png.length,
        },
        dimensions: {
          width: ImageProcessor.getIconSize(),
          height: ImageProcessor.getIconSize(),
        },
        mimeType: file.type,
      },
    };
  }

  /**
   * Delete widget asset from storage
   */
  static async deleteAsset(path: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return { success: false, error: 'Storage service unavailable' };
    }

    const { error } = await supabase.storage.from('widget-assets').remove([path]);

    if (error) {
      console.error('[WidgetAssetDelete] Storage error:', error);
      return { success: false, error: 'Failed to delete file' };
    }

    return { success: true };
  }
}
