/**
 * Product Data Normalizer
 * Cleans and standardizes e-commerce product data from various sources
 */

export interface NormalizedPrice {
  amount: number;
  currency: string;
  formatted: string;
  original?: number;
  discount?: number;
  discountPercent?: number;
  vatIncluded?: boolean;
  vatRate?: number;
  priceType?: 'single' | 'range' | 'starting-from';
}

export interface ProductVariant {
  id?: string;
  name: string;
  type: 'color' | 'size' | 'material' | 'style' | 'custom';
  value: string;
  priceModifier?: number;
  stockLevel?: number;
  sku?: string;
  image?: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
  group?: string;
}

export interface NormalizedProduct {
  // Core fields
  id?: string;
  sku?: string;
  name: string;
  url?: string;
  
  // Pricing
  price?: NormalizedPrice;
  priceRange?: {
    min: NormalizedPrice;
    max: NormalizedPrice;
  };
  
  // Stock
  availability?: {
    inStock: boolean;
    stockLevel?: number;
    stockStatus?: 'in-stock' | 'out-of-stock' | 'pre-order' | 'backorder' | 'limited';
    expectedDate?: string;
  };
  
  // Content
  description?: string;
  shortDescription?: string;
  
  // Media
  images?: Array<{
    url: string;
    alt?: string;
    title?: string;
    isMain?: boolean;
    position?: number;
  }>;
  
  // Variants & Options
  variants?: ProductVariant[];
  hasVariants?: boolean;
  
  // Specifications
  specifications?: ProductSpecification[];
  
  // Categorization
  categories?: string[];
  breadcrumbs?: Array<{
    name: string;
    url?: string;
    level?: number;
  }>;
  tags?: string[];
  
  // Metadata
  brand?: string;
  manufacturer?: string;
  model?: string;
  mpn?: string; // Manufacturer Part Number
  gtin?: string; // Global Trade Item Number (includes UPC, EAN, ISBN)
  
  // Reviews
  rating?: {
    value: number;
    max?: number;
    count?: number;
  };
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  scrapedAt: string;
}

export class ProductNormalizer {
  
  /**
   * Currency symbols mapping
   */
  private static currencySymbols: Record<string, string> = {
    '$': 'USD',
    '£': 'GBP',
    '€': 'EUR',
    '¥': 'JPY',
    '₹': 'INR',
    'R$': 'BRL',
    'C$': 'CAD',
    'A$': 'AUD',
    'kr': 'SEK',
    'zł': 'PLN',
  };
  
