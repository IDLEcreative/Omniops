/**
 * Retail Business Classifier Rules
 * Classification rules for physical retail and location-based businesses
 */

import { BusinessClassification, BusinessType } from './business-classifier-types';

export class RetailClassifierRules {
  static checkRealEstate(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    // Strong indicators
    if (content.includes('bedroom')) { indicators.push('bedrooms'); score += 0.25; }
    if (content.includes('bathroom')) { indicators.push('bathrooms'); score += 0.25; }
    if (content.includes('sqft') || content.includes('square feet')) {
      indicators.push('square footage'); score += 0.2;
    }
    if (content.includes('mls')) { indicators.push('MLS'); score += 0.3; }
    if (content.includes('listing')) { indicators.push('listings'); score += 0.2; }
    if (content.includes('for sale') || content.includes('for rent')) {
      indicators.push('sale/rent'); score += 0.2;
    }
    if (content.includes('realtor') || content.includes('agent')) {
      indicators.push('realtor/agent'); score += 0.15;
    }

    return {
      primaryType: BusinessType.REAL_ESTATE,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'property',
        identifierField: 'mls_number',
        availabilityField: 'status',
        priceField: 'price',
        customFields: {
          bedrooms: 'bedrooms',
          bathrooms: 'bathrooms',
          sqft: 'square_feet',
          address: 'address',
          type: 'property_type'
        }
      },
      extractionStrategy: {
        priorityFields: ['address', 'price', 'bedrooms', 'bathrooms', 'sqft'],
        patterns: {
          price: /\$[\d,]+/,
          bedrooms: /(\d+)\s*(?:bed|br|bedroom)/i,
          bathrooms: /(\d+\.?\d*)\s*(?:bath|ba|bathroom)/i,
          sqft: /(\d+,?\d*)\s*(?:sqft|sq\.?\s*ft)/i
        },
        specialProcessing: ['virtual_tour', 'neighborhood', 'schools']
      },
      terminology: {
        entityName: 'property',
        entityNamePlural: 'properties',
        availableText: 'available',
        unavailableText: 'sold',
        priceLabel: 'price',
        searchPrompt: 'Search properties'
      }
    };
  }

  static checkRestaurant(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    if (content.includes('menu')) { indicators.push('menu'); score += 0.3; }
    if (content.includes('reservation')) { indicators.push('reservations'); score += 0.2; }
    if (content.includes('cuisine') || content.includes('food')) {
      indicators.push('cuisine/food'); score += 0.2;
    }
    if (content.includes('takeout') || content.includes('delivery')) {
      indicators.push('takeout/delivery'); score += 0.15;
    }
    if (content.includes('hours') && content.includes('open')) {
      indicators.push('hours'); score += 0.1;
    }

    return {
      primaryType: BusinessType.RESTAURANT,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'menu_item',
        identifierField: 'item_code',
        availabilityField: 'available',
        priceField: 'price',
        customFields: {
          category: 'category',
          description: 'description',
          dietary: 'dietary_info',
          ingredients: 'ingredients'
        }
      },
      extractionStrategy: {
        priorityFields: ['item_name', 'price', 'description', 'category'],
        patterns: {
          price: /\$[\d,]+\.?\d*/,
          dietary: /(vegan|vegetarian|gluten-free|dairy-free)/i
        },
        specialProcessing: ['specials', 'hours', 'delivery_info']
      },
      terminology: {
        entityName: 'menu item',
        entityNamePlural: 'menu items',
        availableText: 'available',
        unavailableText: 'not available',
        priceLabel: 'price',
        searchPrompt: 'Browse menu'
      }
    };
  }

  static checkAutomotive(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    if (content.includes('vehicle') || content.includes('car')) {
      indicators.push('vehicles'); score += 0.25;
    }
    if (content.includes('vin')) { indicators.push('VIN'); score += 0.3; }
    if (content.includes('mileage') || content.includes('miles')) {
      indicators.push('mileage'); score += 0.2;
    }
    if (content.includes('model') && content.includes('make')) {
      indicators.push('make/model'); score += 0.2;
    }

    return {
      primaryType: BusinessType.AUTOMOTIVE,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'vehicle',
        identifierField: 'vin',
        availabilityField: 'status',
        priceField: 'price',
        customFields: {
          make: 'make',
          model: 'model',
          year: 'year',
          mileage: 'mileage',
          condition: 'condition'
        }
      },
      extractionStrategy: {
        priorityFields: ['make', 'model', 'year', 'price', 'mileage'],
        patterns: {
          vin: /[A-HJ-NPR-Z0-9]{17}/,
          year: /(19|20)\d{2}/,
          mileage: /(\d+,?\d*)\s*miles/i
        },
        specialProcessing: ['features', 'history', 'warranty']
      },
      terminology: {
        entityName: 'vehicle',
        entityNamePlural: 'vehicles',
        availableText: 'available',
        unavailableText: 'sold',
        priceLabel: 'price',
        searchPrompt: 'Search vehicles'
      }
    };
  }

  static checkHospitality(content: string, metadata?: any): BusinessClassification {
    const indicators = [];
    let score = 0;

    if (content.includes('room') || content.includes('suite')) {
      indicators.push('rooms'); score += 0.25;
    }
    if (content.includes('booking') || content.includes('reservation')) {
      indicators.push('bookings'); score += 0.25;
    }
    if (content.includes('check-in') || content.includes('checkout')) {
      indicators.push('check-in/out'); score += 0.2;
    }
    if (content.includes('amenities')) { indicators.push('amenities'); score += 0.15; }

    return {
      primaryType: BusinessType.HOSPITALITY,
      confidence: Math.min(score, 1),
      indicators,
      suggestedSchema: {
        primaryEntity: 'room',
        identifierField: 'room_number',
        availabilityField: 'availability',
        priceField: 'rate',
        customFields: {
          type: 'room_type',
          capacity: 'max_occupancy',
          amenities: 'amenities',
          view: 'view_type'
        }
      },
      extractionStrategy: {
        priorityFields: ['room_type', 'rate', 'availability', 'amenities'],
        patterns: {
          rate: /\$[\d,]+/,
          dates: /\d{1,2}\/\d{1,2}\/\d{2,4}/
        },
        specialProcessing: ['availability_calendar', 'packages', 'policies']
      },
      terminology: {
        entityName: 'room',
        entityNamePlural: 'rooms',
        availableText: 'available',
        unavailableText: 'booked',
        priceLabel: 'rate',
        searchPrompt: 'Search rooms'
      }
    };
  }
}
