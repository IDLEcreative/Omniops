#!/usr/bin/env npx tsx
import { runRealWorldValidator } from './real-world/runner';

async function main() {
  const scenarioFilter = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--scenario='))
    ?.split('=')[1];

  await runRealWorldValidator(scenarioFilter);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
