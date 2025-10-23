import { jest } from '@jest/globals'

// Default return value for rate limit checks
export const checkDomainRateLimit = jest.fn().mockReturnValue({
  allowed: true,
  remaining: 99,
  resetTime: Date.now() + 3600000,
})

export const checkRateLimit = jest.fn().mockReturnValue({
  allowed: true,
  remaining: 99,
  resetTime: Date.now() + 3600000,
})