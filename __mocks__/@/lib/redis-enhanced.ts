// Mock for @/lib/redis-enhanced

const mockRedisData = new Map();

const mockRedisClient = {
  async lpush(key: string, ...values: string[]) {
    const entry = mockRedisData.get(key) || [];
    entry.unshift(...values);
    mockRedisData.set(key, entry);
    return entry.length;
  },
  async rpush(key: string, ...values: string[]) {
    const entry = mockRedisData.get(key) || [];
    entry.push(...values);
    mockRedisData.set(key, entry);
    return entry.length;
  },
  async lrange(key: string, start: number, stop: number) {
    const entry = mockRedisData.get(key) || [];
    if (stop === -1) return entry.slice(start);
    return entry.slice(start, stop + 1);
  },
  async exists(...keys: string[]) {
    let count = 0;
    for (const key of keys) {
      if (mockRedisData.has(key)) count++;
    }
    return count;
  },
  async setex(key: string, seconds: number, value: string) {
    mockRedisData.set(key, value);
    return 'OK';
  },
  async get(key: string) {
    return mockRedisData.get(key) || null;
  },
  async set(key: string, value: string) {
    mockRedisData.set(key, value);
    return 'OK';
  },
  async del(...keys: string[]) {
    let deleted = 0;
    for (const key of keys) {
      if (mockRedisData.has(key)) {
        mockRedisData.delete(key);
        deleted++;
      }
    }
    return deleted;
  },
  async incr(key: string) {
    const current = parseInt(mockRedisData.get(key) || '0', 10);
    const newValue = current + 1;
    mockRedisData.set(key, String(newValue));
    return newValue;
  },
  async expire(key: string, seconds: number) {
    return 1;
  }
};

// Mock job manager
export const getMemoryAwareJobManager = jest.fn(() => ({
  redis: mockRedisClient,
  createJob: jest.fn().mockResolvedValue(undefined),
  updateJob: jest.fn().mockResolvedValue(undefined),
  getJob: jest.fn().mockResolvedValue(null),
  addJobResult: jest.fn().mockResolvedValue(undefined),
  getJobResults: jest.fn().mockResolvedValue([]),
  deleteJob: jest.fn().mockResolvedValue(undefined),
}));

export const getResilientRedisClient = jest.fn(() => mockRedisClient);

export function clearMockRedisData() {
  mockRedisData.clear();
}
