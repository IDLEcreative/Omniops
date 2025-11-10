#!/usr/bin/env tsx

import { runEmbeddingRecovery } from './embeddings-recovery';

runEmbeddingRecovery().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
