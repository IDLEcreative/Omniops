import { Match } from './match-finder';
import { HighlightOptions } from '../highlighter-types';

/**
 * Excerpt extraction utilities
 */

export interface Excerpt {
  text: string;
  matches: Match[];
  offset: number;
}

interface Cluster {
  start: number;
  end: number;
  density: number;
  count: number;
}

/**
 * Extract the most relevant excerpt containing matches
 */
export function extractExcerpt(
  text: string,
  matches: Match[],
  options: HighlightOptions
): Excerpt {
  if (matches.length === 0) {
    return {
      text: truncateText(text, options.maxLength!),
      matches: [],
      offset: 0
    };
  }

  // Find the densest cluster of matches
  const cluster = findBestCluster(matches, text.length, options.maxLength!);

  // Calculate excerpt boundaries
  const contextChars = options.contextWords! * 6; // Avg word length
  let start = Math.max(0, cluster.start - contextChars);
  let end = Math.min(text.length, cluster.end + contextChars);

  // Adjust to word boundaries
  if (start > 0) {
    const spaceIndex = text.lastIndexOf(' ', start);
    if (spaceIndex > start - 20) {
      start = spaceIndex + 1;
    }
  }

  if (end < text.length) {
    const spaceIndex = text.indexOf(' ', end);
    if (spaceIndex !== -1 && spaceIndex < end + 20) {
      end = spaceIndex;
    }
  }

  // Extract text
  let excerptText = text.substring(start, end);

  // Add ellipsis
  if (start > 0) {
    excerptText = '...' + excerptText;
    start -= 3;
  }
  if (end < text.length) {
    excerptText = excerptText + '...';
  }

  // Adjust match positions relative to excerpt
  const excerptMatches = matches
    .filter(m => m.start >= start && m.end <= end)
    .map(m => ({
      start: m.start - start,
      end: m.end - start,
      term: m.term
    }));

  return {
    text: excerptText,
    matches: excerptMatches,
    offset: start
  };
}

/**
 * Find the densest cluster of matches for optimal excerpt
 */
export function findBestCluster(
  matches: Match[],
  textLength: number,
  maxLength: number
): Cluster {
  if (matches.length === 1) {
    return {
      start: matches[0].start,
      end: matches[0].end,
      density: 1,
      count: 1
    };
  }

  let bestCluster: Cluster = {
    start: matches[0].start,
    end: matches[0].end,
    density: 0,
    count: 1
  };

  // Try different window sizes
  for (let i = 0; i < matches.length; i++) {
    let clusterEnd = matches[i].end;
    let clusterCount = 1;

    for (let j = i + 1; j < matches.length; j++) {
      const potentialEnd = matches[j].end;
      const potentialLength = potentialEnd - matches[i].start;

      if (potentialLength > maxLength) {
        break;
      }

      clusterEnd = potentialEnd;
      clusterCount++;

      // Calculate density (matches per character)
      const density = clusterCount / potentialLength;

      if (density > bestCluster.density) {
        bestCluster = {
          start: matches[i].start,
          end: clusterEnd,
          density,
          count: clusterCount
        };
      }
    }
  }

  return bestCluster;
}

/**
 * Truncate text to maximum length at word boundary
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Try to break at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}
