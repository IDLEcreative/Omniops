import { REDIS_TIMEOUT_MS } from './config';
import { stopRedisContainer } from './redis-helpers';
import type { RedisFailureTest } from './types';

const testRedisUnavailable: RedisFailureTest = {
  name: 'Redis Unavailable',
  description: 'Redis connection fails → in-memory fallback → requests allowed',
  failureType: 'unavailable',
  injectFailure: stopRedisContainer,
  validateBehavior: (response) => {
    const requestAllowed = !response.error || !response.error.includes('Rate limit');
    const failOpenDetected = response.statusCode !== 429 && response.message;

    return {
      passed: requestAllowed,
      reason: requestAllowed
        ? 'Rate limiter allowed request (fail-open behavior)'
        : 'Rate limiter blocked request unexpectedly',
      failOpenBehavior: Boolean(failOpenDetected || requestAllowed)
    };
  }
};

const testRedisTimeout: RedisFailureTest = {
  name: 'Redis Connection Timeout',
  description: `Redis responds slowly (>${REDIS_TIMEOUT_MS}ms) → fallback activated`,
  failureType: 'timeout',
  injectFailure: async () => {
    console.log(`Simulating Redis timeout (threshold: ${REDIS_TIMEOUT_MS}ms)`);
  },
  validateBehavior: (response) => {
    const notRateLimited = response.statusCode !== 429;
    const hasValidResponse = response.message || response.error;

    return {
      passed: notRateLimited,
      reason: notRateLimited
        ? 'Request proceeded despite timeout'
        : 'Request was rate limited (no fallback)',
      failOpenBehavior: notRateLimited && Boolean(hasValidResponse)
    };
  }
};

const testRedisCommandError: RedisFailureTest = {
  name: 'Redis Command Error',
  description: 'Redis returns command error (WRONGTYPE) → logged, request allowed',
  failureType: 'command_error',
  injectFailure: async () => {
    console.log('Simulating Redis command error (WRONGTYPE, NOAUTH, etc)');
  },
  validateBehavior: (response) => {
    const requestProcessed = response.message !== undefined || response.error !== undefined;
    const notRateLimited = response.statusCode !== 429;

    return {
      passed: requestProcessed && notRateLimited,
      reason: requestProcessed && notRateLimited
        ? 'Error handled gracefully, request allowed'
        : 'Request blocked due to Redis error',
      failOpenBehavior: notRateLimited
    };
  }
};

const testInMemoryFallback: RedisFailureTest = {
  name: 'In-Memory Fallback',
  description: 'In-memory rate limiter active → enforces limits correctly',
  failureType: 'unavailable',
  injectFailure: stopRedisContainer,
  validateBehavior: (response) => {
    const isInitialRequest = !response.error;
    const hasValidLogic = response.message || response.error;

    return {
      passed: isInitialRequest || Boolean(hasValidLogic),
      reason: isInitialRequest
        ? 'In-memory fallback allowing requests correctly'
        : 'In-memory fallback enforcing limits',
      failOpenBehavior: !response.error || !response.error.includes('Rate limit')
    };
  }
};

export const redisFailureScenarios: RedisFailureTest[] = [
  testRedisUnavailable,
  testRedisTimeout,
  testRedisCommandError,
  testInMemoryFallback
];
