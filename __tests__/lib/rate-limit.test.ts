import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { checkRateLimit, checkDomainRateLimit } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  // Store original Date.now
  let originalDateNow: () => number
  let currentTime: number
  let testCounter = 0

  beforeEach(() => {
    // Clear the rate limit map by making multiple requests with old timestamps
    // This ensures tests start with a clean state
    jest.clearAllMocks()

    // Reset deterministic counter
    testCounter = 0

    // Mock Date.now for consistent testing
    originalDateNow = Date.now
    currentTime = 1000000
    Date.now = jest.fn(() => currentTime)
  })

  afterEach(() => {
    // Restore original Date.now
    Date.now = originalDateNow
    jest.restoreAllMocks()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const identifier = 'test-user-1'
      const maxRequests = 5
      const windowMs = 60000

      // First request
      let result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.resetTime).toBe(currentTime + windowMs)

      // Second request
      result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3)

      // Third request
      result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('should block requests exceeding rate limit', () => {
      const identifier = 'test-user-2'
      const maxRequests = 3
      const windowMs = 60000

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        const result = checkRateLimit(identifier, maxRequests, windowMs)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(maxRequests - i - 1)
      }

      // Next request should be blocked
      const result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetTime).toBe(currentTime + windowMs)
    })

    it('should reset rate limit after time window expires', () => {
      const identifier = 'test-user-3'
      const maxRequests = 2
      const windowMs = 60000

      // Use up the rate limit
      checkRateLimit(identifier, maxRequests, windowMs)
      checkRateLimit(identifier, maxRequests, windowMs)

      // Should be blocked
      let result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(false)

      // Advance time past the window
      currentTime += windowMs + 1

      // Should be allowed again
      result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(maxRequests - 1)
      expect(result.resetTime).toBe(currentTime + windowMs)
    })

    it('should handle multiple identifiers independently', () => {
      const maxRequests = 2
      const windowMs = 60000

      // User 1 makes requests
      checkRateLimit('user1', maxRequests, windowMs)
      checkRateLimit('user1', maxRequests, windowMs)

      // User 1 should be blocked
      let result = checkRateLimit('user1', maxRequests, windowMs)
      expect(result.allowed).toBe(false)

      // User 2 should still be allowed
      result = checkRateLimit('user2', maxRequests, windowMs)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(maxRequests - 1)
    })

    it('should use default parameters when not specified', () => {
      const identifier = 'test-default'
      
      const result = checkRateLimit(identifier)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(49) // Default is 50
      expect(result.resetTime).toBe(currentTime + 60000) // Default is 1 minute
    })

    it('should clean up old entries deterministically', () => {
      // Create multiple entries to trigger deterministic cleanup
      // Cleanup threshold is 100 checks
      const oldIdentifier = 'old-entry'
      checkRateLimit(oldIdentifier, 5, 60000)

      // Advance time past the window
      currentTime += 70000

      // Make 100 requests to trigger deterministic cleanup
      for (let i = 0; i < 100; i++) {
        checkRateLimit(`trigger-${i}`, 5, 60000)
      }

      // The old entry should now be cleaned up when accessed (expired)
      const oldResult = checkRateLimit(oldIdentifier, 5, 60000)
      expect(oldResult.remaining).toBe(4) // Should be reset, not continuing from old count
      expect(oldResult.allowed).toBe(true)
    })

    it('should handle edge case of exactly reaching rate limit', () => {
      const identifier = 'exact-limit'
      const maxRequests = 1
      const windowMs = 60000

      // First request uses up the limit
      let result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)

      // Next request should be blocked
      result = checkRateLimit(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('checkDomainRateLimit', () => {
    it('should apply domain-specific rate limits', () => {
      const domain = 'example.com'

      // Default limit is 100 requests per minute
      const result = checkDomainRateLimit(domain)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)
      expect(result.resetTime).toBe(currentTime + 60000)
    })

    it('should track different domains separately', () => {
      // Make 5 requests for domain1
      for (let i = 0; i < 5; i++) {
        checkDomainRateLimit('domain1.com')
      }

      // Domain1 should have 95 remaining
      let result = checkDomainRateLimit('domain1.com')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(94) // 100 - 6

      // Domain2 should have full quota
      result = checkDomainRateLimit('domain2.com')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99) // 100 - 1
    })

    it('should use domain prefix in identifier', () => {
      const domain = 'test.com'
      
      // Make a domain request
      let result = checkDomainRateLimit(domain)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)

      // Regular rate limit with same name should be independent
      result = checkRateLimit(domain, 10, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9) // Different limit
    })

    it('should handle rapid requests from same domain', () => {
      const domain = 'rapid.com'
      const results = []

      // Make 10 rapid requests
      for (let i = 0; i < 10; i++) {
        results.push(checkDomainRateLimit(domain))
      }

      // All should be allowed
      results.forEach((result, index) => {
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(99 - index)
      })

      // 11th request should still be allowed (limit is 100)
      const result = checkDomainRateLimit(domain)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(89)
    })

    it('should reset domain limits after time window', () => {
      const domain = 'reset-test.com'

      // Use some requests
      for (let i = 0; i < 50; i++) {
        checkDomainRateLimit(domain)
      }

      // Check remaining
      let result = checkDomainRateLimit(domain)
      expect(result.remaining).toBe(49) // 100 - 51

      // Advance time past window
      currentTime += 60001

      // Should be reset
      result = checkDomainRateLimit(domain)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99) // Reset to 100 - 1
    })
  })

  describe('Rate limit edge cases', () => {
    it('should handle concurrent requests correctly', () => {
      const identifier = 'concurrent-test'
      const maxRequests = 10
      const windowMs = 60000

      // Simulate concurrent requests
      const results = []
      for (let i = 0; i < 15; i++) {
        results.push(checkRateLimit(identifier, maxRequests, windowMs))
      }

      // First 10 should be allowed
      results.slice(0, 10).forEach((result, index) => {
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(maxRequests - index - 1)
      })

      // Remaining 5 should be blocked
      results.slice(10).forEach(result => {
        expect(result.allowed).toBe(false)
        expect(result.remaining).toBe(0)
      })
    })

    it('should maintain consistent reset times within a window', () => {
      const identifier = 'reset-time-test'
      const maxRequests = 5
      const windowMs = 60000

      // Make multiple requests
      const results = []
      for (let i = 0; i < 3; i++) {
        results.push(checkRateLimit(identifier, maxRequests, windowMs))
      }

      // All should have the same reset time
      const resetTime = results[0].resetTime
      results.forEach(result => {
        expect(result.resetTime).toBe(resetTime)
      })

      // Even when blocked
      checkRateLimit(identifier, maxRequests, windowMs)
      checkRateLimit(identifier, maxRequests, windowMs)
      const blockedResult = checkRateLimit(identifier, maxRequests, windowMs)
      expect(blockedResult.resetTime).toBe(resetTime)
    })
  })
})