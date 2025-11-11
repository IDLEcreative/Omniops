/**
 * Create a NextRequest for testing
 */
export function buildRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const {
    method = 'POST',
    body,
    headers = { 'Content-Type': 'application/json' },
  } = options;

  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}
