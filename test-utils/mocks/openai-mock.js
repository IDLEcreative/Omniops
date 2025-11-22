/**
 * OpenAI Mock Configuration
 *
 * Provides mock OpenAI client to avoid browser detection issues in tests.
 * Mocks chat completions and embeddings endpoints.
 */

module.exports = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: jest.fn().mockImplementation(async (params) => {
        // Check if this is a JSON response request (AI quote analyzer)
        const isJsonRequest = params?.response_format?.type === 'json_object';

        let content;
        if (isJsonRequest) {
          // Extract traffic from prompt to calculate estimated completions
          // Formula: monthlyVisitors × 0.05 × 0.90
          const prompt = params?.messages?.[0]?.content || '';
          const trafficMatch = prompt.match(/Monthly Traffic:\*\* ([\d,]+)/);
          let estimatedCompletions = 2250; // Default fallback

          if (trafficMatch) {
            const monthlyVisitors = parseInt(trafficMatch[1].replace(/,/g, ''), 10);
            estimatedCompletions = Math.round(monthlyVisitors * 0.05 * 0.90);
          }

          // Return proper JSON structure for AI quote analyzer
          content = JSON.stringify({
            tier: 'sme',
            confidence: 85,
            estimatedCompletions: estimatedCompletions,
            reasoning: [
              'Mock traffic analysis indicates medium-sized business',
              'Estimated conversation volume fits SME tier',
              'Company profile suggests established business',
              'Domain maturity indicates stable customer base'
            ],
            signals: {
              trafficSignal: 'medium',
              employeeSignal: 'medium',
              revenueSignal: 'medium',
              contentSignal: 'extensive',
              domainAgeSignal: 'established'
            }
          });
        } else {
          // Default chat response
          content = 'Mocked response';
        }

        return {
          choices: [{
            message: {
              content: content,
              role: 'assistant',
            },
            finish_reason: 'stop',
          }],
        };
      }),
    },
  },
  embeddings: {
    create: jest.fn().mockResolvedValue({
      data: [{
        embedding: Array(1536).fill(0.1),
      }],
    }),
  },
}));
