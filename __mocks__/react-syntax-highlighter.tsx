/**
 * Mock for react-syntax-highlighter
 * Used in tests to avoid ESM/CommonJS issues with refractor
 */
import React from 'react';

interface SyntaxHighlighterProps {
  children: string;
  language?: string;
  style?: any;
  customStyle?: React.CSSProperties;
  wrapLongLines?: boolean;
}

// Mock component that renders code in a pre tag
export const Prism = ({ children, language, customStyle }: SyntaxHighlighterProps) => {
  return (
    <pre
      data-language={language}
      style={customStyle}
      className="syntax-highlighter"
    >
      <code>{children}</code>
    </pre>
  );
};

// Named export
export { Prism as default };

// Mock for styles
export const vscDarkPlus = {};
