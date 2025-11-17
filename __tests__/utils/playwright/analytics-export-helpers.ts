import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Navigate to analytics dashboard
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard/analytics', {
    waitUntil: 'networkidle',
    timeout: 15000
  });
  
  await page.waitForSelector('h1:has-text("Analytics Dashboard")', {
    state: 'visible',
    timeout: 10000
  });
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): string[][] {
  return content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
}

/**
 * Download file and return path
 */
export async function downloadFile(page: Page, downloadPromise: Promise<any>): Promise<string> {
  const download = await downloadPromise;
  const filePath = path.join(__dirname, '../../..', 'test-results', 'downloads', download.suggestedFilename());
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  await download.saveAs(filePath);
  return filePath;
}

/**
 * Clean up downloaded file
 */
export function cleanupFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
