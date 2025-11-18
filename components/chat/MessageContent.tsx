import React, { useMemo, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
  content: string;
  className?: string;
}

// Memoized component to prevent unnecessary re-renders
export const MessageContent = React.memo(({ content, className = '' }: MessageContentProps) => {
  // Format markdown content for better display - simplified to preserve formatting
  const formatMarkdown = useCallback((text: string): string => {
    // Safety check for null/undefined content
    if (!text || typeof text !== 'string') return '';

    // DON'T modify the text much - preserve the original formatting
    // The AI is already providing proper formatting with line breaks

    let formatted = text;

    // Just normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');
    formatted = formatted.replace(/\r/g, '\n');

    // Trim only
    formatted = formatted.trim();

    return formatted;
  }, []);
  
  // Helper function to process plain URLs in text (hoisted before useMemo)
  const processPlainUrlsCallback = useCallback((text: string): React.ReactNode => {
    const urlRegex = /(https?:\/\/[^\s]+)|((?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Check if this part is a URL
      if (urlRegex.test(part)) {
        const url = part.startsWith('http') ? part : `https://${part}`;
        return (
          <a
            key={`url-${index}`}
            href={url}
            target="_top"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300 break-words"
          >
            {part}
          </a>
        );
      }

      return part;
    });
  }, []);

  // Parse code blocks and render with syntax highlighting
  const renderContentWithCodeBlocks = useCallback((text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    // Match code blocks with optional language: ```language\ncode\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block (with link processing)
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        elements.push(
          <span key={`text-${blockIndex}`}>
            {renderContentWithLinks(textBefore)}
          </span>
        );
      }

      const language = match[1] || 'text';
      const code = match[2]?.trim() || '';

      // Add syntax-highlighted code block
      elements.push(
        <div key={`code-${blockIndex}`} className="my-2 rounded-md overflow-hidden">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
      blockIndex++;
    }

    // Add remaining text after last code block
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${blockIndex}`}>
          {renderContentWithLinks(text.substring(lastIndex))}
        </span>
      );
    }

    // If no code blocks found, just process links
    if (elements.length === 0) {
      return [renderContentWithLinks(text)];
    }

    return elements;
  }, []);

  // Memoized function to convert URLs in text to clickable links
  const renderContentWithLinks = useCallback((text: string) => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // First, handle markdown-style links
    const markdownLinks: Array<{ start: number; end: number; text: string; url: string }> = [];
    let match;

    const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    while ((match = markdownRegex.exec(text)) !== null) {
      markdownLinks.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1] || '',
        url: match[2] || ''
      });
    }

    // Sort by position
    markdownLinks.sort((a, b) => a.start - b.start);

    // Process the text
    for (const link of markdownLinks) {
      // Add text before the link
      if (link.start > lastIndex) {
        const textBefore = text.substring(lastIndex, link.start);
        elements.push(processPlainUrlsCallback(textBefore));
      }

      // Add the link
      elements.push(
        <a
          key={`link-${link.start}`}
          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
          target="_top"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300 break-words"
        >
          {link.text}
        </a>
      );

      lastIndex = link.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(processPlainUrlsCallback(text.substring(lastIndex)));
    }

    // If no markdown links were found, just process plain URLs
    if (elements.length === 0) {
      return processPlainUrlsCallback(text);
    }

    return elements;
  }, [processPlainUrlsCallback]);

  // Memoize the rendered content - format markdown, then process code blocks and links
  const renderedContent = useMemo(() => {
    // Debug: Check if content has line breaks (development only)
    if (process.env.NODE_ENV === 'development' && content.includes('•')) {
      console.log('[MessageContent] Raw content preview:', content.substring(0, 500));
      console.log('[MessageContent] Has newlines after bullets:', content.includes('•\n'));
    }

    const formattedContent = formatMarkdown(content);
    return renderContentWithCodeBlocks(formattedContent);
  }, [content, formatMarkdown, renderContentWithCodeBlocks]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderedContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return prevProps.content === nextProps.content && prevProps.className === nextProps.className;
});

MessageContent.displayName = 'MessageContent';
