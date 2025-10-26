/**
 * Product Normalizer Strategies
 * Normalization strategies for availability, specifications, variants, and names
 */

import type {
  ProductAvailability,
  ProductSpecification,
  ProductVariant,
} from './product-normalizer-types';

import { COMMON_SPEC_PATTERNS } from './product-normalizer-constants';

export { PriceNormalizationStrategy } from './product-normalizer-price';

/**
 * Availability Normalization Strategy
 */
export class AvailabilityNormalizationStrategy {
  /**
   * Extract stock level from text
   */
  static extractStockLevel(text: string): number | undefined {
    const stockMatch = text.match(/(\d+)\s*(in stock|available|left|remaining)/i);
    return stockMatch && stockMatch[1] ? parseInt(stockMatch[1]) : undefined;
  }

  /**
   * Normalize availability status
   */
  static normalizeAvailability(text: string | undefined): ProductAvailability | undefined {
    if (!text) return undefined;

    const lower = text.toLowerCase();

    // Out of stock
    if (lower.includes('out of stock') ||
        lower.includes('sold out') ||
        lower.includes('unavailable')) {
      return {
        inStock: false,
        stockStatus: 'out-of-stock',
      };
    }

    // In stock
    if (lower.includes('in stock') ||
        lower.includes('available') ||
        lower.includes('ready to ship')) {
      const stockLevel = this.extractStockLevel(text);

      return {
        inStock: true,
        stockStatus: stockLevel && stockLevel < 10 ? 'limited' : 'in-stock',
        stockLevel,
      };
    }

    // Pre-order
    if (lower.includes('pre-order') || lower.includes('preorder')) {
      return {
        inStock: false,
        stockStatus: 'pre-order',
      };
    }

    // Backorder
    if (lower.includes('backorder') || lower.includes('back order')) {
      return {
        inStock: false,
        stockStatus: 'backorder',
      };
    }

    // Default
    return {
      inStock: true,
      stockStatus: 'in-stock',
    };
  }
}

/**
 * Specification Extraction Strategy
 */
export class SpecificationExtractionStrategy {
  /**
   * Extract specifications from string content
   */
  static extractFromString(content: string): ProductSpecification[] {
    const specs: ProductSpecification[] = [];

    // Pattern for "Key: Value" format
    const specPattern = /^([^:]+):\s*(.+)$/gm;
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

    return specs;
  }

  /**
   * Extract common specifications
   */
  static extractCommonSpecs(content: string, existingSpecs: ProductSpecification[]): ProductSpecification[] {
    const specs = [...existingSpecs];

    for (const spec of COMMON_SPEC_PATTERNS) {
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

    return specs;
  }

  /**
   * Extract product specifications from various formats
   */
  static extractSpecifications(content: string | any): ProductSpecification[] {
    if (typeof content !== 'string') return [];

    const specs = this.extractFromString(content);
    return this.extractCommonSpecs(content, specs);
  }
}

/**
 * Variant Extraction Strategy
 */
export class VariantExtractionStrategy {
  /**
   * Extract and normalize product variants
   * Note: This is a placeholder for DOM-based extraction
   */
  static extractVariants(element: any): ProductVariant[] {
    // This would be implemented based on actual DOM structure
    return [];
  }
}

/**
 * Name Normalization Strategy
 */
export class NameNormalizationStrategy {
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
}
