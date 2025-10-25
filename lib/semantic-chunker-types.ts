/**
 * Type Definitions for Semantic Chunking System
 * Shared interfaces, types, and constants
 */

export interface SemanticChunk {
  content: string;
  type: 'heading' | 'paragraph' | 'section' | 'list' | 'table' | 'code' | 'mixed';
  parent_heading: string;
  heading_hierarchy: string[];
  semantic_completeness: number; // 0-1 score
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

export interface ContentStructure {
  headings: Array<{ level: number; text: string; position: number }>;
  paragraphs: Array<{ content: string; position: number }>;
  lists: Array<{ content: string; position: number; type: 'ul' | 'ol' }>;
  tables: Array<{ content: string; position: number }>;
  codeBlocks: Array<{ content: string; position: number }>;
}

export interface SemanticBlock {
  content: string;
  type: string;
  parent_heading: string;
  heading_hierarchy: string[];
  elements?: Array<{
    position: number;
    type: 'heading' | 'paragraph' | 'list' | 'table' | 'code';
    content?: string;
    text?: string;
    level?: number;
  }>;
}

export const CHUNK_CONSTANTS = {
  MIN_CHUNK_SIZE: 300,
  MAX_CHUNK_SIZE: 2000,
  IDEAL_CHUNK_SIZE: 1200,
  OVERLAP_SIZE: 100,
  VERY_SMALL_THRESHOLD: 200,
  MIN_SIZE_RATIO: 0.2,
  MAX_SIZE_RATIO: 2.0,
} as const;
