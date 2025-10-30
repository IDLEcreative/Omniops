#!/bin/bash

# Test script to verify your secrets work locally before adding to GitHub
# Usage: Update the values below, then run: bash test-secrets.sh

# Replace these with your actual values
export DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
export SUPABASE_URL="https://[YOUR_PROJECT_REF].supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export MONITOR_ALERT_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Test database connection
echo "Testing database connection..."
npx tsx -e "
import { Client } from 'pg';
const client = new Client(process.env.DATABASE_URL);
client.connect()
  .then(() => { console.log('✅ Database connected'); client.end(); })
  .catch(err => console.log('❌ Database error:', err.message));
"

# Test Supabase connection
echo "Testing Supabase connection..."
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
supabase.from('customer_configs').select('count').single()
  .then(({error}) => console.log(error ? '❌ Supabase error' : '✅ Supabase connected'));
"

# Test Slack webhook (optional)
echo "Testing Slack webhook..."
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from OmniOps setup"}' \
  "$MONITOR_ALERT_WEBHOOK_URL" 2>/dev/null && echo "✅ Slack webhook sent" || echo "⚠️ Slack webhook failed (optional)"

echo ""
echo "If all tests passed, add these values as GitHub secrets!"