  /**
   * Currency codes from text
   */
  private static currencyCodes = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'CHF', 'ZAR', 'NZD', 'SGD', 'HKD', 'KRW'];
  
  /**
   * Normalize price from various formats
   */
  static normalizePrice(priceText: string | number | undefined, currency?: string): NormalizedPrice | undefined {
    if (!priceText) return undefined;
    
    // Convert to string if number
    let text = typeof priceText === 'number' ? priceText.toString() : priceText;
    
    // Clean up the text
    text = text.trim();
    
    // Detect currency
    let detectedCurrency = currency;
    if (!detectedCurrency) {
      // Check for currency symbols
      for (const [symbol, code] of Object.entries(this.currencySymbols)) {
        if (text.includes(symbol)) {
          detectedCurrency = code;
          break;
        }
      }
      
      // Check for currency codes
      if (!detectedCurrency) {
        for (const code of this.currencyCodes) {
          if (text.toUpperCase().includes(code)) {
            detectedCurrency = code;
            break;
          }
        }
      }
    }
    
    // Extract price values
    const priceMatches = text.match(/[\d,]+\.?\d*/g);
    if (!priceMatches || priceMatches.length === 0) return undefined;
    
    // Parse amounts
    const amounts = priceMatches.map(match => {
      // Remove commas and parse
      return parseFloat(match.replace(/,/g, ''));
    }).filter(n => !isNaN(n));
    
    if (amounts.length === 0) return undefined;
    
    // Detect if it's a price range
    const hasRange = text.toLowerCase().includes('from') || 
                    text.includes('-') || 
                    text.toLowerCase().includes('to');
    
    // Detect original/sale price
    const hasDiscount = text.toLowerCase().includes('was') || 
                       text.toLowerCase().includes('original') ||
                       text.includes('£') && amounts.length > 2; // Multiple pound signs
    
    let amount = amounts[0];
    let original: number | undefined;
    
    if (hasDiscount && amounts.length >= 2) {
      // Assume first price is original, last is current
      original = amounts[0];
      amount = amounts[amounts.length - 1];
    }
    
    // Check for VAT
    const vatIncluded = text.toLowerCase().includes('inc vat') || 
                       text.toLowerCase().includes('incl vat') ||
                       text.toLowerCase().includes('including vat');
    
    const vatExcluded = text.toLowerCase().includes('ex vat') || 
                        text.toLowerCase().includes('excl vat') ||
                        text.toLowerCase().includes('excluding vat');
    
    // Calculate discount if we have original price
    let discount: number | undefined;
    let discountPercent: number | undefined;
    if (original && amount !== undefined && original > amount) {
      discount = original - amount;
      discountPercent = Math.round((discount / original) * 100);
    }
    
    return {
      amount: amount || 0,
      currency: detectedCurrency || 'USD',
      formatted: this.formatPrice(amount || 0, detectedCurrency || 'USD'),
      original,
      discount,
      discountPercent,
      vatIncluded: vatIncluded ? true : vatExcluded ? false : undefined,
      priceType: hasRange ? 'starting-from' : 'single',
    };
  }
  
  /**
   * Format price with currency
   */
  static formatPrice(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  }
  
  /**
   * Extract and normalize product variants
   */
  static extractVariants(element: any): ProductVariant[] {
    const variants: ProductVariant[] = [];
    
    // Common variant selectors
    const variantSelectors = {
      color: ['[data-color]', '.color-option', '.swatch-color', '[class*="color-select"]'],
      size: ['[data-size]', '.size-option', '.size-select', '[class*="size-select"]'],
      material: ['[data-material]', '.material-option'],
      style: ['[data-style]', '.style-option'],
    };
    
    // This would be implemented based on the actual DOM structure
    // For now, returning empty array
    return variants;
  }
  
  /**
   * Extract product specifications from various formats
   */
  static extractSpecifications(content: string | any): ProductSpecification[] {
    const specs: ProductSpecification[] = [];
    
    // Pattern for "Key: Value" format
    const specPattern = /^([^:]+):\s*(.+)$/gm;
    
    if (typeof content === 'string') {
      let match;
      while ((match = specPattern.exec(content)) !== null) {
        const [, name, value] = match;
        const trimmedName = name?.trim();
        const trimmedValue = value?.trim();
        if (trimmedName && trimmedValue && trimmedName.length < 50) {
          specs.push({
            name: trimmedName,
            value: trimmedValue,
          });
        }
      }
    }
    
    // Look for common specification patterns
    const commonSpecs = [
      { pattern: /dimensions?:\s*([^\n]+)/i, name: 'Dimensions' },
      { pattern: /weight:\s*([^\n]+)/i, name: 'Weight' },
      { pattern: /material:\s*([^\n]+)/i, name: 'Material' },
      { pattern: /color:\s*([^\n]+)/i, name: 'Color' },
      { pattern: /size:\s*([^\n]+)/i, name: 'Size' },
      { pattern: /model:\s*([^\n]+)/i, name: 'Model' },
      { pattern: /brand:\s*([^\n]+)/i, name: 'Brand' },
      { pattern: /warranty:\s*([^\n]+)/i, name: 'Warranty' },
    ];
    
    if (typeof content === 'string') {
      for (const spec of commonSpecs) {
        const match = content.match(spec.pattern);
        if (match && match[1]) {
          // Check if we already have this spec
          if (!specs.find(s => s.name.toLowerCase() === spec.name.toLowerCase())) {
            specs.push({
              name: spec.name,
              value: match[1].trim(),
            });
          }
        }
      }
    }
    
    return specs;
  }
  
  /**
   * Normalize availability status
   */
  static normalizeAvailability(text: string | undefined): NormalizedProduct['availability'] {
    if (!text) return undefined;
    
    const lower = text.toLowerCase();
    
    // Check for out of stock
    if (lower.includes('out of stock') || 
        lower.includes('sold out') || 
        lower.includes('unavailable')) {
      return {
        inStock: false,
        stockStatus: 'out-of-stock',
      };
    }
    
    // Check for in stock
    if (lower.includes('in stock') || 
        lower.includes('available') ||
        lower.includes('ready to ship')) {
      
      // Try to extract stock number
      const stockMatch = text.match(/(\d+)\s*(in stock|available|left|remaining)/i);
      const stockLevel = stockMatch && stockMatch[1] ? parseInt(stockMatch[1]) : undefined;
      
      return {
        inStock: true,
        stockStatus: stockLevel && stockLevel < 10 ? 'limited' : 'in-stock',
        stockLevel,
      };
    }
    
    // Check for pre-order
    if (lower.includes('pre-order') || lower.includes('preorder')) {
      return {
        inStock: false,
        stockStatus: 'pre-order',
      };
    }
    
    // Check for backorder
    if (lower.includes('backorder') || lower.includes('back order')) {
      return {
        inStock: false,
        stockStatus: 'backorder',
      };
    }
    
    // Default to unknown/available
    return {
      inStock: true,
      stockStatus: 'in-stock',
    };
  }
  
  /**
   * Clean and normalize product name
   */
  static normalizeName(name: string | undefined): string {
    if (!name) return '';
    
    return name
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[®™©]/g, '') // Remove trademark symbols
      .replace(/\s*[-–—]\s*$/, ''); // Remove trailing dashes
  }
  
  /**
   * Normalize a complete product object
   */
  static normalizeProduct(rawProduct: any): NormalizedProduct {
    try {
      const normalized: NormalizedProduct = {
        name: this.normalizeName(rawProduct.name || rawProduct.title),
        scrapedAt: new Date().toISOString(),
      };
    
    // Add optional fields if they exist
    if (rawProduct.sku) normalized.sku = rawProduct.sku;
    if (rawProduct.url) normalized.url = rawProduct.url;
    if (rawProduct.id) normalized.id = rawProduct.id;
    
    // Normalize price
    if (rawProduct.price) {
      normalized.price = this.normalizePrice(rawProduct.price, rawProduct.currency);
    }
    
    // Handle price range
    if (rawProduct.priceMin && rawProduct.priceMax) {
      normalized.priceRange = {
        min: this.normalizePrice(rawProduct.priceMin, rawProduct.currency)!,
        max: this.normalizePrice(rawProduct.priceMax, rawProduct.currency)!,
      };
    }
    
    // Normalize availability
    if (rawProduct.availability || rawProduct.stock || rawProduct.inStock !== undefined) {
      const availabilityText = rawProduct.availability || 
                              rawProduct.stock || 
                              (rawProduct.inStock ? 'In Stock' : 'Out of Stock');
      normalized.availability = this.normalizeAvailability(availabilityText);
    }
    
    // Add descriptions
    if (rawProduct.description) normalized.description = rawProduct.description;
    if (rawProduct.shortDescription) normalized.shortDescription = rawProduct.shortDescription;
    
    // Normalize images
    if (rawProduct.images || rawProduct.image) {
      const images = Array.isArray(rawProduct.images) ? rawProduct.images : 
                    rawProduct.image ? [rawProduct.image] : [];
      
      normalized.images = images.map((img: any, index: number) => ({
        url: typeof img === 'string' ? img : img.url || img.src,
        alt: typeof img === 'object' ? img.alt : undefined,
        title: typeof img === 'object' ? img.title : undefined,
        isMain: index === 0,
        position: index,
      })).filter((img: any) => img.url);
    }
    
    // Extract specifications if available
    if (rawProduct.specifications || rawProduct.details || rawProduct.features) {
      normalized.specifications = this.extractSpecifications(
        rawProduct.specifications || rawProduct.details || rawProduct.features
      );
    }
    
    // Add categories and breadcrumbs
    if (rawProduct.categories) normalized.categories = rawProduct.categories;
    if (rawProduct.breadcrumbs) normalized.breadcrumbs = rawProduct.breadcrumbs;
    if (rawProduct.tags) normalized.tags = rawProduct.tags;
    
    // Add brand and manufacturer
    if (rawProduct.brand) normalized.brand = rawProduct.brand;
    if (rawProduct.manufacturer) normalized.manufacturer = rawProduct.manufacturer;
    if (rawProduct.model) normalized.model = rawProduct.model;
    
    // Add rating if available
    if (rawProduct.rating) {
      normalized.rating = {
        value: parseFloat(rawProduct.rating.value || rawProduct.rating),
        max: rawProduct.rating.max || 5,
        count: parseInt(rawProduct.rating.count || rawProduct.reviewCount || '0'),
      };
    }
    
      return normalized;
    } catch (error) {
      console.error('Failed to normalize product:', error, rawProduct);
      // Return minimal valid product
      return {
        name: String(rawProduct?.name || rawProduct?.title || 'Unknown Product'),
        scrapedAt: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Normalize a batch of products
   */
  static normalizeProducts(rawProducts: any[]): NormalizedProduct[] {
    return rawProducts.map(product => {
      try {
        return this.normalizeProduct(product);
      } catch (error) {
        console.error('Failed to normalize product in batch:', error);
        return {
          name: 'Failed to normalize product',
          scrapedAt: new Date().toISOString(),
        };
      }
    }).filter(product => product.name !== 'Failed to normalize product');
  }
}