/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { MessageContent } from '@/components/chat/MessageContent';

describe('MessageContent - Plain Text Rendering', () => {
  it('should render plain text correctly', () => {
    const { container } = render(<MessageContent content="Hello, world!" />);
    expect(container).toHaveTextContent('Hello, world!');
  });

  it('should handle empty content', () => {
    const { container } = render(<MessageContent content="" />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe('');
  });

  it('should trim whitespace from content', () => {
    const { container } = render(<MessageContent content="   Hello   " />);
    expect(container).toHaveTextContent('Hello');
  });

  it('should preserve line breaks with whitespace-pre-wrap', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const { container } = render(<MessageContent content={content} />);
    const span = container.querySelector('span');
    expect(span).toHaveClass('whitespace-pre-wrap');
  });

  it('should handle very long messages', () => {
    const longMessage = 'A'.repeat(5000);
    const { container } = render(<MessageContent content={longMessage} />);
    expect(container).toHaveTextContent(longMessage);
  });

  it('should handle special characters', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const { container } = render(<MessageContent content={specialChars} />);
    expect(container).toHaveTextContent(specialChars);
  });

  it('should normalize line endings (CRLF to LF)', () => {
    const content = 'Line 1\r\nLine 2\rLine 3\nLine 4';
    const { container } = render(<MessageContent content={content} />);
    const span = container.querySelector('span');
    expect(span?.textContent).toContain('Line 1');
    expect(span?.textContent).toContain('Line 2');
    expect(span?.textContent).toContain('Line 3');
    expect(span?.textContent).toContain('Line 4');
  });
});

describe('MessageContent - Formatting Edge Cases', () => {
  it('should handle messages with only whitespace', () => {
    const { container } = render(<MessageContent content="   \n\t  " />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe('\\n\\t');
  });

  it('should handle messages with bullet points', () => {
    const content = '• Item 1\n• Item 2\n• Item 3';
    const { container } = render(<MessageContent content={content} />);

    expect(container).toHaveTextContent('• Item 1');
    expect(container).toHaveTextContent('• Item 2');
    expect(container).toHaveTextContent('• Item 3');
  });

  it('should handle messages with numbered lists', () => {
    const content = '1. First\n2. Second\n3. Third';
    const { container } = render(<MessageContent content={content} />);

    expect(container).toHaveTextContent('1. First');
    expect(container).toHaveTextContent('2. Second');
    expect(container).toHaveTextContent('3. Third');
  });

  it('should handle messages with mixed formatting', () => {
    const content = '**Bold** text with https://example.com and [Link](https://test.com)';
    const { container } = render(<MessageContent content={content} />);

    expect(container).toHaveTextContent('**Bold** text with');

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
  });

  it('should handle unicode characters', () => {
    const content = 'Hello 世界 🌍 Привет';
    const { container } = render(<MessageContent content={content} />);

    expect(container).toHaveTextContent('Hello 世界 🌍 Привет');
  });

  it('should handle emojis', () => {
    const content = 'Great! 👍 Thanks! 🎉';
    const { container } = render(<MessageContent content={content} />);

    expect(container).toHaveTextContent('Great! 👍 Thanks! 🎉');
  });
});

describe('MessageContent - Custom ClassName', () => {
  it('should apply custom className', () => {
    const { container } = render(
      <MessageContent content="Test" className="custom-class" />
    );

    const span = container.querySelector('span');
    expect(span).toHaveClass('custom-class');
    expect(span).toHaveClass('whitespace-pre-wrap');
  });

  it('should work without custom className', () => {
    const { container } = render(<MessageContent content="Test" />);

    const span = container.querySelector('span');
    expect(span).toHaveClass('whitespace-pre-wrap');
  });
});
