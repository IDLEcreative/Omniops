import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// Enable request logging for debugging only when explicitly requested
// Set DEBUG=msw or CI=true to enable
if (process.env.DEBUG === 'msw' || process.env.MSW_DEBUG === 'true') {
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url)
  })
}