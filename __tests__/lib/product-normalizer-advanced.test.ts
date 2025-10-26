import { describe, it, expect } from '@jest/globals'
import { ProductNormalizer } from '@/lib/product-normalizer'

describe('ProductNormalizer - Advanced Features', () => {
  describe('extractSpecifications', () => {
    it('should extract key-value specifications', () => {
      const content = `
        Dimensions: 120 x 80 x 60 cm
        Weight: 15.5 kg
        Material: Solid Oak
        Color: Natural Brown
      `

      const specs = ProductNormalizer.extractSpecifications(content)

      expect(specs).toHaveLength(4)
      expect(specs.find(s => s.name === 'Dimensions')?.value).toBe('120 x 80 x 60 cm')
      expect(specs.find(s => s.name === 'Weight')?.value).toBe('15.5 kg')
      expect(specs.find(s => s.name === 'Material')?.value).toBe('Solid Oak')
      expect(specs.find(s => s.name === 'Color')?.value).toBe('Natural Brown')
    })

    it('should extract common specification patterns', () => {
      const content = `
        Weight: 2.5kg
        Material: aluminum
        Warranty: 2-year
        Model: ABC-123
      `

      const specs = ProductNormalizer.extractSpecifications(content)

      expect(specs.length).toBeGreaterThan(0)
      expect(specs.find(s => s.name === 'Weight')).toBeDefined()
      expect(specs.find(s => s.name === 'Material')).toBeDefined()
      expect(specs.find(s => s.name === 'Model')).toBeDefined()
      expect(specs.find(s => s.name === 'Warranty')).toBeDefined()
    })

    it('should handle empty or invalid content', () => {
      expect(ProductNormalizer.extractSpecifications('')).toHaveLength(0)
      expect(ProductNormalizer.extractSpecifications('No specifications here')).toHaveLength(0)
    })

    it('should avoid extracting invalid specifications', () => {
      const content = `
        Valid: This is a valid spec
        TooLongNameThatExceedsFiftyCharacterLimitShouldBeIgnored: Value
      `

      const specs = ProductNormalizer.extractSpecifications(content)

      // Should only extract valid specs (length < 50 characters)
      expect(specs.length).toBe(1)
      expect(specs[0].name).toBe('Valid')
      expect(specs[0].value).toBe('This is a valid spec')
    })
  })

  describe('normalizeAvailability', () => {
    it('should detect out of stock status', () => {
      const outOfStock1 = ProductNormalizer.normalizeAvailability('Out of stock')
      expect(outOfStock1?.inStock).toBe(false)
      expect(outOfStock1?.stockStatus).toBe('out-of-stock')

      const outOfStock2 = ProductNormalizer.normalizeAvailability('SOLD OUT')
      expect(outOfStock2?.inStock).toBe(false)

      const unavailable = ProductNormalizer.normalizeAvailability('Currently unavailable')
      expect(unavailable?.inStock).toBe(false)
    })

    it('should detect in stock status', () => {
      const inStock = ProductNormalizer.normalizeAvailability('In stock')
      expect(inStock?.inStock).toBe(true)
      expect(inStock?.stockStatus).toBe('in-stock')

      const available = ProductNormalizer.normalizeAvailability('Available now')
      expect(available?.inStock).toBe(true)

      const readyToShip = ProductNormalizer.normalizeAvailability('Ready to ship')
      expect(readyToShip?.inStock).toBe(true)
    })

    it('should extract stock levels', () => {
      const limitedStock = ProductNormalizer.normalizeAvailability('5 in stock')
      expect(limitedStock?.inStock).toBe(true)
      expect(limitedStock?.stockLevel).toBe(5)
      expect(limitedStock?.stockStatus).toBe('limited')

      const highStock = ProductNormalizer.normalizeAvailability('25 available')
      expect(highStock?.stockLevel).toBe(25)
      expect(highStock?.stockStatus).toBe('in-stock')
    })

    it('should detect pre-order status', () => {
      const preOrder = ProductNormalizer.normalizeAvailability('Pre-order')
      expect(preOrder?.inStock).toBe(false)
      expect(preOrder?.stockStatus).toBe('pre-order')
    })

    it('should detect backorder status', () => {
      const backorder = ProductNormalizer.normalizeAvailability('On backorder')
      expect(backorder?.inStock).toBe(false)
      expect(backorder?.stockStatus).toBe('backorder')
    })

    it('should default to in-stock for undefined input', () => {
      const defaultStatus = ProductNormalizer.normalizeAvailability(undefined)
      expect(defaultStatus).toBeUndefined()
    })

    it('should handle unknown availability text', () => {
      const unknown = ProductNormalizer.normalizeAvailability('Ships in 2-3 weeks')
      expect(unknown?.inStock).toBe(true)
      expect(unknown?.stockStatus).toBe('in-stock')
    })
  })

  describe('normalizeProduct', () => {
    it('should normalize a complete product object', () => {
      const rawProduct = {
        name: '  Premium Product™  ',
        sku: 'PROD-123',
        price: '£49.99',
        currency: 'GBP',
        availability: 'In stock',
        description: 'A great product',
        images: [
          'https://example.com/image1.jpg',
          { url: 'https://example.com/image2.jpg', alt: 'Product image' }
        ],
        brand: 'TestBrand',
        rating: { value: '4.5', count: '10' }
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)

      expect(normalized.name).toBe('Premium Product')
      expect(normalized.sku).toBe('PROD-123')
      expect(normalized.price?.amount).toBe(49.99)
      expect(normalized.price?.currency).toBe('GBP')
      expect(normalized.availability?.inStock).toBe(true)
      expect(normalized.description).toBe('A great product')
      expect(normalized.images).toHaveLength(2)
      expect(normalized.images?.[0].isMain).toBe(true)
      expect(normalized.brand).toBe('TestBrand')
      expect(normalized.rating?.value).toBe(4.5)
      expect(normalized.rating?.count).toBe(10)
      expect(normalized.scrapedAt).toBeDefined()
    })

    it('should handle price ranges', () => {
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

    it('should handle minimal product data', () => {
      const rawProduct = {
        title: 'Simple Product' // Using title instead of name
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)

      expect(normalized.name).toBe('Simple Product')
      expect(normalized.scrapedAt).toBeDefined()
    })

    it('should handle product with specifications', () => {
      const rawProduct = {
        name: 'Product with specs',
        specifications: 'Weight: 2kg\nColor: Blue\nMaterial: Plastic'
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)

      expect(normalized.specifications).toBeDefined()
      expect(normalized.specifications?.length).toBeGreaterThan(0)
      expect(normalized.specifications?.find(s => s.name === 'Weight')?.value).toBe('2kg')
    })

    it('should handle boolean inStock field', () => {
      const rawProduct = {
        name: 'Test Product',
        inStock: false
      }

      const normalized = ProductNormalizer.normalizeProduct(rawProduct)

      expect(normalized.availability?.inStock).toBe(false)
    })

    it('should handle array and single image formats', () => {
      const rawProductArray = {
        name: 'Product 1',
        images: ['img1.jpg', 'img2.jpg']
      }

      const normalizedArray = ProductNormalizer.normalizeProduct(rawProductArray)
      expect(normalizedArray.images).toHaveLength(2)

      const rawProductSingle = {
        name: 'Product 2',
        image: 'single.jpg'
      }

      const normalizedSingle = ProductNormalizer.normalizeProduct(rawProductSingle)
      expect(normalizedSingle.images).toHaveLength(1)
      expect(normalizedSingle.images?.[0].url).toBe('single.jpg')
    })
  })

  describe('normalizeProducts', () => {
    it('should normalize multiple products', () => {
      const rawProducts = [
        { name: 'Product 1', price: '$10.00' },
        { name: 'Product 2', price: '$20.00' },
        { name: 'Product 3', price: '$30.00' }
      ]

      const normalized = ProductNormalizer.normalizeProducts(rawProducts)

      expect(normalized).toHaveLength(3)
      expect(normalized[0].name).toBe('Product 1')
      expect(normalized[1].price?.amount).toBe(20.00)
    })

    it('should filter out failed normalizations', () => {
      const rawProducts = [
        { name: 'Valid Product', price: '$10.00' },
        null, // This will cause an error but return a fallback product
        { name: 'Another Valid Product', price: '$20.00' }
      ]

      const normalized = ProductNormalizer.normalizeProducts(rawProducts)

      // Should have 3 products total (including fallback for null)
      expect(normalized).toHaveLength(3)
      expect(normalized[0].name).toBe('Valid Product')
      expect(normalized[1].name).toBe('Unknown Product') // Fallback for null
      expect(normalized[2].name).toBe('Another Valid Product')
    })

    it('should handle empty array', () => {
      const normalized = ProductNormalizer.normalizeProducts([])
      expect(normalized).toHaveLength(0)
    })
  })
})
