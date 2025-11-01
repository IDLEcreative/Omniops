/**
 * Types for Browser Context Pool
 */

import { BrowserContext, Page } from 'playwright';

export interface ContextPoolConfig {
  maxContexts: number;
  maxPagesPerContext: number;
  contextTimeout: number; // in milliseconds
  reuseContexts: boolean;
  stealth: boolean;
}

export interface ContextInfo {
  context: BrowserContext;
  pages: Page[];
  createdAt: number;
  lastUsed: number;
  domain?: string;
}
