/**
 * Query Enhancer - Constants and Patterns
 */

// Performance optimization: Pre-compiled regex patterns
export const COMPILED_PATTERNS = {
  sku: /\b([A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*)\b/gi,
  cleanup: /[^\w\s\-\$£€]/g,
  whitespace: /\s+/g,
  plural: /s$/,
  alphaNum: /^[a-z]+\d+$/i,
  alphaNumSplit: /^([a-z]+)(\d+)$/i,
  sentenceEnd: /[.!?]$/
};

// Performance optimization: Limit synonym expansions
export const MAX_SYNONYMS = 10;
export const MAX_EXPANDED_TERMS = 15;
export const MAX_RELATED_QUERIES = 3;

// Performance optimization: Use Map for O(1) lookups
export const SYNONYM_MAP = new Map([
  ['motor', ['engine', 'drive', 'power unit']],
  ['broken', ['faulty', 'damaged', 'not working', 'defective']],
  ['install', ['setup', 'mount', 'fit', 'installation']],
  ['warranty', ['guarantee', 'coverage', 'protection']],
  ['replace', ['replacement', 'substitute', 'swap']],
  ['part', ['component', 'spare', 'piece']],
  ['manual', ['guide', 'instructions', 'documentation']],
  ['fix', ['repair', 'mend', 'resolve']],
  ['cheap', ['affordable', 'budget', 'inexpensive']],
  ['expensive', ['premium', 'high-end', 'costly']],
  ['buy', ['purchase', 'order', 'acquire']],
  ['price', ['cost', 'pricing', 'rate']],
  ['ship', ['shipping', 'delivery', 'dispatch']],
  ['return', ['refund', 'exchange', 'RMA']]
]);

// Build reverse synonym map
function buildReverseSynonyms(): Map<string, string> {
  const reverse = new Map<string, string>();
  SYNONYM_MAP.forEach((synonyms, key) => {
    synonyms.forEach(syn => reverse.set(syn, key));
  });
  return reverse;
}

export const REVERSE_SYNONYMS = buildReverseSynonyms();

// Performance optimization: Use Sets for O(1) lookups
export const BRANDS = new Set(['bosch', 'makita', 'dewalt', 'milwaukee', 'ryobi', 'ford', 'toyota', 'honda', 'bmw', 'mercedes']);
export const PRODUCTS = new Set(['motor', 'engine', 'battery', 'filter', 'pump', 'sensor', 'belt', 'brake', 'clutch']);
export const ISSUES = new Set(['broken', 'not working', 'failed', 'error', 'problem', 'issue', 'damaged', 'worn']);
export const ACTIONS = new Set(['install', 'replace', 'repair', 'fix', 'troubleshoot', 'maintain', 'upgrade']);
