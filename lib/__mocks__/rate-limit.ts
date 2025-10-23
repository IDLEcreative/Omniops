// Manual mock for @/lib/rate-limit
// Use global jest (not from @jest/globals)
export const checkDomainRateLimit = jest.fn();

export const checkRateLimit = jest.fn();