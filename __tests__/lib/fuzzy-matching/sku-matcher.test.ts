/**
 * Tests for SKU Fuzzy Matching Utility
 *
 * CRITICAL: Product lookup accuracy - helps users find products when they mistype SKUs
 */

import { describe, it, expect } from '@jest/globals';
import { findSimilarSkus } from '@/lib/fuzzy-matching/sku-matcher';

describe('SKU Fuzzy Matcher', () => {
  describe('findSimilarSkus', () => {
    it('should find SKUs with one character difference', () => {
      const availableSkus = ['MU110667602', 'MU110667611', 'ABC123'];
      const result = findSimilarSkus('MU110667601', availableSkus, 2, 3);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ sku: 'MU110667602', distance: 1 });
      // MU110667611 vs MU110667601: position 9 is '1' vs '0' = 1 distance (they're actually the same length)
      expect(result[1]).toEqual({ sku: 'MU110667611', distance: 1 });
    });

    it('should return results sorted by distance (closest first)', () => {
      const availableSkus = ['ABC', 'AB', 'A', 'ABCD'];
      const result = findSimilarSkus('ABC', availableSkus, 2, 10);

      // Expected distances: AB=1, ABCD=1, A=2
      expect(result).toHaveLength(3);
      expect(result[0].distance).toBe(1);
      expect(result[1].distance).toBe(1);
      expect(result[2].distance).toBe(2);
    });

    it('should be case-insensitive', () => {
      const availableSkus = ['ABC123', 'abc124', 'AbC125'];
      const result = findSimilarSkus('abc123', availableSkus, 2, 3);

      // Should find all three (0, 1, 2 distance) but filter out exact match (distance 0)
      expect(result.some(r => r.sku === 'abc124')).toBe(true);
      expect(result.some(r => r.sku === 'AbC125')).toBe(true);
    });

    it('should respect maxDistance parameter', () => {
      const availableSkus = ['AB', 'ABC', 'ABCD', 'ABCDE'];
      const result = findSimilarSkus('A', availableSkus, 1, 10);

      // Only 'AB' should be included (distance 1)
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ sku: 'AB', distance: 1 });
    });

    it('should respect maxSuggestions parameter', () => {
      const availableSkus = ['ABC1', 'ABC2', 'ABC3', 'ABC4', 'ABC5'];
      const result = findSimilarSkus('ABC0', availableSkus, 2, 2);

      // Should return only 2 suggestions even though all have distance 1
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no similar SKUs found', () => {
      const availableSkus = ['ZZZZZ', 'YYYYY', 'XXXXX'];
      const result = findSimilarSkus('ABC123', availableSkus, 2, 3);

      expect(result).toEqual([]);
    });

    it('should handle empty availableSkus array', () => {
      const result = findSimilarSkus('ABC123', [], 2, 3);

      expect(result).toEqual([]);
    });

    it('should not include exact matches (distance 0)', () => {
      const availableSkus = ['ABC123', 'ABC124', 'ABC125'];
      const result = findSimilarSkus('ABC123', availableSkus, 2, 3);

      // Should not include 'ABC123' (distance 0)
      expect(result.every(r => r.sku !== 'ABC123')).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should handle real-world SKU patterns', () => {
      const availableSkus = [
        'MU110667602',
        'MU110667611',
        'MU110667501',
        'MU220667601', // Different prefix
        'BP-001',
        'A4VTG90'
      ];

      const result = findSimilarSkus('MU110667601', availableSkus, 2, 3);

      expect(result).toHaveLength(3);
      expect(result[0].sku).toBe('MU110667602'); // 1 char diff
      expect(result[0].distance).toBe(1);
    });

    it('should handle SKUs with special characters', () => {
      const availableSkus = ['BP-001', 'BP-002', 'BP-101', 'XY-999'];
      const result = findSimilarSkus('BP-000', availableSkus, 2, 3);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.sku === 'BP-001')).toBe(true);
    });

    it('should handle very long SKUs efficiently', () => {
      const longSku = 'A'.repeat(50) + '1';
      const similarLongSku = 'A'.repeat(50) + '2';
      const availableSkus = [similarLongSku, 'SHORT'];

      const result = findSimilarSkus(longSku, availableSkus, 2, 3);

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe(similarLongSku);
      expect(result[0].distance).toBe(1);
    });

    it('should use default maxDistance of 2', () => {
      const availableSkus = ['ABC', 'ABCD', 'ABCDE', 'ABCDEF'];
      // Not passing maxDistance, should default to 2
      const result = findSimilarSkus('A', availableSkus);

      // Only ABC (2) and ABCD (3) would be close, but ABCD exceeds default maxDistance=2
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should use default maxSuggestions of 3', () => {
      const availableSkus = ['ABC1', 'ABC2', 'ABC3', 'ABC4', 'ABC5', 'ABC6'];
      // Not passing maxSuggestions, should default to 3
      const result = findSimilarSkus('ABC0', availableSkus, 2);

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle transposition errors', () => {
      const availableSkus = ['12345', '54321', '13245'];
      const result = findSimilarSkus('12435', availableSkus, 2, 3);

      // '13245' has 2 transpositions = 2 distance
      expect(result.some(r => r.sku === '13245' && r.distance <= 2)).toBe(true);
    });

    it('should handle insertion errors', () => {
      const availableSkus = ['ABC', 'ABCD', 'ABCDE'];
      const result = findSimilarSkus('ABCX', availableSkus, 2, 3);

      // 'ABC' = 1 deletion, 'ABCD' = 1 substitution
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle deletion errors', () => {
      const availableSkus = ['ABCD', 'ABCDE', 'ABCDEF'];
      const result = findSimilarSkus('ABC', availableSkus, 2, 3);

      // 'ABCD' = 1 insertion needed
      expect(result.some(r => r.sku === 'ABCD' && r.distance === 1)).toBe(true);
    });

    it('should handle substitution errors', () => {
      const availableSkus = ['ABCD', 'XBCD', 'AXCD', 'ABXD', 'ABCX'];
      const result = findSimilarSkus('ABCD', availableSkus, 1, 10);

      // All except 'ABCD' (exact) should have distance 1
      expect(result).toHaveLength(4);
      expect(result.every(r => r.distance === 1)).toBe(true);
    });
  });
});
