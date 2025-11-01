/**
 * Query Enhancer Constants
 * Domain-specific synonym mappings, intent patterns, and spelling corrections
 */

import type { QueryIntent } from './types';

/**
 * Domain-specific synonym mappings for query expansion
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  // Automotive/parts domain
  'motor': ['engine', 'drive', 'power unit', 'motor unit'],
  'broken': ['faulty', 'damaged', 'not working', 'defective', 'malfunctioning', 'failed'],
  'install': ['setup', 'mount', 'fit', 'attach', 'installation', 'fitting'],
  'warranty': ['guarantee', 'coverage', 'protection', 'warrantee'],
  'replace': ['replacement', 'substitute', 'swap', 'change'],
  'part': ['component', 'spare', 'piece', 'item'],
  'manual': ['guide', 'instructions', 'documentation', 'handbook'],
  'fix': ['repair', 'mend', 'resolve', 'troubleshoot'],

  // E-commerce terms
  'cheap': ['affordable', 'budget', 'economical', 'inexpensive', 'low cost'],
  'expensive': ['premium', 'high-end', 'costly', 'luxury'],
  'buy': ['purchase', 'order', 'get', 'acquire'],
  'price': ['cost', 'pricing', 'rate', 'fee'],
  'ship': ['shipping', 'delivery', 'dispatch', 'send'],
  'return': ['refund', 'exchange', 'send back', 'RMA'],

  // Technical terms
  'volt': ['voltage', 'V', 'volts'],
  'amp': ['ampere', 'amperage', 'A', 'amps', 'current'],
  'watt': ['watts', 'W', 'power', 'wattage'],
  'RPM': ['revolutions', 'speed', 'rotation'],
  'HP': ['horsepower', 'horse power', 'bhp'],

  // Common misspellings and variations
  'catalogue': ['catalog'],
  'colour': ['color'],
  'tyre': ['tire'],
  'aluminium': ['aluminum']
};

/**
 * Intent detection patterns for classifying user queries
 */
export const INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
  informational: [
    /^(what|how|why|when|where|who|which)/i,
    /\b(guide|tutorial|manual|instructions|documentation)\b/i,
    /\b(information|info|details|specs|specifications)\b/i
  ],
  transactional: [
    /\b(buy|purchase|order|price|cost|cheap|expensive|deal|discount|sale)\b/i,
    /\b(cart|checkout|payment|shipping|delivery)\b/i,
    /\$\d+|\£\d+|€\d+/
  ],
  navigational: [
    /\b(contact|support|about|home|login|account|profile)\b/i,
    /\b(page|site|website|portal)\b/i
  ],
  troubleshooting: [
    /\b(problem|issue|error|broken|not working|fix|repair|troubleshoot)\b/i,
    /\b(won't|can't|unable|failed|failure)\b/i,
    /\b(help|support|assist)\b/i
  ],
  comparison: [
    /\b(vs|versus|compare|comparison|difference|better|best)\b/i,
    /\b(alternative|instead|similar|like)\b/i
  ]
};

/**
 * Common typos and their corrections
 */
export const SPELLING_CORRECTIONS: Record<string, string> = {
  'moter': 'motor',
  'engin': 'engine',
  'waranty': 'warranty',
  'instalation': 'installation',
  'replacment': 'replacement',
  'maintainance': 'maintenance',
  'recieve': 'receive',
  'guage': 'gauge',
  'cataloge': 'catalogue',
  'seperate': 'separate'
};
