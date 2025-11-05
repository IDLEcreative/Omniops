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
  async del(key) {
    mockRedisData.delete(key);
    return 1;
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
