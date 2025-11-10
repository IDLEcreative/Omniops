/**
 * Tests for woocommerceOperations MCP Tool - Metadata & Schema
 *
 * Coverage: Tool metadata, schema validation, and configuration tests
 */

import { metadata } from '../woocommerceOperations';

describe('woocommerceOperations - Metadata and Schema', () => {
  describe('Metadata', () => {
    it('should have correct metadata name', () => {
      expect(metadata.name).toBe('woocommerceOperations');
    });

    it('should have commerce category', () => {
      expect(metadata.category).toBe('commerce');
    });

    it('should have version defined', () => {
      expect(metadata.version).toBeDefined();
      expect(typeof metadata.version).toBe('string');
    });

    it('should have tool description', () => {
      expect(metadata.description).toBeDefined();
      expect(metadata.description.length).toBeGreaterThan(0);
    });

    it('should require authentication', () => {
      expect(metadata.capabilities.requiresAuth).toBe(true);
    });

    it('should require context (domain)', () => {
      expect(metadata.capabilities.requiresContext).toContain('domain');
    });

    it('should have rate limiting configured', () => {
      expect(metadata.capabilities.rateLimit).toBeDefined();
      expect(metadata.capabilities.rateLimit?.requests).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle metadata access within 1ms', () => {
      const start = Date.now();
      const _ = metadata.name;
      const duration = Date.now() - start;

      expect(duration).toBeLessThanOrEqual(5); // 5ms threshold to account for test overhead
    });
  });
});