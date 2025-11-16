/**
 * Training utility functions and helpers
 */

import { getCSRFHeaders } from '@/lib/csrf-client';

export interface TrainingData {
  id: string;
  type: 'url' | 'file' | 'qa' | 'text';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: string;
  metadata?: any;
}

/**
 * Normalize URL by adding https:// if no protocol specified
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Create optimistic training data item
 */
export function createOptimisticItem(
  type: TrainingData['type'],
  content: string,
  metadata?: any
): TrainingData {
  return {
    id: `temp-${Date.now()}`,
    type,
    content: type === 'text' && content.length > 100
      ? content.substring(0, 100) + '...'
      : content,
    status: 'processing',
    createdAt: new Date().toISOString(),
    metadata
  };
}

/**
 * Format Q&A content for display
 */
export function formatQAContent(question: string, answer: string): string {
  return `Q: ${question}`;
}

/**
 * Update optimistic item with real data
 */
export function updateOptimisticItem(
  items: TrainingData[],
  tempId: string,
  realData: Partial<TrainingData>
): TrainingData[] {
  return items.map(item =>
    item.id === tempId
      ? { ...item, ...realData }
      : item
  );
}

/**
 * Remove optimistic item (used on error)
 */
export function removeOptimisticItem(
  items: TrainingData[],
  tempId: string
): TrainingData[] {
  return items.filter(item => item.id !== tempId);
}

/**
 * Fetch training data from API
 */
export async function fetchTrainingData(
  page: number = 1,
  limit: number = 20
): Promise<{
  items: TrainingData[];
  total: number;
  hasMore: boolean;
}> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await fetch(`/api/training?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch training data');
  }

  const data = await response.json();
  return {
    items: data.items || [],
    total: data.total || 0,
    hasMore: data.hasMore || false
  };
}

/**
 * Submit URL for scraping
 */
export async function submitUrl(url: string): Promise<{ id: string; status: string }> {
  const normalizedUrl = normalizeUrl(url);

  const headers = await getCSRFHeaders({ 'Content-Type': 'application/json' });

  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers,
    body: JSON.stringify({ url: normalizedUrl, crawl: true, max_pages: 1000 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || response.statusText || 'Unknown error');
  }

  return await response.json();
}

/**
 * Submit text content
 */
export async function submitText(content: string): Promise<{ data: TrainingData }> {
  const headers = await getCSRFHeaders({ 'Content-Type': 'application/json' });

  const response = await fetch('/api/training/text', {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit text content');
  }

  return await response.json();
}

/**
 * Submit Q&A pair
 */
export async function submitQA(
  question: string,
  answer: string
): Promise<{ data: TrainingData }> {
  const headers = await getCSRFHeaders({ 'Content-Type': 'application/json' });

  const response = await fetch('/api/training/qa', {
    method: 'POST',
    headers,
    body: JSON.stringify({ question, answer }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit Q&A pair');
  }

  return await response.json();
}

/**
 * Delete training data item
 */
export async function deleteTrainingData(id: string): Promise<void> {
  const headers = await getCSRFHeaders();

  const response = await fetch(`/api/training/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete training data');
  }
}
