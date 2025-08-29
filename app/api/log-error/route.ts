import { NextRequest, NextResponse } from 'next/server';
import { logError, ErrorSeverity, ErrorCategory } from '@/lib/error-logger';
import { z } from 'zod';

const errorLogSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  errorCount: z.number().optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  context: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = errorLogSchema.parse(body);
    
    // Extract domain from URL if present
    let domain: string | undefined;
    if (validated.url) {
      try {
        const url = new URL(validated.url);
        domain = url.hostname;
      } catch {}
    }
    
    // Determine severity
    const severity = validated.severity as ErrorSeverity || 
                    (validated.errorCount && validated.errorCount > 2 ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH);
    
    // Determine category
    const category = validated.category === 'react_component' 
      ? ErrorCategory.SYSTEM 
      : ErrorCategory.API;
    
    // Create error object
    const error = new Error(validated.message);
    if (validated.stack) {
      error.stack = validated.stack;
    }
    
    // Log the error
    await logError(
      error,
      {
        domain,
        endpoint: '/api/log-error',
        method: 'POST',
        userAgent: validated.userAgent,
        componentStack: validated.componentStack,
        errorCount: validated.errorCount,
        url: validated.url,
        ...validated.context
      },
      severity,
      category
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Error logged successfully'
    });
  } catch (error) {
    console.error('Failed to log error:', error);
    
    // Still return success to not break the client
    return NextResponse.json({ 
      success: false,
      message: 'Failed to log error but application continues'
    }, { status: 200 });
  }
}