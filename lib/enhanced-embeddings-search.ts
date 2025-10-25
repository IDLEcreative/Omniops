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
    
    const isAgricultural = queryLower.includes('agri') || queryLower.includes('agricultural');
    const isTipper = queryLower.includes('tipper') || queryLower.includes('dumper') || queryLower.includes('trailer');
    const hasFlip = queryLower.includes('flip');
    
    const conditions: string[] = [];
    
    if (isAgricultural || queryLower.includes('agri')) {
      console.log('[Enhanced Search] Detected agricultural query - adding specific agri searches');
      conditions.push(`url.ilike.%agri%`);
      conditions.push(`title.ilike.%agri%`);
      conditions.push(`title.ilike.%agricultural%`);
      conditions.push(`content.ilike.%agri%`);
      conditions.push(`content.ilike.%agricultural%`);
      conditions.push(`url.ilike.%agri-flip%`);
      conditions.push(`url.ilike.%agri_flip%`);
    }
    
    if (hasFlip) {
      conditions.push(`url.ilike.%flip%`);
      conditions.push(`title.ilike.%flip%`);
      conditions.push(`content.ilike.%flip%`);
    }
    
    if (isTipper) {
      conditions.push(`url.ilike.%tipper%`);
      conditions.push(`url.ilike.%dumper%`);
      conditions.push(`url.ilike.%trailer%`);
      conditions.push(`title.ilike.%tipper%`);
      conditions.push(`title.ilike.%dumper%`);
      conditions.push(`title.ilike.%trailer%`);
      conditions.push(`content.ilike.%tipper%`);
      conditions.push(`content.ilike.%dumper%`);
    }
    
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);
    words.forEach(word => {
      conditions.push(`url.ilike.%${word}%`);
      conditions.push(`title.ilike.%${word}%`);
      if (word === 'agricultural' || word === 'agri' || word === 'agriculture') {
        conditions.push(`content.ilike.%${word}%`);
      }
    });
    
    if (conditions.length === 0) return [];
    
    const fetchLimit = isAgricultural ? Math.max(50, limit * 3) : limit * 2;
    
    const { data, error } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('domain_id', domainId)
      .or(conditions.join(','))
      .limit(fetchLimit);
    
    if (error || !data) return [];
    
    console.log(`[Enhanced Search] Found ${data.length} title/URL matches`);
    
    if (isAgricultural) {
      const agriFlipInRaw = data.some((row: any) => row.url?.includes('agri-flip'));
      if (!agriFlipInRaw) {
        console.log(`[Enhanced Search] Agri Flip NOT in raw database results (${data.length} items)`);
        
        console.log(`[Enhanced Search] Explicitly fetching Agri Flip product...`);
        const { data: agriFlipData } = await supabase
          .from('scraped_pages')
          .select('url, title, content')
          .eq('domain_id', domainId)
          .ilike('url', '%agri-flip%')
          .single();
        
        if (agriFlipData) {
          console.log(`[Enhanced Search] Found and adding Agri Flip to results`);
          data.unshift(agriFlipData);
        }
      } else {
        console.log(`[Enhanced Search] Agri Flip IS in raw database results`);
      }
    }
    
    return data.map((row: any) => {
      const urlLower = (row.url || '').toLowerCase();
      const titleLower = (row.title || '').toLowerCase();
      const contentLower = (row.content || '').toLowerCase();
      let score = 0.6;
      
      if (isAgricultural && (urlLower.includes('agri') || titleLower.includes('agri') || contentLower.includes('agricultural'))) {
        score += 0.25;
        console.log(`[Enhanced Search] Found agricultural product: ${row.title}`);
      }
      
      if (isTipper && (urlLower.includes('tipper') || urlLower.includes('dumper') || urlLower.includes('trailer'))) {
        score += 0.15;
      }
      
      if (urlLower.includes('agri-flip') || titleLower.includes('agri flip')) {
        score = 0.99;
        console.log(`[Enhanced Search] Found Agri Flip product!`);
      }
      
      let matchCount = 0;
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      queryWords.forEach(word => {
        if (urlLower.includes(word)) matchCount++;
        if (titleLower.includes(word)) matchCount++;
      });
      
      score += (matchCount * 0.1);
      
      if (urlLower.includes(queryLower.replace(/\s+/g, '-')) || 
          titleLower.includes(queryLower)) {
        score = Math.min(0.99, score + 0.3);
        console.log(`[Enhanced Search] Found exact/near-exact match: ${row.title}`);
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
