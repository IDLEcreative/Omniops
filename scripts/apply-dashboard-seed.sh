#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEED_FILE="${ROOT_DIR}/supabase/seeds/20251020_dashboard_sample_data.sql"

if [ ! -f "${SEED_FILE}" ]; then
  echo "Seed file not found: ${SEED_FILE}" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL environment variable is required to run the dashboard seed." >&2
  echo "Example: DATABASE_URL=postgres://user:password@host:5432/db ./scripts/apply-dashboard-seed.sh" >&2
  exit 1
fi

echo "Applying dashboard seed from ${SEED_FILE}"
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${SEED_FILE}"

echo "Dashboard seed applied successfully."
