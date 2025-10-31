#!/bin/bash
#
# Manual Rate Limiting Test
# Tests /api/setup-rag endpoint with 12 sequential requests
#
# Usage: bash scripts/tests/manual-rate-limit-test.sh
#

API_URL="http://localhost:3000"
DOMAIN="test-rate-limit.com"

echo "🧪 Manual Rate Limiting Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Testing: POST $API_URL/api/setup-rag"
echo "Domain: $DOMAIN"
echo "Expected: First 10 succeed, 11+ rate limited (429)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

rate_limited_count=0
success_count=0

for i in {1..12}; do
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/setup-rag" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\"}")

  # Split response and status code
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  if [ "$status" == "429" ]; then
    echo "❌ Request $i: RATE LIMITED (429)"
    rate_limited_count=$((rate_limited_count + 1))
    # Print error message
    error_msg=$(echo "$body" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$error_msg" ]; then
      echo "   Message: $error_msg"
    fi
  else
    echo "✅ Request $i: $status"
    success_count=$((success_count + 1))
  fi

  # Small delay between requests
  sleep 0.1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total requests: 12"
echo "Not rate limited: $success_count"
echo "Rate limited (429): $rate_limited_count"
echo ""

# Verify expectations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $rate_limited_count -ge 2 ]; then
  echo "✅ Rate limiting is working correctly"
  echo "   (Requests 11+ were rate limited)"
else
  echo "❌ Rate limiting may not be working"
  echo "   (Expected 2+ rate limited, got $rate_limited_count)"
fi

echo ""
echo "💡 To reset rate limits:"
echo "   - Wait 1 hour, OR"
echo "   - Restart dev server: npm run dev"
echo ""
