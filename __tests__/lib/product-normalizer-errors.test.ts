import { describe, it, expect } from '@jest/globals'
import { ProductNormalizer } from '@/lib/product-normalizer'

describe('ProductNormalizer - Error Handling & Edge Cases', () => {
  describe('Error handling', () => {
    it('should gracefully handle errors and return minimal valid product', () => {
      // Simulate error by passing null
      const normalized = ProductNormalizer.normalizeProduct(null)

      expect(normalized.name).toBe('Unknown Product')
      expect(normalized.scrapedAt).toBeDefined()
    })

    it('should handle invalid price input gracefully', () => {
      expect(ProductNormalizer.normalizePrice('')).toBeUndefined()
      expect(ProductNormalizer.normalizePrice(undefined)).toBeUndefined()
      expect(ProductNormalizer.normalizePrice('No price here')).toBeUndefined()
    })

    it('should handle empty name input', () => {
      expect(ProductNormalizer.normalizeName('')).toBe('')
      expect(ProductNormalizer.normalizeName(undefined)).toBe('')
    })

    it('should handle undefined availability input', () => {
      const defaultStatus = ProductNormalizer.normalizeAvailability(undefined)
      expect(defaultStatus).toBeUndefined()
    })

    it('should handle empty specifications content', () => {
      expect(ProductNormalizer.extractSpecifications('')).toHaveLength(0)
      expect(ProductNormalizer.extractSpecifications('No specifications here')).toHaveLength(0)
    })

    it('should handle empty products array', () => {
      const normalized = ProductNormalizer.normalizeProducts([])
      expect(normalized).toHaveLength(0)
    })

    it('should handle null in products array', () => {
      const rawProducts = [
        { name: 'Valid Product', price: '$10.00' },
        null,
        { name: 'Another Valid Product', price: '$20.00' }
      ]

      const normalized = ProductNormalizer.normalizeProducts(rawProducts)

      expect(normalized).toHaveLength(3)
      expect(normalized[1].name).toBe('Unknown Product')
    })
  })

  describe('Edge cases and internationalization', () => {
    it('should handle various currency formats', () => {
      const currencies = [
        { input: '₹999', expectedCurrency: 'INR', expectedAmount: 999 },
        { input: 'kr 150', expectedCurrency: 'SEK', expectedAmount: 150 },
        { input: 'zł 75.25', expectedCurrency: 'PLN', expectedAmount: 75.25 }
      ]

      currencies.forEach(({ input, expectedCurrency, expectedAmount }) => {
        const result = ProductNormalizer.normalizePrice(input)
        expect(result?.currency).toBe(expectedCurrency)
        expect(result?.amount).toBe(expectedAmount)
      })
    })

    it('should handle very large and small prices', () => {
      const largePriceResult = ProductNormalizer.normalizePrice('$999,999.99')
      expect(largePriceResult?.amount).toBe(999999.99)

      const smallPriceResult = ProductNormalizer.normalizePrice('$0.01')
      expect(smallPriceResult?.amount).toBe(0.01)
    })

    it('should handle decimal-only prices', () => {
      const result = ProductNormalizer.normalizePrice('£0.99')
      expect(result?.amount).toBe(0.99)
    })

    it('should prioritize explicit currency parameter', () => {
      const result = ProductNormalizer.normalizePrice('25.99', 'EUR')
      expect(result?.currency).toBe('EUR')
    })

    it('should handle complex price strings with multiple values', () => {
      const result = ProductNormalizer.normalizePrice('Special offer: Was $89.99, now only $59.99 (save $30)')

      expect(result).toBeDefined()
      expect(result?.amount).toBe(30.00)
      expect(result?.original).toBe(89.99)
      expect(result?.currency).toBe('USD')
    })

    it('should handle international price format edge cases', () => {
      const result = ProductNormalizer.normalizePrice('€1.234,56')
      expect(result?.currency).toBe('EUR')
    })

    it('should handle price with no currency symbol', () => {
      const result = ProductNormalizer.normalizePrice('25.99')
      expect(result?.currency).toBe('USD')
      expect(result?.amount).toBe(25.99)
    })

    it('should handle unknown availability text', () => {
      const unknown = ProductNormalizer.normalizeAvailability('Ships in 2-3 weeks')
      expect(unknown?.inStock).toBe(true)
      expect(unknown?.stockStatus).toBe('in-stock')
    })

    it('should reject specifications with names too long', () => {
      const content = `
        Valid: This is a valid spec
        TooLongNameThatExceedsFiftyCharacterLimitShouldBeIgnored: Value
      `

      const specs = ProductNormalizer.extractSpecifications(content)

      expect(specs.length).toBe(1)
      expect(specs[0].name).toBe('Valid')
    })

    it('should handle whitespace edge cases in names', () => {
      const name = ProductNormalizer.normalizeName('Product    Name    With    Spaces')
      expect(name).toBe('Product Name With Spaces')
    })

    it('should handle trademark symbols in names', () => {
      const name = ProductNormalizer.normalizeName('Brand® Product™ Name©')
      expect(name).toBe('Brand Product Name')
    })

    it('should handle trailing dashes in names', () => {
      const name = ProductNormalizer.normalizeName('Product Name - ')
      expect(name).toBe('Product Name')
    })

    it('should handle minimal product data', () => {
      const rawProduct = {
        title: 'Simple Product'
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)
      expect(normalized.name).toBe('Simple Product')
      expect(normalized.scrapedAt).toBeDefined()
    })

    it('should handle mixed image format types', () => {
      const rawProduct = {
        name: 'Product',
        images: [
          'https://example.com/image1.jpg',
          { url: 'https://example.com/image2.jpg', alt: 'Product image' }
        ]
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)
      expect(normalized.images).toHaveLength(2)
      expect(normalized.images?.[0].isMain).toBe(true)
    })

    it('should handle single image vs array', () => {
      const singleImage = {
        name: 'Product',
        image: 'single.jpg'
      }

      const normalized = ProductNormalizer.normalizeProduct(singleImage)
      expect(normalized.images).toHaveLength(1)
      expect(normalized.images?.[0].url).toBe('single.jpg')
    })

    it('should handle boolean inStock edge case', () => {
      const rawProduct = {
        name: 'Test Product',
        inStock: false
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)
      expect(normalized.availability?.inStock).toBe(false)
    })

    it('should handle price ranges with different currencies', () => {
      const rawProduct = {
        name: 'Variable Product',
        priceMin: '£10.00',
        priceMax: '£50.00',
        currency: 'GBP'
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)
      expect(normalized.priceRange).toBeDefined()
      expect(normalized.priceRange?.min.amount).toBe(10.00)
      expect(normalized.priceRange?.max.amount).toBe(50.00)
    })

    it('should handle product specifications edge cases', () => {
      const rawProduct = {
        name: 'Product with specs',
        specifications: 'Weight: 2kg\nColor: Blue\nMaterial: Plastic'
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)
      expect(normalized.specifications).toBeDefined()
      expect(normalized.specifications?.length).toBeGreaterThan(0)
    })
  })
})
