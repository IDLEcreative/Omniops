import React, { useMemo } from 'react';

interface MessageContentProps {
  content: string;
  className?: string;
}

// Memoized component to prevent unnecessary re-renders
export const MessageContent = React.memo(({ content, className = '' }: MessageContentProps) => {
  // Format markdown content for better display
  const formatMarkdown = useMemo(() => (text: string): string => {
    let formatted = text;
    
    // First normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');
    formatted = formatted.replace(/\r/g, '\n');
    
    // Remove horizontal rules (---, ***, ___)
    formatted = formatted.replace(/^[-*_]{3,}$/gm, '');
    
    // Keep headers but remove the # symbols and add spacing
    formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n');
    
    // Convert bold markers to just keep the text
    formatted = formatted.replace(/(\*\*|__)(.*?)\1/g, '$2');
    
    // Keep single asterisk/underscore for lists but clean up emphasis
    formatted = formatted.replace(/(?<!\*)(\*|_)(?!\*)([^*_\n]+?)(\*|_)(?!\*)/g, '$2');
    
    // Format code blocks nicely
    formatted = formatted.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').trim();
      return '\n' + code + '\n';
    });
    
    // Keep inline code visible but remove backticks
    formatted = formatted.replace(/`([^`]+)`/g, '$1');
    
    // Remove blockquotes marker but keep content
    formatted = formatted.replace(/^>\s+/gm, '');
    
    // Format list markers consistently with proper spacing
    formatted = formatted.replace(/^[\s]*[-*+]\s+(.+)$/gm, '\n• $1');
    formatted = formatted.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '\n$1. $2');
    
    // Clean up multiple newlines but preserve paragraph breaks
    formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
    formatted = formatted.replace(/\n{3}/g, '\n\n');
    
    // Ensure single line break between list items
    formatted = formatted.replace(/(\n[•\d]+\..+)(\n)([•\d]+\.)/g, '$1\n$3');
    
    // Remove empty lines at start and end only
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

  // Memoize the rendered content - first format markdown, then process links
  const renderedContent = useMemo(() => {
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
