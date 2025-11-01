/**
 * Price Parser Constants
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  '£': 'GBP',
  '$': 'USD',
  '€': 'EUR',
  '¥': 'JPY',
  '₹': 'INR',
  'R': 'ZAR',
  'A$': 'AUD',
  'C$': 'CAD',
};

export const CURRENCY_DISPLAY_SYMBOLS: Record<string, string> = {
  'GBP': '£',
  'USD': '$',
  'EUR': '€',
  'JPY': '¥',
  'INR': '₹',
  'ZAR': 'R',
  'AUD': 'A$',
  'CAD': 'C$',
};

export const CONTACT_PRICE_PATTERNS = [
  /contact\s*(us|for|to)/i,
  /call\s*for\s*price/i,
  /price\s*on\s*request/i,
  /por/i, // Price on request
  /poa/i, // Price on application
  /enquire/i,
  /quote/i,
];

export const SALE_PRICE_PATTERNS = [
  /original\s*price/i,
  /was\s*[:£$€]/i,
  /current\s*price/i,
  /sale\s*price/i,
  /reduced\s*from/i,
  /save\s*[:£$€]/i,
  /<del>/i,
  /strike/i,
];

export const PRICE_EXTRACTION_PATTERNS = [
  /[£$€¥₹][\s]?([\d,]+\.?\d*)/g,
  /\b(\d+[,\d]*\.?\d*)\s*(?:GBP|USD|EUR)/gi,
  /\b(\d+[,\d]*\.?\d*)\b/g,
];
