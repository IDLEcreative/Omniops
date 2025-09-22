/**
 * AI-Powered Category Inference System
 * Uses OpenAI to intelligently infer product categories from content
 */

import OpenAI from 'openai';
import { ProductData } from './product-content-extractor';

export interface CategoryInference {
  primaryCategory: string;
  secondaryCategories: string[];
  confidence: number;
  reasoning: string;
  suggestedUrl?: string;
}

export class AICategoryInferencer {
  private openai: OpenAI;
  private cache: Map<string, CategoryInference> = new Map();
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Infer categories for a product using AI
   */
  async inferCategories(
    productName: string,
    productContent: string,
    existingCategories?: string[]
  ): Promise<CategoryInference> {
    // Check cache first
    const cacheKey = `${productName}-${productContent.substring(0, 100)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const prompt = this.buildPrompt(productName, productContent, existingCategories);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a categorization expert. 
            Analyze the provided content and suggest appropriate categories based on what you see.
            Use the terminology and structure that seems natural for this type of content.
            Return JSON only.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      const inference: CategoryInference = {
        primaryCategory: result.primary_category || 'General Products',
        secondaryCategories: result.secondary_categories || [],
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning || 'Based on product analysis',
        suggestedUrl: this.generateCategoryUrl(result.primary_category)
      };

      // Cache the result
      this.cache.set(cacheKey, inference);
      
      return inference;
    } catch (error) {
      console.error('AI category inference error:', error);
      
      // Fallback to simple inference
      return this.fallbackInference(productName, existingCategories);
    }
  }

  /**
   * Batch infer categories for multiple products
   */
  async inferBatchCategories(
    products: Array<{ name: string; content: string; categories?: string[] }>
  ): Promise<Map<string, CategoryInference>> {
    const results = new Map<string, CategoryInference>();
    
    // Process in batches of 5 for efficiency
    const batchSize = 5;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const batchPromises = batch.map(product => 
        this.inferCategories(product.name, product.content, product.categories)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, idx) => {
        const product = batch[idx];
        if (result.status === 'fulfilled' && product) {
          results.set(product.name, result.value);
        }
      });
    }
    
    return results;
  }

  /**
   * Build prompt for AI inference
   */
  private buildPrompt(
    productName: string,
    productContent: string,
    existingCategories?: string[]
  ): string {
    const contentPreview = productContent.substring(0, 500);
    
    let prompt = `Analyze this content and suggest appropriate categories:

Title: ${productName}
Content: ${contentPreview}`;

    if (existingCategories && existingCategories.length > 0) {
      prompt += `\nCategories already identified: ${existingCategories.join(', ')}`;
    }

    prompt += `

Return a JSON object with:
{
  "primary_category": "Main category based on the content",
  "secondary_categories": ["Other relevant categories"],
  "confidence": 0.8,
  "reasoning": "Why these categories fit"
}

Use categories that match the nature and domain of the content.
Don't force any specific category structure - adapt to what you see.`;

    return prompt;
  }

  /**
   * Fallback inference when AI is unavailable
   */
  private fallbackInference(
    productName: string,
    existingCategories?: string[]
  ): CategoryInference {
    // If we have existing categories from the site, use them
    if (existingCategories && existingCategories.length > 0) {
      return {
        primaryCategory: existingCategories[0],
        secondaryCategories: existingCategories.slice(1, 3),
        confidence: 0.8,
        reasoning: 'Categories extracted from site structure',
        suggestedUrl: this.generateCategoryUrl(existingCategories[0])
      };
    }
    
    // Otherwise just return a generic uncategorized response
    // We DON'T try to guess categories - that's imposing our structure
    return {
      primaryCategory: 'Uncategorized',
      secondaryCategories: [],
      confidence: 0.1,
      reasoning: 'No category information available',
      suggestedUrl: undefined
    };
  }

  /**
   * Generate a URL-friendly category path
   */
  private generateCategoryUrl(category: string): string {
    return `/product-category/${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
  }

  /**
   * Analyze search results to find common categories
   */
  async analyzeSearchResults(
    searchResults: Array<{ title: string; content: string; productData?: ProductData }>
  ): Promise<{
    commonCategory?: string;
    categoryUrl?: string;
    confidence: number;
  }> {
    // Extract all categories from search results
    const allCategories: Map<string, number> = new Map();
    
    for (const result of searchResults) {
      // Use existing product categories if available
      if (result.productData?.categories) {
        result.productData.categories.forEach(cat => {
          allCategories.set(cat, (allCategories.get(cat) || 0) + 1);
        });
      }
      
      // Also check breadcrumbs
      if (result.productData?.breadcrumbs) {
        result.productData.breadcrumbs.forEach(crumb => {
          if (!crumb.name.toLowerCase().includes('home')) {
            allCategories.set(crumb.name, (allCategories.get(crumb.name) || 0) + 1);
          }
        });
      }
    }
    
    // Find most common category
    let commonCategory: string | undefined;
    let maxCount = 0;
    
    for (const [category, count] of allCategories) {
      if (count > maxCount && count >= searchResults.length * 0.4) {
        maxCount = count;
        commonCategory = category;
      }
    }
    
    if (commonCategory) {
      return {
        commonCategory,
        categoryUrl: this.generateCategoryUrl(commonCategory),
        confidence: maxCount / searchResults.length
      };
    }
    
    // If no common category found, use AI to infer one
    if (searchResults.length > 0) {
      const sampleProducts = searchResults.slice(0, 3).map(r => ({
        name: r.title,
        content: r.content.substring(0, 200)
      }));
      
      const inferences = await this.inferBatchCategories(sampleProducts);
      
      // Find most common inferred category
      const inferredCategories = new Map<string, number>();
      inferences.forEach(inf => {
        inferredCategories.set(inf.primaryCategory, 
          (inferredCategories.get(inf.primaryCategory) || 0) + 1);
      });
      
      let bestInferred: string | undefined;
      let bestCount = 0;
      
      for (const [category, count] of inferredCategories) {
        if (count > bestCount) {
          bestCount = count;
          bestInferred = category;
        }
      }
      
      if (bestInferred) {
        return {
          commonCategory: bestInferred,
          categoryUrl: this.generateCategoryUrl(bestInferred),
          confidence: 0.7
        };
      }
    }
    
    return { confidence: 0 };
  }
}

// Singleton instance for reuse
let inferencer: AICategoryInferencer | null = null;

export function getAICategoryInferencer(apiKey: string): AICategoryInferencer {
  if (!inferencer) {
    inferencer = new AICategoryInferencer(apiKey);
  }
  return inferencer;
}