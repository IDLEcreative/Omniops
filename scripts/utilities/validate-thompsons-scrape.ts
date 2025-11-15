#!/usr/bin/env tsx

import dotenv from 'dotenv';
import Redis from 'ioredis';
import { ThompsonsValidation } from '../../lib/scripts/validate-thompsons-scrape/core';
import {
  validateContentProcessing,
  validateDeduplicationSystem,
  validatePerformanceMetrics
} from '../../lib/scripts/validate-thompsons-scrape/validators';
import { printSummary } from '../../lib/scripts/validate-thompsons-scrape/formatters';

dotenv.config();

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const validator = new ThompsonsValidation(supabaseUrl, supabaseServiceKey, redisUrl);

  try {
    await validator.validateAll();
    const results = validator.getResults();
    printSummary(results);
  } catch (error) {
    console.error('❌ Fatal validation error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ThompsonsValidation };
