import { escapeRegex } from './html-escape';

/**
 * Match finding and merging utilities
 */

export interface Match {
  start: number;
  end: number;
  term: string;
}

/**
 * Find all matches in text for given search terms
 */
export function findMatches(
  text: string,
  terms: string[],
  caseSensitive: boolean = false
): Match[] {
  const matches: Match[] = [];
  const searchText = caseSensitive ? text : text.toLowerCase();

  for (const term of terms) {
    const searchTerm = caseSensitive ? term : term.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, 'g');

    let match;
    while ((match = regex.exec(searchText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        term: term
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  // Merge overlapping matches
  return mergeOverlappingMatches(matches);
}

/**
 * Merge overlapping or adjacent matches
 */
export function mergeOverlappingMatches(matches: Match[]): Match[] {
  if (matches.length === 0) return matches;

  const firstMatch = matches[0];
  if (!firstMatch) return [];

  const merged: Match[] = [firstMatch];

  for (let i = 1; i < matches.length; i++) {
    const current = matches[i];
    const last = merged[merged.length - 1];

    if (!current || !last) continue;

    if (current.start <= last.end) {
      // Overlapping or adjacent - merge
      last.end = Math.max(last.end, current.end);
      if (current.term.length > last.term.length) {
        last.term = current.term;
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}
