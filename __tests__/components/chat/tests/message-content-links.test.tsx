/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { MessageContent } from '@/components/chat/MessageContent';

describe('MessageContent - URL Detection and Linking', () => {
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

describe('MessageContent - Markdown-Style Links', () => {
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
