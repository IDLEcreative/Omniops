export function sanitizeOutboundLinks(message: string, allowedDomain: string | null): string {
  if (!message || !allowedDomain) return message;
  const normalizedAllowed = allowedDomain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .toLowerCase();

  const isAllowedHost = (host: string) => {
    if (host === normalizedAllowed) return true;
    return host.endsWith(`.${normalizedAllowed}`);
  };

  // 1) Strip external markdown links: [text](url) -> text (if external)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  message = message.replace(markdownLinkRegex, (match, text, url) => {
    try {
      const host = new URL(url).host.replace(/^www\./, '').toLowerCase();
      return isAllowedHost(host) ? match : text; // keep link if same-domain, else drop URL
    } catch {
      return text; // malformed URL: drop
    }
  });

  // 2) Strip bare external URLs
  const bareUrlRegex = /(https?:\/\/[^\s)]+)(?=[\s)|]|$)/g;
  message = message.replace(bareUrlRegex, (url) => {
    try {
      const host = new URL(url).host.replace(/^www\./, '').toLowerCase();
      return isAllowedHost(host) ? url : '';
    } catch {
      return '';
    }
  });

  // Preserve newlines while cleaning up excessive spaces
  return message
    .replace(/[^\S\n]{2,}/g, ' ')  // Replace multiple spaces (but not newlines) with single space
    .replace(/\n{3,}/g, '\n\n')     // Limit consecutive newlines to maximum 2
    .trim();
}
