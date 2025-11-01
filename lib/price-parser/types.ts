/**
 * Price Parser Types
 */

export interface ParsedPrice {
  value: number | null;
  formatted: string;
  currency: string;
  regularPrice?: number;
  salePrice?: number;
  onSale: boolean;
  discount?: number;
  vatIncluded?: boolean;
  vatExcluded?: boolean;
  priceIncVAT?: number;
  priceExcVAT?: number;
  requiresContact?: boolean;
  raw: string;
}
