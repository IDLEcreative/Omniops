/**
 * Content Parsing and Structure Extraction
 * Handles HTML and text parsing to identify document structure
 */

import type { ContentStructure } from './semantic-chunker-types';

export class ContentParser {
  /**
   * Strip HTML tags from text
   */
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Parse content to identify structure
   */
  static parseContentStructure(
    content: string,
    htmlContent?: string
  ): ContentStructure {
    const structure: ContentStructure = {
      headings: [],
      paragraphs: [],
      lists: [],
      tables: [],
      codeBlocks: []
    };

    if (htmlContent) {
      this.parseHtmlStructure(htmlContent, structure);
    } else {
      this.parseTextStructure(content, structure);
    }

    return structure;
  }

  /**
   * Parse HTML structure
   */
  private static parseHtmlStructure(htmlContent: string, structure: ContentStructure): void {
    // Parse headings
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    let match;
    while ((match = headingRegex.exec(htmlContent)) !== null) {
      const level = match[1];
      const text = match[2];
      if (level && text) {
        structure.headings.push({
          level: parseInt(level),
          text: this.stripHtml(text),
          position: match.index
        });
      }
    }

    // Parse paragraphs
    const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((match = paraRegex.exec(htmlContent)) !== null) {
      const matchText = match[1];
      if (matchText) {
        const content = this.stripHtml(matchText);
        if (content.trim()) {
          structure.paragraphs.push({
            content,
            position: match.index
          });
        }
      }
    }

    // Parse lists
    const listRegex = /<(ul|ol)[^>]*>[\s\S]*?<\/\1>/gi;
    while ((match = listRegex.exec(htmlContent)) !== null) {
      const fullMatch = match[0];
      const listType = match[1];
      if (fullMatch && listType) {
        structure.lists.push({
          content: this.stripHtml(fullMatch),
          position: match.index,
          type: listType as 'ul' | 'ol'
        });
      }
    }

    // Parse tables
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    while ((match = tableRegex.exec(htmlContent)) !== null) {
      const fullMatch = match[0];
      if (fullMatch) {
        structure.tables.push({
          content: this.stripHtml(fullMatch),
          position: match.index
        });
      }
    }

    // Parse code blocks
    const codeRegex = /<(code|pre)[^>]*>[\s\S]*?<\/\1>/gi;
    while ((match = codeRegex.exec(htmlContent)) !== null) {
      const fullMatch = match[0];
      if (fullMatch) {
        structure.codeBlocks.push({
          content: this.stripHtml(fullMatch),
          position: match.index
        });
      }
    }
  }

  /**
   * Parse plain text structure (markdown-like)
   */
  private static parseTextStructure(content: string, structure: ContentStructure): void {
    const lines = content.split('\n');
    let currentParagraph: string[] = [];
    let currentList: string[] = [];
    let isInList = false;
    let position = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const trimmed = line.trim();
      position += line.length + 1;

      // Detect markdown headings
      if (trimmed.startsWith('#')) {
        this.saveCurrentContent(structure, currentParagraph, currentList, position);
        currentParagraph = [];
        currentList = [];
        isInList = false;

        const levelMatch = trimmed.match(/^#+/);
        if (levelMatch && levelMatch[0]) {
          const level = levelMatch[0].length;
          const text = trimmed.replace(/^#+\s*/, '');
          structure.headings.push({
            level,
            text,
            position: position - line.length
          });
        }
      }
      // Detect Q&A format - treat Q: as a heading-like boundary
      else if (trimmed.startsWith('Q:')) {
        this.saveCurrentContent(structure, currentParagraph, currentList, position);
        currentParagraph = [];
        currentList = [];
        isInList = false;

        // Treat Q: as a pseudo-heading for better chunking
        structure.headings.push({
          level: 3, // Treat Q&A as level 3 headings
          text: trimmed,
          position: position - line.length
        });
      }
      else if (trimmed.startsWith('A:')) {
        currentParagraph.push(trimmed);
      }
      // Detect list items
      else if (/^[\-\*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        if (currentParagraph.length > 0) {
          structure.paragraphs.push({
            content: currentParagraph.join(' '),
            position: position - currentParagraph.join(' ').length
          });
          currentParagraph = [];
        }
        isInList = true;
        currentList.push(trimmed);
      }
      // Detect code blocks
      else if (trimmed.startsWith('```')) {
        const codeContent = this.extractCodeBlock(lines, i);
        if (codeContent.content.length > 0) {
          structure.codeBlocks.push({
            content: codeContent.content.join('\n'),
            position
          });
          i = codeContent.endIndex;
        }
      }
      // Regular paragraph text
      else if (trimmed.length > 0) {
        if (isInList && currentList.length > 0) {
          structure.lists.push({
            content: currentList.join('\n'),
            position: position - currentList.join('\n').length,
            type: 'ul'
          });
          currentList = [];
          isInList = false;
        }
        currentParagraph.push(trimmed);
      }
      // Empty line - end of paragraph or list
      else {
        this.saveCurrentContent(structure, currentParagraph, currentList, position);
        currentParagraph = [];
        currentList = [];
        isInList = false;
      }
    }

    // Add remaining content
    this.saveCurrentContent(structure, currentParagraph, currentList, position);
  }

  /**
   * Extract code block content
   */
  private static extractCodeBlock(lines: string[], startIndex: number): {
    content: string[];
    endIndex: number;
  } {
    const codeContent: string[] = [];
    let j = startIndex + 1;

    while (j < lines.length) {
      const codeLine = lines[j];
      if (codeLine && codeLine.trim().startsWith('```')) {
        break;
      }
      if (codeLine !== undefined) {
        codeContent.push(codeLine);
      }
      j++;
    }

    return {
      content: codeContent,
      endIndex: j
    };
  }

  /**
   * Save current paragraph and list content to structure
   */
  private static saveCurrentContent(
    structure: ContentStructure,
    currentParagraph: string[],
    currentList: string[],
    position: number
  ): void {
    if (currentParagraph.length > 0) {
      structure.paragraphs.push({
        content: currentParagraph.join(' '),
        position: position - currentParagraph.join(' ').length
      });
    }
    if (currentList.length > 0) {
      structure.lists.push({
        content: currentList.join('\n'),
        position: position - currentList.join('\n').length,
        type: 'ul'
      });
    }
  }
}
