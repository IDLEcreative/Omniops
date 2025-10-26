import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { PatternLearner, DomainPatterns } from '@/lib/pattern-learner'
import supabaseMockModule from '@supabase/supabase-js'

const mockSupabaseClient = (supabaseMockModule as { _mockSupabaseClient: unknown })._mockSupabaseClient
const { MockQueryBuilder } = supabaseMockModule as { MockQueryBuilder: unknown }

const originalEnv = process.env

describe('PatternLearner - Learning Algorithms', () => {
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

  describe('Pattern Merging', () => {
    it('should merge new patterns with existing ones', async () => {
      const existingPatterns: DomainPatterns = {
        domain: 'example.com',
        platform: 'woocommerce',
        patterns: [
          {
            selector: '.old-selector',
            fieldType: 'name',
            confidence: 0.8,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.75,
        totalExtractions: 5
      }

      const qbExisting = new MockQueryBuilder()
      qbExisting.single.mockResolvedValue({ data: existingPatterns, error: null })
      const qbUpdate = new MockQueryBuilder() as { update: jest.Mock }
      qbUpdate.update = jest.fn().mockReturnThis()
      mockSupabaseClient.from
        .mockReturnValueOnce(qbExisting)
        .mockReturnValueOnce(qbUpdate)

      const products: NormalizedProduct[] = [
        {
          name: 'New Product',
          price: { amount: 49.99, currency: 'USD', formatted: '$49.99' },
          scrapedAt: new Date().toISOString()
        }
      ]

      await PatternLearner.learnFromExtraction('https://example.com/product', products, {
        platform: 'woocommerce',
        selectors: { price: '.new-price-selector' }
      })

      expect(qbUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          patterns: expect.arrayContaining([
            expect.objectContaining({
              selector: '.old-selector',
              fieldType: 'name'
            }),
            expect.objectContaining({
              selector: '.new-price-selector',
              fieldType: 'price'
            })
          ]),
          totalExtractions: 6
        })
      )
    })

    it('should update confidence for duplicate patterns', async () => {
      const existingPatterns: DomainPatterns = {
        domain: 'example.com',
        patterns: [
          {
            selector: '.product-title',
            fieldType: 'name',
            confidence: 0.6,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.8,
        totalExtractions: 5
      }

      const qbExisting = new MockQueryBuilder()
      qbExisting.single.mockResolvedValue({ data: existingPatterns, error: null })
      const qbUpdate = new MockQueryBuilder() as { update: jest.Mock }
      qbUpdate.update = jest.fn().mockReturnThis()
      mockSupabaseClient.from
        .mockReturnValueOnce(qbExisting)
        .mockReturnValueOnce(qbUpdate)

      const products: NormalizedProduct[] = [
        {
          name: 'Test Product',
          scrapedAt: new Date().toISOString()
        }
      ]

      await PatternLearner.learnFromExtraction('https://example.com/product', products, {
        selectors: { name: '.product-title' }
      })

      expect(qbUpdate.update).toHaveBeenCalled()
    })
  })

  describe('Pattern Confidence Management', () => {
    it('should adjust confidence when patterns fail', async () => {
      const mockPatterns: DomainPatterns = {
        domain: 'example.com',
        patterns: [
          {
            selector: '.failing-selector',
            fieldType: 'name',
            confidence: 0.9,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.8,
        totalExtractions: 10
      }

      const qbErr = new MockQueryBuilder()
      qbErr.single.mockResolvedValue({ data: mockPatterns, error: null })
      mockSupabaseClient.from.mockReturnValue(qbErr)

      const mockCheerio = jest.fn()
      mockCheerio.mockReturnValue({ length: 0 })

      const result = await PatternLearner.applyPatterns('https://example.com/product', mockCheerio)

      expect(result).toBeNull()
    })
  })

  describe('Pattern Recommendations', () => {
    it('should get recommendations based on platform', async () => {
      const platformPatterns = [
        {
          patterns: [
            {
              selector: '.woo-product-title',
              fieldType: 'name',
              confidence: 0.9,
              extractionMethod: 'dom'
            }
          ]
        },
        {
          patterns: [
            {
              selector: '.woo-price',
              fieldType: 'price',
              confidence: 0.85,
              extractionMethod: 'dom'
            }
          ]
        }
      ]

      const qbRec = new MockQueryBuilder()
      qbRec.then = (resolve: (value: unknown) => void) => Promise.resolve({ data: platformPatterns, error: null }).then(resolve)
      mockSupabaseClient.from.mockReturnValue(qbRec)

      const recommendations = await PatternLearner.getRecommendations('https://newshop.com/product', 'woocommerce')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_patterns')
      expect(qbRec.eq).toHaveBeenCalledWith('platform', 'woocommerce')
      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            selector: '.woo-product-title',
            fieldType: 'name'
          })
        ])
      )
    })

    it('should return empty array when no platform specified', async () => {
      const recommendations = await PatternLearner.getRecommendations('https://example.com/product')

      expect(recommendations).toEqual([])
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return empty array when no platform patterns found', async () => {
      const qbRecEmpty = new MockQueryBuilder()
      qbRecEmpty.then = (resolve: (value: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve)
      mockSupabaseClient.from.mockReturnValue(qbRecEmpty)

      const recommendations = await PatternLearner.getRecommendations('https://example.com/product', 'unknown-platform')

      expect(recommendations).toEqual([])
    })
  })

  describe('URL Parsing', () => {
    it('should extract domain correctly from various URL formats', async () => {
      const testCases = [
        'https://example.com/product/123',
        'http://example.com/category',
        'https://www.example.com/page',
        'https://subdomain.example.com/item'
      ]

      for (const url of testCases) {
        const qb = new MockQueryBuilder()
        qb.single.mockResolvedValue({ data: null, error: null })
        mockSupabaseClient.from.mockReturnValue(qb)

        await PatternLearner.getPatterns(url)

        const expectedDomain = new URL(url).hostname
        expect(qb.eq).toHaveBeenCalledWith('domain', expectedDomain)

        jest.clearAllMocks()
      }
    })

    it('should handle invalid URLs gracefully', async () => {
      const result = await PatternLearner.getPatterns('not-a-valid-url')

      expect(result).toBeNull()
    })
  })
})
