/**
 * Types and constants for result highlighting
 */

export interface HighlightOptions {
  startTag?: string;
  endTag?: string;
  maxLength?: number;
  contextWords?: number;
  caseSensitive?: boolean;
}

export const DEFAULT_HIGHLIGHT_OPTIONS: HighlightOptions = {
  startTag: '<mark>',
  endTag: '</mark>',
  maxLength: 200,
  contextWords: 10,
  caseSensitive: false
};
