/**
 * Query Expansion and Synonym Mapping
 * Expands queries with related terms and finds synonyms
 */

import { SYNONYM_MAP } from './constants';

/**
 * Expand query with related terms
 * Adds plurals, hyphenated variations, and common affixes
 */
export function expandQuery(query: string): string[] {
  const words = query.split(' ');
  const expanded = new Set<string>();

  for (const word of words) {
    // Add original word
    expanded.add(word);

    // Add common variations
    if (word.endsWith('s')) {
      expanded.add(word.slice(0, -1)); // Remove plural
    } else {
      expanded.add(word + 's'); // Add plural
    }

    // Add hyphenated variations for part numbers
    if (/^[a-z]+\d+$/i.test(word)) {
      // Add hyphen between letters and numbers
      const match = word.match(/^([a-z]+)(\d+)$/i);
      if (match) {
        expanded.add(`${match[1]}-${match[2]}`);
      }
    }

    // Add common prefixes/suffixes
    if (word.length > 4) {
      expanded.add('re' + word); // repair, replace, etc.
      expanded.add(word + 'ing'); // installing, working, etc.
      expanded.add(word + 'ed'); // installed, worked, etc.
    }
  }

  return Array.from(expanded);
}

/**
 * Find synonyms for query terms
 * Maps words to their synonyms from SYNONYM_MAP
 */
export function findSynonyms(query: string): Map<string, string[]> {
  const synonyms = new Map<string, string[]>();
  const words = query.split(' ');

  for (const word of words) {
    // Check direct match
    if (SYNONYM_MAP[word]) {
      synonyms.set(word, SYNONYM_MAP[word]);
    }

    // Check if word is a synonym of something else
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if (syns.includes(word)) {
        synonyms.set(word, [key, ...syns.filter(s => s !== word)]);
      }
    }
  }

  return synonyms;
}
