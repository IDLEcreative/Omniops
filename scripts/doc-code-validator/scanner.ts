import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { CodeBlock } from './types';

export function getDocumentationFiles(): string[] {
  const docFiles = glob.sync('docs/**/*.md', { cwd: process.cwd() });
  const readmeFiles = glob.sync('**/README.md', { cwd: process.cwd(), ignore: ['node_modules/**'] });
  return [...new Set([...docFiles, ...readmeFiles])];
}

export function extractCodeBlocks(content: string, filename: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentLanguage = '';
  let currentCode: string[] = [];
  let startLine = 0;

  lines.forEach((line, index) => {
    const codeBlockMatch = line.match(/^```(\w+)?/);

    if (codeBlockMatch && !inCodeBlock) {
      inCodeBlock = true;
      currentLanguage = codeBlockMatch[1] || 'text';
      currentCode = [];
      startLine = index + 1;
      return;
    }

    if (line.startsWith('```') && inCodeBlock) {
      blocks.push({
        file: filename,
        language: currentLanguage,
        code: currentCode.join('\n'),
        lineNumber: startLine
      });
      inCodeBlock = false;
      currentLanguage = '';
      currentCode = [];
      return;
    }

    if (inCodeBlock) {
      currentCode.push(line);
    }
  });

  return blocks;
}

export function readFileContent(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
}
