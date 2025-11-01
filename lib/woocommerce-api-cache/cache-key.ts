/**
 * Cache Key Generation
 */

import crypto from 'crypto';

export function generateCacheKey(operation: string, params: any, domain: string): string {
  // Sort params for consistent key generation
  const sortedParams = JSON.stringify(sortObject(params));
  const hash = crypto
    .createHash('md5')
    .update(`${operation}:${sortedParams}:${domain}`)
    .digest('hex')
    .substring(0, 12);

  return `wc_api:${domain}:${operation}:${hash}`;
}

function sortObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(item => sortObject(item));

  return Object.keys(obj)
    .sort()
    .reduce((sorted: any, key) => {
      sorted[key] = sortObject(obj[key]);
      return sorted;
    }, {});
}
