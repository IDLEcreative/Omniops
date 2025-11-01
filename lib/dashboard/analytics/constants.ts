/**
 * Constants for analytics calculations
 */

export const POSITIVE_KEYWORDS = [
  'thank',
  'great',
  'perfect',
  'awesome',
  'helpful',
  'excellent',
  'good',
  'works',
  'love',
  'amazing',
  'fantastic',
  'spot on',
];

export const NEGATIVE_KEYWORDS = [
  'not work',
  "doesn't work",
  'error',
  'wrong',
  'bad',
  'issue',
  'problem',
  'broken',
  'fail',
  'unable',
  'frustrating',
  'annoying',
];

export const FAILED_SEARCH_PHRASES = [
  'no results',
  "couldn't find",
  'not found',
  "don't have",
  'not available',
  'cannot find',
  'unable to locate',
];

export const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  spanish: ['hola', 'gracias', 'ayuda', 'necesito', 'producto', 'buenos dias', 'envío'],
  french: ['bonjour', 'merci', 'aide', 'besoin', 'produit', "s'il vous plaît", 'expédition'],
  german: ['hallo', 'danke', 'hilfe', 'brauche', 'produkt', 'lieferung', 'bestellung'],
};
