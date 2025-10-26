/**
 * Individual product data extraction functions
 */

import type { CheerioAPI } from 'cheerio';
import type { ProductData } from './types';

/**
 * Extract product data from JSON-LD structured data
 */
export function extractJsonLdProductData($: CheerioAPI, productData: ProductData): void {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((_, script) => {
    try {
      const data = JSON.parse($(script).text());
      if (data['@type'] === 'Product' || data.type === 'Product') {
        productData.name = data.name || productData.name;
        productData.description = data.description || productData.description;
        productData.sku = data.sku || data.mpn || productData.sku;
        productData.brand = data.brand?.name || data.manufacturer || productData.brand;

        // Extract price from offers
        if (data.offers) {
          const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          productData.price = offer.price || offer.priceSpecification?.price;
          productData.availability = offer.availability;
        }

        // Extract rating
        if (data.aggregateRating) {
          productData.rating = data.aggregateRating.ratingValue;
          productData.reviews = data.aggregateRating.reviewCount;
        }

        // Extract images
        if (data.image) {
          productData.images = Array.isArray(data.image) ? data.image : [data.image];
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  });
}

/**
 * Extract product prices from HTML
 */
export function extractPrices($: CheerioAPI, productData: ProductData): void {
  if (!productData.price) {
    const priceSelectors = [
      '.price ins .amount',
      '.price > .amount',
      '.product-price',
      '.price-now',
      'span[itemprop="price"]',
      '.price .woocommerce-Price-amount',
      '[data-price]',
    ];

    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText && (priceText.includes('£') || priceText.includes('$') || /\d/.test(priceText))) {
        productData.price = priceText;
        break;
      }
    }

    // Also check data attributes
    if (!productData.price) {
      const priceAttr = $('[data-price]').first().attr('data-price');
      if (priceAttr) {
        productData.price = priceAttr;
      }
    }
  }

  // Extract regular price
  productData.regularPrice = $('.price del .amount, .price .regular-price, .was-price').first().text().trim() || productData.regularPrice;
}

/**
 * Extract product categories from multiple sources
 */
export function extractCategories($: CheerioAPI, productData: ProductData): void {
  const categories: string[] = [];

  // WooCommerce category links
  $('.posted_in a, .product-category a, .product_meta .posted_in a').each((_, el) => {
    const category = $(el).text().trim();
    if (category) categories.push(category);
  });

  // Schema.org categories
  const schemaCategory = $('[itemprop="category"]').text().trim();
  if (schemaCategory) categories.push(schemaCategory);

  // Meta keywords
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    const keywordList = keywords.split(',').map(k => k.trim());
    categories.push(...keywordList.slice(0, 3));
  }

  // From breadcrumbs
  if (productData.breadcrumbs) {
    productData.breadcrumbs.forEach(crumb => {
      if (!crumb.name.toLowerCase().includes('home') &&
        crumb.name !== productData.name &&
        !categories.includes(crumb.name)) {
        categories.push(crumb.name);
      }
    });
  }

  if (categories.length > 0) {
    productData.categories = [...new Set(categories)];
    productData.primaryCategory = productData.categoryHierarchy?.[productData.categoryHierarchy.length - 2] || categories[0];
  }
}

/**
 * Extract product specifications from tables and lists
 */
export function extractSpecifications($: CheerioAPI, productData: ProductData): void {
  const specs: Record<string, string> = {};

  // Specification tables
  $('.specifications table tr, .product-specs table tr, .tech-specs table tr').each((_, row) => {
    const $row = $(row);
    const key = $row.find('td:first-child, th').first().text().trim();
    const value = $row.find('td:last-child').text().trim();
    if (key && value && key !== value) {
      specs[key] = value;
    }
  });

  // Definition lists
  $('.specifications dl, .product-attributes dl').each((_, dl) => {
    $(dl).find('dt').each((i, dt) => {
      const key = $(dt).text().trim();
      const dd = $(dt).next('dd');
      if (dd.length > 0) {
        const value = dd.text().trim();
        if (key && value) {
          specs[key] = value;
        }
      }
    });
  });

  // List items with labels
  $('.product-details li, .features li').each((_, li) => {
    const text = $(li).text();
    const colonIndex = text.indexOf(':');
    if (colonIndex > 0) {
      const key = text.substring(0, colonIndex).trim();
      const value = text.substring(colonIndex + 1).trim();
      if (key && value) {
        specs[key] = value;
      }
    }
  });

  if (Object.keys(specs).length > 0) {
    productData.specifications = specs;
  }
}

/**
 * Extract product images
 */
export function extractImages($: CheerioAPI, productData: ProductData): void {
  if (!productData.images || productData.images.length === 0) {
    const images: string[] = [];

    // WooCommerce gallery images
    $('.woocommerce-product-gallery__image img, .product-images img, .product-gallery img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-large_image');
      if (src && !src.includes('placeholder')) {
        images.push(src);
      }
    });

    // Open Graph image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      images.push(ogImage);
    }

    if (images.length > 0) {
      productData.images = [...new Set(images)];
    }
  }
}
