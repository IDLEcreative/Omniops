/**
 * Domain-Agnostic Agent - Education, Legal, and Automotive Business Types
 * Tests for specific business type adaptations (education, legal services, automotive)
 *
 * @purpose Validates that the agent correctly adapts terminology and behavior for
 *          specialized business types: education (courses), legal (services), automotive (vehicles)
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Education, Legal, and Automotive', () => {
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
});
