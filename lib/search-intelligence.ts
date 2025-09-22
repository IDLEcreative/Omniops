/**
 * Search Intelligence Layer
 * Adds predictive capabilities and learning to the search system
 */

import { searchSimilarContent } from './embeddings';
import { getProductOverview } from './search-overview';

interface QueryPattern {
  sequence: string[];
  frequency: number;
  avgTimeToNext: number;
}

interface UserIntent {
  primary: 'browse' | 'compare' | 'specific' | 'troubleshoot';
  categories: string[];
  priceRange?: [number, number];
  urgency: 'immediate' | 'research' | 'planning';
}

export class SearchIntelligence {
  private queryHistory: string[] = [];
  private commonPatterns: Map<string, QueryPattern> = new Map();
  private prefetchCache: Map<string, any> = new Map();
  
  /**
   * Analyze query to predict user intent and pre-fetch related data
   */
  async analyzeAndPrefetch(
    query: string,
    domain: string
  ): Promise<{
    intent: UserIntent;
    prefetched: string[];
    suggestions: string[];
  }> {
    // Analyze query intent
    const intent = this.detectIntent(query);
    
    // Predict likely follow-up queries
    const predictions = this.predictNextQueries(query);
    
    // Pre-fetch in background (non-blocking)
    const prefetched: string[] = [];
    predictions.forEach(prediction => {
      this.prefetchInBackground(prediction, domain);
      prefetched.push(prediction);
    });
    
    // Generate smart suggestions
    const suggestions = this.generateSuggestions(query, intent);
    
    return { intent, prefetched, suggestions };
  }
  
  /**
   * Detect user intent from query
   */
  private detectIntent(query: string): UserIntent {
    const queryLower = query.toLowerCase();
    
    // Detect browsing intent
    if (queryLower.includes('show') || queryLower.includes('all') || queryLower.includes('list')) {
      return {
        primary: 'browse',
        categories: this.extractCategories(query),
        urgency: 'research'
      };
    }
    
    // Detect comparison intent
    if (queryLower.includes('compare') || queryLower.includes('vs') || queryLower.includes('difference')) {
      return {
        primary: 'compare',
        categories: this.extractCategories(query),
        urgency: 'planning'
      };
    }
    
    // Detect specific product search
    if (/[A-Z0-9]{5,}/.test(query) || queryLower.includes('part number')) {
      return {
        primary: 'specific',
        categories: [],
        urgency: 'immediate'
      };
    }
    
    // Default to browse
    return {
      primary: 'browse',
      categories: this.extractCategories(query),
      urgency: 'research'
    };
  }
  
  /**
   * Predict likely follow-up queries based on patterns
   */
  private predictNextQueries(currentQuery: string): string[] {
    const predictions: string[] = [];
    
    // Common patterns based on query type
    if (currentQuery.toLowerCase().includes('cifa')) {
      predictions.push('pumps', 'hydraulic', 'valves');
    }
    
    if (currentQuery.toLowerCase().includes('pump')) {
      predictions.push('fittings', 'gaskets', 'hydraulic oil');
    }
    
    if (currentQuery.toLowerCase().includes('show all')) {
      predictions.push('in stock', 'under 500', 'most popular');
    }
    
    // Learn from history
    const lastQuery = this.queryHistory[this.queryHistory.length - 1];
    if (lastQuery) {
      const pattern = `${lastQuery} -> ${currentQuery}`;
      const knownPattern = this.commonPatterns.get(pattern);
      if (knownPattern && knownPattern.frequency > 3) {
        // This is a common pattern, predict next step
        predictions.push(...knownPattern.sequence.slice(2, 4));
      }
    }
    
    return predictions.slice(0, 3); // Limit pre-fetching
  }
  
  /**
   * Pre-fetch data in background without blocking
   */
  private async prefetchInBackground(query: string, domain: string): Promise<void> {
    // Check if already cached
    if (this.prefetchCache.has(query)) {
      return;
    }
    
    // Non-blocking prefetch
    searchSimilarContent(query, domain, 20, 0.15, 3000)
      .then(results => {
        this.prefetchCache.set(query, {
          results,
          timestamp: Date.now()
        });
        
        // Clear old cache entries (older than 5 minutes)
        this.cleanCache();
      })
      .catch(() => {
        // Silently fail - this is just optimization
      });
  }
  
  /**
   * Get pre-fetched results if available
   */
  getPrefetchedResults(query: string): any[] | null {
    const cached = this.prefetchCache.get(query);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.results;
    }
    return null;
  }
  
  /**
   * Generate intelligent suggestions based on context
   */
  private generateSuggestions(query: string, intent: UserIntent): string[] {
    const suggestions: string[] = [];
    
    switch (intent.primary) {
      case 'browse':
        suggestions.push(
          'Filter by price range',
          'Show only in-stock items',
          'Group by category',
          'Sort by popularity'
        );
        break;
        
      case 'compare':
        suggestions.push(
          'Show comparison table',
          'Highlight differences',
          'Check compatibility',
          'Compare prices'
        );
        break;
        
      case 'specific':
        suggestions.push(
          'Check stock availability',
          'Find alternatives',
          'View technical specs',
          'See compatible parts'
        );
        break;
        
      case 'troubleshoot':
        suggestions.push(
          'Common replacement parts',
          'Installation guides',
          'Maintenance items',
          'Contact support'
        );
        break;
    }
    
    return suggestions;
  }
  
  /**
   * Extract categories from query
   */
  private extractCategories(query: string): string[] {
    const categories: string[] = [];
    const queryLower = query.toLowerCase();
    
    const knownCategories = [
      'pumps', 'valves', 'motors', 'hydraulic',
      'fittings', 'gaskets', 'filters', 'starters'
    ];
    
    knownCategories.forEach(cat => {
      if (queryLower.includes(cat)) {
        categories.push(cat);
      }
    });
    
    return categories;
  }
  
  /**
   * Clean old cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    for (const [key, value] of this.prefetchCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.prefetchCache.delete(key);
      }
    }
  }
  
  /**
   * Record query for pattern learning
   */
  recordQuery(query: string): void {
    this.queryHistory.push(query);
    
    // Keep only last 100 queries
    if (this.queryHistory.length > 100) {
      this.queryHistory.shift();
    }
    
    // Update patterns
    if (this.queryHistory.length >= 2) {
      const sequence = this.queryHistory.slice(-2);
      const pattern = sequence.join(' -> ');
      
      const existing = this.commonPatterns.get(pattern) || {
        sequence: sequence,
        frequency: 0,
        avgTimeToNext: 0
      };
      
      existing.frequency++;
      this.commonPatterns.set(pattern, existing);
    }
  }
}

// Singleton instance
export const searchIntelligence = new SearchIntelligence();