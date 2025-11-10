export const TEST_DOMAIN = process.env.BENCHMARK_TEST_DOMAIN || 'thompsonseparts.co.uk';
export const TEST_ITERATIONS = Number(process.env.BENCHMARK_ITERATIONS || 5);
export const CACHE_WARMUP_RUNS = Number(process.env.BENCHMARK_CACHE_WARMUP || 2);

export const API_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
