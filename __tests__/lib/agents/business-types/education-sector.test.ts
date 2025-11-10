/**
 * Domain-Agnostic Agent - Education Sector Tests
 * Tests for education business type (courses, enrollment, tuition)
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';
import {
  createMockSupabaseClient,
  initializeAgentWithBusinessType,
  STANDARD_TERMINOLOGY,
  createSampleEntity,
  type MockSupabaseClient
} from '@/__tests__/utils/domain-agnostic-test-helpers';

// Mock Supabase
const mockSupabase = createMockSupabaseClient();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Education Business Type', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(async () => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();

    await initializeAgentWithBusinessType(
      agent,
      mockSupabase,
      'education',
      STANDARD_TERMINOLOGY.education,
      0.88
    );
  });

  describe('System Prompt Generation', () => {
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

    it('should include education-specific terminology', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('tuition');
      expect(prompt).toContain('open for enrollment');
    });
  });

  describe('Entity Formatting', () => {
    it('should format education entities with course-specific fields', () => {
      const entities = [
        createSampleEntity(
          'Introduction to Computer Science',
          1200,
          true,
          {
            course_code: 'CS101',
            instructor: 'Dr. Jane Smith',
            credit_hours: 3
          }
        ),
        createSampleEntity(
          'Advanced Mathematics',
          1500,
          false,
          {
            course_code: 'MATH301',
            instructor: 'Prof. John Doe',
            credit_hours: 4
          }
        )
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
  });

  describe('Context Building', () => {
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

    it('should handle education-specific customer profiles', () => {
      const context = agent.buildAdaptiveContext(
        'Graduate student seeking advanced courses',
        'Are there any 400-level courses available?',
        []
      );

      expect(context).toContain('courses');
      expect(context).toBeDefined();
    });
  });
});
