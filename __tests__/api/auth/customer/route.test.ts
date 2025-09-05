/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Set up global Response polyfill before any imports
global.Response = class Response {
  body: any
  status: number
  statusText: string
  headers: Headers
  ok: boolean

  constructor(body?: any, init?: ResponseInit) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Headers(init?.headers)
    this.ok = this.status >= 200 && this.status < 300
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }

  async text() {
    if (typeof this.body === 'string') {
      return this.body
    }
    return JSON.stringify(this.body)
  }
} as any

// Use native Headers from undici/Node where available

// Mock the static json method on Response
Response.json = function(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {})
    }
  })
}

// Mock the module before importing anything that uses it
const mockCreateClient = jest.fn()
jest.mock('@/lib/supabase-server', () => ({
  createClient: mockCreateClient
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
  }))
}))

// Now import the route that uses the mocked modules
import { GET } from '@/app/api/auth/customer/route'

describe('/api/auth/customer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return customer data for authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'customer@example.com'
      }

      const mockCustomer = {
        id: 'customer-123',
        auth_user_id: 'user-123',
        email: 'customer@example.com',
        name: 'John Doe',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock the createClient to return a client with specific behavior
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockCustomer,
            error: null
          })
        }))
      }

      mockCreateClient.mockResolvedValue(mockSupabaseClient)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ customer: mockCustomer })

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('customers')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('auth_user_id', 'user-123')
    })

    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' }
          })
        },
        from: jest.fn()
      }

      mockCreateClient.mockResolvedValue(mockSupabaseClient)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 404 if customer record not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'customer@example.com'
      }

      // Mock authenticated user but customer not found
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Customer not found' }
          })
        }))
      }

      mockCreateClient.mockResolvedValue(mockSupabaseClient)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Customer not found' })
    })

    it('should handle database errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'customer@example.com'
      }

      // Mock database error
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockRejectedValue(
            new Error('Database connection failed')
          )
        }))
      }

      mockCreateClient.mockResolvedValue(mockSupabaseClient)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
    })

    it('should handle missing auth error', async () => {
      // Mock auth error
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Auth service unavailable' }
          })
        },
        from: jest.fn()
      }

      mockCreateClient.mockResolvedValue(mockSupabaseClient)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })
  })
})
