#!/usr/bin/env npx tsx

import { runTelemetryCleanupSuite } from './telemetry-cleanup';

runTelemetryCleanupSuite().catch(error => {
  console.error('Telemetry cleanup test suite failed:', error);
  process.exit(1);
});
