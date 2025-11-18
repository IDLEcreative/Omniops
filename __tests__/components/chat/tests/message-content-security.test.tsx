/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { MessageContent } from '@/components/chat/MessageContent';

describe('MessageContent - XSS Prevention', () => {
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
