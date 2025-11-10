import { Match } from './match-finder';
import { escapeHtml } from './html-escape';
import { HighlightOptions } from '../highlighter-types';

/**
 * Apply highlights to text with HTML-safe formatting
 */
export function applyHighlights(
  text: string,
  matches: Match[],
  options: HighlightOptions,
  offset: number = 0
): string {
  if (matches.length === 0) {
    return escapeHtml(text);
  }

  let result = '';
  let lastEnd = 0;

  for (const match of matches) {
    // Add text before match
    result += escapeHtml(text.substring(lastEnd, match.start));

    // Add highlighted match
    result += options.startTag;
    result += escapeHtml(text.substring(match.start, match.end));
    result += options.endTag;

    lastEnd = match.end;
  }

  // Add remaining text
  result += escapeHtml(text.substring(lastEnd));

  return result;
}
