// Mock for @/lib/scraper-api
import { jest } from '@jest/globals'

export const scrapePage = jest.fn().mockResolvedValue({
  url: 'https://example.com',
  title: 'Example Page',
  content: 'This is the page content. It contains multiple sentences. This helps test chunking.',
  metadata: { description: 'Test description' },
})

export const crawlWebsite = jest.fn().mockResolvedValue('job-123')

export const checkCrawlStatus = jest.fn().mockResolvedValue({
  status: 'completed',
  data: [],
})

export const getHealthStatus = jest.fn().mockResolvedValue({
  status: 'ok',
  crawler: 'ready',
})
