import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { PatternLearner, ExtractedPattern, DomainPatterns } from '@/lib/pattern-learner'
import { NormalizedProduct } from '@/lib/product-normalizer'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock environment variables
const originalEnv = process.env

describe('PatternLearner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key'
    }

    // Reset mock implementations
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Environment Setup', () => {
    it('should throw error when Supabase credentials are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      expect(() => {
        // This will trigger the getSupabaseClient call
        PatternLearner['getSupabaseClient']()
      }).toThrow('Supabase credentials not found')
    })

    it('should create Supabase client with correct credentials', () => {
      const client = PatternLearner['getSupabaseClient']()
      expect(client).toBeDefined()
    })
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

      // Mock database responses
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null })
      mockSupabaseClient.insert.mockResolvedValue({ data: {}, error: null })

      await PatternLearner.learnFromExtraction('https://example.com/product/123', products, extractionData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_patterns')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
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

      // Mock database error
      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'))

      // Should not throw error
      await expect(PatternLearner.learnFromExtraction('https://example.com/product', products, {}))
        .resolves.toBeUndefined()
    })

    it('should skip learning when no products provided', async () => {
      await PatternLearner.learnFromExtraction('https://example.com/product', [], {})

      expect(mockSupabaseClient.insert).not.toHaveBeenCalled()
    })
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

      mockSupabaseClient.single.mockResolvedValue({ data: mockPatterns, error: null })

      const result = await PatternLearner.getPatterns('https://example.com/some-page')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_patterns')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('domain', 'example.com')
      expect(result).toEqual(mockPatterns)
    })

    it('should return null when no patterns found', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      const result = await PatternLearner.getPatterns('https://newsite.com/product')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('Database connection failed'))

      const result = await PatternLearner.getPatterns('https://example.com/product')

      expect(result).toBeNull()
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

      mockSupabaseClient.single.mockResolvedValue({ data: mockPatterns, error: null })

      // Mock Cheerio-like object
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
        sku: 'Amazing Product', // Mock returns same text
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
            confidence: 0.5, // Below threshold
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.6,
        totalExtractions: 5
      }

      mockSupabaseClient.single.mockResolvedValue({ data: mockPatterns, error: null })

      const mockCheerio = jest.fn()
      mockCheerio.mockReturnValue({ length: 0 })

      const result = await PatternLearner.applyPatterns('https://example.com/product', mockCheerio)

      expect(result).toBeNull()
    })

    it('should return null when no patterns exist', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })

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

      mockSupabaseClient.single.mockResolvedValue({ data: mockPatterns, error: null })

      // Mock Cheerio to throw an error
      const mockCheerio = jest.fn()
      mockCheerio.mockImplementation(() => {
        throw new Error('Selector error')
      })

      const result = await PatternLearner.applyPatterns('https://example.com/product', mockCheerio)

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

      mockSupabaseClient.single.mockResolvedValue({ data: existingPatterns, error: null })
      mockSupabaseClient.update.mockResolvedValue({ data: {}, error: null })

      await PatternLearner.updatePatternSuccess('https://example.com/product', true, ['name:.product-title'])

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          successRate: expect.any(Number),
          totalExtractions: 11,
          lastUpdated: expect.any(String)
        })
      )
    })

    it('should handle missing patterns gracefully', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })

      await expect(PatternLearner.updatePatternSuccess('https://newdomain.com/product', false))
        .resolves.toBeUndefined()

      expect(mockSupabaseClient.update).not.toHaveBeenCalled()
    })
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

      mockSupabaseClient.single.mockResolvedValue({ data: existingPatterns, error: null })
      mockSupabaseClient.update.mockResolvedValue({ data: {}, error: null })

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

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
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

      mockSupabaseClient.single.mockResolvedValue({ data: existingPatterns, error: null })
      mockSupabaseClient.update.mockResolvedValue({ data: {}, error: null })

      const products: NormalizedProduct[] = [
        {
          name: 'Test Product',
          scrapedAt: new Date().toISOString()
        }
      ]

      await PatternLearner.learnFromExtraction('https://example.com/product', products, {
        selectors: { name: '.product-title' } // Same selector
      })

      // Should update existing pattern confidence
      expect(mockSupabaseClient.update).toHaveBeenCalled()
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

      mockSupabaseClient.single.mockImplementation(() => ({ data: platformPatterns, error: null }))

      const recommendations = await PatternLearner.getRecommendations('https://newshop.com/product', 'woocommerce')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_patterns')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('platform', 'woocommerce')
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
      mockSupabaseClient.single.mockImplementation(() => ({ data: [], error: null }))

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
        mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })
        
        await PatternLearner.getPatterns(url)
        
        const expectedDomain = new URL(url).hostname
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('domain', expectedDomain)
        
        jest.clearAllMocks()
      }
    })

    it('should handle invalid URLs gracefully', async () => {
      const result = await PatternLearner.getPatterns('not-a-valid-url')
      
      expect(result).toBeNull()
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

      mockSupabaseClient.single.mockResolvedValue({ data: mockPatterns, error: null })

      // Mock element not found
      const mockCheerio = jest.fn()
      mockCheerio.mockReturnValue({ length: 0 }) // Element not found

      const result = await PatternLearner.applyPatterns('https://example.com/product', mockCheerio)

      expect(result).toBeNull()
      // Confidence should be reduced internally (though we can't directly test this in the current implementation)
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

      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.insert.mockResolvedValue({ data: {}, error: null })

      await PatternLearner.learnFromExtraction('https://shop.example.com/product/complete', products, {
        platform: 'magento',
        extractionMethod: 'json-ld'
      })

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
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