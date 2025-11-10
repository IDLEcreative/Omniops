// Mock Redis client for testing rate limiting
let mockRedisData = new Map();

const createMockPipeline = () => {
  let pipelineKey = null;

  const pipeline = {
    get(key) {
      pipelineKey = key;
      return pipeline;
    },
    incr(key) {
      // Accept key but don't need to store it, pipelineKey was set by get()
      return pipeline;
    },
    pexpire(key, ms) {
      // Accept key and ms but don't need to store them
      return pipeline;
    },
    async exec() {
      if (!pipelineKey) return null;

      // Get current count
      const entry = mockRedisData.get(pipelineKey);
      const currentValue = entry ? parseInt(entry.value, 10) : 0;
      const newValue = currentValue + 1;

      // Update storage
      mockRedisData.set(pipelineKey, {
        value: String(newValue),
        expiry: entry?.expiry ?? (Date.now() + 60000)
      });

      // Return pipeline results: [get, incr, pexpire]
      return [
        [null, currentValue > 0 ? String(currentValue) : null], // get
        [null, newValue],    // incr
        [null, 1]            // pexpire
      ];
    }
  };

  return pipeline;
};

const mockRedis = {
  pipeline() {
    return createMockPipeline();
  },
  async get(key) {
    const entry = mockRedisData.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      mockRedisData.delete(key);
      return null;
    }
    return entry.value;
  },
  async incr(key) {
    const entry = mockRedisData.get(key);
    const currentValue = entry ? parseInt(entry.value, 10) : 0;
    const newValue = currentValue + 1;
    mockRedisData.set(key, {
      value: String(newValue),
      expiry: entry?.expiry ?? (Date.now() + 60000)
    });
    return newValue;
  },
  async expire(key, seconds) {
    const entry = mockRedisData.get(key);
    if (entry) {
      entry.expiry = Date.now() + (seconds * 1000);
    }
    return 1;
  },
  async pexpire(key, ms) {
    const entry = mockRedisData.get(key);
    if (entry) {
      entry.expiry = Date.now() + ms;
    }
    return 1;
  },
  async pttl(key) {
    const entry = mockRedisData.get(key);
    if (!entry) return -2;
    const ttl = entry.expiry - Date.now();
    return ttl > 0 ? ttl : -1;
  },
  async del(...keys) {
    let deleted = 0;
    for (const key of keys) {
      if (mockRedisData.has(key)) {
        mockRedisData.delete(key);
        deleted++;
      }
    }
    return deleted;
  },
  async lpush(key, ...values) {
    const entry = mockRedisData.get(key) || { value: '[]', expiry: Date.now() + 60000 };
    const list = JSON.parse(entry.value);
    list.unshift(...values);
    mockRedisData.set(key, { ...entry, value: JSON.stringify(list) });
    return list.length;
  },
  async rpush(key, ...values) {
    const entry = mockRedisData.get(key) || { value: '[]', expiry: Date.now() + 60000 };
    const list = JSON.parse(entry.value);
    list.push(...values);
    mockRedisData.set(key, { ...entry, value: JSON.stringify(list) });
    return list.length;
  },
  async lrange(key, start, stop) {
    const entry = mockRedisData.get(key);
    if (!entry) return [];
    const list = JSON.parse(entry.value);
    if (stop === -1) return list.slice(start);
    return list.slice(start, stop + 1);
  },
  async exists(...keys) {
    let count = 0;
    for (const key of keys) {
      if (mockRedisData.has(key)) count++;
    }
    return count;
  },
  async setex(key, seconds, value) {
    mockRedisData.set(key, {
      value: String(value),
      expiry: Date.now() + (seconds * 1000)
    });
    return 'OK';
  },
  async set(key, value, ...args) {
    const expiry = args[0] === 'EX' ? Date.now() + (args[1] * 1000) : Date.now() + 60000;
    mockRedisData.set(key, { value: String(value), expiry });
    return 'OK';
  }
};

const getRedisClient = () => {
  return mockRedis;
};

const createRedisClient = () => {
  return mockRedis;
};

const clearMockRedisData = () => { mockRedisData.clear(); };

module.exports = {
  getRedisClient,
  createRedisClient,
  clearMockRedisData
};
