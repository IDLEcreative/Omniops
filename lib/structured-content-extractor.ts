/**
 * Generic structured content extractor
 * Preserves hierarchical navigation, categories, and structured data from ANY website
 * Works for e-commerce, blogs, documentation, services - any domain
 */

import * as cheerio from 'cheerio';

export interface ProductData {
  name: string;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  sku?: string;
  description?: string;
  specifications?: Record<string, string>;
  availability?: string;
  images?: string[];
  categories?: string[];
  breadcrumbs?: Array<{ name: string; url?: string }>;
  categoryHierarchy?: string[];
  primaryCategory?: string;
  brand?: string;
  rating?: number;
  reviews?: number;
}

/**
 * Extract product-specific information from HTML
 */
export function extractProductData(html: string, url: string): ProductData | null {
  const $ = cheerio.load(html);
  
  // Check if this is likely a product page
  const isProductPage = url.includes('/product/') || 
                        $('[itemtype*="Product"]').length > 0 ||
                        $('.product-info, .product-details, .product-page').length > 0 ||
                        $('meta[property="og:type"][content="product"]').length > 0;
  
  if (!isProductPage) {
    return null;
  }
  
  const productData: ProductData = {
    name: '',
  };
  
  // CRITICAL: Extract breadcrumbs FIRST before any HTML manipulation
  productData.breadcrumbs = extractBreadcrumbs($);
  productData.categoryHierarchy = productData.breadcrumbs
    ?.filter(b => !b.name.toLowerCase().includes('home'))
    ?.map(b => b.name) || [];
  
  // Extract structured data (JSON-LD)
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
  
  // Extract from WooCommerce-specific patterns
  const wooCommerceSelectors = {
    name: 'h1.product_title, .product-title h1, .entry-title',
    price: '.price ins .amount, .price > .amount, .price-now, .product-price',
    regularPrice: '.price del .amount, .price .regular-price, .was-price',
    sku: '.sku, .product-sku, .product_meta .sku_wrapper .sku',
    description: '.woocommerce-product-details__short-description, .product-short-description, .summary .description',
    availability: '.stock, .availability, .in-stock, .out-of-stock',
    category: '.posted_in a, .product-category a, .product_meta .posted_in a',
  };
  
  // Extract product name
  if (!productData.name) {
    productData.name = $(wooCommerceSelectors.name).first().text().trim() ||
                      $('meta[property="og:title"]').attr('content') ||
                      $('h1').first().text().trim();
  }
  
  // Extract prices
  if (!productData.price) {
    // Try various price selectors
    const priceSelectors = [
      '.price ins .amount', // Sale price in WooCommerce
      '.price > .amount',   // Regular price display
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
  
  // Extract regular/sale prices
  productData.regularPrice = $(wooCommerceSelectors.regularPrice).first().text().trim() || productData.regularPrice;
  
  // Extract SKU
  if (!productData.sku) {
    productData.sku = $(wooCommerceSelectors.sku).first().text().trim();
  }
  
  // Extract description
  if (!productData.description) {
    productData.description = $(wooCommerceSelectors.description).first().text().trim() ||
                             $('meta[name="description"]').attr('content');
  }
  
  // Extract availability
  if (!productData.availability) {
    const stockText = $(wooCommerceSelectors.availability).first().text().trim();
    if (stockText) {
      productData.availability = stockText;
    } else if ($('.in-stock').length > 0) {
      productData.availability = 'In Stock';
    } else if ($('.out-of-stock').length > 0) {
      productData.availability = 'Out of Stock';
    }
  }
  
  // Extract categories from multiple sources
  const categories: string[] = [];
  
  // 1. WooCommerce category links
  $(wooCommerceSelectors.category).each((_, el) => {
    const category = $(el).text().trim();
    if (category) categories.push(category);
  });
  
  // 2. Schema.org categories
  const schemaCategory = $('[itemprop="category"]').text().trim();
  if (schemaCategory) categories.push(schemaCategory);
  
  // 3. Meta keywords that might be categories
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    const keywordList = keywords.split(',').map(k => k.trim());
    // Add first 2-3 keywords as potential categories
    categories.push(...keywordList.slice(0, 3));
  }
  
  // 4. From breadcrumbs (excluding Home and product name)
  if (productData.breadcrumbs) {
    productData.breadcrumbs.forEach(crumb => {
      if (!crumb.name.toLowerCase().includes('home') && 
          crumb.name !== productData.name &&
          !categories.includes(crumb.name)) {
        categories.push(crumb.name);
      }
    });
  }
  
  // Remove duplicates and assign
  if (categories.length > 0) {
    productData.categories = [...new Set(categories)];
    // Set primary category (usually the most specific one from breadcrumbs)
    productData.primaryCategory = productData.categoryHierarchy?.[productData.categoryHierarchy.length - 2] || categories[0];
  }
  
  // Extract specifications (from tables or definition lists)
  const specs: Record<string, string> = {};
  
  // Try specification tables
  $('.specifications table tr, .product-specs table tr, .tech-specs table tr').each((_, row) => {
    const $row = $(row);
    const key = $row.find('td:first-child, th').first().text().trim();
    const value = $row.find('td:last-child').text().trim();
    if (key && value && key !== value) {
      specs[key] = value;
    }
  });
  
  // Try definition lists
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
  
  // Try list items with labels
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
  
  // Extract product images
  if (!productData.images || productData.images.length === 0) {
    const images: string[] = [];
    
    // WooCommerce gallery images
    $('.woocommerce-product-gallery__image img, .product-images img, .product-gallery img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-large_image');
      if (src && !src.includes('placeholder')) {
        images.push(src);
      }
    });
    
    // Also check Open Graph image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      images.push(ogImage);
    }
    
    if (images.length > 0) {
      productData.images = [...new Set(images)]; // Remove duplicates
    }
  }
  
  // Only return if we found meaningful product data
  if (!productData.name || productData.name.length < 3) {
    return null;
  }
  
  return productData;
}

