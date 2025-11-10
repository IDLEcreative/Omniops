import { SearchResult } from '@/lib/search/conversation-search';

/**
 * Strip HTML tags from string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Group search results by conversation ID
 */
export function groupByConversation(
  results: SearchResult[]
): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();

  for (const result of results) {
    const messages = grouped.get(result.conversationId) || [];
    messages.push(result);
    grouped.set(result.conversationId, messages);
  }

  // Sort messages within each conversation
  grouped.forEach(messages => {
    messages.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  return grouped;
}
