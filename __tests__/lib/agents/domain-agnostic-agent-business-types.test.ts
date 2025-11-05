/**
 * Domain-Agnostic Agent - Additional Business Types Tests
 * Comprehensive tests for education, legal, automotive, and edge cases
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Additional Business Types', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('Education Business Type', () => {
    beforeEach(async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'education',
                entity_terminology: {
                  entityName: 'course',
                  entityNamePlural: 'courses',
                  availableText: 'open for enrollment',
                  unavailableText: 'closed',
                  priceLabel: 'tuition',
                  searchPrompt: 'Search courses'
                },
                confidence: 0.88
              }
            })
          })
        })
      });

      await agent.initializeForDomain('education-domain');
    });

    it('should generate education-specific system prompt', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('education');
      expect(prompt).toContain('courses');
      expect(prompt).toContain('prerequisites');
      expect(prompt).toContain('credit hours');
      expect(prompt).toContain('enrollment deadlines');
      expect(prompt).toContain('instructor information');
      expect(prompt).toContain('learning outcomes');
    });

    it('should format education entities with course-specific fields', () => {
      const entities = [
        {
          name: 'Introduction to Computer Science',
          price: 1200,
          is_available: true,
          attributes: {
            course_code: 'CS101',
            instructor: 'Dr. Jane Smith',
            credit_hours: 3
          },
          description: 'Fundamental concepts in computer science and programming'
        },
        {
          name: 'Advanced Mathematics',
          price: 1500,
          is_available: false,
          attributes: {
            course_code: 'MATH301',
            instructor: 'Prof. John Doe',
            credit_hours: 4
          },
          description: 'Advanced mathematical concepts and proofs'
        }
      ];

      const result = agent.formatEntitiesForAI(entities);

      expect(result).toContain('Introduction to Computer Science');
      expect(result).toContain('CS101');
      expect(result).toContain('Dr. Jane Smith');
      expect(result).toContain('Credits: 3');
      expect(result).toContain('tuition: $1200');
      expect(result).toContain('open for enrollment');
      expect(result).toContain('Advanced Mathematics');
      expect(result).toContain('MATH301');
      expect(result).toContain('Credits: 4');
      expect(result).toContain('closed');
    });

    it('should use education terminology in context building', () => {
      const context = agent.buildAdaptiveContext(
        'Prospective student interested in STEM',
        'What courses are available for beginners?',
        []
      );

      expect(context).toContain('courses');
      expect(context).toContain('education business');
      expect(context).toContain('open for enrollment');
      expect(context).toContain('tuition');
    });
  });

  describe('Legal Services Business Type', () => {
    beforeEach(async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'legal',
                entity_terminology: {
                  entityName: 'service',
                  entityNamePlural: 'services',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'consultation fee',
                  searchPrompt: 'Browse legal services'
                },
                confidence: 0.92
              }
            })
          })
        })
      });

      await agent.initializeForDomain('legal-domain');
    });

    it('should generate legal-specific system prompt', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('legal');
      expect(prompt).toContain('services');
      expect(prompt).toContain('practice areas');
      expect(prompt).toContain('consultation scheduling');
      expect(prompt).toContain('professional tone');
      expect(prompt).toContain('Avoid giving specific legal advice');
    });

    it('should maintain professional tone in legal context', () => {
      const context = agent.buildAdaptiveContext(
        'Client seeking family law assistance',
        'Do you handle divorce cases?',
        []
      );

      expect(context).toContain('professional tone');
      expect(context).toContain('legal business');
      expect(context).toContain('services');
    });

    it('should format legal services with generic fields', () => {
      const entities = [
        {
          name: 'Family Law Consultation',
          primary_identifier: 'FL-001',
          price: 250,
          primary_category: 'Family Law',
          is_available: true,
          description: 'Initial consultation for family law matters'
        }
      ];

      const result = agent.formatEntitiesForAI(entities);

      expect(result).toContain('Family Law Consultation');
      expect(result).toContain('FL-001');
      expect(result).toContain('consultation fee: $250');
      expect(result).toContain('Family Law');
      expect(result).toContain('available');
    });
  });

  describe('Automotive Business Type', () => {
    beforeEach(async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'automotive',
                entity_terminology: {
                  entityName: 'vehicle',
                  entityNamePlural: 'vehicles',
                  availableText: 'available',
                  unavailableText: 'sold',
                  priceLabel: 'price',
                  searchPrompt: 'Browse inventory'
                },
                confidence: 0.85
              }
            })
          })
        })
      });

      await agent.initializeForDomain('automotive-domain');
    });

    it('should generate automotive-specific system prompt', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('automotive');
      expect(prompt).toContain('vehicles');
      expect(prompt).toContain('vehicle specifications');
      expect(prompt).toContain('make, model, year, mileage');
      expect(prompt).toContain('financing options');
      expect(prompt).toContain('test drive scheduling');
      expect(prompt).toContain('VIN numbers');
    });

    it('should use automotive terminology consistently', () => {
      const context = agent.buildAdaptiveContext(
        'Customer interested in SUVs',
        'Show me available vehicles',
        []
      );

      expect(context).toContain('vehicles');
      expect(context).toContain('automotive business');
      expect(context).toContain('available');
    });
  });

  describe('Multiple Business Types Comparison', () => {
    it('should use different terminology for different business types', async () => {
      // Test e-commerce
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'ecommerce',
                entity_terminology: {
                  entityName: 'product',
                  entityNamePlural: 'products',
                  availableText: 'in stock',
                  unavailableText: 'out of stock',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('ecommerce-domain');
      const ecommercePrompt = agent.getAdaptiveSystemPrompt();

      // Test education
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'education',
                entity_terminology: {
                  entityName: 'course',
                  entityNamePlural: 'courses',
                  availableText: 'open',
                  unavailableText: 'closed',
                  priceLabel: 'tuition',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      const educationAgent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
      await educationAgent.initializeForDomain('education-domain');
      const educationPrompt = educationAgent.getAdaptiveSystemPrompt();

      // Verify different terminology
      expect(ecommercePrompt).toContain('products');
      expect(ecommercePrompt).not.toContain('courses');
      expect(educationPrompt).toContain('courses');
      // Note: "products" may appear in generic text but should not be the primary term
      expect(educationPrompt).toMatch(/courses.*not.*"products"/s);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null entity attributes gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'education',
                entity_terminology: {
                  entityName: 'course',
                  entityNamePlural: 'courses',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');

      const entities = [
        {
          name: 'Test Course',
          is_available: true,
          attributes: null
        }
      ];

      const result = agent.formatEntitiesForAI(entities);
      expect(result).toContain('Test Course');
      expect(result).toContain('available');
    });

    it('should handle missing price field', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'general',
                entity_terminology: {
                  entityName: 'item',
                  entityNamePlural: 'items',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.5
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');

      const entities = [
        {
          name: 'Free Service',
          is_available: true
        }
      ];

      const result = agent.formatEntitiesForAI(entities);
      expect(result).toContain('Free Service');
      expect(result).not.toContain('$');
    });

    it('should handle very low confidence scores', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'general',
                entity_terminology: {
                  entityName: 'item',
                  entityNamePlural: 'items',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.3
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('30% certain');
    });

    it('should handle database query errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      await expect(agent.initializeForDomain('test-domain')).rejects.toThrow('Database error');
    });

    it('should handle undefined business_type', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: undefined,
                entity_terminology: {
                  entityName: 'item',
                  entityNamePlural: 'items',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.5
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle empty search results', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'ecommerce',
                entity_terminology: {
                  entityName: 'product',
                  entityNamePlural: 'products',
                  availableText: 'in stock',
                  unavailableText: 'out of stock',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
      const context = agent.buildAdaptiveContext('Customer', 'Show products', []);

      expect(context).toContain('No products found');
    });

    it('should handle malformed entity data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'ecommerce',
                entity_terminology: {
                  entityName: 'product',
                  entityNamePlural: 'products',
                  availableText: 'in stock',
                  unavailableText: 'out of stock',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');

      const malformedEntities = [
        {
          // Missing name
          is_available: true,
          price: 100
        },
        {
          name: 'Valid Product',
          is_available: true,
          price: 50
        }
      ];

      const result = agent.formatEntitiesForAI(malformedEntities);
      expect(result).toBeDefined();
      expect(result).toContain('Valid Product');
    });
  });

  describe('Query Intent Detection Edge Cases', () => {
    beforeEach(async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'ecommerce',
                entity_terminology: {
                  entityName: 'product',
                  entityNamePlural: 'products',
                  availableText: 'in stock',
                  unavailableText: 'out of stock',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
    });

    it('should handle queries with multiple intents', () => {
      const query = 'What do you have available and how much does it cost?';
      const result = agent.getAdaptiveActionPrompt(query);

      // Should detect availability intent (first match)
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty query string', () => {
      const result = agent.getAdaptiveActionPrompt('');
      expect(result).toContain('Help the customer');
    });

    it('should handle very long query strings', () => {
      const longQuery = 'I am looking for ' + 'something '.repeat(100) + 'that is available';
      const result = agent.getAdaptiveActionPrompt(longQuery);

      expect(result).toBeDefined();
      expect(result).toContain('in stock');
    });

    it('should handle special characters in queries', () => {
      const query = 'Do you have @special #products with $symbols?';
      const result = agent.getAdaptiveActionPrompt(query);

      expect(result).toBeDefined();
    });

    it('should handle non-English characters', () => {
      const query = '你有什么产品？'; // Chinese: What products do you have?
      const result = agent.getAdaptiveActionPrompt(query);

      expect(result).toBeDefined();
    });
  });

  describe('Context Building Edge Cases', () => {
    beforeEach(async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'ecommerce',
                entity_terminology: {
                  entityName: 'product',
                  entityNamePlural: 'products',
                  availableText: 'in stock',
                  unavailableText: 'out of stock',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
    });

    it('should handle very large search result sets', () => {
      const largeResultSet = Array.from({ length: 100 }, (_, i) => ({
        name: `Product ${i}`,
        price: i * 10,
        is_available: i % 2 === 0,
        primary_identifier: `PROD-${i}`
      }));

      const context = agent.buildAdaptiveContext(
        'Customer',
        'Show all products',
        largeResultSet
      );

      expect(context).toContain('Found 100 products');
      expect(context).toContain('Product 0');
      expect(context).toContain('Product 99');
    });

    it('should handle null customer context gracefully', () => {
      const context = agent.buildAdaptiveContext(
        null as any,
        'Test query',
        []
      );

      expect(context).toContain('No customer data available');
    });

    it('should handle empty string query gracefully', () => {
      const context = agent.buildAdaptiveContext(
        'Customer',
        '',
        []
      );

      expect(context).toBeDefined();
      expect(context).toContain('User Query');
    });
  });

  describe('Brand-Agnostic Validation', () => {
    it('should not contain hardcoded company names', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'ecommerce',
                entity_terminology: {
                  entityName: 'product',
                  entityNamePlural: 'products',
                  availableText: 'in stock',
                  unavailableText: 'out of stock',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      // Should not contain specific company names
      expect(prompt).not.toContain('Thompson');
      expect(prompt).not.toContain('Cifa');
      expect(prompt).not.toContain('Amazon');
      expect(prompt).not.toContain('Shopify');
    });

    it('should not contain industry-specific product types', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'general',
                entity_terminology: {
                  entityName: 'item',
                  entityNamePlural: 'items',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'price',
                  searchPrompt: 'Search'
                },
                confidence: 0.5
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      // Generic prompt should not contain specific product types
      expect(prompt).not.toContain('pumps');
      expect(prompt).not.toContain('hydraulic');
      expect(prompt).not.toContain('parts');
    });
  });
});
