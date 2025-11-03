import React, { useMemo } from 'react';

interface MessageContentProps {
  content: string;
  className?: string;
}

// Memoized component to prevent unnecessary re-renders
export const MessageContent = React.memo(({ content, className = '' }: MessageContentProps) => {
  // Format markdown content for better display - simplified to preserve formatting
  const formatMarkdown = useMemo(() => (text: string): string => {
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
  
  // Memoized function to convert URLs in text to clickable links
  const renderContentWithLinks = useMemo(() => (text: string) => {
    // Regex patterns for different URL formats
    const patterns = [
      // [text](url) markdown style
      /\[([^\]]+)\]\(([^)]+)\)/g,
      // Plain URLs with http/https
      /(https?:\/\/[^\s]+)/g,
      // URLs without protocol (example.com/page)
      /(?<!\S)((?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g
    ];

    const processedText = text;
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
        elements.push(processPlainUrls(textBefore));
      }

      // Add the link
      elements.push(
        <a
          key={`link-${link.start}`}
          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
          className="text-blue-400 underline hover:text-blue-300 break-words"
        >
          {link.text}
        </a>
      );

      lastIndex = link.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(processPlainUrls(text.substring(lastIndex)));
    }

    // If no markdown links were found, just process plain URLs
    if (elements.length === 0) {
      return processPlainUrls(text);
    }

    return elements;
  }, []);

  // Function to process plain URLs in text
  const processPlainUrls = useMemo(() => (text: string): React.ReactNode => {
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
            className="text-blue-400 underline hover:text-blue-300 break-words"
          >
            {part}
          </a>
        );
      }
      
      return part;
    });
  }, []);

  // Memoize the rendered content - first format markdown, then process links
  const renderedContent = useMemo(() => {
    // Debug: Check if content has line breaks (development only)
    if (process.env.NODE_ENV === 'development' && content.includes('•')) {
      console.log('[MessageContent] Raw content preview:', content.substring(0, 500));
      console.log('[MessageContent] Has newlines after bullets:', content.includes('•\n'));
    }

    const formattedContent = formatMarkdown(content);
    return renderContentWithLinks(formattedContent);
  }, [content, formatMarkdown, renderContentWithLinks]);

  return (
    <span className={`whitespace-pre-wrap ${className}`}>
      {renderedContent}
    </span>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return prevProps.content === nextProps.content && prevProps.className === nextProps.className;
});

MessageContent.displayName = 'MessageContent';
