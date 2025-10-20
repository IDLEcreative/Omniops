import { POST } from '@/app/api/webhooks/customer/route'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'job-123', status: 'pending' },
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

describe('Webhook Signature Verification', () => {
  const webhookSecret = 'test-webhook-secret'
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  function createSignedRequest(payload: any, secret: string): NextRequest {
    const body = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    return new NextRequest('http://localhost:3000/api/webhooks/customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-supabase-signature': signature
      },
      body: body
    })
  }

  it('accepts valid webhook signature', async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = webhookSecret

    const payload = {
      type: 'INSERT',
      table: 'customer_configs',
      record: { id: 'config-123', domain: 'test.com' }
    }

    const request = createSignedRequest(payload, webhookSecret)
    const response = await POST(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.message).toBeDefined()
  })

  it('rejects invalid webhook signature', async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = webhookSecret

    const payload = {
      type: 'INSERT',
      table: 'customer_configs',
      record: { id: 'config-123', domain: 'test.com' }
    }

    const request = createSignedRequest(payload, 'wrong-secret')
    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Invalid signature')
  })

  it('rejects missing webhook signature when secret is configured', async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = webhookSecret

    const request = new NextRequest('http://localhost:3000/api/webhooks/customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'INSERT', table: 'test' })
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Missing signature')
  })

  it('processes webhook without signature when secret not configured', async () => {
    delete process.env.SUPABASE_WEBHOOK_SECRET

    const request = new NextRequest('http://localhost:3000/api/webhooks/customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'INSERT',
        table: 'customer_configs',
        record: { id: 'config-123', domain: 'test.com' }
      })
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.message).toBeDefined()
  })

  it('handles malformed signature gracefully', async () => {
    process.env.SUPABASE_WEBHOOK_SECRET = webhookSecret

    const request = new NextRequest('http://localhost:3000/api/webhooks/customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-supabase-signature': 'not-a-valid-hex-signature'
      },
      body: JSON.stringify({ type: 'INSERT', table: 'test' })
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Invalid signature')
  })
})