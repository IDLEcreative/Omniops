// Mock for ioredis

const mockRedisData = new Map();

class MockRedis {
  constructor() {
    // Mock constructor
  }

  async lpush(key, ...values) {
    const entry = mockRedisData.get(key) || [];
    entry.unshift(...values);
    mockRedisData.set(key, entry);
    return entry.length;
  }

  async rpush(key, ...values) {
    const entry = mockRedisData.get(key) || [];
    entry.push(...values);
    mockRedisData.set(key, entry);
    return entry.length;
  }

  async lrange(key, start, stop) {
    const entry = mockRedisData.get(key) || [];
    if (stop === -1) return entry.slice(start);
    return entry.slice(start, stop + 1);
  }

  async hset(key, ...args) {
    // Can accept either (key, field, value) or (key, object)
    if (args.length === 1 && typeof args[0] === 'object') {
      mockRedisData.set(key, args[0]);
    } else {
      const obj = mockRedisData.get(key) || {};
      for (let i = 0; i < args.length; i += 2) {
        obj[args[i]] = args[i + 1];
      }
      mockRedisData.set(key, obj);
    }
    return 'OK';
  }

  async hget(key, field) {
    const obj = mockRedisData.get(key);
    return obj ? obj[field] : null;
  }

  async hgetall(key) {
    return mockRedisData.get(key) || {};
  }

  async exists(...keys) {
    let count = 0;
    for (const key of keys) {
      if (mockRedisData.has(key)) count++;
    }
    return count;
  }

  async setex(key, seconds, value) {
    mockRedisData.set(key, value);
    return 'OK';
  }

  async get(key) {
    return mockRedisData.get(key) || null;
  }

  async set(key, value) {
    mockRedisData.set(key, value);
    return 'OK';
  }

  async del(...keys) {
    let deleted = 0;
    for (const key of keys) {
      if (mockRedisData.has(key)) {
        mockRedisData.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  async incr(key) {
    const current = parseInt(mockRedisData.get(key) || '0', 10);
    const newValue = current + 1;
    mockRedisData.set(key, String(newValue));
    return newValue;
  }

  async expire(key, seconds) {
    return 1;
  }

  async quit() {
    return 'OK';
  }

  async disconnect() {
    return 'OK';
  }
}

module.exports = MockRedis;
module.exports.default = MockRedis;
