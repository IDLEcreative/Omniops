import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { MessageContent } from '@/components/chat/MessageContent';

describe('MessageContent Component', () => {
  describe('Plain Text Rendering', () => {
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

  describe('URL Detection and Linking', () => {
    it('should convert plain HTTP URLs to clickable links', () => {
      const content = 'Check out http://example.com for more info';
      render(<MessageContent content={content} />);

      const link = screen.getByText('http://example.com');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', 'http://example.com');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should convert plain HTTPS URLs to clickable links', () => {
      const content = 'Visit https://secure.example.com';
      render(<MessageContent content={content} />);

      const link = screen.getByText('https://secure.example.com');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://secure.example.com');
    });

    it('should add https:// to URLs without protocol', () => {
      const content = 'Visit example.com or www.example.com';
      render(<MessageContent content={content} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', 'https://example.com');
      expect(links[1]).toHaveAttribute('href', 'https://www.example.com');
    });

    it('should handle URLs with paths', () => {
      const content = 'Check https://example.com/path/to/page';
      render(<MessageContent content={content} />);

      const link = screen.getByText('https://example.com/path/to/page');
      expect(link).toHaveAttribute('href', 'https://example.com/path/to/page');
    });

    it('should handle URLs with query parameters', () => {
      const content = 'Search at https://example.com?query=test&sort=asc';
      render(<MessageContent content={content} />);

      const link = screen.getByText('https://example.com?query=test&sort=asc');
      expect(link).toHaveAttribute('href', 'https://example.com?query=test&sort=asc');
    });

    it('should handle multiple URLs in one message', () => {
      const content = 'Visit https://example.com and https://test.com';
      render(<MessageContent content={content} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', 'https://example.com');
      expect(links[1]).toHaveAttribute('href', 'https://test.com');
    });

    it('should apply correct CSS classes to links', () => {
      const content = 'Visit https://example.com';
      render(<MessageContent content={content} />);

      const link = screen.getByText('https://example.com');
      expect(link).toHaveClass('text-blue-400');
      expect(link).toHaveClass('underline');
      expect(link).toHaveClass('hover:text-blue-300');
      expect(link).toHaveClass('break-words');
    });
  });

  describe('Markdown-Style Links', () => {
    it('should render markdown-style links [text](url)', () => {
      const content = 'Visit [Example](https://example.com) for more';
      render(<MessageContent content={content} />);

      const link = screen.getByText('Example');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(screen.queryByText('[Example](https://example.com)')).not.toBeInTheDocument();
    });

    it('should add https:// to markdown links without protocol', () => {
      const content = 'Visit [Example](example.com)';
      render(<MessageContent content={content} />);

      const link = screen.getByText('Example');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should handle multiple markdown links', () => {
      const content = 'Visit [Site 1](https://site1.com) and [Site 2](https://site2.com)';
      render(<MessageContent content={content} />);

      const link1 = screen.getByText('Site 1');
      const link2 = screen.getByText('Site 2');

      expect(link1).toHaveAttribute('href', 'https://site1.com');
      expect(link2).toHaveAttribute('href', 'https://site2.com');
    });

    it('should handle markdown links with plain URLs mixed in', () => {
      const content = 'Visit [Example](https://example.com) or https://test.com';
      render(<MessageContent content={content} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('Example');
      expect(links[1]).toHaveTextContent('https://test.com');
    });

    it('should handle markdown links with special characters in text', () => {
      const content = '[Example Site!](https://example.com)';
      render(<MessageContent content={content} />);

      const link = screen.getByText('Example Site!');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('XSS Prevention', () => {
    it('should not execute script tags in content', () => {
      const maliciousContent = '<script>alert("XSS")</script>';
      const { container } = render(<MessageContent content={maliciousContent} />);

      // Should render as text, not execute
      expect(container).toHaveTextContent('<script>alert("XSS")</script>');
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('should not render HTML tags in content', () => {
      const htmlContent = '<div>Hello</div><img src="x" onerror="alert(1)">';
      const { container } = render(<MessageContent content={htmlContent} />);

      // Should render as text
      expect(container).toHaveTextContent('<div>Hello</div>');
      expect(container.querySelector('div div')).not.toBeInTheDocument();
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('should handle javascript: protocol URLs safely', () => {
      const content = '[Click](javascript:alert("XSS"))';
      render(<MessageContent content={content} />);

      const link = screen.getByText('Click');
      // Should add https:// prefix, making it an invalid URL
      // Note: The closing parenthesis gets stripped by the markdown parser
      expect(link).toHaveAttribute('href', 'https://javascript:alert("XSS"');
    });

    it('should handle data: URLs safely', () => {
      const content = 'Visit data:text/html,<script>alert("XSS")</script>';
      render(<MessageContent content={content} />);

      // Should not create a link for data: URLs (doesn't match URL pattern)
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  describe('Formatting Edge Cases', () => {
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

  describe('Custom ClassName', () => {
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

  describe('React.memo Optimization', () => {
    it('should not re-render when props are the same', () => {
      const { rerender } = render(<MessageContent content="Test" />);

      const firstRender = screen.getByText('Test');

      // Re-render with same props
      rerender(<MessageContent content="Test" />);

      const secondRender = screen.getByText('Test');

      // Should be the same element (React.memo prevented re-render)
      expect(firstRender).toBe(secondRender);
    });

    it('should re-render when content changes', () => {
      const { rerender } = render(<MessageContent content="Original" />);

      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(<MessageContent content="Updated" />);

      expect(screen.queryByText('Original')).not.toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('should re-render when className changes', () => {
      const { container, rerender } = render(
        <MessageContent content="Test" className="class1" />
      );

      let span = container.querySelector('span');
      expect(span).toHaveClass('class1');

      rerender(<MessageContent content="Test" className="class2" />);

      span = container.querySelector('span');
      expect(span).not.toHaveClass('class1');
      expect(span).toHaveClass('class2');
    });
  });

  describe('Performance with Large Content', () => {
    it('should handle messages with many URLs efficiently', () => {
      const urls = Array(50).fill(0).map((_, i) => `https://example${i}.com`).join(' ');
      const { container } = render(<MessageContent content={urls} />);

      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(50);
    });

    it('should handle messages with many markdown links', () => {
      const markdownLinks = Array(20).fill(0)
        .map((_, i) => `[Link ${i}](https://example${i}.com)`)
        .join(' ');

      render(<MessageContent content={markdownLinks} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(20);
    });

    it('should handle mixed content efficiently', () => {
      const content = `
        Regular text with https://example.com
        [Markdown link](https://test.com)
        More text
        www.another-site.com
        Final text
      `;

      const { container } = render(<MessageContent content={content} />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Console Logging (Debug)', () => {
    it('should log debug info for messages with bullets', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<MessageContent content="• Item 1\n• Item 2" />);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MessageContent] Raw content preview:',
        expect.any(String)
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug info for regular messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const content = 'Regular message without bullets';
      render(<MessageContent content={content} />);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
