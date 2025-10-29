/**
 * Unit Tests for Response Parser
 * Correction Detection, Product Extraction, and Order Extraction
 */

import { describe, test, expect } from '@jest/globals';
import { ResponseParser } from '../../../lib/chat/response-parser';

describe('ResponseParser - Core Features', () => {
  describe('Correction Detection', () => {
    test('should detect "I meant X not Y" pattern', () => {
      const result = ResponseParser.parseResponse(
        'Sorry I meant ZF4 not ZF5',
        'Ok, looking at ZF4',
        1
      );

      expect(result.corrections).toHaveLength(1);
      expect(result.corrections[0].original).toBe('ZF5');
      expect(result.corrections[0].corrected).toBe('ZF4');
    });

    test('should detect "not Y but X" pattern', () => {
      const result = ResponseParser.parseResponse(
        'not ZF5 but ZF4',
        'Ok',
        1
      );

      expect(result.corrections).toHaveLength(1);
      expect(result.corrections[0].original).toBe('ZF5');
      expect(result.corrections[0].corrected).toBe('ZF4');
    });

    test('should detect arrow pattern "X → Y"', () => {
      const result = ResponseParser.parseResponse(
        'ZF4 → ZF5',
        'Ok',
        1
      );

      expect(result.corrections).toHaveLength(1);
    });

    test('should detect "I said X not Y" pattern', () => {
      const result = ResponseParser.parseResponse(
        'I said ZF4 not ZF5',
        'Ok',
        1
      );

      expect(result.corrections).toHaveLength(1);
      expect(result.corrections[0].corrected).toBe('ZF4');
      expect(result.corrections[0].original).toBe('ZF5');
    });

    test('should detect "it\'s X not Y" pattern', () => {
      const result = ResponseParser.parseResponse(
        "it's ZF4 not ZF5",
        'Ok',
        1
      );

      expect(result.corrections).toHaveLength(1);
      expect(result.corrections[0].corrected).toBe('ZF4');
    });

    test('should ignore corrections that are too long', () => {
      const longString = 'a'.repeat(60);
      const result = ResponseParser.parseResponse(
        `I meant ${longString} not other`,
        'Ok',
        1
      );

      expect(result.corrections).toHaveLength(0);
    });

    test('should not detect false positives', () => {
      const result = ResponseParser.parseResponse(
        'I like products',
        'Ok',
        1
      );

      expect(result.corrections).toHaveLength(0);
    });
  });

  describe('Product Extraction', () => {
    test('should extract product from markdown link', () => {
      const result = ResponseParser.parseResponse(
        'Show me products',
        'Here is the [Item A](https://example.com/products/item-a)',
        1
      );

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].type).toBe('product');
      expect(result.entities[0].value).toBe('ZF4 Pump');
      expect(result.entities[0].metadata?.url).toBe('https://example.com/products/zf4');
    });

    test('should extract multiple products', () => {
      const result = ResponseParser.parseResponse(
        'Show me options',
        'Here are [ZF4](https://example.com/zf4) and [ZF5](https://example.com/zf5)',
        1
      );

      expect(result.entities.length).toBeGreaterThanOrEqual(2);
    });

    test('should filter out generic link text', () => {
      const result = ResponseParser.parseResponse(
        'Show me info',
        'For more info [click here](https://example.com/products/zf4)',
        1
      );

      expect(result.entities).toHaveLength(0);
    });

    test('should filter out documentation URLs', () => {
      const result = ResponseParser.parseResponse(
        'Help',
        'Check the [Manual](https://example.com/docs/manual.pdf)',
        1
      );

      expect(result.entities).toHaveLength(0);
    });

    test('should include product aliases', () => {
      const result = ResponseParser.parseResponse(
        'Show me',
        '[Product](https://example.com/p)',
        1
      );

      expect(result.entities[0].aliases).toContain('it');
      expect(result.entities[0].aliases).toContain('that');
    });
  });

  describe('Order Extraction', () => {
    test('should extract order with hash', () => {
      const result = ResponseParser.parseResponse(
        'Check status',
        'Your order #12345 is shipping',
        1
      );

      expect(result.entities.some(e => e.type === 'order')).toBe(true);
      const order = result.entities.find(e => e.type === 'order');
      expect(order?.value).toBe('12345');
    });

    test('should extract order without hash', () => {
      const result = ResponseParser.parseResponse(
        'Check status',
        'Your order 12345 is shipping',
        1
      );

      expect(result.entities.some(e => e.type === 'order')).toBe(true);
    });

    test('should extract multiple orders', () => {
      const result = ResponseParser.parseResponse(
        'Check status',
        'Orders #12345 and #67890 are ready',
        1
      );

      const orders = result.entities.filter(e => e.type === 'order');
      expect(orders.length).toBe(2);
    });
  });
});
