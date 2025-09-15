import { ContentExtractor, ExtractedContent } from './content-extractor';
import * as cheerio from 'cheerio';
import { ProductNormalizer, NormalizedProduct } from './product-normalizer';
import { PatternLearner } from './pattern-learner';
import { configManager } from './scraper-config';
import { PriceParser, ParsedPrice } from './price-parser';

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

export class EcommerceExtractor extends ContentExtractor {
  /**
   * Platform detection signatures
   */
  private static platformSignatures = {
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
  private static productSelectors = {
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
   * Enhanced extraction for e-commerce sites
   */
  static async extractEcommerce(html: string, url: string): Promise<EcommerceExtractedContent> {
    // First get base content
    const baseContent = this.extractWithReadability(html, url);
    
    // Load HTML for detailed parsing
    const $ = cheerio.load(html);
    
    // Detect platform
    const platform = this.detectPlatform($);
    
    // Detect page type
    const pageType = this.detectPageType($, url);
    
    // Extract e-commerce specific data
    let products: NormalizedProduct[] = [];
    let pagination;
    let breadcrumbs: any = null;
    let totalProducts;
    
    if (pageType === 'product') {
      // Single product page
      const product = await this.extractProductData($, url);
      if (product) products = [product];
    } else if (pageType === 'category' || pageType === 'search') {
      // Product listing page
      products = await this.extractProductListing($, url, platform);
      pagination = this.extractPagination($, url);
      totalProducts = this.extractTotalProductCount($);
    }
    
    breadcrumbs = this.extractBreadcrumbs($);
    
    // Create consolidated metadata for backward compatibility and easier access
    const firstProduct = products?.[0];
    const consolidatedMetadata = firstProduct ? {
      productSku: firstProduct.sku,
      productName: firstProduct.name,
      productPrice: firstProduct.price?.formatted || 
                    (typeof firstProduct.price === 'object' ? JSON.stringify(firstProduct.price) : firstProduct.price),
      productInStock: firstProduct.availability?.inStock,
      productBrand: firstProduct.brand,
      productCategory: firstProduct.categories?.[0],
      platform,
      pageType,
      // Include business info in consolidated format
      businessInfo: baseContent.metadata.businessInfo || this.extractBusinessInfo($)
    } : {
      platform,
      pageType,
      businessInfo: baseContent.metadata.businessInfo || this.extractBusinessInfo($)
    };
    
    return {
      ...baseContent,
      platform,
      pageType,
      products,
      pagination,
      breadcrumbs,
      // Merge consolidated metadata into the existing metadata
      metadata: {
        ...baseContent.metadata,
        ...consolidatedMetadata,
        // Keep ecommerceData as a separate structured object for advanced use cases
        ecommerceData: {
          platform,
          pageType,
          products,
          pagination,
          breadcrumbs,
          totalProducts
        }
      }
    };
  }

  /**
   * Detect e-commerce platform
   */
  private static detectPlatform($: cheerio.CheerioAPI): string | undefined {
    for (const [platform, signatures] of Object.entries(this.platformSignatures)) {
      for (const signature of signatures) {
        if ($(signature).length > 0) {
          return platform;
        }
      }
    }
    
    // Check for generic e-commerce indicators
    if ($('[itemtype*="schema.org/Product"]').length > 0 ||
        $('.product, .product-item').length > 0 ||
        $('script[type="application/ld+json"]:contains("Product")').length > 0) {
      return 'generic-ecommerce';
    }
    
    return undefined;
  }

  /**
   * Detect page type
   */
  private static detectPageType($: cheerio.CheerioAPI, url: string): EcommerceExtractedContent['pageType'] {
    const urlLower = url.toLowerCase();
    
    // URL-based detection
    if (urlLower.includes('/product/') || urlLower.includes('/p/')) {
      return 'product';
    }
    if (urlLower.includes('/category/') || urlLower.includes('/shop/') || urlLower.includes('/collection/')) {
      return 'category';
    }
    if (urlLower.includes('/search') || urlLower.includes('?q=') || urlLower.includes('?s=')) {
      return 'search';
    }
    if (urlLower.includes('/cart')) {
      return 'cart';
    }
    if (urlLower.includes('/checkout')) {
      return 'checkout';
    }
    
    // Content-based detection
    if ($('[itemtype*="schema.org/Product"]').length === 1 || 
        $('.product-single, .single-product').length > 0) {
      return 'product';
    }
    if ($('.product-list, .product-grid, .products').length > 0 &&
        $('.product, .product-item').length > 1) {
      return 'category';
    }
    
    return 'other';
  }

  /**
   * Extract single product data
   */
  private static async extractProductData($: cheerio.CheerioAPI, url: string): Promise<NormalizedProduct | null> {
    let rawProduct: any = null;
    let extractionMethod: string = 'unknown';
    
    // Get configuration for extraction strategies
    const config = configManager.getConfig();
    const platform = this.detectPlatform($);
    
    // Get platform-specific configuration if available
    const platformConfig = platform ? config.extraction.platformOverrides[platform] : null;
    const extractionPriority = platformConfig?.extractionPriority || config.extraction.strategies.fallbackChain;
    
    // Try extraction methods in configured priority order
    for (const method of extractionPriority) {
      if (rawProduct) break;
      
      switch (method) {
        case 'learned-patterns':
          if (config.extraction.strategies.patternLearningEnabled) {
            const learnedProduct = await PatternLearner.applyPatterns(url, $);
            if (learnedProduct && learnedProduct.name) {
              rawProduct = learnedProduct;
              extractionMethod = 'learned-patterns';
            }
          }
          break;
          
        case 'json-ld':
          if (config.extraction.strategies.jsonLdEnabled) {
            rawProduct = this.extractJsonLdProduct($);
            if (rawProduct) extractionMethod = 'json-ld';
          }
          break;
          
        case 'microdata':
          if (config.extraction.strategies.microdataEnabled) {
            rawProduct = this.extractMicrodataProduct($);
            if (rawProduct) extractionMethod = 'microdata';
          }
          break;
          
        case 'dom':
          if (config.extraction.strategies.domScrapingEnabled) {
            // Use platform-specific selectors if available
            rawProduct = this.extractProductFromDOM($, platformConfig?.selectors);
            if (rawProduct) extractionMethod = 'dom';
          }
          break;
      }
    }
    
    // If we found a product, normalize it
    if (rawProduct) {
      // Add URL
      rawProduct.url = url;
      
      // Extract additional details
      rawProduct.specifications = this.extractSpecifications($);
      rawProduct.variants = this.extractVariants($);
      
      // Normalize the product
      const normalizedProduct = ProductNormalizer.normalizeProduct(rawProduct);
      
      // Learn from successful extraction
      if (normalizedProduct && normalizedProduct.name) {
        await PatternLearner.learnFromExtraction(url, [normalizedProduct], {
          platform: this.detectPlatform($),
          extractionMethod
        });
      }
      
      return normalizedProduct;
    }
    
    return null;
  }

  /**
   * Extract product from JSON-LD
   */
  private static extractJsonLdProduct($: cheerio.CheerioAPI): ProductData | null {
    const scripts = $('script[type="application/ld+json"]');
    
    for (let i = 0; i < scripts.length; i++) {
      try {
        const data = JSON.parse($(scripts[i]).html() || '{}');
        
        // Handle both single product and product array
        const products = Array.isArray(data) ? data : [data];
        
        for (const item of products) {
          if (item['@type'] === 'Product' || item.type === 'Product') {
            const priceValue = item.offers?.price || item.price;
            
            return {
              name: item.name,
              sku: item.sku,
              description: item.description,
              brand: item.brand?.name || item.brand,
              rawPrice: priceValue ? `${priceValue}` : undefined,
              price: priceValue ? PriceParser.parse(`${priceValue}`) : undefined,
              availability: {
                inStock: item.offers?.availability?.includes('InStock'),
                availabilityText: item.offers?.availability,
              },
              images: item.image ? (Array.isArray(item.image) ? item.image : [item.image]).map((img: any) => ({
                url: typeof img === 'string' ? img : img.url,
              })) : [],
              rating: item.aggregateRating ? {
                value: parseFloat(item.aggregateRating.ratingValue),
                count: parseInt(item.aggregateRating.reviewCount),
              } : undefined,
            };
          }
        }
      } catch (e) {
        // Continue to next script
      }
    }
    
    return null;
  }

  /**
   * Extract product from microdata
   */
  private static extractMicrodataProduct($: cheerio.CheerioAPI): ProductData | null {
    const product = $('[itemtype*="schema.org/Product"]').first();
    
    if (product.length === 0) return null;
    
    const priceText = product.find('[itemprop="price"]').first().attr('content') || 
                      product.find('[itemprop="price"]').first().text()?.trim();
    
    return {
      name: product.find('[itemprop="name"]').first().text()?.trim(),
      sku: product.find('[itemprop="sku"]').first().text()?.trim(),
      description: product.find('[itemprop="description"]').first().text()?.trim(),
      brand: product.find('[itemprop="brand"]').first().text()?.trim(),
      rawPrice: priceText,
      price: priceText ? PriceParser.parse(priceText) : undefined,
      availability: {
        availabilityText: product.find('[itemprop="availability"]').first().attr('content'),
        inStock: product.find('[itemprop="availability"]').first().attr('content')?.includes('InStock'),
      },
      images: product.find('[itemprop="image"]').map((_, img) => ({
        url: $(img).attr('src') || $(img).attr('content') || '',
      })).get(),
    };
  }

  /**
   * Extract product from DOM using common selectors
   */
  private static extractProductFromDOM($: cheerio.CheerioAPI, customSelectors?: any): ProductData | null {
    const findFirst = (selectors: string[]): string | undefined => {
      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          return element.text()?.trim() || element.attr('content') || element.val()?.toString();
        }
      }
      return undefined;
    };
    
    const findImages = (selectors: string[]): Array<{url: string; alt?: string}> => {
      const images: Array<{url: string; alt?: string}> = [];
      for (const selector of selectors) {
        $(selector).each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy');
          if (src) {
            images.push({
              url: src,
              alt: $(img).attr('alt'),
            });
          }
        });
        if (images.length > 0) break;
      }
      return images;
    };
    
    // Merge custom selectors with defaults
    const selectors = {
      productName: customSelectors?.productName || this.productSelectors.product.name,
      price: customSelectors?.price || this.productSelectors.product.price,
      originalPrice: customSelectors?.originalPrice || this.productSelectors.product.originalPrice,
      sku: customSelectors?.sku || this.productSelectors.product.sku,
      availability: customSelectors?.availability || this.productSelectors.product.availability,
      description: customSelectors?.description || this.productSelectors.product.description,
      images: customSelectors?.image || this.productSelectors.product.images,
    };
    
    const name = findFirst(selectors.productName);
    if (!name) return null; // No product found
    
    // Extract raw price strings
    const rawPriceString = findFirst(selectors.price);
    const rawOriginalPrice = findFirst(selectors.originalPrice);
    
    // Combine price strings for better parsing
    const combinedPriceString = rawOriginalPrice && rawPriceString 
      ? `${rawOriginalPrice} ${rawPriceString}` 
      : rawPriceString || '';
    
    // Parse the price
    const parsedPrice = PriceParser.parse(combinedPriceString);
    
    // Clean the SKU
    const rawSku = findFirst(selectors.sku);
    const cleanSku = PriceParser.cleanSKU(rawSku);
    
    return {
      name,
      sku: cleanSku || undefined,
      rawPrice: combinedPriceString,
      price: parsedPrice,
      availability: {
        availabilityText: findFirst(selectors.availability),
        inStock: !$('.out-of-stock').length && ($('.in-stock').length > 0 || 
                 findFirst(selectors.availability)?.toLowerCase().includes('in stock')),
      },
      description: findFirst(selectors.description),
      images: findImages(selectors.images),
    };
  }

  /**
   * Extract product listing
   */
  private static async extractProductListing($: cheerio.CheerioAPI, url: string, platform?: string): Promise<NormalizedProduct[]> {
    const products: ProductData[] = [];
    
    // Find product containers
    const productContainers = $(this.productSelectors.listing.products.join(', '));
    
    productContainers.each((_, element) => {
      const $product = $(element);
      
      // Extract basic product info from listing
      const productName = $product.find('h2, h3, h4, .product-title, .product-name').first().text()?.trim();
      const rawPriceText = $product.find('.price, .product-price, [class*="price"]').first().text()?.trim();
      const rawSkuText = $product.find('.sku').text()?.trim();
      
      const product: ProductData = {
        name: productName,
        sku: PriceParser.cleanSKU(rawSkuText) || undefined,
        rawPrice: rawPriceText,
        price: PriceParser.parse(rawPriceText),
        images: [{
          url: $product.find('img').first().attr('src') || 
               $product.find('img').first().attr('data-src') || '',
        }],
      };
      
      // Only add if we found a name
      if (product.name) {
        products.push(product);
      }
    });
    
    // Normalize all products
    const normalizedProducts = products.map(p => ProductNormalizer.normalizeProduct(p));
    
    // Learn from successful extraction if we found products
    if (normalizedProducts.length > 0) {
      await PatternLearner.learnFromExtraction(url, normalizedProducts, {
        platform,
        extractionMethod: 'dom-listing'
      });
    }
    
    return normalizedProducts;
  }

  /**
   * Extract pagination info
   */
  private static extractPagination($: cheerio.CheerioAPI, currentUrl: string): EcommerceExtractedContent['pagination'] {
    const pagination = $(this.productSelectors.listing.pagination.join(', ')).first();
    
    if (pagination.length === 0) return undefined;
    
    // Extract current page
    const current = parseInt(
      pagination.find('.current, .active, [aria-current="page"]').first().text() || '1'
    );
    
    // Extract total pages
    const pageNumbers = pagination.find('a').map((_, el) => {
      const text = $(el).text();
      const num = parseInt(text);
      return isNaN(num) ? 0 : num;
    }).get();
    const total = Math.max(...pageNumbers, current);
    
    // Extract next/prev URLs
    const nextUrl = pagination.find(this.productSelectors.listing.nextPage.join(', ')).first().attr('href');
    const prevUrl = pagination.find('.prev, .pagination-prev, a[rel="prev"]').first().attr('href');
    
    return {
      current,
      total: total > 0 ? total : undefined,
      nextUrl: nextUrl ? new URL(nextUrl, currentUrl).href : undefined,
      prevUrl: prevUrl ? new URL(prevUrl, currentUrl).href : undefined,
    };
  }

  /**
   * Extract breadcrumbs
   */
  private static extractBreadcrumbs($: cheerio.CheerioAPI): Array<{name: string; url?: string}> {
    const breadcrumbs: Array<{name: string; url?: string}> = [];
    
    // Common breadcrumb selectors
    const breadcrumbContainers = [
      '.breadcrumb',
      '.breadcrumbs',
      'nav[aria-label="breadcrumb"]',
      '.woocommerce-breadcrumb',
      '[itemtype*="BreadcrumbList"]',
    ];
    
    for (const selector of breadcrumbContainers) {
      const container = $(selector).first();
      if (container.length > 0) {
        container.find('a, span:not(.separator)').each((_, el) => {
          const $el = $(el);
          const name = $el.text()?.trim();
          if (name && !['>', '/', '»', '›'].includes(name)) {
            breadcrumbs.push({
              name,
              url: $el.is('a') ? $el.attr('href') : undefined,
            });
          }
        });
        if (breadcrumbs.length > 0) break;
      }
    }
    
    return breadcrumbs;
  }
  
  /**
   * Extract product variants (colors, sizes, etc.)
   */
  private static extractVariants($: cheerio.CheerioAPI): any[] {
    const variants: any[] = [];
    
    // WooCommerce variations
    $('.variations select').each((_, select) => {
      const $select = $(select);
      const label = $select.attr('data-attribute_name') || 
                   $select.attr('name')?.replace('attribute_', '') ||
                   $select.prev('label').text();
      
      $select.find('option').each((_, option) => {
        const value = $(option).text()?.trim();
        if (value && value !== 'Choose an option') {
          variants.push({
            type: label,
            value: value,
            price: $(option).attr('data-price'),
          });
        }
      });
    });
    
    // Shopify variants
    $('[data-variant-id]').each((_, el) => {
      const $el = $(el);
      variants.push({
        id: $el.attr('data-variant-id'),
        value: $el.text()?.trim(),
        price: $el.attr('data-price'),
        available: $el.attr('data-available') !== 'false',
      });
    });
    
    // Generic color swatches
    $('.color-swatch, .swatch-color, [class*="color-option"]').each((_, el) => {
      const $el = $(el);
      variants.push({
        type: 'color',
        value: $el.attr('title') || $el.attr('data-color') || $el.text()?.trim(),
        image: $el.find('img').attr('src'),
      });
    });
    
    // Generic size options
    $('.size-option, [class*="size-select"] option').each((_, el) => {
      const $el = $(el);
      const value = $el.text()?.trim();
      if (value && value !== 'Select Size') {
        variants.push({
          type: 'size',
          value: value,
        });
      }
    });
    
    return variants;
  }
  
  /**
   * Extract product specifications
   */
  private static extractSpecifications($: cheerio.CheerioAPI): any[] {
    const specs: any[] = [];
    
    // Look for specification tables
    $('.specifications table, .product-specs table, #tab-additional_information table').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const $row = $(row);
        const name = $row.find('td:first, th:first').text()?.trim();
        const value = $row.find('td:last').text()?.trim();
        
        if (name && value && name !== value) {
          specs.push({ name, value });
        }
      });
    });
    
    // Look for definition lists
    $('dl.specs, dl.specifications').each((_, dl) => {
      $(dl).find('dt').each((i, dt) => {
        const name = $(dt).text()?.trim();
        const value = $(dt).next('dd').text()?.trim();
        
        if (name && value) {
          specs.push({ name, value });
        }
      });
    });
    
    // Look for list-based specs
    $('.product-features li, .specifications li').each((_, li) => {
      const text = $(li).text()?.trim();
      const colonIndex = text.indexOf(':');
      
      if (colonIndex > 0 && colonIndex < 50) {
        specs.push({
          name: text.substring(0, colonIndex).trim(),
          value: text.substring(colonIndex + 1).trim(),
        });
      }
    });
    
    return specs;
  }
  
  /**
   * Extract business information
   */
  private static extractBusinessInfo($: cheerio.CheerioAPI): any {
    return {
      contactInfo: {
        phones: this.extractPhoneNumbers($),
        emails: this.extractEmails($),
        addresses: this.extractAddresses($)
      },
      businessHours: this.extractBusinessHours($)
    };
  }

  /**
   * Extract phone numbers from page
   */
  private static extractPhoneNumbers($: cheerio.CheerioAPI): string[] {
    const phones: string[] = [];
    const phoneRegex = /(?:\+?[\d\s\-\(\)]{10,})/g;
    
    // Check common phone selectors
    $('.phone, .telephone, .contact-phone, [href^="tel:"]').each((_, el) => {
      const text = $(el).text().trim();
      const matches = text.match(phoneRegex);
      if (matches) phones.push(...matches);
    });
    
    return [...new Set(phones)]; // Remove duplicates
  }

  /**
   * Extract email addresses from page
   */
  private static extractEmails($: cheerio.CheerioAPI): string[] {
    const emails: string[] = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Check common email selectors
    $('.email, .contact-email, [href^="mailto:"]').each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      
      if (href?.startsWith('mailto:')) {
        emails.push(href.replace('mailto:', ''));
      }
      
      const matches = text.match(emailRegex);
      if (matches) emails.push(...matches);
    });
    
    return [...new Set(emails)]; // Remove duplicates
  }

  /**
   * Extract addresses from page
   */
  private static extractAddresses($: cheerio.CheerioAPI): string[] {
    const addresses: string[] = [];
    
    // Check common address selectors
    $('.address, .contact-address, [itemtype*="PostalAddress"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text) addresses.push(text);
    });
    
    return addresses;
  }

  /**
   * Extract business hours from page
   */
  private static extractBusinessHours($: cheerio.CheerioAPI): string[] {
    const hours: string[] = [];
    
    // Check common business hours selectors
    $('.hours, .business-hours, .opening-hours, [itemtype*="OpeningHoursSpecification"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text) hours.push(text);
    });
    
    return hours;
  }

  /**
   * Extract total product count from listing page
   */
  private static extractTotalProductCount($: cheerio.CheerioAPI): number | undefined {
    // Look for result count text
    const countSelectors = [
      '.woocommerce-result-count',
      '.product-count',
      '.results-count',
      '.toolbar-amount',
      '[class*="result-count"]',
    ];
    
    for (const selector of countSelectors) {
      const text = $(selector).first().text();
      if (text) {
        // Extract number from text like "Showing 1-12 of 48 results"
        const match = text.match(/(\d+)\s*(?:results?|products?|items?)(?:\s|$)/i);
        if (match && match[1]) {
          return parseInt(match[1]);
        }
        
        // Try "of X" pattern
        const ofMatch = text.match(/of\s+(\d+)/i);
        if (ofMatch && ofMatch[1]) {
          return parseInt(ofMatch[1]);
        }
      }
    }
    
    // Count products on page as fallback
    return $('.product, .product-item').length;
  }
}