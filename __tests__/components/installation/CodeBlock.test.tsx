/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeBlock } from '@/app/dashboard/installation/components/CodeBlock';

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('CodeBlock Component', () => {
  it('should render code block with code', () => {
    const code = 'const x = 42;';

    render(<CodeBlock code={code} language="javascript" />);

    expect(screen.getByText(code)).toBeInTheDocument();
  });

  it('should render pre element with dark theme', () => {
    const { container } = render(<CodeBlock code="test" language="js" />);

    const pre = container.querySelector('pre');
    expect(pre).toHaveClass('bg-[#1e1e1e]');
    expect(pre).toHaveClass('text-gray-100');
  });

  it('should include copy button', () => {
    render(<CodeBlock code="test code" language="js" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should set language data attribute', () => {
    const { container } = render(<CodeBlock code="test" language="typescript" />);

    const pre = container.querySelector('pre');
    expect(pre).toHaveAttribute('data-language', 'typescript');
  });

  it('should handle multi-line code', () => {
    const code = `function test() {
  console.log('hello');
  return true;
}`;

    render(<CodeBlock code={code} language="javascript" />);

    expect(screen.getByText(/function test/)).toBeInTheDocument();
  });

  it('should preserve code formatting', () => {
    const code = '  indented code\n    more indented';

    const { container } = render(<CodeBlock code={code} language="text" />);

    const codeElement = container.querySelector('code');
    expect(codeElement?.textContent).toBe(code);
  });
});
