#!/bin/bash
# Validate .env.local format to catch issues early
# Usage: npm run validate:env

set -e

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found"
  exit 1
fi

echo "🔍 Validating $ENV_FILE..."
echo ""

ERRORS=0

# Check 1: No quotes around JWT tokens (eyJ...)
echo "Checking for quoted API keys..."
if grep -E '(ANON_KEY|SERVICE_ROLE_KEY|OPENAI_API_KEY)="' "$ENV_FILE" > /dev/null; then
  echo "❌ Found quoted API keys (remove quotes):"
  grep -E '(ANON_KEY|SERVICE_ROLE_KEY|OPENAI_API_KEY)="' "$ENV_FILE" | sed 's/=.*/=***REDACTED***/'
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No quoted API keys"
fi

# Check 2: Supabase keys are present and look valid (both old JWT and new format)
echo ""
echo "Checking Supabase keys..."
if ! grep -E "NEXT_PUBLIC_SUPABASE_ANON_KEY=(eyJ|sb_publishable_)" "$ENV_FILE" > /dev/null; then
  echo "❌ SUPABASE_ANON_KEY missing or invalid (should start with eyJ or sb_publishable_)"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Supabase anon key present"
fi

if ! grep -E "SUPABASE_SERVICE_ROLE_KEY=(eyJ|sb_secret_)" "$ENV_FILE" > /dev/null; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY missing or invalid (should start with eyJ or sb_secret_)"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Supabase service role key present"
fi

# Check 3: OpenAI key present
echo ""
echo "Checking OpenAI key..."
if ! grep -q "OPENAI_API_KEY=sk-" "$ENV_FILE"; then
  echo "⚠️  OPENAI_API_KEY missing or invalid (should start with sk-)"
  # Not a critical error for some operations
else
  echo "✅ OpenAI key present"
fi

# Check 4: No placeholder values
echo ""
echo "Checking for placeholder values..."
if grep -E "(your-.*-key-here|your-.*-here|example\.com)" "$ENV_FILE" > /dev/null; then
  echo "⚠️  Found placeholder values (may need updating):"
  grep -E "(your-.*-key-here|your-.*-here)" "$ENV_FILE" | head -5
  # Not a critical error
else
  echo "✅ No obvious placeholders"
fi

echo ""
echo "======================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ Validation passed!"
  exit 0
else
  echo "❌ Found $ERRORS error(s)"
  echo "Fix these issues before starting the server"
  exit 1
fi
