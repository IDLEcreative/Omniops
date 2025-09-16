/**
 * Adaptive Entity Extractor
 * Extracts structured data based on detected business type
 * Works with any industry, not just e-commerce
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { BusinessClassifier, BusinessType, BusinessClassification } from './business-classifier';

export class AdaptiveEntityExtractor {
  private supabase: ReturnType<typeof createClient>;
  private openai: OpenAI;
  private businessClassification: BusinessClassification | null = null;
  
  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiKey });
  }
  
  /**
   * Initialize extractor for a domain by detecting business type
   */
  async initializeForDomain(domainId: string): Promise<void> {
    // Check if we already have a classification
    const { data: existing } = await this.supabase
      .from('business_classifications')
      .select('*')
      .eq('domain_id', domainId)
      .single();
    
    if (existing) {
      this.businessClassification = {
        primaryType: existing.business_type as BusinessType,
        confidence: existing.confidence,
        indicators: existing.indicators,
        suggestedSchema: existing.extraction_config?.schema,
        extractionStrategy: existing.extraction_config?.strategy,
        terminology: existing.entity_terminology
      };
      console.log(`Using existing classification: ${existing.business_type}`);
      return;
    }
    
    // Get sample content from domain
    const { data: pages } = await this.supabase
      .from('scraped_pages')
      .select('content, metadata')
      .eq('domain_id', domainId)
      .limit(5);
    
    if (!pages || pages.length === 0) {
      console.error('No pages found for classification');
      return;
    }
    
    // Classify the business
    const sampleContent = pages.map(p => p.content || '');
    const classification = await BusinessClassifier.classifyBusiness(
      domainId,
      sampleContent,
      pages[0].metadata
    );
    
    // Store classification
    await this.supabase
      .from('business_classifications')
      .upsert({
        domain_id: domainId,
        business_type: classification.primaryType,
        confidence: classification.confidence,
        indicators: classification.indicators,
        entity_terminology: classification.terminology,
        extraction_config: {
          schema: classification.suggestedSchema,
          strategy: classification.extractionStrategy
        }
      });
    
    this.businessClassification = classification;
    console.log(`Classified as: ${classification.primaryType} (${(classification.confidence * 100).toFixed(0)}% confidence)`);
  }
  
  /**
   * Extract entities from a page using appropriate strategy
   */
  async extractEntities(pageId: string): Promise<any> {
    if (!this.businessClassification) {
      throw new Error('Must initialize with domain first');
    }
    
    // Get page content
    const { data: page } = await this.supabase
      .from('scraped_pages')
      .select('*')
      .eq('id', pageId)
      .single();
    
    if (!page) {
      console.error('Page not found');
      return null;
    }
    
    // Build extraction prompt based on business type
    const extractionPrompt = this.buildExtractionPrompt(
      page,
      this.businessClassification
    );
    
    // Use GPT-4 to extract structured data
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a data extraction specialist for ${this.businessClassification.primaryType} businesses. Extract structured information and return valid JSON only.`
        },
        {
          role: 'user',
          content: extractionPrompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const extracted = JSON.parse(response.choices[0].message.content || '{}');
    
    // Store in flexible entity catalog
    await this.storeEntity(page, extracted, this.businessClassification);
    
    return extracted;
  }
  
  /**
   * Build extraction prompt based on business type
   */
  private buildExtractionPrompt(
    page: any,
    classification: BusinessClassification
  ): string {
    const schema = classification.suggestedSchema;
    const terminology = classification.terminology;
    
    let promptTemplate = `
Extract structured ${terminology.entityName} information from this webpage.
Return JSON with these fields:

Core fields (always include):
- name: ${terminology.entityName} name
- description: Brief description
- ${schema.identifierField}: Unique identifier (if found)
- ${schema.priceField}: Numeric price/cost (if applicable)
- ${schema.availabilityField}: Availability status
- primary_category: Main category
- tags: Array of relevant tags

`;
    
    // Add business-specific fields
    switch (classification.primaryType) {
      case BusinessType.REAL_ESTATE:
        promptTemplate += `
Real estate specific:
- bedrooms: Number of bedrooms
- bathrooms: Number of bathrooms  
- square_feet: Size in sqft
- lot_size: Lot dimensions
- year_built: Year constructed
- property_type: House/Condo/Apartment
- address: Full address
- amenities: Array of features
`;
        break;
        
      case BusinessType.HEALTHCARE:
        promptTemplate += `
Healthcare specific:
- provider_name: Doctor/Provider name
- specialty: Medical specialty
- insurance_accepted: Array of accepted insurance
- appointment_duration: Typical appointment length
- languages: Languages spoken
- credentials: Degrees/Certifications
`;
        break;
        
      case BusinessType.EDUCATION:
        promptTemplate += `
Education specific:
- course_code: Course identifier
- instructor: Teacher/Professor name
- credit_hours: Number of credits
- schedule: Days and times
- prerequisites: Required prior courses
- enrollment_limit: Max students
- format: Online/In-person/Hybrid
`;
        break;
        
      case BusinessType.RESTAURANT:
        promptTemplate += `
Restaurant specific:
- cuisine_type: Type of cuisine
- meal_type: Breakfast/Lunch/Dinner
- dietary_options: Vegan/Vegetarian/Gluten-free
- ingredients: Key ingredients
- portion_size: Serving size
- spice_level: Mild/Medium/Hot
`;
        break;
        
      default:
        promptTemplate += `
Additional fields (extract if relevant):
- specifications: Object with any technical details
- features: Array of key features
- dimensions: Size/measurements if applicable
`;
    }
    
    promptTemplate += `
    
Page URL: ${page.url}
Page Title: ${page.title}
Page Content: ${page.content?.substring(0, 4000)}

Return ONLY valid JSON matching the structure above.`;
    
    return promptTemplate;
  }
  
  /**
   * Store extracted entity in flexible catalog
   */
  private async storeEntity(
    page: any,
    extracted: any,
    classification: BusinessClassification
  ): Promise<void> {
    const schema = classification.suggestedSchema;
    const terminology = classification.terminology;
    
    // Map extracted data to flexible schema
    const entity = {
      page_id: page.id,
      domain_id: page.domain_id,
      entity_type: terminology.entityName,
      name: extracted.name || 'Unnamed ' + terminology.entityName,
      description: extracted.description,
      primary_identifier: extracted[schema.identifierField],
      price: extracted[schema.priceField],
      price_unit: extracted.price_unit,
      is_available: this.parseAvailability(
        extracted[schema.availabilityField],
        classification
      ),
      availability_status: extracted[schema.availabilityField],
      primary_category: extracted.primary_category,
      tags: extracted.tags || [],
      
      // Store all other fields in attributes
      attributes: this.extractAttributes(extracted, schema),
      
      // Metadata
      extraction_method: 'gpt4_adaptive',
      confidence_score: this.calculateConfidence(extracted),
      raw_data: extracted
    };
    
    // Upsert to entity catalog
    const { error } = await this.supabase
      .from('entity_catalog')
      .upsert(entity);
    
    if (error) {
      console.error('Failed to store entity:', error);
    } else {
      console.log(`Stored ${terminology.entityName}: ${entity.name}`);
    }
  }
  
  /**
   * Parse availability based on business type
   */
  private parseAvailability(
    value: any,
    classification: BusinessClassification
  ): boolean {
    if (typeof value === 'boolean') return value;
    if (!value) return true; // Default to available
    
    const valueStr = String(value).toLowerCase();
    const unavailableTerms = [
      'sold', 'unavailable', 'booked', 'closed',
      'out of stock', 'not available', 'coming soon'
    ];
    
    return !unavailableTerms.some(term => valueStr.includes(term));
  }
  
  /**
   * Extract custom attributes based on business type
   */
  private extractAttributes(data: any, schema: any): any {
    const attributes: any = {};
    
    // Get all fields that aren't core fields
    const coreFields = [
      'name', 'description', 'primary_category', 'tags',
      schema.identifierField, schema.priceField, schema.availabilityField
    ];
    
    for (const [key, value] of Object.entries(data)) {
      if (!coreFields.includes(key) && value !== null && value !== undefined) {
        attributes[key] = value;
      }
    }
    
    return attributes;
  }
  
  /**
   * Calculate extraction confidence
   */
  private calculateConfidence(data: any): number {
    let score = 0;
    let fields = 0;
    
    // Check core fields
    if (data.name) { score += 2; fields += 2; }
    if (data.description) { score += 1; fields += 1; }
    if (data.price || data.fee || data.rate) { score += 1; fields += 1; }
    
    // Check for any additional data
    const hasAttributes = Object.keys(data).length > 5;
    if (hasAttributes) { score += 1; fields += 1; }
    
    return fields > 0 ? score / fields : 0;
  }
  
  /**
   * Batch process entities for a domain
   */
  async processDomainsEntities(domainId: string, limit: number = 50): Promise<void> {
    // Initialize for domain first
    await this.initializeForDomain(domainId);
    
    if (!this.businessClassification) {
      console.error('Failed to classify business');
      return;
    }
    
    console.log(`\nProcessing ${this.businessClassification.terminology.entityNamePlural} for ${this.businessClassification.primaryType} business`);
    
    // Find pages likely to contain entities
    const { data: pages } = await this.supabase
      .from('scraped_pages')
      .select('id, url, title')
      .eq('domain_id', domainId)
      .limit(limit);
    
    if (!pages || pages.length === 0) {
      console.log('No pages found');
      return;
    }
    
    let processed = 0;
    let failed = 0;
    
    for (const page of pages) {
      try {
        console.log(`Extracting from: ${page.title || page.url}`);
        await this.extractEntities(page.id);
        processed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to extract from ${page.id}:`, error);
        failed++;
      }
    }
    
    console.log(`\n✅ Extraction complete:`);
    console.log(`   Processed: ${processed} ${this.businessClassification.terminology.entityNamePlural}`);
    console.log(`   Failed: ${failed}`);
  }
}