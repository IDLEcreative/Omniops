import type { ExtractedContent } from '@/lib/content-extractor';
import type { NormalizedProduct } from '@/lib/product-normalizer';
import type { ParsedPrice } from '@/lib/price-parser';

export interface ProductData {
  name?: string;
  sku?: string;
  rawPrice?: string; // Original price string
  price?: ParsedPrice; // Parsed price object
  availability?: {
    inStock?: boolean;
    stockLevel?: string;
    availabilityText?: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
    isMain?: boolean;
  }>;
  variants?: Array<{
    name: string;
    options: string[];
    selected?: string;
  }>;
  description?: string;
  specifications?: Record<string, string>;
  categories?: string[];
  brand?: string;
  rating?: {
    value?: number;
    count?: number;
  };
}

export interface EcommerceExtractedContent extends ExtractedContent {
  platform?: string;
  pageType?: 'product' | 'category' | 'search' | 'cart' | 'checkout' | 'other';
  products?: NormalizedProduct[];
  pagination?: {
    current?: number;
    total?: number;
    nextUrl?: string;
    prevUrl?: string;
    hasMore?: boolean;
  };
  breadcrumbs?: Array<{
    name: string;
    url?: string;
  }>;
  totalProducts?: number;
}

/**
 * Platform detection signatures
 */
export const PLATFORM_SIGNATURES = {
  woocommerce: [
    'body.woocommerce',
    'body.woocommerce-page',
    'meta[name="generator"][content*="WooCommerce"]',
    '.woocommerce-product',
  ],
  shopify: [
    'meta[name="shopify-digital-wallet"]',
    'script[src*="cdn.shopify.com"]',
    '#shopify-features',
    '.shopify-section',
  ],
  magento: [
    'body[class*="catalog-product"]',
    'body[class*="catalog-category"]',
    'script[src*="/static/version"]',
    '.magento-init',
  ],
  bigcommerce: [
    'meta[name="generator"][content*="BigCommerce"]',
    'script[src*="bigcommerce.com"]',
    '.bigcommerce-product',
  ],
  prestashop: [
    'meta[name="generator"][content*="PrestaShop"]',
    'body[id*="prestashop"]',
    '.prestashop-product',
  ],
  squarespace: [
    'meta[name="generator"][content*="Squarespace"]',
    'body.squarespace',
    '.sqs-block-product',
  ],
};

/**
 * Universal product selectors for different platforms
 */
export const PRODUCT_SELECTORS = {
  // JSON-LD structured data (most reliable)
  jsonLd: 'script[type="application/ld+json"]',

  // Microdata
  microdata: '[itemtype*="schema.org/Product"]',

  // Common product selectors
  product: {
    name: [
      'h1[itemprop="name"]',
      '.product-title',
      '.product-name',
      '.product_title',
      'h1.product-name',
      'h1[class*="product"]',
      '[data-product-name]',
      'h1:not([class])',
    ],
    price: [
      '[itemprop="price"]',
      '.price',
      '.product-price',
      '.price-now',
      '.actual-price',
      '[data-product-price]',
      '.woocommerce-Price-amount',
      'span[class*="price"]',
    ],
    originalPrice: [
      '.price-was',
      '.original-price',
      '.old-price',
      'del .price',
      '.price-regular',
      '[data-original-price]',
    ],
    sku: [
      '[itemprop="sku"]',
      '.sku',
      '.product-sku',
      '[data-product-sku]',
      '.sku_wrapper .sku',
    ],
    availability: [
      '[itemprop="availability"]',
      '.stock',
      '.availability',
      '.in-stock',
      '.out-of-stock',
      '[data-availability]',
      '.stock-status',
    ],
    description: [
      '[itemprop="description"]',
      '.product-description',
      '.description',
      '#tab-description',
      '.woocommerce-product-details__short-description',
    ],
    images: [
      '[itemprop="image"]',
      '.product-image img',
      '.product-photo img',
      '.woocommerce-product-gallery__image img',
      '.product-main-image img',
      '[data-product-image]',
    ],
  },

  // Category/listing page selectors
  listing: {
    products: [
      '.product',
      '.product-item',
      '.product-card',
      'article.product',
      '[data-product-id]',
      '.grid-item',
    ],
    pagination: [
      '.pagination',
      '.page-numbers',
      '.pager',
      'nav[aria-label="pagination"]',
    ],
    nextPage: [
      '.next',
      '.pagination-next',
      'a[rel="next"]',
      '.page-numbers .next',
    ],
  },
};

/**
 * Business information structure
 */
export interface BusinessInfo {
  contactInfo: {
    phones: string[];
    emails: string[];
    addresses: string[];
  };
  businessHours: string[];
}

/**
 * Product specification structure
 */
export interface ProductSpecification {
  name: string;
  value: string;
}

/**
 * Product variant structure
 */
export interface ProductVariant {
  type?: string;
  value?: string;
  price?: string;
  id?: string;
  available?: boolean;
  image?: string;
}
