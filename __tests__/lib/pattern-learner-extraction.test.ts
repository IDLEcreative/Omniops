import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { PatternLearner, DomainPatterns } from '@/lib/pattern-learner'
import supabaseMockModule from '@supabase/supabase-js'

// Mock the supabase server creation
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClientSync: jest.fn()
}))

const mockSupabaseClient = (supabaseMockModule as { _mockSupabaseClient: unknown })._mockSupabaseClient
const { MockQueryBuilder } = supabaseMockModule as { MockQueryBuilder: unknown }

const originalEnv = process.env

describe('PatternLearner - Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key'
    }

    mockSupabaseClient.from.mockImplementation(() => new MockQueryBuilder())
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Learning from Extractions', () => {
    it('should learn patterns from successful product extraction', async () => {
      const products: NormalizedProduct[] = [
        {
          name: 'Test Product',
          sku: 'TEST-123',
          price: {
            amount: 29.99,
            currency: 'GBP',
            formatted: '£29.99'
          },
          scrapedAt: new Date().toISOString()
        }
      ]

      const extractionData = {
        platform: 'woocommerce',
        selectors: {
          name: '.product-title',
          price: '.price',
          sku: '.sku'
        },
        extractionMethod: 'dom'
      }

      const qbExisting = new MockQueryBuilder()
      qbExisting.single.mockResolvedValue({ data: null, error: null })
      const qbInsert = new MockQueryBuilder()
      qbInsert.insert = jest.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from
        .mockReturnValueOnce(qbExisting)
        .mockReturnValueOnce(qbInsert)

      await PatternLearner.learnFromExtraction('https://example.com/product/123', products, extractionData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_patterns')
      expect(qbInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'example.com',
          platform: 'woocommerce',
          patterns: expect.arrayContaining([
            expect.objectContaining({
              selector: '.price',
              fieldType: 'price',
              confidence: 0.9
            }),
            expect.objectContaining({
              selector: '.product-title',
              fieldType: 'name',
              confidence: 0.85
            }),
            expect.objectContaining({
              selector: '.sku',
              fieldType: 'sku',
              confidence: 0.95
            })
          ])
        })
      )
    })

    it('should handle learning errors gracefully', async () => {
      const products: NormalizedProduct[] = [
        {
          name: 'Test Product',
          scrapedAt: new Date().toISOString()
        }
      ]

      const qbErr = new MockQueryBuilder()
      qbErr.single.mockRejectedValue(new Error('Database error'))
      mockSupabaseClient.from.mockReturnValue(qbErr)

      await expect(PatternLearner.learnFromExtraction('https://example.com/product', products, {}))
        .resolves.toBeUndefined()
    })

    it('should skip learning when no products provided', async () => {
      await PatternLearner.learnFromExtraction('https://example.com/product', [], {})

      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('Pattern Application', () => {
    it('should apply high-confidence patterns to extract product data', async () => {
      const mockPatterns: DomainPatterns = {
        domain: 'example.com',
        patterns: [
          {
            selector: 'h1.product-title',
            fieldType: 'name',
            confidence: 0.95,
            extractionMethod: 'dom'
          },
          {
            selector: '.sku-code',
            fieldType: 'sku',
            confidence: 0.90,
            extractionMethod: 'dom'
          },
          {
            selector: '.main-image img',
            fieldType: 'image',
            confidence: 0.85,
            attribute: 'src'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.9,
        totalExtractions: 10
      }

      const qbApply = new MockQueryBuilder()
      qbApply.single.mockResolvedValue({ data: mockPatterns, error: null })
      mockSupabaseClient.from.mockReturnValue(qbApply)

      const mockCheerio = jest.fn()
      const mockElement = {
        length: 1,
        text: jest.fn().mockReturnValue('Amazing Product'),
        attr: jest.fn().mockReturnValue('https://example.com/image.jpg')
      }
      mockCheerio.mockReturnValue(mockElement)

      const result = await PatternLearner.applyPatterns('https://example.com/product/123', mockCheerio)

      expect(result).toEqual({
        name: 'Amazing Product',
        sku: 'Amazing Product',
        images: [{
          url: 'https://example.com/image.jpg',
          isMain: true,
          position: 0
        }]
      })
    })

    it('should skip low-confidence patterns', async () => {
      const mockPatterns: DomainPatterns = {
        domain: 'example.com',
        patterns: [
          {
            selector: '.unreliable-selector',
            fieldType: 'name',
            confidence: 0.5,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.6,
        totalExtractions: 5
      }

      const qbLow = new MockQueryBuilder()
      qbLow.single.mockResolvedValue({ data: mockPatterns, error: null })
      mockSupabaseClient.from.mockReturnValue(qbLow)

      const mockCheerio = jest.fn()
      mockCheerio.mockReturnValue({ length: 0 })

      const result = await PatternLearner.applyPatterns('https://example.com/product', mockCheerio)

      expect(result).toBeNull()
    })

    it('should return null when no patterns exist', async () => {
      const qbNone = new MockQueryBuilder()
      qbNone.single.mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue(qbNone)

      const mockCheerio = jest.fn()
      const result = await PatternLearner.applyPatterns('https://newdomain.com/product', mockCheerio)

      expect(result).toBeNull()
    })

    it('should handle pattern application errors', async () => {
      const mockPatterns: DomainPatterns = {
        domain: 'example.com',
        patterns: [
          {
            selector: '.product-title',
            fieldType: 'name',
            confidence: 0.8,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.8,
        totalExtractions: 10
      }

      const qbNone2 = new MockQueryBuilder()
      qbNone2.single.mockResolvedValue({ data: mockPatterns, error: null })
      mockSupabaseClient.from.mockReturnValue(qbNone2)

      const mockCheerio = jest.fn()
      mockCheerio.mockImplementation(() => {
        throw new Error('Selector error')
      })

      const result = await PatternLearner.applyPatterns('https://example.com/product', mockCheerio)

      expect(result).toBeNull()
    })
  })
})
