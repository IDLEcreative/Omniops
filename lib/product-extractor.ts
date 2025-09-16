import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';

// Product extraction schema
const ProductDataSchema = z.object({
  sku: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  salePrice: z.number().min(0).optional(),
  priceUnit: z.string().optional(),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().optional(),
  availabilityStatus: z.enum(['in_stock', 'out_of_stock', 'pre_order', 'discontinued']).optional(),
  specifications: z.record(z.any()).default({}),
  features: z.array(z.string()).default([]),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    weight: z.number().optional(),
    unit: z.string().optional(),
  }).optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  searchKeywords: z.string().optional(),
});

type ProductData = z.infer<typeof ProductDataSchema>;

export class ProductExtractor {
  private supabase: ReturnType<typeof createClient>;
  private openai: OpenAI;

  constructor(supabaseUrl: string, supabaseKey: string, openaiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  /**
   * Extract structured product data from a scraped page using GPT-4
   */
  async extractProductData(pageId: string): Promise<ProductData | null> {
    try {
      // Fetch the page content
      const { data: page, error } = await this.supabase
        .from('scraped_pages')
        .select('id, url, title, content, metadata')
        .eq('id', pageId)
        .single();

      if (error || !page) {
        console.error('Failed to fetch page:', error);
        return null;
      }

      // Check if this looks like a product page
      if (!this.isLikelyProductPage(page.url, page.title, page.content)) {
        return null;
      }

      // Use GPT-4 to extract structured data
      const extractionPrompt = `
        Extract structured product information from the following webpage content.
        Return ONLY valid JSON that matches this exact structure, nothing else:
        
        {
          "sku": "product SKU or code if found",
          "name": "product name (required)",
          "description": "brief product description",
          "category": "main category",
          "subcategory": "subcategory if applicable",
          "brand": "brand name",
          "price": numeric price without currency symbol,
          "currency": "USD/EUR/GBP etc",
          "salePrice": sale price if on sale,
          "priceUnit": "per item/per kg/etc",
          "inStock": true/false,
          "stockQuantity": numeric quantity if specified,
          "availabilityStatus": "in_stock/out_of_stock/pre_order/discontinued",
          "specifications": { "key": "value" pairs for specs },
          "features": ["list", "of", "features"],
          "dimensions": {
            "length": numeric,
            "width": numeric,
            "height": numeric,
            "weight": numeric,
            "unit": "cm/inch/kg/lb"
          },
          "images": ["image URLs"],
          "tags": ["relevant", "tags"],
          "searchKeywords": "keywords for search optimization"
        }
        
        Page URL: ${page.url}
        Page Title: ${page.title}
        Page Content: ${page.content?.substring(0, 4000)}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a product data extraction specialist. Extract structured e-commerce data from web pages. Return only valid JSON, no explanation.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const extractedData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and clean the data
      const validatedData = ProductDataSchema.parse(extractedData);

      // Calculate confidence score based on how much data was extracted
      const confidence = this.calculateConfidence(validatedData);

      // Store in product catalog
      const { error: insertError } = await this.supabase
        .from('product_catalog')
        .upsert({
          page_id: pageId,
          ...this.mapToDbSchema(validatedData),
          extraction_method: 'gpt4',
          confidence_score: confidence,
          raw_data: extractedData,
          extracted_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to store product data:', insertError);
        return null;
      }

      return validatedData;
    } catch (error) {
      console.error('Product extraction failed:', error);
      return null;
    }
  }

  /**
   * Batch extract products from multiple pages
   */
  async extractBatch(pageIds: string[]): Promise<void> {
    console.log(`Starting batch extraction for ${pageIds.length} pages...`);
    
    let succeeded = 0;
    let failed = 0;
    
    for (const pageId of pageIds) {
      const result = await this.extractProductData(pageId);
      if (result) {
        succeeded++;
        console.log(`✓ Extracted product from page ${pageId}`);
      } else {
        failed++;
        console.log(`✗ Failed to extract from page ${pageId}`);
      }
      
      // Rate limiting - avoid hitting OpenAI too hard
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Extraction complete: ${succeeded} succeeded, ${failed} failed`);
  }

  /**
   * Extract products from all likely product pages in a domain
   */
  async extractDomainProducts(domainId: string, limit = 100): Promise<void> {
    // Find likely product pages
    const { data: pages, error } = await this.supabase
      .from('scraped_pages')
      .select('id, url')
      .eq('domain_id', domainId)
      .or('url.ilike.%/product/%,url.ilike.%/shop/%,url.ilike.%/item/%,url.ilike.%/p/%')
      .limit(limit);

    if (error || !pages) {
      console.error('Failed to fetch product pages:', error);
      return;
    }

    const pageIds = pages.map(p => p.id);
    await this.extractBatch(pageIds);
  }

  /**
   * Check if a page is likely to be a product page
   */
  private isLikelyProductPage(url: string, title: string, content: string): boolean {
    const urlPatterns = ['/product/', '/shop/', '/item/', '/p/', '/products/'];
    const contentIndicators = ['add to cart', 'buy now', 'price', 'in stock', 'sku', 'product code'];
    
    // Check URL patterns
    const hasProductUrl = urlPatterns.some(pattern => url.toLowerCase().includes(pattern));
    
    // Check content indicators
    const contentLower = (content || '').toLowerCase();
    const hasProductContent = contentIndicators.some(indicator => contentLower.includes(indicator));
    
    return hasProductUrl || hasProductContent;
  }

  /**
   * Calculate confidence score based on extracted data completeness
   */
  private calculateConfidence(data: ProductData): number {
    let score = 0;
    let fields = 0;
    
    // Required fields
    if (data.name) { score += 2; fields += 2; }
    
    // Important fields
    if (data.price && data.price > 0) { score += 1.5; fields += 1.5; }
    if (data.sku) { score += 1.5; fields += 1.5; }
    if (data.description) { score += 1; fields += 1; }
    if (data.category) { score += 1; fields += 1; }
    
    // Nice to have fields
    if (data.brand) { score += 0.5; fields += 0.5; }
    if (data.images.length > 0) { score += 0.5; fields += 0.5; }
    if (Object.keys(data.specifications).length > 0) { score += 0.5; fields += 0.5; }
    if (data.features.length > 0) { score += 0.5; fields += 0.5; }
    
    return fields > 0 ? score / fields : 0;
  }

  /**
   * Map extracted data to database schema
   */
  private mapToDbSchema(data: ProductData) {
    return {
      sku: data.sku,
      name: data.name,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      brand: data.brand,
      price: data.price,
      currency: data.currency,
      sale_price: data.salePrice,
      price_unit: data.priceUnit,
      in_stock: data.inStock,
      stock_quantity: data.stockQuantity,
      availability_status: data.availabilityStatus,
      specifications: data.specifications,
      features: data.features,
      dimensions: data.dimensions,
      images: data.images,
      tags: data.tags,
      search_keywords: data.searchKeywords,
    };
  }
}