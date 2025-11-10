/**
 * Validation for Widget Asset Uploads
 */

import { z } from 'zod';

// Maximum file size: 2MB
export const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
];

export const uploadSchema = z.object({
  type: z.enum(['logo', 'minimized-icon']),
  organizationId: z.string().uuid().optional(),
  customerConfigId: z.string().uuid(),
});

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 2MB limit' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images are allowed.' };
  }

  return { valid: true };
}
