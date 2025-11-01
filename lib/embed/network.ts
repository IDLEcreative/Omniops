import { FetchFallbackOptions } from './types';

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeout: number): Promise<Response> {
  if (!timeout) return fetch(input, init);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFromCandidates<T>(
  candidates: string[],
  path: string,
  options: FetchFallbackOptions<T> = {}
): Promise<{ data: T; origin: string }> {
  const retryDelays = options.retryDelaysMs ?? [0];
  let lastError: unknown = null;

  for (const origin of candidates) {
    for (const delay of retryDelays) {
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));

      try {
        const response = await fetchWithTimeout(`${origin}${path}`, options.init, options.timeoutMs ?? 8000);
        if (!response.ok) {
          lastError = new Error(`Request failed with status ${response.status}`);
          continue;
        }

        const parsed = options.parser ? await options.parser(response) : ((response as unknown) as T);
        return { data: parsed, origin };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch from any candidate origin');
}

