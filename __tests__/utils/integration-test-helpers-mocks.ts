import { jest } from '@jest/globals';

/**
 * Mock Factories
 * Factory functions for creating mock objects for testing
 */

export class MockFactory {
  /**
   * Create comprehensive Supabase client mock
   */
  static createSupabaseMock(): ReturnType<typeof jest.fn> {
    const mockResponse = { data: null, error: null };

    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue(mockResponse),
      update: jest.fn().mockResolvedValue(mockResponse),
      upsert: jest.fn().mockResolvedValue(mockResponse),
      delete: jest.fn().mockResolvedValue(mockResponse),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockResponse),
      maybeSingle: jest.fn().mockResolvedValue(mockResponse),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
    };
  }

  /**
   * Create Redis client mock with full functionality
   */
  static createRedisMock(): ReturnType<typeof jest.fn> {
    const storage = new Map<string, string>();
    const hashes = new Map<string, Map<string, string>>();
    const sets = new Map<string, Set<string>>();
    const sortedSets = new Map<string, Map<string, number>>();
    const expirations = new Map<string, number>();

    return {
      // String operations
      get: jest.fn((key: string) => {
        const expiry = expirations.get(key);
        if (expiry && Date.now() > expiry) {
          storage.delete(key);
          expirations.delete(key);
          return Promise.resolve(null);
        }
        return Promise.resolve(storage.get(key) || null);
      }),

      set: jest.fn((key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve('OK');
      }),

      setex: jest.fn((key: string, ttl: number, value: string) => {
        storage.set(key, value);
        expirations.set(key, Date.now() + ttl * 1000);
        return Promise.resolve('OK');
      }),

      del: jest.fn((key: string | string[]) => {
        const keys = Array.isArray(key) ? key : [key];
        let deleted = 0;
        keys.forEach(k => {
          if (storage.delete(k)) deleted++;
          if (hashes.delete(k)) deleted++;
          if (sets.delete(k)) deleted++;
          if (sortedSets.delete(k)) deleted++;
          expirations.delete(k);
        });
        return Promise.resolve(deleted);
      }),

      exists: jest.fn((key: string | string[]) => {
        const keys = Array.isArray(key) ? key : [key];
        let count = 0;
        keys.forEach(k => {
          if (storage.has(k) || hashes.has(k) || sets.has(k) || sortedSets.has(k)) {
            count++;
          }
        });
        return Promise.resolve(count);
      }),

      // Hash operations
      hmget: jest.fn((key: string, ...fields: string[]) => {
        const hash = hashes.get(key);
        if (!hash) return Promise.resolve(fields.map(() => null));
        return Promise.resolve(fields.map(field => hash.get(field) || null));
      }),

      hmset: jest.fn((key: string, ...args: string[]) => {
        if (!hashes.has(key)) hashes.set(key, new Map());
        const hash = hashes.get(key)!;
        for (let i = 0; i < args.length; i += 2) {
          hash.set(args[i], args[i + 1]);
        }
        return Promise.resolve('OK');
      }),

      hincrby: jest.fn((key: string, field: string, increment: number) => {
        if (!hashes.has(key)) hashes.set(key, new Map());
        const hash = hashes.get(key)!;
        const current = parseInt(hash.get(field) || '0');
        const newValue = current + increment;
        hash.set(field, newValue.toString());
        return Promise.resolve(newValue);
      }),

      // Set operations
      sadd: jest.fn((key: string, ...values: string[]) => {
        if (!sets.has(key)) sets.set(key, new Set());
        const set = sets.get(key)!;
        let added = 0;
        values.forEach(value => {
          if (!set.has(value)) {
            set.add(value);
            added++;
          }
        });
        return Promise.resolve(added);
      }),

      smembers: jest.fn((key: string) => {
        const set = sets.get(key);
        return Promise.resolve(set ? Array.from(set) : []);
      }),

      srem: jest.fn((key: string, ...values: string[]) => {
        const set = sets.get(key);
        if (!set) return Promise.resolve(0);
        let removed = 0;
        values.forEach(value => {
          if (set.delete(value)) removed++;
        });
        return Promise.resolve(removed);
      }),

      // Utility operations
      expire: jest.fn((key: string, ttl: number) => {
        if (storage.has(key) || hashes.has(key) || sets.has(key)) {
          expirations.set(key, Date.now() + ttl * 1000);
          return Promise.resolve(1);
        }
        return Promise.resolve(0);
      }),

      ttl: jest.fn((key: string) => {
        const expiry = expirations.get(key);
        if (!expiry) return Promise.resolve(-1);
        const remaining = Math.ceil((expiry - Date.now()) / 1000);
        return Promise.resolve(remaining > 0 ? remaining : -2);
      }),

      flushall: jest.fn(() => {
        storage.clear();
        hashes.clear();
        sets.clear();
        sortedSets.clear();
        expirations.clear();
        return Promise.resolve('OK');
      }),

      // Lua scripting
      eval: jest.fn((script: string) => {
        // Mock token bucket script response
        if (script.includes('rate') && script.includes('capacity')) {
          return Promise.resolve(1); // Allow request
        }
        return Promise.resolve(null);
      }),

      // Connection management
      on: jest.fn(() => {}),

      quit: jest.fn(() => Promise.resolve('OK')),
      disconnect: jest.fn(),

      // Pipeline support
      pipeline: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve([]))
      })),

      // Transaction support
      multi: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve([]))
      }))
    };
  }

  /**
   * Create OpenAI API mock
   */
  static createOpenAIMock(): ReturnType<typeof jest.fn> {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            id: 'chatcmpl-test',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-4',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: JSON.stringify({
                    summary: 'AI-generated summary of the content with key insights and main points.',
                    keyFacts: [
                      'Key fact 1 extracted from content',
                      'Important data point 2',
                      'Significant insight 3'
                    ],
                    topicTags: ['technology', 'ecommerce', 'products', 'business'],
                    qaPairs: [
                      {
                        question: 'What is this product about?',
                        answer: 'This is a premium product with advanced features.'
                      }
                    ]
                  })
                }
              }
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 150,
              total_tokens: 250
            }
          })
        }
      },

      embeddings: {
        create: jest.fn().mockResolvedValue({
          object: 'list',
          data: [
            {
              object: 'embedding',
              index: 0,
              embedding: Array.from({ length: 1536 }, () => Math.random() * 0.1)
            }
          ],
          model: 'text-embedding-ada-002',
          usage: {
            prompt_tokens: 50,
            total_tokens: 50
          }
        })
      }
    };
  }
}
