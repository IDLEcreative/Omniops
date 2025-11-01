/**
 * Semantic Chunker Types
 */

export interface SemanticChunk {
  content: string;
  type: 'heading' | 'paragraph' | 'section' | 'list' | 'table' | 'code' | 'mixed';
  parent_heading: string;
  heading_hierarchy: string[];
  semantic_completeness: number;
  boundary_type: 'natural' | 'forced' | 'overlap';
  overlap_with_previous: string;
  overlap_with_next: string;
  chunk_index: number;
  total_chunks: number;
  metadata: {
    has_complete_sentences: boolean;
    word_count: number;
    char_count: number;
    contains_list: boolean;
    contains_code: boolean;
    contains_table: boolean;
  };
}

export interface ContentBlock {
  type: string;
  content: string;
  position: number;
  level?: number;
}

export const MIN_CHUNK_SIZE = 300;
export const MAX_CHUNK_SIZE = 2000;
export const IDEAL_CHUNK_SIZE = 1200;
export const OVERLAP_SIZE = 100;

export const PATTERNS = {
  heading: /<h([1-6])[^>]*>(.*?)<\/h\1>/gi,
  paragraph: /<p[^>]*>(.*?)<\/p>/gis,
  list: /<(ul|ol)[^>]*>.*?<\/\1>/gis,
  table: /<table[^>]*>.*?<\/table>/gis,
  code: /<(code|pre)[^>]*>.*?<\/\1>/gis,
  htmlTags: /<[^>]*>/g,
  whitespace: /\s+/g,
  sentence: /[^.!?]+[.!?]+/g,
  listItem: /^[\-\*•]\s|^\d+\.\s/,
  markdownHeading: /^#+/,
  questionAnswer: /^[QA]:/,
  codeBlock: /^```/
};
