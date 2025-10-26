/**
 * Mock Factory Utilities
 *
 * Factory functions for creating test mocks of external services.
 * Includes Supabase, Redis, and OpenAI mocks with realistic behavior.
 */

import { jest } from '@jest/globals';

export class MockUtilities {
  static createSupabaseMock() {
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };
  }

  static createRedisMock() {
    const storage = new Map<string, string>();
    const sets = new Map<string, Set<string>>();

    return {
      get: jest.fn((key: string) => Promise.resolve(storage.get(key) || null)),
      set: jest.fn((key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve('OK');
      }),
      setex: jest.fn((key: string, ttl: number, value: string) => {
        storage.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        const existed = storage.has(key);
        storage.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
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
      flushall: jest.fn(() => {
        storage.clear();
        sets.clear();
        return Promise.resolve('OK');
      }),
      eval: jest.fn(),
      hmget: jest.fn(),
      hmset: jest.fn(),
      hincrby: jest.fn(),
      expire: jest.fn(),
      quit: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
    };
  }

  static createOpenAIMock() {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: "Test AI-generated summary",
                    keyFacts: ["Fact 1", "Fact 2", "Fact 3"],
                    topicTags: ["tag1", "tag2", "tag3"]
                  })
                }
              }
            ]
          })
        }
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }]
        })
      }
    };
  }
}
