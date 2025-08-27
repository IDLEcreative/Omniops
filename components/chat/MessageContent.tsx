import React from 'react';

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className = '' }: MessageContentProps) {
  // Function to convert URLs in text to clickable links
  const renderContentWithLinks = (text: string) => {
    // Regex patterns for different URL formats
    const patterns = [
      // [text](url) markdown style
      /\[([^\]]+)\]\(([^)]+)\)/g,
      // Plain URLs with http/https
      /(https?:\/\/[^\s]+)/g,
      // URLs without protocol (example.com/page)
      /(?<!\S)((?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g
    ];

    let processedText = text;
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
  };

  // Function to process plain URLs in text
  const processPlainUrls = (text: string): React.ReactNode => {
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
  };

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderContentWithLinks(content)}
    </div>
  );
}