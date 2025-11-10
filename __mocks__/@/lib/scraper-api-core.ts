// Mock for @/lib/scraper-api-core
// This module is the actual implementation that scraper-api.ts re-exports
import { jest } from '@jest/globals'

// Import the mock from scraper-api so they share the same instance
import { scrapePage } from './scraper-api'

// Re-export the same mock  instance
export { scrapePage }
