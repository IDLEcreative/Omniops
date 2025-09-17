import 'dotenv/config';
import { getSearchCacheManager } from './lib/embeddings';

async function clearCache() {
  const cache = getSearchCacheManager();
  await cache.clearCache();
  console.log('Cache cleared');
}

clearCache().catch(console.error);