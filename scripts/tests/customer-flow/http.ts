import https from 'node:https';
import http from 'node:http';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export function makeRequest(url: string, options: RequestOptions = {}) {
  return new Promise<any>((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const requestOptions: RequestOptions & { method: string; headers: Record<string, string> } = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Customer-Flow-Test/1.0',
        ...(options.headers || {})
      }
    };

    const req = client.request(url, requestOptions as any, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        } catch (error: any) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}
