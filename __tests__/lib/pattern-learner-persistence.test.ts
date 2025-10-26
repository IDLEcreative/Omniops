import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { PatternLearner, DomainPatterns } from '@/lib/pattern-learner'
import supabaseMockModule from '@supabase/supabase-js'

const mockSupabaseClient = (supabaseMockModule as { _mockSupabaseClient: unknown })._mockSupabaseClient
const { MockQueryBuilder } = supabaseMockModule as { MockQueryBuilder: unknown }

const originalEnv = process.env

describe('PatternLearner - Persistence', () => {
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

  describe('Pattern Retrieval', () => {
    it('should retrieve patterns for a domain', async () => {
      const mockPatterns: DomainPatterns = {
        domain: 'example.com',
        platform: 'shopify',
        patterns: [
          {
            selector: '.product-title',
            fieldType: 'name',
            confidence: 0.95,
            extractionMethod: 'dom'
          },
          {
            selector: '.price',
            fieldType: 'price',
            confidence: 0.90,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.85,
        totalExtractions: 20
      }

      const qbGet = new MockQueryBuilder()
      qbGet.single.mockResolvedValue({ data: mockPatterns, error: null })
      mockSupabaseClient.from.mockReturnValue(qbGet)

      const result = await PatternLearner.getPatterns('https://example.com/some-page')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_patterns')
      expect(qbGet.eq).toHaveBeenCalledWith('domain', 'example.com')
      expect(result).toEqual(mockPatterns)
    })

    it('should return null when no patterns found', async () => {
      const qbNone = new MockQueryBuilder()
      qbNone.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
      mockSupabaseClient.from.mockReturnValue(qbNone)

      const result = await PatternLearner.getPatterns('https://newsite.com/product')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const qbDbErr = new MockQueryBuilder()
      qbDbErr.single.mockRejectedValue(new Error('Database connection failed'))
      mockSupabaseClient.from.mockReturnValue(qbDbErr)

      const result = await PatternLearner.getPatterns('https://example.com/product')

      expect(result).toBeNull()
    })
  })

  describe('Pattern Success Tracking', () => {
    it('should update pattern success rates', async () => {
      const existingPatterns: DomainPatterns = {
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
        successRate: 0.7,
        totalExtractions: 10
      }

      const qbGet = new MockQueryBuilder()
      qbGet.single.mockResolvedValue({ data: existingPatterns, error: null })
      const qbUpdate = new MockQueryBuilder() as { update: jest.Mock }
      qbUpdate.update = jest.fn().mockReturnThis()
      mockSupabaseClient.from
        .mockReturnValueOnce(qbGet)
        .mockReturnValueOnce(qbUpdate)

      await PatternLearner.updatePatternSuccess('https://example.com/product', true, ['name:.product-title'])

      expect(qbUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          successRate: expect.any(Number),
          totalExtractions: 11,
          lastUpdated: expect.any(String)
        })
      )
    })

    it('should handle missing patterns gracefully', async () => {
      const qbMissing = new MockQueryBuilder()
      qbMissing.single.mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.from.mockReturnValue(qbMissing)

      await expect(PatternLearner.updatePatternSuccess('https://newdomain.com/product', false))
        .resolves.toBeUndefined()

      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
    })
  })

  describe('Database Schema Compatibility', () => {
    it('should save patterns with correct schema structure', async () => {
      const products: NormalizedProduct[] = [
        {
          name: 'Complete Product',
          sku: 'COMP-123',
          price: { amount: 99.99, currency: 'EUR', formatted: '€99.99' },
          description: 'A complete product description',
          scrapedAt: new Date().toISOString()
        }
      ]

      const qbExistNone = new MockQueryBuilder()
      qbExistNone.single.mockResolvedValue({ data: null, error: null })
      const qbIns = new MockQueryBuilder()
      qbIns.insert = jest.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from
        .mockReturnValueOnce(qbExistNone)
        .mockReturnValueOnce(qbIns)

      await PatternLearner.learnFromExtraction('https://shop.example.com/product/complete', products, {
        platform: 'magento',
        extractionMethod: 'json-ld'
      })

      expect(qbIns.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'shop.example.com',
          platform: 'magento',
          patterns: expect.any(Array),
          lastUpdated: expect.any(String),
          successRate: 1.0,
          totalExtractions: 1
        })
      )
    })
  })
})
