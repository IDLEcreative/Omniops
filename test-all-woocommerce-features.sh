#!/bin/bash

echo "=================================="
echo "WooCommerce Feature Testing Suite"
echo "=================================="
echo ""

BASE_URL="http://localhost:3000/api/chat"
DOMAIN="thompsonseparts.co.uk"

# Test 1: Customer Verification Required for Order Query
echo "Test 1: Customer Verification (Should require verification)"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me order #12345 details",
    "session_id": "test-verification-1",
    "domain": "'$DOMAIN'"
  }' -s | jq -r '.message' | head -3
echo ""
echo "---"

# Test 2: Real-time Stock Query
echo "Test 2: Real-time Stock Check"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Is SKU-ABC123 in stock?",
    "session_id": "test-stock-1",
    "domain": "'$DOMAIN'"
  }' -s | jq -r '.message' | head -3
echo ""
echo "---"

# Test 3: Order Search by Email
echo "Test 3: Order Search by Email (Should require verification)"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me orders for customer@example.com",
    "session_id": "test-email-search-1",
    "domain": "'$DOMAIN'"
  }' -s | jq -r '.message' | head -3
echo ""
echo "---"

# Test 4: Order Search by Name
echo "Test 4: Order Search by Customer Name"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to see orders for John Smith",
    "session_id": "test-name-search-1",
    "domain": "'$DOMAIN'"
  }' -s | jq -r '.message' | head -3
echo ""
echo "---"

# Test 5: Order Modification Request
echo "Test 5: Order Cancellation Request (Should require verification)"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to cancel order #98765",
    "session_id": "test-cancel-1",
    "domain": "'$DOMAIN'"
  }' -s | jq -r '.message' | head -3
echo ""
echo "---"

# Test 6: General Query (Should NOT require verification)
echo "Test 6: General Query (No verification needed)"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your return policy?",
    "session_id": "test-general-1",
    "domain": "'$DOMAIN'"
  }' -s | jq -r '.message' | head -3
echo ""

echo "=================================="
echo "Testing Complete"
echo "=================================="