/**
 * Format product data as text content for embedding
 */
export function formatProductContent(productData: ProductData): string {
  const lines: string[] = [];
  
  // Add product name
  lines.push(`Product: ${productData.name}`);
  
  // Add price information
  if (productData.price) {
    lines.push(`Price: ${productData.price}`);
  }
  if (productData.regularPrice && productData.regularPrice !== productData.price) {
    lines.push(`Regular Price: ${productData.regularPrice}`);
  }
  if (productData.salePrice) {
    lines.push(`Sale Price: ${productData.salePrice}`);
  }
  
  // Add SKU
  if (productData.sku) {
    lines.push(`SKU: ${productData.sku}`);
  }
  
  // Add brand
  if (productData.brand) {
    lines.push(`Brand: ${productData.brand}`);
  }
  
  // Add availability
  if (productData.availability) {
    lines.push(`Availability: ${productData.availability}`);
  }
  
  // Add rating
  if (productData.rating) {
    lines.push(`Rating: ${productData.rating}/5${productData.reviews ? ` (${productData.reviews} reviews)` : ''}`);
  }
  
  // Add categories
  if (productData.categories && productData.categories.length > 0) {
    lines.push(`Categories: ${productData.categories.join(', ')}`);
  }
  
  // Add description
  if (productData.description) {
    lines.push('');
    lines.push('Description:');
    lines.push(productData.description);
  }
  
  // Add specifications
  if (productData.specifications && Object.keys(productData.specifications).length > 0) {
    lines.push('');
    lines.push('Specifications:');
    for (const [key, value] of Object.entries(productData.specifications)) {
      lines.push(`- ${key}: ${value}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Extract breadcrumb navigation from HTML
 */
function extractBreadcrumbs($: cheerio.CheerioAPI): Array<{ name: string; url?: string }> {
  const breadcrumbs: Array<{ name: string; url?: string }> = [];
  
  // Common breadcrumb selectors
  const breadcrumbSelectors = [
    '.breadcrumb li',
    '.breadcrumbs li',
    '.woocommerce-breadcrumb a',
    '.woocommerce-breadcrumb span',
    '[aria-label="breadcrumb"] li',
    '[aria-label="Breadcrumb"] li',
    '.breadcrumb-item',
    '.trail-item',
    'nav.breadcrumb a',
    '.yoast-breadcrumb a',
    '.rank-math-breadcrumb a',
    '[itemtype*="BreadcrumbList"] [itemprop="itemListElement"]'
  ];
  
  // Try each selector until we find breadcrumbs
  for (const selector of breadcrumbSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_, el) => {
        const $el = $(el);
        let name = '';
        let url = '';
        
        // Handle different breadcrumb structures
        if ($el.find('a').length > 0) {
          const $link = $el.find('a').first();
          name = $link.text().trim();
          url = $link.attr('href') || '';
        } else if ($el.is('a')) {
          name = $el.text().trim();
          url = $el.attr('href') || '';
        } else {
          // Text-only breadcrumb item
          name = $el.text().trim();
        }
        
        // Clean up the name (remove separators like > or /)
        name = name.replace(/^[>\/\-→»]+/, '').replace(/[>\/\-→»]+$/, '').trim();
        
        if (name && name.length > 0 && name !== '>' && name !== '/') {
          breadcrumbs.push({ name, url });
        }
      });
      
      // If we found breadcrumbs, stop looking
      if (breadcrumbs.length > 0) break;
    }
  }
  
  // Try JSON-LD structured data for breadcrumbs
  if (breadcrumbs.length === 0) {
    $('script[type="application/ld+json"]').each((_, script) => {
      try {
        const data = JSON.parse($(script).text());
        if (data['@type'] === 'BreadcrumbList' && data.itemListElement) {
          data.itemListElement.forEach((item: any) => {
            if (item.name) {
              breadcrumbs.push({
                name: item.name,
                url: item.item || ''
              });
            }
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    });
  }
  
  return breadcrumbs;
}

/**
 * Enhanced content extraction that preserves product data
 */
export function extractContentWithProducts(html: string, url: string): {
  content: string;
  productData?: ProductData;
} {
  // First try to extract product data
  const productData = extractProductData(html, url);
  
  if (productData) {
    // If this is a product page, format the product data as content
    const content = formatProductContent(productData);
    return { content, productData };
  }
  
  // For non-product pages, return regular content extraction
  // This would use the existing extraction logic
  return { content: '' };
}