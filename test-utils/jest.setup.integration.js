// Jest setup for integration tests
// THIS FILE DOES NOT START MSW - we need real API calls for RLS testing

// Polyfill TextEncoder/TextDecoder for jsdom environment
import { TextEncoder, TextDecoder } from 'util'
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

// Polyfill Web Streams API for Node.js compatibility (required by cheerio/undici)
import { ReadableStream, WritableStream, TransformStream } from 'stream/web'
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream
}
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream
}

// Polyfill MessagePort and MessageChannel (required by undici)
if (typeof global.MessagePort === 'undefined') {
  global.MessagePort = class MessagePort {
    constructor() {
      this.onmessage = null
      this.onmessageerror = null
      this._otherPort = null
    }

    postMessage(message) {
      if (this._otherPort && this._otherPort.onmessage) {
        setTimeout(() => {
          this._otherPort.onmessage({ data: message })
        }, 0)
      }
    }

    start() {
      // No-op for test environment
    }

    close() {
      // No-op for test environment
    }
  }

  global.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = new global.MessagePort()
      this.port2 = new global.MessagePort()
      this.port1._otherPort = this.port2
      this.port2._otherPort = this.port1
    }
  }
}

// Polyfill fetch for jsdom environment
// jsdom doesn't include fetch, but Node.js 18+ has it
if (!globalThis.fetch) {
  // Use undici's fetch (which is what Node uses internally)
  const { fetch, Headers, Request, Response } = require('undici');
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set test environment
process.env.NODE_ENV = 'test'

// DO NOT set mock Supabase credentials here - they come from .env.local
// See integration-setup.js for .env.local loading with override: true

// Mock OpenAI to avoid unnecessary API calls in integration tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked AI response for integration test',
              role: 'assistant',
            },
            finish_reason: 'stop',
          }],
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{
          embedding: Array(1536).fill(0.1),
        }],
      }),
    },
  }));
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock ioredis for integration tests
jest.mock('ioredis', () => {
  return jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }))
});
