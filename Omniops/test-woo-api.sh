#!/bin/bash

# Test WooCommerce integration with real store

echo "🔧 Testing WooCommerce Chat Integration with Thompson's E-Parts"
echo "================================================"

# Test message 1: General product query
echo -e "\n📦 Test 1: Asking about products..."
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What products do you have available?",
    "session_id": "woo_test_'$(date +%s)'",
    "domain": "thompsonseparts.co.uk",
    "woocommerceEnabled": true,
    "storeDomain": "thompsonseparts.co.uk"
  }' | python3 -m json.tool

sleep 2

# Test message 2: Specific product query
echo -e "\n📦 Test 2: Asking about specific product..."
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you check if you have any brake parts in stock?",
    "session_id": "woo_test_'$(date +%s)'_2",
    "domain": "thompsonseparts.co.uk",
    "woocommerceEnabled": true,
    "storeDomain": "thompsonseparts.co.uk"
  }' | python3 -m json.tool

sleep 2

# Test message 3: Order status query
echo -e "\n📦 Test 3: Asking about order status..."
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you check the status of order #12345?",
    "session_id": "woo_test_'$(date +%s)'_3",
    "domain": "thompsonseparts.co.uk",
    "woocommerceEnabled": true,
    "storeDomain": "thompsonseparts.co.uk"
  }' | python3 -m json.tool