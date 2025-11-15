#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { TokenAnomalyDetector } from '../../lib/scripts/check-token-anomalies/core';
import { printAnomalies } from '../../lib/scripts/check-token-anomalies/formatters';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const hoursArg = args.find(arg => arg.startsWith('--hours='))?.split('=')[1];
  const hours = hoursArg ? parseInt(hoursArg, 10) : 24;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Token Anomaly Detection Tool

Usage:
  npx tsx scripts/monitoring/check-token-anomalies.ts [options]

Options:
  --domain=<domain>    Check specific domain
  --hours=<N>          Hours to analyze (default: 24)
  --help, -h           Show this help

Examples:
  npx tsx scripts/monitoring/check-token-anomalies.ts
  npx tsx scripts/monitoring/check-token-anomalies.ts --domain=example.com --hours=48
`);
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const detector = new TokenAnomalyDetector(supabaseUrl, supabaseServiceKey);

  try {
    const anomalies = await detector.analyzeTokenUsage(domain, hours);
    printAnomalies(anomalies);
  } catch (error) {
    console.error('L Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { TokenAnomalyDetector };
