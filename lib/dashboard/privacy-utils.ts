/**
 * Privacy dashboard utility functions
 */

/**
 * Converts a date string to ISO format with proper time boundaries
 * @param value - Date string to convert
 * @param mode - Whether to use start of day (00:00:00) or end of day (23:59:59)
 * @returns ISO date string or null if invalid
 */
export function toDateISOString(value: string, mode: 'start' | 'end'): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (mode === 'start') {
    date.setUTCHours(0, 0, 0, 0);
  } else {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

/**
 * Downloads a blob as a file
 * @param blob - Blob to download
 * @param filename - Name for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}
