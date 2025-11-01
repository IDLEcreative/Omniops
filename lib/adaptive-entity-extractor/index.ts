/**
 * Adaptive Entity Extractor - Main Export
 * Composed from modular components
 *
 * Original file: lib/adaptive-entity-extractor.ts (392 LOC)
 * Refactored into 3 focused modules:
 * - prompts.ts (109 LOC) - Business-specific extraction prompts
 * - storage.ts (114 LOC) - Entity storage and processing utilities
 * - index.ts (169 LOC) - Main extraction class
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { BusinessClassifier, BusinessType, BusinessClassification } from '../business-classifier';
import { buildExtractionPrompt } from './prompts';
import { buildEntityForStorage } from './storage';

export class AdaptiveEntityExtractor {
  private supabase: any; // Supabase client type
  private openai: OpenAI;
  private businessClassification: BusinessClassification | null = null;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiKey: string
  ) {
    this.supabase = createServiceRoleClientSync();
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
      const existingData = existing as any;
      this.businessClassification = {
        primaryType: existingData.business_type as BusinessType,
        confidence: existingData.confidence,
        indicators: existingData.indicators,
        suggestedSchema: existingData.extraction_config?.schema,
        extractionStrategy: existingData.extraction_config?.strategy,
        terminology: existingData.entity_terminology
      };
      console.log(`Using existing classification: ${existingData.business_type}`);
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
    const sampleContent = pages.map((p: any) => p.content || '');
    const classification = await BusinessClassifier.classifyBusiness(
      domainId,
      sampleContent,
      pages[0] ? (pages[0] as any).metadata : undefined
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
      } as any);

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
    const extractionPrompt = buildExtractionPrompt(
      page as any,
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

    const extracted = JSON.parse(response.choices[0]?.message?.content || '{}');

    // Store in flexible entity catalog
    await this.storeEntity(page as any, extracted, this.businessClassification);

    return extracted;
  }

  /**
   * Store extracted entity in flexible catalog
   */
  private async storeEntity(
    page: any,
    extracted: any,
    classification: BusinessClassification
  ): Promise<void> {
    const entity = buildEntityForStorage(page, extracted, classification);

    // Upsert to entity catalog
    const { error } = await this.supabase
      .from('entity_catalog')
      .upsert(entity as any);

    if (error) {
      console.error('Failed to store entity:', error);
    } else {
      console.log(`Stored ${classification.terminology.entityName}: ${entity.name}`);
    }
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
        console.log(`Extracting from: ${(page as any).title || (page as any).url}`);
        await this.extractEntities((page as any).id);
        processed++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to extract from ${(page as any).id}:`, error);
        failed++;
      }
    }

    console.log(`\n✅ Extraction complete:`);
    console.log(`   Processed: ${processed} ${this.businessClassification.terminology.entityNamePlural}`);
    console.log(`   Failed: ${failed}`);
  }
}
