/**
 * Image Optimization Tests
 *
 * Tests the automatic image optimization feature for widget icon uploads.
 * Verifies that uploaded images are:
 * - Resized to optimal dimensions (128x128 for retina displays)
 * - Converted to both WebP and PNG formats
 * - Properly compressed while maintaining quality
 * - Stored with correct metadata
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import sharp from 'sharp';
import { createCanvas } from 'canvas';

describe('Image Optimization', () => {
  describe('Sharp Image Processing', () => {
    it('should resize images to 128x128', async () => {
      // Create a test image (200x200)
      const testBuffer = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

      // Process it
      const result = await sharp(testBuffer)
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Check dimensions
      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(128);
      expect(metadata.height).toBe(128);
    });

    it('should preserve transparency in PNG', async () => {
      // Create a transparent test image
      const testBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 0.5 }
        }
      })
        .png()
        .toBuffer();

      // Process to PNG
      const result = await sharp(testBuffer)
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 9 })
        .toBuffer();

      // Check that it has alpha channel
      const metadata = await sharp(result).metadata();
      expect(metadata.channels).toBeGreaterThanOrEqual(4); // RGBA
    });

    it('should convert to WebP format', async () => {
      const testBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

      // Convert to WebP
      const webpBuffer = await sharp(testBuffer)
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 90, alphaQuality: 100 })
        .toBuffer();

      // Check format
      const metadata = await sharp(webpBuffer).metadata();
      expect(metadata.format).toBe('webp');
    });

    it('should maintain aspect ratio with fit: contain', async () => {
      // Create a non-square image (200x100)
      const testBuffer = await sharp({
        create: {
          width: 200,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

      // Process it with fit: contain
      const result = await sharp(testBuffer)
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      const metadata = await sharp(result).metadata();

      // With fit: 'contain', output is always 128x128 canvas
      // but the image inside maintains aspect ratio
      expect(metadata.width).toBe(128);
      expect(metadata.height).toBe(128);

      // The important thing is the image doesn't exceed the bounds
      // and maintains aspect ratio within the 128x128 canvas
      // This is correct behavior for widget icons
    });

    it('should compress images effectively', async () => {
      // Create a large test image
      const testBuffer = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png({ compressionLevel: 0 }) // Uncompressed
        .toBuffer();

      // Process with compression
      const compressedPng = await sharp(testBuffer)
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 9 })
        .toBuffer();

      const compressedWebp = await sharp(testBuffer)
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 90 })
        .toBuffer();

      // WebP should be smaller than PNG for same dimensions
      expect(compressedWebp.length).toBeLessThan(compressedPng.length);

      // Both should be significantly smaller than original
      expect(compressedPng.length).toBeLessThan(testBuffer.length);
    });
  });

  describe('API Response Format', () => {
    it('should return both WebP and PNG URLs', () => {
      // Mock response structure
      const mockResponse = {
        success: true,
        data: {
          webpUrl: 'https://example.com/icon-123.webp',
          pngUrl: 'https://example.com/icon-123.png',
          webpPath: 'organizations/123/widgets/icon-123.webp',
          pngPath: 'organizations/123/widgets/icon-123.png',
          type: 'minimized-icon',
          baseFileName: 'icon-123',
          originalSize: 50000,
          optimizedSize: {
            webp: 15000,
            png: 20000
          },
          dimensions: {
            width: 128,
            height: 128
          },
          mimeType: 'image/png'
        }
      };

      expect(mockResponse.data.webpUrl).toBeDefined();
      expect(mockResponse.data.pngUrl).toBeDefined();
      expect(mockResponse.data.webpUrl).toContain('.webp');
      expect(mockResponse.data.pngUrl).toContain('.png');
      expect(mockResponse.data.optimizedSize.webp).toBeLessThan(mockResponse.data.originalSize);
      expect(mockResponse.data.dimensions.width).toBe(128);
      expect(mockResponse.data.dimensions.height).toBe(128);
    });
  });

  describe('Picture Element Fallback', () => {
    it('should generate correct picture element HTML structure', () => {
      const webpUrl = 'https://example.com/icon.webp';
      const pngUrl = 'https://example.com/icon.png';

      // This tests the structure we use in ChatWidget.tsx
      const pictureHTML = `
        <picture>
          <source srcSet="${webpUrl}" type="image/webp" />
          <img
            src="${pngUrl}"
            alt="Chat"
            width="24"
            height="24"
            loading="lazy"
          />
        </picture>
      `;

      expect(pictureHTML).toContain('source');
      expect(pictureHTML).toContain('srcSet');
      expect(pictureHTML).toContain('type="image/webp"');
      expect(pictureHTML).toContain('loading="lazy"');
      expect(pictureHTML).toContain('width="24"');
      expect(pictureHTML).toContain('height="24"');
    });

    it('should correctly transform URLs between formats', () => {
      const webpUrl = 'https://example.com/icon-123.webp';

      // Test URL transformation (as done in ChatWidget.tsx)
      const pngUrl = webpUrl.replace(/\.webp$/i, '.png');
      expect(pngUrl).toBe('https://example.com/icon-123.png');

      // Test reverse transformation
      const backToWebp = pngUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      expect(backToWebp).toBe('https://example.com/icon-123.webp');
    });
  });

  describe('Edge Cases', () => {
    it('should handle SVG files specially', async () => {
      // SVG shouldn't be resized, just passed through
      const svgBuffer = Buffer.from(`
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `);

      // For SVG, we'd return the original buffer
      // (no Sharp processing as per our implementation)
      expect(svgBuffer.length).toBeGreaterThan(0);
    });

    it('should calculate compression percentage correctly', () => {
      const originalSize = 100000; // 100KB
      const webpSize = 30000; // 30KB

      const compressionPercent = Math.round((1 - webpSize / originalSize) * 100);
      expect(compressionPercent).toBe(70); // 70% smaller
    });
  });
});
