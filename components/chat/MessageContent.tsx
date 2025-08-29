import React, { useMemo } from 'react';

interface MessageContentProps {
  content: string;
  className?: string;
}

// Memoized component to prevent unnecessary re-renders
export const MessageContent = React.memo(({ content, className = '' }: MessageContentProps) => {
  // Strip markdown formatting from content
  const stripMarkdown = useMemo(() => (text: string): string => {
    let cleaned = text;
    
    // Remove horizontal rules (---, ***, ___)
    cleaned = cleaned.replace(/^[-*_]{3,}$/gm, '');
    
    // Remove headers (###, ##, #)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    
    // Remove bold/italic markers
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
    
    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').trim();
      return code;
    });
    
    // Remove inline code
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Remove blockquotes
    cleaned = cleaned.replace(/^>\s+/gm, '');
    
    // Remove list markers (keeping the text)
    cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '• ');
    cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');
    
    // Clean up extra newlines (keep max 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Trim each line
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    
    // Remove empty lines at start and end
    cleaned = cleaned.trim();
    
    return cleaned;
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
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-words"
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
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 break-words"
          >
            {part}
          </a>
        );
      }
      
      return part;
    });
  }, []);

  // Memoize the rendered content - first strip markdown, then process links
  const renderedContent = useMemo(() => {
    const cleanedContent = stripMarkdown(content);
    return renderContentWithLinks(cleanedContent);
  }, [content, stripMarkdown, renderContentWithLinks]);

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