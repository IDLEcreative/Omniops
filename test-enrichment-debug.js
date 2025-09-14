#!/usr/bin/env node

/**
 * Debug test to see exactly what's in the enriched content
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { ContentEnricher } = require('./lib/content-enricher');

// Test metadata
const metadata = {
  ecommerceData: {
    products: [{
      name: 'DC66-10P Dryer Heating Element',
      sku: 'DC66-10P',
      price: { formatted: '$45.99', raw: 45.99 },
      availability: { inStock: true },
      brand: 'Samsung'
    }]
  }
};

const chunk = 'The heating element provides reliable performance.';

const enriched = ContentEnricher.enrichContent(
  chunk,
  metadata,
  'https://example.com/DC66-10P',
  'DC66-10P - Dryer Heating Element'
);

console.log('Full enriched content:');
console.log('='.repeat(70));
console.log(enriched);
console.log('='.repeat(70));

// Test searches
const searches = [
  'DC66-10P',
  'heating element',
  'Heating Element',
  'Samsung',
  'in stock',
  'In Stock',
  '$45.99',
  'part number',
  'Part Number'
];

console.log('\nSearch tests (case-insensitive):');
searches.forEach(search => {
  const found = enriched.toLowerCase().includes(search.toLowerCase());
  console.log(`${found ? '✓' : '✗'} "${search}" - ${found ? 'FOUND' : 'NOT FOUND'}`);
});