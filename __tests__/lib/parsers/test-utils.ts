import { jest } from '@jest/globals'

// Mock the dependencies
export const mockExtractWithReadability = jest.fn();

export const mockPatternLearner = {
  applyPatterns: jest.fn(),
  learnFromExtraction: jest.fn()
}

export const mockProductNormalizer = {
  normalizeProduct: jest.fn()
}

// Mock the imports - ContentExtractor must be a real class for inheritance to work
jest.mock('@/lib/content-extractor', () => ({
  ContentExtractor: class ContentExtractor {
    static extractWithReadability = mockExtractWithReadability
  }
}))

jest.mock('@/lib/pattern-learner', () => ({
  PatternLearner: mockPatternLearner
}))

jest.mock('@/lib/product-normalizer', () => ({
  ProductNormalizer: mockProductNormalizer
}))

export function setupMockDefaults() {
  jest.clearAllMocks()

  // Setup default mock returns
  mockExtractWithReadability.mockReturnValue({
    title: 'Test Page',
    content: 'Test content',
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    metadata: {}
  })

  mockProductNormalizer.normalizeProduct.mockImplementation((product) => ({
    name: product.name || 'Normalized Product',
    scrapedAt: new Date().toISOString(),
    ...product
  }))

  mockPatternLearner.applyPatterns.mockResolvedValue(null)
  mockPatternLearner.learnFromExtraction.mockResolvedValue(undefined)
}

export function verifyMocksInitialized() {
  expect(typeof mockProductNormalizer.normalizeProduct).toBe('function')
}
