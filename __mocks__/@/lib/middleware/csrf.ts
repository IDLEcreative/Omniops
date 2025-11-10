// Mock for @/lib/middleware/csrf

// Bypass CSRF protection in tests
export const withCSRF = (handler: any) => handler

export const generateCSRFToken = () => 'test-csrf-token'

export const validateCSRFToken = () => true

export const setCSRFCookie = (response: any) => response

export const requiresCSRF = false
