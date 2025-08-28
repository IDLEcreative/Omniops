import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/customer/route'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/encryption')

describe('/api/auth/customer', () => {
  let mockSupabaseClient: any
  let mockAdminSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock regular Supabase client
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
        getSession: jest.fn(),
        updateUser: jest.fn(),
        resetPasswordForEmail: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      }))
    }

    // Mock admin Supabase client
    mockAdminSupabaseClient = {
      auth: {
        admin: {
          createUser: jest.fn(),
          updateUserById: jest.fn(),
          deleteUser: jest.fn(),
          listUsers: jest.fn()
        }
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      }))
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mockAdminSupabaseClient)

    // Mock encryption
    ;(encrypt as jest.Mock).mockImplementation((data) => `encrypted_${data}`)
  })

  describe('Customer Authentication', () => {
    const createRequest = (body: any, headers: Record<string, string> = {}) => {
      return new NextRequest('http://localhost:3000/api/auth/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body)
      })
    }

    it('should handle customer login with email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'customer@example.com',
        user_metadata: { name: 'John Doe' }
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123'
          }
        },
        error: null
      })

      const requestBody = {
        action: 'login',
        email: 'customer@example.com',
        password: 'secure-password-123'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: mockUser,
        message: 'Successfully logged in'
      })

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'customer@example.com',
        password: 'secure-password-123'
      })
    })

    it('should handle customer registration', async () => {
      const mockUser = {
        id: 'new-user-123',
        email: 'newcustomer@example.com',
        user_metadata: { name: 'Jane Doe' }
      }

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null // Email confirmation required
        },
        error: null
      })

      const requestBody = {
        action: 'register',
        email: 'newcustomer@example.com',
        password: 'secure-password-456',
        metadata: {
          name: 'Jane Doe',
          phone: '+1234567890'
        }
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: mockUser,
        message: 'Registration successful. Please check your email to confirm your account.'
      })

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newcustomer@example.com',
        password: 'secure-password-456',
        options: {
          data: {
            name: 'Jane Doe',
            phone: '+1234567890'
          }
        }
      })
    })

    it('should handle logout', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      })

      const requestBody = {
        action: 'logout'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Successfully logged out'
      })

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should handle password reset request', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      })

      const requestBody = {
        action: 'reset-password',
        email: 'customer@example.com'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Password reset email sent'
      })

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'customer@example.com',
        {
          redirectTo: expect.stringContaining('/reset-password')
        }
      )
    })

    it('should validate email format', async () => {
      const requestBody = {
        action: 'login',
        email: 'invalid-email',
        password: 'password123'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email format')
    })

    it('should validate password strength for registration', async () => {
      const requestBody = {
        action: 'register',
        email: 'test@example.com',
        password: '123' // Too weak
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Password must be at least')
    })

    it('should handle duplicate email registration', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: {
          message: 'User already registered',
          status: 400
        }
      })

      const requestBody = {
        action: 'register',
        email: 'existing@example.com',
        password: 'secure-password-789'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User already registered')
    })

    it('should handle invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid login credentials',
          status: 401
        }
      })

      const requestBody = {
        action: 'login',
        email: 'customer@example.com',
        password: 'wrong-password'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid login credentials')
    })

    it('should get current user session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'customer@example.com'
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const requestBody = {
        action: 'get-user'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: mockUser
      })
    })

    it('should handle session expiration', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Session expired',
          status: 401
        }
      })

      const requestBody = {
        action: 'get-user'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Session expired')
    })

    it('should update user profile', async () => {
      const updatedUser = {
        id: 'user-123',
        email: 'customer@example.com',
        user_metadata: {
          name: 'John Updated',
          phone: '+9876543210'
        }
      }

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: updatedUser },
        error: null
      })

      const requestBody = {
        action: 'update-profile',
        metadata: {
          name: 'John Updated',
          phone: '+9876543210'
        }
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
      })

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        data: {
          name: 'John Updated',
          phone: '+9876543210'
        }
      })
    })

    it('should handle OAuth login', async () => {
      const requestBody = {
        action: 'oauth-login',
        provider: 'google'
      }

      mockSupabaseClient.auth.signInWithOAuth = jest.fn().mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        url: 'https://accounts.google.com/oauth/authorize?...'
      })
    })

    it('should validate OAuth provider', async () => {
      const requestBody = {
        action: 'oauth-login',
        provider: 'invalid-provider'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid OAuth provider')
    })

    it('should handle email change request', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { email: 'newemail@example.com' } },
        error: null
      })

      const requestBody = {
        action: 'change-email',
        newEmail: 'newemail@example.com',
        password: 'current-password' // For security verification
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Email change confirmation sent to new email'
      })
    })

    it('should handle password change', async () => {
      // First verify current password
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: {} },
        error: null
      })

      // Then update password
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const requestBody = {
        action: 'change-password',
        currentPassword: 'old-password',
        newPassword: 'new-secure-password-123'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Password changed successfully'
      })
    })

    it('should handle account deletion', async () => {
      const userId = 'user-to-delete'
      
      // Get current user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Delete user data
      mockAdminSupabaseClient.from().delete.mockResolvedValue({
        error: null
      })

      // Delete auth user
      mockAdminSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        data: {},
        error: null
      })

      const requestBody = {
        action: 'delete-account',
        confirmPassword: 'password123' // For security
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Account deleted successfully'
      })

      expect(mockAdminSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(userId)
    })

    it('should handle rate limiting for auth attempts', async () => {
      // Simulate multiple failed login attempts
      const attempts = 5
      const requestBody = {
        action: 'login',
        email: 'customer@example.com',
        password: 'wrong-password'
      }

      for (let i = 0; i < attempts; i++) {
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: 'Invalid credentials' }
        })
      }

      // After too many attempts, should get rate limited
      const response = await POST(
        createRequest(requestBody, { 'X-Forwarded-For': '192.168.1.1' })
      )
      
      // Mock rate limiting logic
      if (attempts >= 5) {
        expect(response.status).toBe(429)
        const data = await response.json()
        expect(data.error).toContain('Too many attempts')
      }
    })

    it('should handle MFA setup', async () => {
      mockSupabaseClient.auth.mfa = {
        enroll: jest.fn().mockResolvedValue({
          data: {
            id: 'mfa-factor-id',
            qr_code: 'data:image/png;base64,...',
            secret: 'MFASECRET123'
          },
          error: null
        })
      }

      const requestBody = {
        action: 'setup-mfa'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.qr_code).toBeDefined()
    })

    it('should handle MFA verification', async () => {
      mockSupabaseClient.auth.mfa = {
        verify: jest.fn().mockResolvedValue({
          data: { verified: true },
          error: null
        })
      }

      const requestBody = {
        action: 'verify-mfa',
        code: '123456'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.verified).toBe(true)
    })

    it('should store encrypted credentials when remember me is enabled', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'customer@example.com'
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'token-123' }
        },
        error: null
      })

      const requestBody = {
        action: 'login',
        email: 'customer@example.com',
        password: 'secure-password',
        rememberMe: true
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(encrypt).toHaveBeenCalledWith(expect.stringContaining('secure-password'))
      
      // Verify encrypted credentials were stored
      expect(mockAdminSupabaseClient.from).toHaveBeenCalledWith('user_preferences')
      expect(mockAdminSupabaseClient.from().insert).toHaveBeenCalled()
    })

    it('should handle social login linking', async () => {
      const requestBody = {
        action: 'link-social',
        provider: 'facebook',
        accessToken: 'fb-access-token-123'
      }

      mockSupabaseClient.auth.linkIdentity = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Social account linked successfully')
    })
  })

  describe('Security Features', () => {
    it('should prevent SQL injection in email field', async () => {
      const requestBody = {
        action: 'login',
        email: "admin@example.com'; DROP TABLE users; --",
        password: 'password'
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email format')
    })

    it('should sanitize user input in metadata', async () => {
      const requestBody = {
        action: 'update-profile',
        metadata: {
          name: '<script>alert("XSS")</script>',
          phone: '+1234567890'
        }
      }

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const response = await POST(createRequest(requestBody))

      // The name should be sanitized
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: expect.not.stringContaining('<script>')
        })
      })
    })

    it('should enforce CSRF protection', async () => {
      const requestBody = {
        action: 'delete-account',
        confirmPassword: 'password123'
      }

      // Request without CSRF token should fail
      const response = await POST(
        createRequest(requestBody, { 'Origin': 'https://evil-site.com' })
      )

      expect(response.status).toBe(403)
    })
  })
})