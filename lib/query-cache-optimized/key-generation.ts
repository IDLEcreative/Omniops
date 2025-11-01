/**
 * Query Cache - Cache Key Generation
 */

import { createHash } from 'crypto';

/**
 * Generate cache key with scope awareness
 */
export function generateScopedKey(
  params: Record<string, any>,
  scope: 'user' | 'domain' | 'global',
  conversationId?: string,
  domainId?: string
): string {
  const keyBase = {
    ...params,
    _scope: scope,
    _domain: scope !== 'user' ? domainId : undefined,
    _conversation: scope === 'user' ? conversationId : undefined,
  };

  // Remove null/undefined values
  Object.keys(keyBase).forEach((key) => {
    if ((keyBase as any)[key] === undefined || (keyBase as any)[key] === null) {
      delete (keyBase as any)[key];
    }
  });

  return createHash('sha256').update(JSON.stringify(keyBase)).digest('hex');
}
