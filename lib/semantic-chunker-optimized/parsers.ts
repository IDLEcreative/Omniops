/**
 * Content Parsers
 */

import { PATTERNS } from './types';
import { stripHtmlFast, mapTagToType } from './utils';
import type { ContentBlock } from './types';

export function parseContentBlocks(content: string, htmlContent?: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  if (htmlContent) {
    parseHtmlEfficiently(htmlContent, blocks);
  } else {
    parseTextEfficiently(content, blocks);
  }

  blocks.sort((a, b) => a.position - b.position);
  return blocks;
}

function parseHtmlEfficiently(html: string, blocks: ContentBlock[]): void {
  const blockRegex = /<(h[1-6]|p|ul|ol|table|code|pre)(?:\s[^>]*)?>.*?<\/\1>/gis;
  let match;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1]?.toLowerCase();
    const content = stripHtmlFast(match[0]);

    if (content.trim() && tag) {
      blocks.push({
        type: mapTagToType(tag),
        content,
        position: match.index,
        level: tag?.startsWith('h') ? parseInt(tag[1] || '1') : undefined
      });
    }
  }
}

function parseTextEfficiently(text: string, blocks: ContentBlock[]): void {
  const lines = text.split('\n');
  let currentBlock: ContentBlock | null = null;
  let position = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    position += line.length + 1;

    if (!trimmed) {
      if (currentBlock && currentBlock.content.trim()) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    if (PATTERNS.markdownHeading.test(trimmed)) {
      if (currentBlock) blocks.push(currentBlock);
      const level = trimmed.match(PATTERNS.markdownHeading)![0].length;
      currentBlock = {
        type: 'heading',
        content: trimmed.replace(PATTERNS.markdownHeading, '').trim(),
        position,
        level
      };
    } else if (PATTERNS.questionAnswer.test(trimmed)) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'paragraph', content: trimmed, position };
    } else if (PATTERNS.listItem.test(trimmed)) {
      if (currentBlock?.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'list', content: trimmed, position };
      } else {
        currentBlock.content += '\n' + trimmed;
      }
    } else {
      if (currentBlock?.type === 'paragraph') {
        currentBlock.content += ' ' + trimmed;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'paragraph', content: trimmed, position };
      }
    }
  }

  if (currentBlock && currentBlock.content.trim()) {
    blocks.push(currentBlock);
  }
}
