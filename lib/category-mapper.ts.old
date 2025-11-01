/**
 * Intelligent Category Mapping System
 * Maps products to categories based on URL patterns and product names
 * No hardcoding - uses dynamic pattern detection
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';

export interface CategoryMapping {
  pattern: string;           // URL pattern or keyword
  category_name: string;      // Display name
  category_url?: string;      // Optional category page URL
  product_count: number;      // Number of products
  confidence: number;         // Confidence score 0-1
}

export interface ProductCategory {
  product_url: string;
  product_name: string;
  category: string;
  category_url?: string;
}

export class CategoryMapper {
  private supabase: any;
  
  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Analyze all products and build category mappings
   * Uses pagination to prevent OOM on large datasets
   */
  async buildCategoryMappings(): Promise<Map<string, CategoryMapping>> {
    console.log('Building intelligent category mappings...');

    // Fetch all scraped product pages with pagination
    // ✅ Optimized: Only fetches needed columns (url, title, content)
    // ✅ Optimized: Uses pagination to handle 10,000+ pages safely
    const pages: Array<{ url: string; title: string; content: string }> = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error } = await this.supabase
        .from('scraped_pages')
        .select('url, title, content')
        .eq('status', 'completed')
        .order('url')
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error fetching pages:', error);
        break;
      }

      if (batch && batch.length > 0) {
        pages.push(...batch);
        offset += batchSize;
        console.log(`Fetched ${pages.length} pages for category mapping...`);

        if (batch.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    if (pages.length === 0) {
      console.log('No pages found for category mapping');
      return new Map();
    }

    // Group products by detected patterns
    const categoryPatterns = new Map<string, Set<string>>();
    const categoryUrls = new Map<string, string>();
    
    for (const page of pages) {
      // Skip non-product pages
      if (!this.isLikelyProductPage(page.url, page.content)) continue;
      
      // Extract potential category from various sources
      const categories = this.extractCategories(page);
      
      for (const category of categories) {
        if (!categoryPatterns.has(category.name)) {
          categoryPatterns.set(category.name, new Set());
        }
        const patternSet = categoryPatterns.get(category.name);
        if (patternSet) {
          patternSet.add(page.url);
        }
        
        // Track potential category URL
        if (category.url && !categoryUrls.has(category.name)) {
          categoryUrls.set(category.name, category.url);
        }
      }
    }

    // Build final mappings with confidence scores
    const mappings = new Map<string, CategoryMapping>();
    
    for (const [category, urls] of categoryPatterns) {
      // Skip categories with too few products
      if (urls.size < 2) continue;
      
      mappings.set(category, {
        pattern: this.generatePattern(category, Array.from(urls)),
        category_name: category,
        category_url: categoryUrls.get(category) || undefined,
        product_count: urls.size,
        confidence: this.calculateConfidence(urls.size, pages.length)
      });
    }

    console.log(`Created ${mappings.size} category mappings`);
    return mappings;
  }

  /**
   * Extract potential categories from a product page
   */
  private extractCategories(page: any): Array<{name: string; url?: string}> {
    const categories: Array<{name: string; url?: string}> = [];
    
    // ONLY extract from actual site structure - breadcrumbs, categories in content
    // Look for explicit category mentions in the content
    const categoryPattern = /(?:category|categories|filed under|posted in|tagged):\s*([^,\n]+)/gi;
    let match;
    
    while ((match = categoryPattern.exec(page.content || '')) !== null) {
      const matchedText = match[1];
      if (matchedText) {
        const categoryName = this.humanizeName(matchedText.trim());
        if (categoryName.length > 2 && categoryName.length < 50) {
          categories.push({ name: categoryName });
        }
      }
    }
    
    // If the page explicitly has category data in its structure, use it
    // Otherwise, we don't guess or impose categories
    
    return categories;
  }

  /**
   * Extract categories from product title
   */
  private extractFromTitle(title: string): Array<{name: string}> {
    // We DON'T extract categories from titles
    // That's imposing our own structure
    // Categories should come from the SITE'S navigation/structure
    return [];
  }

  /**
   * Extract brand from content
   */
  private extractBrand(title: string, content: string): string | null {
    // Common brand patterns in titles
    const brandMatch = title.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+/);
    if (brandMatch && brandMatch[1]) {
      return brandMatch[1];
    }
    
    // Look for "Brand:" or "Manufacturer:" in content
    const brandPattern = /(?:Brand|Manufacturer|Make):\s*([A-Za-z0-9\s]+)/i;
    const contentMatch = content.match(brandPattern);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1].trim();
    }
    
    return null;
  }

  /**
   * Extract product types from content
   */
  private extractProductTypes(content: string): Array<{name: string}> {
    const types: Array<{name: string}> = [];
    
    // Look for "Type:" or "Category:" in content
    const typePattern = /(?:Type|Category|Product Type):\s*([A-Za-z0-9\s\-]+)/gi;
    let match;
    
    while ((match = typePattern.exec(content)) !== null) {
      const type = match[1];
      if (type && type.trim().length > 2 && type.trim().length < 50) {
        types.push({ name: this.humanizeName(type.trim()) });
      }
    }
    
    return types;
  }

  /**
   * Check if URL is likely a product page
   */
  private isLikelyProductPage(url: string, content: string): boolean {
    // URL indicators
    if (url.includes('/product/') || url.includes('/item/')) return true;
    
    // Content indicators
    const indicators = ['price', 'add to cart', 'sku', 'product code', 'availability'];
    const lowerContent = content.toLowerCase();
    
    let matches = 0;
    for (const indicator of indicators) {
      if (lowerContent.includes(indicator)) matches++;
    }
    
    return matches >= 2;
  }

  /**
   * Generate pattern for category detection
   */
  private generatePattern(category: string, urls: string[]): string {
    // Find common URL patterns
    const commonSegments = new Set<string>();
    
    for (const url of urls) {
      const segments = url.split('/').filter(s => s);
      for (const segment of segments) {
        if (segment.toLowerCase().includes(category.toLowerCase().replace(/\s+/g, '-'))) {
          commonSegments.add(segment);
        }
      }
    }
    
    return Array.from(commonSegments).join('|') || category.toLowerCase();
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(categorySize: number, totalProducts: number): number {
    // Higher confidence for categories with more products
    const sizeScore = Math.min(categorySize / 10, 1) * 0.5;
    
    // Higher confidence for better coverage
    const coverageScore = Math.min(categorySize / totalProducts * 10, 1) * 0.5;
    
    return sizeScore + coverageScore;
  }

  /**
   * Convert URL slug to human-readable name
   */
  private humanizeName(slug: string): string {
    return slug
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * Find best category for a search query
   */
  async findCategoryForQuery(query: string, searchResults: any[]): Promise<{
    category: string;
    url?: string;
    confidence: number;
  } | null> {
    // Build mappings if not cached
    const mappings = await this.buildCategoryMappings();
    
    // Count URLs by potential category
    const categoryCounts = new Map<string, number>();
    
    for (const result of searchResults) {
      if (!result.url) continue;
      
      // Check each category mapping
      for (const [categoryName, mapping] of mappings) {
        // Check if URL matches pattern
        if (result.url.includes(mapping.pattern) || 
            result.title?.toLowerCase().includes(categoryName.toLowerCase())) {
          categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
        }
      }
    }
    
    // Find category with most matches
    let bestCategory = null;
    let maxCount = 0;
    
    for (const [category, count] of categoryCounts) {
      if (count > maxCount && count >= searchResults.length * 0.4) { // At least 40% match
        maxCount = count;
        bestCategory = category;
      }
    }
    
    if (bestCategory && mappings.has(bestCategory)) {
      const mapping = mappings.get(bestCategory)!;
      return {
        category: bestCategory,
        url: mapping.category_url,
        confidence: maxCount / searchResults.length
      };
    }
    
    return null;
  }

  /**
   * Store mappings in database for persistence
   */
  async persistMappings(mappings: Map<string, CategoryMapping>): Promise<void> {
    // Get domain ID first
    const { data: domains } = await this.supabase
      .from('customer_configs')
      .select('domain_id')
      .limit(1);
    
    if (!domains || domains.length === 0) {
      console.error('No domain found to persist mappings');
      return;
    }
    
    const domainId = domains[0].domain_id;
    
    // Store as a single record with all mappings
    const record = {
      domain_id: domainId,
      url: 'system/category-mappings',
      extract_type: 'category_mappings',
      extracted_data: {
        mappings: Array.from(mappings.values()),
        generated_at: new Date().toISOString(),
        total_categories: mappings.size
      },
      confidence_score: 0.8,
      extracted_at: new Date().toISOString()
    };

    // Delete old mappings first
    await this.supabase
      .from('structured_extractions')
      .delete()
      .eq('url', 'system/category-mappings')
      .eq('extract_type', 'category_mappings');

    // Insert new mappings
    const { error } = await this.supabase
      .from('structured_extractions')
      .insert(record);

    if (error) {
      console.error('Error persisting mappings:', error);
    } else {
      console.log(`Persisted ${mappings.size} category mappings`);
    }
  }
}