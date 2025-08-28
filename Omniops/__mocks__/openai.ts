import { jest } from '@jest/globals'

const OpenAI = jest.fn().mockImplementation(() => ({
  embeddings: {
    create: jest.fn()
  },
  chat: {
    completions: {
      create: jest.fn()
    }
  }
}))

export default OpenAI