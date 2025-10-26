/**
 * Content Refresh Types
 * Type definitions and interfaces for content refresh system
 */

export interface RefreshConfig {
  domainId: string;
  domain: string;
  refreshInterval: number; // hours
  priority: 'high' | 'medium' | 'low';
  lastRefreshedAt?: Date;
}

export interface RefreshStats {
  refreshed: number;
  skipped: number;
  failed: number;
}

export interface RefreshOptions {
  forceRefresh?: boolean;
  maxPages?: number;
}

export interface PageRefreshResult {
  status: 'refreshed' | 'skipped' | 'failed';
  url: string;
  error?: unknown;
}

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  priority?: number;
}

export interface RefreshJob {
  domainId: string;
  domain: string;
  type: 'content_refresh';
  schedule: string;
  priority: 'high' | 'medium' | 'low';
  lastRun?: Date;
}

export interface DomainData {
  domain: string;
  settings: Record<string, unknown>;
}

export interface ExistingPage {
  url: string;
  scraped_at: string;
}

export interface WebsiteContent {
  id: string;
  content_hash: string;
}
