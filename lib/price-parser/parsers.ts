/**
 * Specialized Price Parsers
 */

import type { ParsedPrice } from './types';
import { formatCurrency } from './formatters';

export function parseSalePrice(
  priceString: string,
  prices: number[],
  currency: string
): ParsedPrice {
  // Try to extract specific sale and regular prices
  const currentMatch = priceString.match(/current\s*price\s*is\s*[:£$€]?\s*([\d,]+\.?\d*)/i);
  const originalMatch = priceString.match(/original\s*price\s*was\s*[:£$€]?\s*([\d,]+\.?\d*)/i);

  let salePrice: number;
  let regularPrice: number;

  if (currentMatch && currentMatch[1] && originalMatch && originalMatch[1]) {
    salePrice = parseFloat(currentMatch[1].replace(/,/g, ''));
    regularPrice = parseFloat(originalMatch[1].replace(/,/g, ''));
  } else if (prices.length >= 2) {
    // Assume lower price is sale price
    salePrice = Math.min(...prices);
    regularPrice = Math.max(...prices);
  } else {
    salePrice = prices[0] ?? 0;
    regularPrice = prices[0] ?? 0;
  }

  const discount = regularPrice > salePrice
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : 0;

  return {
    value: salePrice,
    formatted: discount > 0
      ? `${formatCurrency(salePrice, currency)} (was ${formatCurrency(regularPrice, currency)}, ${discount}% off)`
      : formatCurrency(salePrice, currency),
    currency,
    regularPrice,
    salePrice,
    onSale: discount > 0,
    discount: discount > 0 ? discount : undefined,
    raw: priceString,
  };
}

export function parseVATPrice(
  priceString: string,
  prices: number[],
  currency: string
): ParsedPrice {
  const hasIncVAT = /inc(l?\.?\s*)?vat/i.test(priceString);
  const hasExcVAT = /ex(cl?\.?\s*)?vat/i.test(priceString);

  let priceIncVAT: number | undefined;
  let priceExcVAT: number | undefined;

  if (prices.length >= 2 && hasIncVAT && hasExcVAT) {
    // Both prices present, higher is inc VAT
    priceIncVAT = Math.max(...prices);
    priceExcVAT = Math.min(...prices);
  } else if (hasIncVAT) {
    priceIncVAT = prices[0] ?? 0;
    // Calculate exc VAT (assuming 20% VAT)
    priceExcVAT = (prices[0] ?? 0) / 1.2;
  } else if (hasExcVAT) {
    priceExcVAT = prices[0] ?? 0;
    // Calculate inc VAT (assuming 20% VAT)
    priceIncVAT = (prices[0] ?? 0) * 1.2;
  } else {
    priceIncVAT = prices[0] ?? 0;
    priceExcVAT = prices.length > 1 ? prices[1] : undefined;
  }

  return {
    value: priceIncVAT || priceExcVAT || prices[0] || 0,
    formatted: priceIncVAT
      ? `${formatCurrency(priceIncVAT, currency)} inc VAT`
      : `${formatCurrency(priceExcVAT || prices[0] || 0, currency)} exc VAT`,
    currency,
    onSale: false,
    vatIncluded: hasIncVAT,
    vatExcluded: hasExcVAT,
    priceIncVAT,
    priceExcVAT,
    raw: priceString,
  };
}

export function parseSimplePrice(
  price: number,
  currency: string,
  raw: string
): ParsedPrice {
  return {
    value: price,
    formatted: formatCurrency(price, currency),
    currency,
    onSale: false,
    raw,
  };
}
