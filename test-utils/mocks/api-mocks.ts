import { NextRequest } from 'next/server';

/**
 * Creates a properly configured mock NextRequest for testing API routes
 */
export function mockNextRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  const baseUrl = 'http://localhost:3000';
  const fullUrl = new URL(url, baseUrl);

  // Add search params if provided
  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, value);
    });
  }

  // Create headers
  const headers = new Headers(options?.headers || {});
  if (options?.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  // Create the request
  const init = {
    method: options?.method || 'GET',
    headers,
    body: undefined as string | undefined,
  };

  // Add body if provided
  if (options?.body) {
    init.body = typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body);
  }

  return new NextRequest(fullUrl, init as any);
}

/**
 * Mock response helper for streaming responses
 */
export function mockStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        // Simulate delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
