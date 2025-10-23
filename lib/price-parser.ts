/**
 * Price Parser Utility
 * Handles complex e-commerce price formats including sales, VAT, and contact pricing
 */

export interface ParsedPrice {
  value: number | null;
  formatted: string;
  currency: string;
  regularPrice?: number;
  salePrice?: number;
  onSale: boolean;
  discount?: number;
  vatIncluded?: boolean;
  vatExcluded?: boolean;
  priceIncVAT?: number;
  priceExcVAT?: number;
  requiresContact?: boolean;
  raw: string;
}

export class PriceParser {
  private static currencySymbols: Record<string, string> = {
    '£': 'GBP',
    '$': 'USD',
    '€': 'EUR',
    '¥': 'JPY',
    '₹': 'INR',
    'R': 'ZAR',
    'A$': 'AUD',
    'C$': 'CAD',
  };

  /**
   * Parse complex price strings from e-commerce sites
   * Handles various formats including WooCommerce, Shopify, etc.
   */
  static parse(priceString: string | null | undefined): ParsedPrice {
    if (!priceString || typeof priceString !== 'string') {
      return {
        value: null,
        formatted: 'No price',
        currency: 'GBP',
        onSale: false,
        raw: priceString || '',
      };
    }

    // Handle "Contact us" or similar pricing
    if (this.isContactPrice(priceString)) {
      return {
        value: null,
        formatted: 'Contact for price',
        currency: 'GBP',
        onSale: false,
        requiresContact: true,
        raw: priceString,
      };
    }

    // Detect currency
    const currency = this.detectCurrency(priceString);
    
    // Extract all price values
    const prices = this.extractPriceValues(priceString);
    
    if (prices.length === 0) {
      return {
        value: null,
        formatted: 'No price',
        currency,
        onSale: false,
        raw: priceString,
      };
    }

    // Parse based on detected patterns
    if (this.isSalePrice(priceString)) {
      return this.parseSalePrice(priceString, prices, currency);
    } else if (this.hasVATPrice(priceString)) {
      return this.parseVATPrice(priceString, prices, currency);
    } else {
      const firstPrice = prices[0];
      if (firstPrice !== undefined) {
        return this.parseSimplePrice(firstPrice, currency, priceString);
      }
      // Fallback - should never reach here due to the length check above
      return {
        value: null,
        formatted: 'No price',
        currency,
        onSale: false,
        raw: priceString,
      };
    }
  }

  /**
   * Check if price requires contact
   */
  private static isContactPrice(priceString: string): boolean {
    const contactPatterns = [
      /contact\s*(us|for|to)/i,
      /call\s*for\s*price/i,
      /price\s*on\s*request/i,
      /por/i, // Price on request
      /poa/i, // Price on application
      /enquire/i,
      /quote/i,
    ];
    
    return contactPatterns.some(pattern => pattern.test(priceString));
  }

  /**
   * Detect currency from price string
   */
  private static detectCurrency(priceString: string): string {
    // Check for currency codes first (more specific than symbols)
    const currencyCodeMatch = priceString.match(/\b(GBP|USD|EUR|JPY|INR|ZAR|AUD|CAD)\b/i);
    if (currencyCodeMatch && currencyCodeMatch[1]) {
      return currencyCodeMatch[1].toUpperCase();
    }

    // Then check for currency symbols
    for (const [symbol, code] of Object.entries(this.currencySymbols)) {
      if (priceString.includes(symbol)) {
        return code;
      }
    }

    return 'GBP'; // Default to GBP
  }

  /**
   * Extract numeric price values from string
   */
  private static extractPriceValues(priceString: string): number[] {
    // Match various price formats
    const pricePatterns = [
      /[£$€¥₹][\s]?([\d,]+\.?\d*)/g,
      /\b(\d+[,\d]*\.?\d*)\s*(?:GBP|USD|EUR)/gi,
      /\b(\d+[,\d]*\.?\d*)\b/g,
    ];
    
    const prices: number[] = [];
    
    for (const pattern of pricePatterns) {
      const matches = priceString.matchAll(pattern);
      for (const match of matches) {
        const priceStr = match[1] || match[0];
        const cleaned = priceStr.replace(/[^0-9.]/g, '');
        const value = parseFloat(cleaned);
        
        if (!isNaN(value) && value > 0) {
          prices.push(value);
        }
      }
      
      if (prices.length > 0) break;
    }
    
    // Remove duplicates and sort
    return [...new Set(prices)].sort((a, b) => b - a);
  }

  /**
   * Check if string contains sale price pattern
   */
  private static isSalePrice(priceString: string): boolean {
    const salePatterns = [
      /original\s*price/i,
      /was\s*[:£$€]/i,
      /current\s*price/i,
      /sale\s*price/i,
      /reduced\s*from/i,
      /save\s*[:£$€]/i,
      /<del>/i,
      /strike/i,
    ];
    
    return salePatterns.some(pattern => pattern.test(priceString));
  }

  /**
   * Check if string contains VAT price information
   */
  private static hasVATPrice(priceString: string): boolean {
    return /\b(inc|incl|ex|excl|excluding|including)\s*(\.?\s*)?vat\b/i.test(priceString);
  }

