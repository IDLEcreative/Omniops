import { NextResponse } from 'next/server';
import { ChatTelemetry } from '@/lib/chat-telemetry';

export type OpenAIErrorDetails = {
  status: number;
  code?: string;
  type?: string;
  message?: string;
  retryAfter?: string;
};

/**
 * Extract structured error information from OpenAI API errors
 * Handles various error response formats and header parsing
 */
export function extractOpenAIError(error: unknown): OpenAIErrorDetails | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const status = typeof (error as any).status === 'number' ? (error as any).status : undefined;

  if (status === undefined) {
    return null;
  }

  const code = typeof (error as any).code === 'string' ? (error as any).code : undefined;
  const type = typeof (error as any).type === 'string' ? (error as any).type : undefined;
  const message = typeof (error as any).message === 'string' ? (error as any).message : undefined;

  let retryAfter: string | undefined;
  const errorHeaders = (error as any).headers;
  const responseHeaders = (error as any).response?.headers;

  const tryGetRetryAfter = (headers: any) => {
    if (!headers) return;
    try {
      if (typeof headers.get === 'function') {
        const headerValue = headers.get('retry-after');
        if (headerValue) retryAfter = headerValue;
      } else if (typeof headers === 'object') {
        const headerValue = headers['retry-after'] ?? headers['Retry-After'];
        if (headerValue) retryAfter = String(headerValue);
      }
    } catch {
      // Ignore header parsing errors
    }
  };

  tryGetRetryAfter(errorHeaders);
  if (!retryAfter) {
    tryGetRetryAfter(responseHeaders);
  }

  return { status, code, type, message, retryAfter };
}

export interface ErrorContext {
  telemetry?: ChatTelemetry | null;
}

/**
 * Centralized error handler for chat API errors
 * Handles OpenAI API errors, validation errors, and general exceptions
 */
export class ChatErrorHandler {
  constructor(private context: ErrorContext = {}) {}

  async handleError(error: unknown): Promise<NextResponse> {
    console.error('[Intelligent Chat API] Error:', error);

    // DEBUG: Enhanced error logging for tests
    if (process.env.NODE_ENV === 'test') {
      console.error('[TEST DEBUG] Full error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error?.constructor?.name,
        error
      });
    }

    // Complete telemetry with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await this.context.telemetry?.complete(undefined, errorMessage);

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid request format', details: (error as any).issues },
        { status: 400 }
      );
    }

    // Handle OpenAI API errors
    const openAIError = extractOpenAIError(error);
    if (openAIError) {
      this.context.telemetry?.log('error', 'ai', 'OpenAI API failure', openAIError);

      const responseStatus =
        openAIError.status === 429
          ? 429
          : openAIError.status === 400
            ? 400
            : 503;

      const baseMessage =
        openAIError.status === 401
          ? 'The AI service credentials are invalid. Please verify the OpenAI API key.'
          : openAIError.status === 429
            ? 'The AI service is receiving too many requests. Please wait a few seconds and try again.'
            : 'Our AI assistant is temporarily unavailable. Please try again shortly.';

      return NextResponse.json(
        {
          error: baseMessage,
          message: baseMessage,
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              openAIStatus: openAIError.status,
              openAICode: openAIError.code,
              openAIType: openAIError.type,
              openAIMessage: openAIError.message,
              timestamp: new Date().toISOString()
            }
          })
        },
        {
          status: responseStatus,
          headers: openAIError.retryAfter
            ? { 'Retry-After': openAIError.retryAfter }
            : undefined
        }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: 'An unexpected error occurred. Please try again.',
        // Only include debug info in development (SECURITY: Never expose stack traces in production)
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
            timestamp: new Date().toISOString()
          }
        })
      },
      { status: 500 }
    );
  }
}
