// Mock for @/lib/scraper-with-cleanup
import { jest } from '@jest/globals'

export const crawlWebsiteWithCleanup = jest.fn().mockResolvedValue('job-123')