  /**
   * Parse sale price format
   */
  private static parseSalePrice(
    priceString: string,
    prices: number[],
    currency: string
  ): ParsedPrice {
    // Try to extract specific sale and regular prices
    const currentMatch = priceString.match(/current\s*price\s*is\s*[:£$€]?\s*([\d,]+\.?\d*)/i);
    const originalMatch = priceString.match(/original\s*price\s*was\s*[:£$€]?\s*([\d,]+\.?\d*)/i);
    
    let salePrice: number;
    let regularPrice: number;
    
    if (currentMatch && currentMatch[1] && originalMatch && originalMatch[1]) {
      salePrice = parseFloat(currentMatch[1].replace(/,/g, ''));
      regularPrice = parseFloat(originalMatch[1].replace(/,/g, ''));
    } else if (prices.length >= 2) {
      // Assume lower price is sale price
      salePrice = Math.min(...prices);
      regularPrice = Math.max(...prices);
    } else {
      salePrice = prices[0] ?? 0;
      regularPrice = prices[0] ?? 0;
    }
    
    const discount = regularPrice > salePrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;
    
    return {
      value: salePrice,
      formatted: discount > 0 
        ? `${this.formatCurrency(salePrice, currency)} (was ${this.formatCurrency(regularPrice, currency)}, ${discount}% off)`
        : this.formatCurrency(salePrice, currency),
      currency,
      regularPrice,
      salePrice,
      onSale: discount > 0,
      discount: discount > 0 ? discount : undefined,
      raw: priceString,
    };
  }

  /**
   * Parse VAT price format
   */
  private static parseVATPrice(
    priceString: string,
    prices: number[],
    currency: string
  ): ParsedPrice {
    const hasIncVAT = /inc(l?\.?\s*)?vat/i.test(priceString);
    const hasExcVAT = /ex(cl?\.?\s*)?vat/i.test(priceString);
    
    let priceIncVAT: number | undefined;
    let priceExcVAT: number | undefined;
    
    if (prices.length >= 2 && hasIncVAT && hasExcVAT) {
      // Both prices present, higher is inc VAT
      priceIncVAT = Math.max(...prices);
      priceExcVAT = Math.min(...prices);
    } else if (hasIncVAT) {
      priceIncVAT = prices[0] ?? 0;
      // Calculate exc VAT (assuming 20% VAT)
      priceExcVAT = (prices[0] ?? 0) / 1.2;
    } else if (hasExcVAT) {
      priceExcVAT = prices[0] ?? 0;
      // Calculate inc VAT (assuming 20% VAT)
      priceIncVAT = (prices[0] ?? 0) * 1.2;
    } else {
      priceIncVAT = prices[0] ?? 0;
      priceExcVAT = prices.length > 1 ? prices[1] : undefined;
    }
    
    return {
      value: priceIncVAT || priceExcVAT || prices[0] || 0,
      formatted: priceIncVAT 
        ? `${this.formatCurrency(priceIncVAT, currency)} inc VAT`
        : `${this.formatCurrency(priceExcVAT || prices[0] || 0, currency)} exc VAT`,
      currency,
      onSale: false,
      vatIncluded: hasIncVAT,
      vatExcluded: hasExcVAT,
      priceIncVAT,
      priceExcVAT,
      raw: priceString,
    };
  }

  /**
   * Parse simple price format
   */
  private static parseSimplePrice(
    price: number,
    currency: string,
    raw: string
  ): ParsedPrice {
    return {
      value: price,
      formatted: this.formatCurrency(price, currency),
      currency,
      onSale: false,
      raw,
    };
  }

  /**
   * Format price with currency symbol
   */
  private static formatCurrency(value: number, currency: string): string {
    const symbols: Record<string, string> = {
      'GBP': '£',
      'USD': '$',
      'EUR': '€',
      'JPY': '¥',
      'INR': '₹',
      'ZAR': 'R',
      'AUD': 'A$',
      'CAD': 'C$',
    };
    
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${value.toFixed(2)}`;
  }

  /**
   * Clean SKU by removing common prefixes
   */
  static cleanSKU(sku: string | null | undefined): string | null {
    if (!sku || typeof sku !== 'string') {
      return null;
    }
    
    // Remove common SKU prefixes
    return sku
      .replace(/^(sku|SKU|item|Item|product|Product|code|Code):\s*/i, '')
      .replace(/^#/, '')
      .trim() || null;
  }

  /**
   * Parse multiple prices from a product listing
   */
  static parseMultiplePrices(prices: (string | null | undefined)[]): ParsedPrice[] {
    return prices
      .filter(p => p)
      .map(price => this.parse(price));
  }

  /**
   * Get the best price from multiple parsed prices
   */
  static getBestPrice(prices: ParsedPrice[]): ParsedPrice | null {
    const validPrices = prices.filter(p => p.value !== null);
    
    if (validPrices.length === 0) {
      return null;
    }
    
    // Prefer sale prices
    const salePrices = validPrices.filter(p => p.onSale);
    if (salePrices.length > 0) {
      return salePrices.reduce((best, current) => 
        (current.value || 0) < (best.value || Infinity) ? current : best
      );
    }
    
    // Return lowest regular price
    return validPrices.reduce((best, current) => 
      (current.value || 0) < (best.value || Infinity) ? current : best
    );
  }
}