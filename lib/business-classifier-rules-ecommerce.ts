/**
 * E-commerce Business Classifier Rules
 * Classification rules for online retail and e-commerce businesses
 */

import { BusinessClassification, BusinessType } from './business-classifier-types';

export class EcommerceClassifierRules {
  static checkEcommerce(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    // Strong indicators
    if (content.includes('add to cart')) { indicators.push('add to cart'); score += 0.3; }
    if (content.includes('checkout')) { indicators.push('checkout'); score += 0.2; }
    if (content.includes('shopping cart')) { indicators.push('shopping cart'); score += 0.2; }
    if (/\$\d+\.\d{2}/.test(content)) { indicators.push('price format'); score += 0.1; }
    if (content.includes('sku:')) { indicators.push('SKU'); score += 0.2; }
    if (content.includes('in stock')) { indicators.push('stock status'); score += 0.2; }
    if (content.includes('product')) { indicators.push('product mentions'); score += 0.1; }

    return {
      primaryType: BusinessType.ECOMMERCE,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'product',
        identifierField: 'sku',
        availabilityField: 'in_stock',
        priceField: 'price',
        customFields: {
          brand: 'brand',
          category: 'category',
          shipping: 'shipping_info'
        }
      },
      extractionStrategy: {
        priorityFields: ['name', 'price', 'sku', 'availability', 'description'],
        patterns: {
          price: /\$[\d,]+\.?\d*/,
          sku: /SKU[:\s]*([A-Z0-9-]+)/i,
          stock: /(in stock|out of stock|available|unavailable)/i
        },
        specialProcessing: ['variants', 'reviews', 'specifications']
      },
      terminology: {
        entityName: 'product',
        entityNamePlural: 'products',
        availableText: 'in stock',
        unavailableText: 'out of stock',
        priceLabel: 'price',
        searchPrompt: 'Search products'
      }
    };
  }
}
