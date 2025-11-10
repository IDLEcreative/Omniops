// Mock for @/lib/scraper-api
import { jest } from '@jest/globals'

// Export plain jest.fn() instances that can be configured in tests
// Default implementations can be set in setupDefaultMocks() in test-setup.ts
export const scrapePage = jest.fn()
export const crawlWebsite = jest.fn()
export const checkCrawlStatus = jest.fn()
export const getHealthStatus = jest.fn()
