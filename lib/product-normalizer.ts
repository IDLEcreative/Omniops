/**
 * Product Data Normalizer
 * Cleans and standardizes e-commerce product data from various sources
 */

import type {
  NormalizedProduct,
  NormalizedPrice,
  ProductImage,
  ProductAvailability,
  ProductSpecification,
  ProductRating,
  ProductPriceRange,
  RawProduct,
} from './product-normalizer-types';

import {
  PriceNormalizationStrategy,
  AvailabilityNormalizationStrategy,
  SpecificationExtractionStrategy,
  NameNormalizationStrategy,
} from './product-normalizer-strategies';

export * from './product-normalizer-types';

/**
 * Main Product Normalizer Class
 */
export class ProductNormalizer {
  /**
   * Normalize price from various formats
   */
  static normalizePrice(
    priceText: string | number | undefined,
    currency?: string
  ): NormalizedPrice | undefined {
    return PriceNormalizationStrategy.normalizePrice(priceText, currency);
  }

  /**
   * Format price with currency
   */
  static formatPrice(amount: number, currency: string): string {
    return PriceNormalizationStrategy.formatPrice(amount, currency);
  }

  /**
   * Normalize availability status
   */
  static normalizeAvailability(text: string | undefined): ProductAvailability | undefined {
    return AvailabilityNormalizationStrategy.normalizeAvailability(text);
  }

  /**
   * Extract product specifications from various formats
   */
  static extractSpecifications(content: string | any): ProductSpecification[] {
    return SpecificationExtractionStrategy.extractSpecifications(content);
  }

  /**
   * Clean and normalize product name
   */
  static normalizeName(name: string | undefined): string {
    return NameNormalizationStrategy.normalizeName(name);
  }

  /**
   * Normalize product images
   */
  private static normalizeImages(rawProduct: RawProduct): ProductImage[] | undefined {
    if (!rawProduct.images && !rawProduct.image) return undefined;

    const images = Array.isArray(rawProduct.images)
      ? rawProduct.images
      : rawProduct.image
      ? [rawProduct.image]
      : [];

    const normalized = images
      .map((img: any, index: number) => ({
        url: typeof img === 'string' ? img : img.url || img.src,
        alt: typeof img === 'object' ? img.alt : undefined,
        title: typeof img === 'object' ? img.title : undefined,
        isMain: index === 0,
        position: index,
      }))
      .filter((img: any) => img.url);

    return normalized.length > 0 ? normalized : undefined;
  }

  /**
   * Normalize product rating
   */
  private static normalizeRating(rawProduct: RawProduct): ProductRating | undefined {
    if (!rawProduct.rating) return undefined;

    return {
      value: parseFloat(rawProduct.rating.value || rawProduct.rating),
      max: rawProduct.rating.max || 5,
      count: parseInt(
        String(rawProduct.rating.count || rawProduct.reviewCount || '0')
      ),
    };
  }

  /**
   * Normalize product availability
   */
  private static normalizeProductAvailability(rawProduct: RawProduct): ProductAvailability | undefined {
    if (!rawProduct.availability && !rawProduct.stock && rawProduct.inStock === undefined) {
      return undefined;
    }

    const availabilityText =
      rawProduct.availability ||
      rawProduct.stock ||
      (rawProduct.inStock ? 'In Stock' : 'Out of Stock');

    return this.normalizeAvailability(availabilityText);
  }

  /**
   * Normalize product price range
   */
  private static normalizePriceRange(rawProduct: RawProduct): ProductPriceRange | undefined {
    if (!rawProduct.priceMin || !rawProduct.priceMax) return undefined;

    const min = this.normalizePrice(rawProduct.priceMin, rawProduct.currency);
    const max = this.normalizePrice(rawProduct.priceMax, rawProduct.currency);

    if (!min || !max) return undefined;

    return { min, max };
  }

  /**
   * Normalize product specifications
   */
  private static normalizeSpecifications(rawProduct: RawProduct): ProductSpecification[] | undefined {
    const content = rawProduct.specifications || rawProduct.details || rawProduct.features;
    if (!content) return undefined;

    const specs = this.extractSpecifications(content);
    return specs.length > 0 ? specs : undefined;
  }

  /**
   * Normalize a complete product object
   */
  static normalizeProduct(rawProduct: RawProduct): NormalizedProduct {
    try {
      const normalized: NormalizedProduct = {
        name: this.normalizeName(rawProduct.name || rawProduct.title),
        scrapedAt: new Date().toISOString(),
      };

      // Add core fields
      if (rawProduct.sku) normalized.sku = rawProduct.sku;
      if (rawProduct.url) normalized.url = rawProduct.url;
      if (rawProduct.id) normalized.id = rawProduct.id;

      // Normalize price
      if (rawProduct.price) {
        normalized.price = this.normalizePrice(rawProduct.price, rawProduct.currency);
      }

      // Handle price range
      const priceRange = this.normalizePriceRange(rawProduct);
      if (priceRange) normalized.priceRange = priceRange;

      // Normalize availability
      const availability = this.normalizeProductAvailability(rawProduct);
      if (availability) normalized.availability = availability;

      // Add descriptions
      if (rawProduct.description) normalized.description = rawProduct.description;
      if (rawProduct.shortDescription) normalized.shortDescription = rawProduct.shortDescription;

      // Normalize images
      const images = this.normalizeImages(rawProduct);
      if (images) normalized.images = images;

      // Extract specifications
      const specifications = this.normalizeSpecifications(rawProduct);
      if (specifications) normalized.specifications = specifications;

      // Add categories and breadcrumbs
      if (rawProduct.categories) normalized.categories = rawProduct.categories;
      if (rawProduct.breadcrumbs) normalized.breadcrumbs = rawProduct.breadcrumbs;
      if (rawProduct.tags) normalized.tags = rawProduct.tags;

      // Add brand and manufacturer
      if (rawProduct.brand) normalized.brand = rawProduct.brand;
      if (rawProduct.manufacturer) normalized.manufacturer = rawProduct.manufacturer;
      if (rawProduct.model) normalized.model = rawProduct.model;

      // Add rating
      const rating = this.normalizeRating(rawProduct);
      if (rating) normalized.rating = rating;

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
    return rawProducts
      .map(product => {
        try {
          return this.normalizeProduct(product);
        } catch (error) {
          console.error('Failed to normalize product in batch:', error);
          return null;
        }
      })
      .filter((product): product is NormalizedProduct => product !== null);
  }
}
