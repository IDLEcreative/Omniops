/**
 * Load Generator Utility
 *
 * Generates concurrent HTTP requests for load testing
 * Supports various load patterns and concurrency levels
 */

export interface LoadTestRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export interface LoadTestResponse {
  status: number;
  duration: number;
  error?: Error;
  body?: any;
}

export interface LoadTestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responses: LoadTestResponse[];
  totalDuration: number;
  requestsPerSecond: number;
}

/**
 * Generate load with fixed concurrency
 * @param request - Request configuration
 * @param concurrency - Number of concurrent requests
 * @param totalRequests - Total number of requests to make
 */
export async function generateLoad(
  request: LoadTestRequest,
  concurrency: number,
  totalRequests: number
): Promise<LoadTestResults> {
  const startTime = Date.now();
  const responses: LoadTestResponse[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Create batches of concurrent requests
  const batches = Math.ceil(totalRequests / concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalRequests - batch * concurrency);
    const promises = Array.from({ length: batchSize }, () => executeRequest(request));

    const batchResults = await Promise.allSettled(promises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
        if (result.value.error) {
          failureCount++;
        } else {
          successCount++;
        }
      } else {
        failureCount++;
        responses.push({
          status: 0,
          duration: 0,
          error: result.reason
        });
      }
    }
  }

  const totalDuration = Date.now() - startTime;

  return {
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failureCount,
    responses,
    totalDuration,
    requestsPerSecond: totalRequests / (totalDuration / 1000)
  };
}

/**
 * Generate sustained load over a duration
 * @param request - Request configuration
 * @param concurrency - Number of concurrent requests
 * @param durationMs - Duration in milliseconds
 */
export async function generateSustainedLoad(
  request: LoadTestRequest,
  concurrency: number,
  durationMs: number
): Promise<LoadTestResults> {
  const startTime = Date.now();
  const responses: LoadTestResponse[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalRequests = 0;

  // Keep generating requests until duration is reached
  while (Date.now() - startTime < durationMs) {
    const promises = Array.from({ length: concurrency }, () => executeRequest(request));
    totalRequests += concurrency;

    const batchResults = await Promise.allSettled(promises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
        if (result.value.error) {
          failureCount++;
        } else {
          successCount++;
        }
      } else {
        failureCount++;
        responses.push({
          status: 0,
          duration: 0,
          error: result.reason
        });
      }
    }
  }

  const totalDuration = Date.now() - startTime;

  return {
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failureCount,
    responses,
    totalDuration,
    requestsPerSecond: totalRequests / (totalDuration / 1000)
  };
}

/**
 * Execute a single HTTP request
 */
async function executeRequest(request: LoadTestRequest): Promise<LoadTestResponse> {
  const startTime = performance.now();

  try {
    const response = await fetch(request.url, {
      method: request.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      },
      body: request.body ? JSON.stringify(request.body) : undefined
    });

    const duration = performance.now() - startTime;
    let body;

    try {
      body = await response.json();
    } catch {
      // Response might not be JSON
      body = null;
    }

    return {
      status: response.status,
      duration,
      body
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      status: 0,
      duration,
      error: error as Error
    };
  }
}

/**
 * Generate ramp-up load (gradually increasing concurrency)
 * @param request - Request configuration
 * @param maxConcurrency - Maximum concurrency level
 * @param steps - Number of ramp-up steps
 * @param requestsPerStep - Requests per step
 */
export async function generateRampUpLoad(
  request: LoadTestRequest,
  maxConcurrency: number,
  steps: number,
  requestsPerStep: number
): Promise<LoadTestResults> {
  const startTime = Date.now();
  const allResponses: LoadTestResponse[] = [];
  let totalSuccess = 0;
  let totalFailure = 0;
  let totalRequests = 0;

  for (let step = 1; step <= steps; step++) {
    const concurrency = Math.floor((step / steps) * maxConcurrency);
    const stepResults = await generateLoad(request, concurrency, requestsPerStep);

    allResponses.push(...stepResults.responses);
    totalSuccess += stepResults.successfulRequests;
    totalFailure += stepResults.failedRequests;
    totalRequests += stepResults.totalRequests;
  }

  const totalDuration = Date.now() - startTime;

  return {
    totalRequests,
    successfulRequests: totalSuccess,
    failedRequests: totalFailure,
    responses: allResponses,
    totalDuration,
    requestsPerSecond: totalRequests / (totalDuration / 1000)
  };
}
