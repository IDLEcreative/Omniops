import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { MessageContent } from '@/components/chat/MessageContent';

describe('MessageContent - React.memo Optimization', () => {
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

    let div = container.querySelector('div');
    expect(div).toHaveClass('class1');

    rerender(<MessageContent content="Test" className="class2" />);

    div = container.querySelector('div');
    expect(div).not.toHaveClass('class1');
    expect(div).toHaveClass('class2');
  });
});

describe('MessageContent - Performance with Large Content', () => {
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

describe('MessageContent - Console Logging (Debug)', () => {
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
