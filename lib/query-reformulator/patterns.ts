/**
 * Query Reformulator - Pattern Constants
 */

// Patterns that indicate continuation from previous context
export const CONTINUATION_PATTERNS = [
  /^(it'?s?\s+for|its?\s+for)\s+/i,
  /^(yes,?\s+)?for\s+/i,
  /^(i\s+need\s+it\s+for|we\s+need\s+it\s+for)\s+/i,
  /^(that'?s?\s+for|thats?\s+for)\s+/i,
  /^(specifically\s+for|especially\s+for)\s+/i,
  /^(mainly\s+for|mostly\s+for)\s+/i,
  /^(the\s+one\s+for|one\s+for)\s+/i,
  /^(something\s+for)\s+/i,
  /^(for\s+use\s+in|for\s+use\s+with)\s+/i,
  /^(suitable\s+for|good\s+for|works\s+for)\s+/i,
];

// Patterns that reference previous mentions
export const REFERENCE_PATTERNS = [
  /^(that|those|these|this)\s+(one|product|item)/i,
  /^(the\s+)?(first|second|third|last)\s+one/i,
  /^(yes|yeah|yep|sure|ok|okay)[\s,.]*(that'?s?\s+)?(it|one|correct|right)/i,
  /^(exactly|precisely|correct)/i,
];

// Question patterns that need context
export const QUESTION_PATTERNS = [
  /^(do\s+you\s+have|have\s+you\s+got)\s+(any|some)?\s*$/i,
  /^(what\s+about|how\s+about)\s*$/i,
  /^(any\s+other|anything\s+else)\s*$/i,
  /^(what\s+)?(options|choices|alternatives)\s*$/i,
];
