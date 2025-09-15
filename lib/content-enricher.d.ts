/**
 * Type declarations for the ContentEnricher module
 */

export class ContentEnricher {
  static enrichContent(
    text: string,
    metadata?: any,
    url?: string,
    title?: string
  ): string;

  static createMetadataOnlyContent(metadata?: any): string;

  static needsEnrichment(text: string): boolean;

  static formatAttributeName(key: string): string;

  static extractStructuredData(text: string, url?: string): any;

  static calculateEnrichmentQuality(enrichedContent: string): {
    hasProductData: boolean;
    hasSKU: boolean;
    hasPrice: boolean;
    hasAvailability: boolean;
    hasBusinessInfo: boolean;
    enrichmentScore: number;
  };
}