/**
 * Keyword and metadata search functions for Enhanced Embeddings
 * Handles parallel search strategies beyond semantic search
 */

import type { SearchResult } from './enhanced-embeddings-types';

/**
 * Search for keywords in content
 */
export async function searchKeywordsInContent(
  domainId: string,
  query: string,
  limit: number,
  supabase: any
): Promise<SearchResult[]> {
  try {
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
    
    if (keywords.length === 0) return [];
    
    const orConditions = keywords.flatMap(kw => [
      `content.ilike.%${kw}%`,
      `title.ilike.%${kw}%`
    ]);
    
    const { data, error } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('domain_id', domainId)
      .or(orConditions.join(','))
      .limit(limit * 2);
    
    if (error || !data) return [];
    
    return data.map((row: any) => {
      const contentLower = (row.content || '').toLowerCase();
      const titleLower = (row.title || '').toLowerCase();
      let score = 0.5;
      
      keywords.forEach(kw => {
        if (titleLower.includes(kw)) score += 0.15;
        if (contentLower.includes(kw)) score += 0.05;
      });
      
      let allKeywordsMatched = true;
      keywords.forEach(kw => {
        if (!contentLower.includes(kw) && !titleLower.includes(kw)) {
          allKeywordsMatched = false;
        }
      });
      if (allKeywordsMatched) score += 0.2;
      
      return {
        content: row.content || '',
        url: row.url || '',
        title: row.title || 'Untitled',
        similarity: Math.min(score, 0.95)
      };
    })
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, limit);
  } catch (error) {
    console.error('[Enhanced Search] Keyword search error:', error);
    return [];
  }
}

/**
 * Search in titles and URLs for better product matching
 */
export async function searchTitleAndUrl(
  domainId: string,
  query: string,
  limit: number,
  supabase: any
): Promise<SearchResult[]> {
  try {
    const queryLower = query.toLowerCase();
    const conditions: string[] = [];

    // Extract query words for generic matching
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);
    words.forEach(word => {
      conditions.push(`url.ilike.%${word}%`);
      conditions.push(`title.ilike.%${word}%`);
      // Also search content for important terms
      conditions.push(`content.ilike.%${word}%`);
    });

    if (conditions.length === 0) return [];

    const { data, error } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('domain_id', domainId)
      .or(conditions.join(','))
      .limit(limit * 2);

    if (error || !data) return [];


    return data.map((row: any) => {
      const urlLower = (row.url || '').toLowerCase();
      const titleLower = (row.title || '').toLowerCase();
      let score = 0.6;

      // Count how many query words match
      let matchCount = 0;
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      queryWords.forEach(word => {
        if (urlLower.includes(word)) matchCount++;
        if (titleLower.includes(word)) matchCount++;
      });

      score += (matchCount * 0.1);

      // Boost for exact or near-exact matches
      if (urlLower.includes(queryLower.replace(/\s+/g, '-')) ||
          titleLower.includes(queryLower)) {
        score = Math.min(0.99, score + 0.3);
      }

      return {
        content: row.content || '',
        url: row.url || '',
        title: row.title || 'Untitled',
        similarity: Math.min(score, 0.99)
      };
    })
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, limit);
  } catch (error) {
    console.error('[Enhanced Search] Title/URL search error:', error);
    return [];
  }
}
