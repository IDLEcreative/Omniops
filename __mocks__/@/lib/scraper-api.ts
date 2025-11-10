// Mock for @/lib/scraper-api
// This completely replaces the scraper-api module so the actual core code never runs
import { jest } from '@jest/globals'

// Export mock functions that will be configured by tests
// These are the ACTUAL mocks that will be called by the route handlers
export const scrapePage = jest.fn()
export const crawlWebsite = jest.fn()
export const checkCrawlStatus = jest.fn()
export const getHealthStatus = jest.fn()

// Mock other exports from the real module to prevent errors
export const createAIOptimizationConfig = jest.fn()
export const isAIOptimizedResult = jest.fn()
export const convertToStandardResult = jest.fn()
export const getOptimizationMetrics = jest.fn()
export const clearAIOptimizationCache = jest.fn()
export const applyAIOptimizationPreset = jest.fn()
export const getAIOptimizationMetrics = jest.fn()
export const resetAIOptimizationMetrics = jest.fn()
export const cleanupOldJobs = jest.fn()
export const streamCrawlResults = jest.fn()
export const resumeCrawl = jest.fn()
export const configureOwnedDomains = jest.fn()
export const isOwnedSite = jest.fn()

// Mock types (no-ops, just to satisfy imports)
export const ScrapedPageSchema = {}
export const CrawlJobSchema = {}
export const crawlerPresets = {}
