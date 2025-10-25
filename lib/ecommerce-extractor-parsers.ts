import * as cheerio from 'cheerio';
import { PriceParser } from '@/lib/price-parser';
import type { ProductData, EcommerceExtractedContent } from '@/lib/ecommerce-extractor-types';
import { PRODUCT_SELECTORS } from '@/lib/ecommerce-extractor-types';

/**
 * Extract product from JSON-LD structured data
 */
export function extractJsonLdProduct($: cheerio.CheerioAPI): ProductData | null {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || '{}');

      // Handle both single product and product array
      const products = Array.isArray(data) ? data : [data];

      for (const item of products) {
        if (item['@type'] === 'Product' || item.type === 'Product') {
          const priceValue = item.offers?.price || item.price;
          const currency = item.offers?.priceCurrency || item.priceCurrency;
          // Include currency in price string so PriceParser can detect it
          const priceString = priceValue && currency ? `${priceValue} ${currency}` : priceValue ? `${priceValue}` : undefined;

          return {
            name: item.name,
            sku: item.sku,
            description: item.description,
            brand: item.brand?.name || item.brand,
            rawPrice: priceValue ? `${priceValue}` : undefined,
            price: priceString ? PriceParser.parse(priceString) : undefined,
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
export function extractMicrodataProduct($: cheerio.CheerioAPI): ProductData | null {
  const product = $('[itemtype*="schema.org/Product"]').first();

  if (product.length === 0) return null;

  const priceText = product.find('[itemprop="price"]').first().attr('content') ||
                    product.find('[itemprop="price"]').first().text()?.trim();
  const currency = product.find('[itemprop="priceCurrency"]').first().attr('content');
  const priceString = priceText && currency ? `${priceText} ${currency}` : priceText;

  return {
    name: product.find('[itemprop="name"]').first().text()?.trim(),
    sku: product.find('[itemprop="sku"]').first().text()?.trim(),
    description: product.find('[itemprop="description"]').first().text()?.trim(),
    brand: product.find('[itemprop="brand"]').first().text()?.trim(),
    rawPrice: priceText,
    price: priceString ? PriceParser.parse(priceString) : undefined,
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
export function extractProductFromDOM($: cheerio.CheerioAPI, customSelectors?: any): ProductData | null {
  const findFirst = (selectorList: string[]): string | undefined => {
    for (const selector of selectorList) {
      const element = $(selector).first();
      if (element.length > 0) {
        return element.text()?.trim() || element.attr('content') || element.val()?.toString();
      }
    }
    return undefined;
  };

  const findImages = (selectorList: string[]): Array<{url: string; alt?: string}> => {
    const images: Array<{url: string; alt?: string}> = [];
    for (const selector of selectorList) {
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
    productName: customSelectors?.productName || PRODUCT_SELECTORS.product.name,
    price: customSelectors?.price || PRODUCT_SELECTORS.product.price,
    originalPrice: customSelectors?.originalPrice || PRODUCT_SELECTORS.product.originalPrice,
    sku: customSelectors?.sku || PRODUCT_SELECTORS.product.sku,
    availability: customSelectors?.availability || PRODUCT_SELECTORS.product.availability,
    description: customSelectors?.description || PRODUCT_SELECTORS.product.description,
    images: customSelectors?.image || PRODUCT_SELECTORS.product.images,
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
 * Extract pagination information from listing pages
 */
export function extractPagination($: cheerio.CheerioAPI, currentUrl: string): EcommerceExtractedContent['pagination'] {
  const paginationSelectors = PRODUCT_SELECTORS.listing.pagination.join(', ');
  const pagination = $(paginationSelectors).first();

  if (pagination.length === 0) return undefined;

  // Extract current page
  const currentText = pagination.find('.current, .active, [aria-current="page"]').first().text()?.trim();
  let current = parseInt(currentText || '', 10);
  if (!Number.isFinite(current) || current <= 0) {
    try {
      const urlObj = new URL(currentUrl);
      const pageParam = urlObj.searchParams.get('page') || urlObj.searchParams.get('paged');
      const parsedPage = pageParam ? parseInt(pageParam, 10) : NaN;
      current = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    } catch {
      current = 1;
    }
  }

  // Extract total pages
  const pageNumbers = pagination.find('a').map((_, el) => {
    const text = $(el).text();
    const num = parseInt((text || '').trim(), 10);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }).get().filter((num): num is number => typeof num === 'number');
  const total = pageNumbers.length > 0 ? Math.max(current, ...pageNumbers) : undefined;

  // Extract next/prev URLs
  const nextSelector = PRODUCT_SELECTORS.listing.nextPage.join(', ');
  const nextHref = pagination.find(nextSelector).first().attr('href');
  const prevHref = pagination.find('.prev, .pagination-prev, a[rel="prev"]').first().attr('href');
  const nextUrl = nextHref ? new URL(nextHref, currentUrl).href : undefined;
  const prevUrl = prevHref ? new URL(prevHref, currentUrl).href : undefined;

  return {
    current,
    total,
    nextUrl,
    prevUrl,
    hasMore: Boolean(nextUrl)
  };
}

/**
 * Extract breadcrumb navigation
 */
export function extractBreadcrumbs($: cheerio.CheerioAPI): Array<{name: string; url?: string}> {
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
 * Extract total product count from listing page
 */
export function extractTotalProductCount($: cheerio.CheerioAPI): number | undefined {
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
