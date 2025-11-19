import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { MessageContent } from '@/components/chat/MessageContent';

describe('MessageContent - Syntax Highlighting', () => {
  it('should render code blocks with syntax highlighting', () => {
    const content = 'Here is some code:\n```javascript\nconst x = 5;\nconsole.log(x);\n```';
    const { container } = render(<MessageContent content={content} />);

    // Should contain the code
    expect(container).toHaveTextContent('const x = 5;');
    expect(container).toHaveTextContent('console.log(x);');
  });

  it('should handle code blocks without language specified', () => {
    const content = '```\nplain code\n```';
    const { container } = render(<MessageContent content={content} />);
    expect(container).toHaveTextContent('plain code');
  });

  it('should handle multiple code blocks in same message', () => {
    const content = `First block:
\`\`\`javascript
const a = 1;
\`\`\`

Second block:
\`\`\`python
b = 2
\`\`\``;

    const { container } = render(<MessageContent content={content} />);
    expect(container).toHaveTextContent('const a = 1;');
    expect(container).toHaveTextContent('b = 2');
  });

  it('should preserve text before and after code blocks', () => {
    const content = 'Before\n```js\ncode\n```\nAfter';
    const { container } = render(<MessageContent content={content} />);
    expect(container).toHaveTextContent('Before');
    expect(container).toHaveTextContent('code');
    expect(container).toHaveTextContent('After');
  });

  it('should handle code blocks with various languages', () => {
    const languages = ['typescript', 'python', 'rust', 'go', 'java', 'c'];

    languages.forEach(lang => {
      const content = `\`\`\`${lang}\ncode\n\`\`\``;
      const { container } = render(<MessageContent content={content} />);
      expect(container).toHaveTextContent('code');
    });
  });

  it('should handle empty code blocks', () => {
    const content = '```javascript\n```';
    const { container } = render(<MessageContent content={content} />);
    // Should not crash
    expect(container).toBeInTheDocument();
  });

  it('should handle code blocks with special characters', () => {
    const content = '```javascript\nconst obj = { key: "value", fn: () => {} };\n```';
    const { container } = render(<MessageContent content={content} />);
    expect(container).toHaveTextContent('const obj');
  });

  it('should mix code blocks with markdown links', () => {
    const content = 'Check [this link](https://example.com)\n```js\nconst x = 1;\n```';
    const { container } = render(<MessageContent content={content} />);

    const link = container.querySelector('a[href="https://example.com"]');
    expect(link).toBeInTheDocument();
    expect(container).toHaveTextContent('const x = 1;');
  });

  it('should handle inline backticks (not code blocks)', () => {
    const content = 'Use `const` instead of `var` in JavaScript';
    const { container } = render(<MessageContent content={content} />);
    // Inline backticks should render as plain text (we only handle triple backticks)
    expect(container).toHaveTextContent('Use `const` instead of `var` in JavaScript');
  });

  it('should handle nested backticks inside code blocks', () => {
    const content = '```javascript\nconst str = `template ${literal}`;\n```';
    const { container } = render(<MessageContent content={content} />);
    expect(container).toHaveTextContent('template');
  });
});
