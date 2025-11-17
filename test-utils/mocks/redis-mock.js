/**
 * Redis (ioredis) Mock Configuration
 *
 * Provides in-memory Redis mock for testing rate limiting, caching, and job queues.
 * Prevents real Redis connections during test execution.
 */

// In-memory data store for Redis mock
let mockRedisData = new Map();

const createMockPipeline = () => {
  let pipelineKey = null;
  let pexpireMs = null;

  const pipeline = {
    get(key) {
      pipelineKey = key;
      return pipeline;
    },
    incr(key) {
      return pipeline;
    },
    pexpire(key, ms) {
      pexpireMs = ms;
      return pipeline;
    },
    async exec() {
      if (!pipelineKey) return null;

      const entry = mockRedisData.get(pipelineKey);

      // Check if entry is expired
      const isExpired = entry && entry.expiry && Date.now() > entry.expiry;
      const currentValue = (entry && !isExpired) ? parseInt(entry.value, 10) : 0;
      const newValue = currentValue + 1;

      // Set expiry: use existing expiry if entry exists and not expired, otherwise use pexpireMs
      let expiry;
      if (entry && !isExpired && entry.expiry) {
        expiry = entry.expiry;
      } else if (pexpireMs !== null) {
        expiry = Date.now() + pexpireMs;
      } else {
        expiry = Date.now() + 60000;
      }

      mockRedisData.set(pipelineKey, {
        value: String(newValue),
        expiry
      });

      return [
        [null, currentValue > 0 ? String(currentValue) : null],
        [null, newValue],
        [null, 1]
      ];
    }
  };

  return pipeline;
};

const createRedisMock = () => ({
  // Pipeline support for rate limiting
  pipeline: jest.fn(() => createMockPipeline()),
  pttl: jest.fn().mockResolvedValue(-1),
  ping: jest.fn().mockResolvedValue('PONG'),

  // Basic operations
  get: jest.fn(async (key) => {
    const entry = mockRedisData.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      mockRedisData.delete(key);
      return null;
    }
    return entry.value;
  }),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn((...keys) => {
    let deleted = 0;
    for (const key of keys) {
      if (mockRedisData.has(key)) {
        mockRedisData.delete(key);
        deleted++;
      }
    }
    return Promise.resolve(deleted);
  }),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  incr: jest.fn(async (key) => {
    const entry = mockRedisData.get(key);
    const currentValue = entry ? parseInt(entry.value, 10) : 0;
    const newValue = currentValue + 1;
    mockRedisData.set(key, {
      value: String(newValue),
      expiry: entry?.expiry ?? (Date.now() + 60000)
    });
    return newValue;
  }),

  // List operations (for queue)
  lpush: jest.fn().mockResolvedValue(1),
  rpush: jest.fn().mockResolvedValue(1),
  lrange: jest.fn().mockResolvedValue([]),

  // Hash operations (for job status)
  hset: jest.fn().mockResolvedValue('OK'),
  hget: jest.fn().mockResolvedValue(null),
  hgetall: jest.fn().mockResolvedValue({}),

  // Pattern matching (for cleanup)
  keys: jest.fn().mockResolvedValue([]),

  // Sorted set operations (for caching)
  zadd: jest.fn().mockResolvedValue(1),
  zcard: jest.fn().mockResolvedValue(0),
  zrange: jest.fn().mockResolvedValue([]),
  zrem: jest.fn().mockResolvedValue(1),
  zremrangebyrank: jest.fn().mockResolvedValue(1),

  // Connection
  quit: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  status: 'ready',
});

module.exports = jest.fn().mockImplementation(createRedisMock);
