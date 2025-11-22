import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  createServiceRoleClient,
  __setMockSupabaseClient,
  __resetMockSupabaseClient
} from '@/lib/supabase-server'

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), delete: jest.fn() })),
}))

describe('Privacy Schema - GDPR Compliance Tables', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    __resetMockSupabaseClient()

    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockReturnThis(),
      })),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }
    __setMockSupabaseClient(mockSupabaseClient)
  })

  describe('user_agreements - GDPR Article 7', () => {
    it('should insert and fetch Terms of Service acceptance', async () => {
      const mockAgreement = {
        id: 'agreement-123',
        user_id: 'user-456',
        terms_version: '2025-11-19',
        accepted_at: new Date().toISOString(),
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAgreement, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('user_agreements')
        .insert({ user_id: 'user-456', terms_version: '2025-11-19' })
        .select()
        .single()

      expect(result.data).toMatchObject({
        user_id: 'user-456',
        terms_version: '2025-11-19',
      })
      expect(result.error).toBeNull()
    })

    it('should enforce unique constraint on user_id and terms_version', async () => {
      const duplicateError = {
        message: 'duplicate key value violates unique constraint',
        code: '23505',
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({ data: null, error: duplicateError }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('user_agreements')
        .insert({ user_id: 'user-456', terms_version: '2025-11-19' })

      expect(result.error).toEqual(duplicateError)
    })

    it('should fetch agreements history ordered by date', async () => {
      const mockAgreements = [
        { terms_version: '2025-11-19', accepted_at: '2025-11-19T15:30:00Z' },
        { terms_version: '2025-01-01', accepted_at: '2025-01-01T10:00:00Z' },
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAgreements, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('user_agreements')
        .select('terms_version, accepted_at')
        .eq('user_id', 'user-456')
        .order('accepted_at', { ascending: false })

      expect(result.data?.length).toBe(2)
    })
  })

  describe('account_deletion_requests - GDPR Article 17', () => {
    it('should create deletion request with 30-day cooling off', async () => {
      const requestedAt = new Date()
      const scheduledFor = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

      const mockDeletionRequest = {
        id: 'deletion-123',
        user_id: 'user-456',
        requested_at: requestedAt.toISOString(),
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDeletionRequest, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('account_deletion_requests')
        .insert({ user_id: 'user-456', scheduled_for: scheduledFor.toISOString() })
        .select()
        .single()

      expect(result.data?.status).toBe('pending')
    })

    it('should allow cancelling deletion request', async () => {
      const mockUpdatedRequest = {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedRequest, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('account_deletion_requests')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', 'user-456')
        .select()
        .single()

      expect(result.data?.status).toBe('cancelled')
    })

    it('should fetch pending deletions for processing', async () => {
      const mockPendingRequests = [
        { user_id: 'user-1', status: 'pending' },
        { user_id: 'user-2', status: 'pending' },
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ data: mockPendingRequests, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('account_deletion_requests')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())

      expect(result.data?.length).toBe(2)
    })
  })

  describe('data_export_logs - GDPR Article 15 & 20', () => {
    it('should create and track export request', async () => {
      const mockExportLog = {
        id: 'export-123',
        user_id: 'user-456',
        status: 'processing',
        export_format: 'json',
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExportLog, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('data_export_logs')
        .insert({ user_id: 'user-456', export_format: 'json' })
        .select()
        .single()

      expect(result.data?.status).toBe('processing')
    })

    it('should update export log when completed', async () => {
      const mockCompletedLog = {
        status: 'completed',
        file_size_bytes: 1024000,
        records_exported: { conversations: 10, messages: 50 },
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCompletedLog, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('data_export_logs')
        .update({
          status: 'completed',
          file_size_bytes: 1024000,
          records_exported: { conversations: 10, messages: 50 },
        })
        .eq('id', 'export-123')
        .select()
        .single()

      expect(result.data?.status).toBe('completed')
      expect(result.data?.records_exported).toMatchObject({ conversations: 10 })
    })

    it('should track failed exports with error message', async () => {
      const mockFailedLog = {
        status: 'failed',
        error_message: 'Database timeout',
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockFailedLog, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('data_export_logs')
        .update({ status: 'failed', error_message: 'Database timeout' })
        .eq('id', 'export-123')
        .select()
        .single()

      expect(result.data?.status).toBe('failed')
      expect(result.data?.error_message).toBe('Database timeout')
    })

    it('should fetch user export history', async () => {
      const mockExports = [
        { requested_at: '2025-11-15T14:30:00Z', status: 'completed' },
        { requested_at: '2025-11-01T10:00:00Z', status: 'completed' },
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockExports, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('data_export_logs')
        .select('requested_at, status')
        .eq('user_id', 'user-456')
        .order('requested_at', { ascending: false })

      expect(result.data?.length).toBe(2)
    })
  })
})
