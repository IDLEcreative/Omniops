/**
 * Image Processing Service for Widget Assets
 *
 * Handles image optimization and format conversion for widget customization
 */

import sharp from 'sharp';

// Optimized dimensions for widget icons (128x128 = 64x64 @2x for retina)
const ICON_SIZE = 128;

export interface ProcessedImage {
  webp: Buffer;
  png: Buffer;
  error?: string;
}

export class ImageProcessor {
  /**
   * Process and optimize image for widget use
   * - Resizes to 128x128 (64x64 @2x for retina displays)
   * - Generates both WebP (modern) and PNG (fallback) versions
   * - Preserves transparency
   * - Optimizes file size
   */
  static async processImage(
    buffer: Buffer,
    mimeType: string
  ): Promise<ProcessedImage> {
    try {
      // Handle SVG files specially - don't resize, just pass through
      if (mimeType === 'image/svg+xml') {
        return { webp: buffer, png: buffer };
      }

      const image = sharp(buffer);

      const resizeOptions: sharp.ResizeOptions = {
        width: ICON_SIZE,
        height: ICON_SIZE,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      };

      // Generate WebP version (modern browsers, better compression)
      const webpBuffer = await image
        .clone()
        .resize(resizeOptions)
        .webp({
          quality: 90,
          alphaQuality: 100,
          effort: 6,
        })
        .toBuffer();

      // Generate PNG version (universal fallback, lossless)
      const pngBuffer = await image
        .clone()
        .resize(resizeOptions)
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: false,
        })
        .toBuffer();

      return { webp: webpBuffer, png: pngBuffer };
    } catch (error) {
      console.error('[ImageProcessor] Error:', error);
      return {
        webp: buffer,
        png: buffer,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static getIconSize(): number {
    return ICON_SIZE;
  }
}
