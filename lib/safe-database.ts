import { createClient } from '@/lib/supabase-server';
import { logError, ErrorSeverity, ErrorCategory } from './error-logger';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

/**
 * Wraps a database operation with error handling and retry logic
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T | null> {
  const { maxRetries, retryDelay, exponentialBackoff } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries!; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log the error
      await logError(
        lastError,
        {
          operationName,
          attempt: attempt + 1,
          maxRetries,
        },
        attempt === maxRetries ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
        ErrorCategory.DATABASE
      );

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        console.error(`Non-retryable database error in ${operationName}:`, lastError.message);
        return null;
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries!) {
        const delay = exponentialBackoff 
          ? retryDelay! * Math.pow(2, attempt)
          : retryDelay!;
        
        console.log(`Retrying ${operationName} after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`Database operation ${operationName} failed after ${maxRetries} retries:`, lastError?.message);
  return null;
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  
  // Connection errors are retryable
  if (errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('network')) {
    return true;
  }
  
  // Rate limiting errors are retryable
  if (errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests')) {
    return true;
  }
  
  // Temporary database errors
  if (errorMessage.includes('deadlock') ||
      errorMessage.includes('lock timeout') ||
      errorMessage.includes('concurrent')) {
    return true;
  }
  
  // PostgreSQL error codes that are retryable
  const code = (error as any).code;
  if (code) {
    // Connection errors
    if (code === '08000' || code === '08003' || code === '08006') return true;
    // Lock errors
    if (code === '40001' || code === '40P01') return true;
    // Resource errors
    if (code === '53000' || code === '53100' || code === '53200' || code === '53300') return true;
  }
  
  return false;
}

/**
 * Safe wrapper for the search_embeddings function
 */
export async function safeSearchEmbeddings(
  domainId: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
) {
  return withDatabaseErrorHandling(
    async () => {
      const supabase = await createClient();
      
      // Try the new function signature first
      let result = await supabase.rpc('search_embeddings', {
        p_domain_id: domainId,
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      // If the new signature fails, try the old one
      if (result.error?.message?.includes('search_embeddings')) {
        console.log('Trying alternative search_embeddings signature...');
        result = await supabase.rpc('search_embeddings', {
          customer_id: domainId,
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
        });
      }

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    'search_embeddings',
    { maxRetries: 2, retryDelay: 500 }
  );
}

/**
 * Safe wrapper for database queries with automatic retries
 */
export async function safeQuery<T>(
  queryFn: (supabase: any) => Promise<{ data: T | null; error: any }>,
  operationName: string,
  options?: RetryOptions
): Promise<T | null> {
  return withDatabaseErrorHandling(
    async () => {
      const supabase = await createClient();
      const { data, error } = await queryFn(supabase);
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    operationName,
    options
  );
}

/**
 * Batch database operations to reduce load
 */
export async function batchDatabaseOperations<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const result = await withDatabaseErrorHandling(
      () => operation(batch),
      `batch_operation_${i / batchSize}`,
      { maxRetries: 2 }
    );
    
    if (result !== null) {
      results.push(result);
    }
  }
  
  return results;
}