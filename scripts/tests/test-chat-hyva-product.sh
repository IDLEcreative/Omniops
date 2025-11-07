#!/bin/bash

# Test chat API with Hyva product query
# Tests both search functionality and hallucination prevention

echo "🧪 Testing Chat API with Hyva Tank Filler Breather Cap Assembly"
echo "================================================================"
echo ""

echo "Test 1: Weight query (should find product and admit no weight spec)"
echo "-------------------------------------------------------------------"

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much does the Hyva Tank Filler Breather Cap Assembly weigh?",
    "domain": "thompsonseparts.co.uk",
    "session_id": "test-weight-query"
  }' | jq -r '.message'

echo ""
echo ""
echo "Test 2: General product query (should find product)"
echo "-------------------------------------------------------------------"

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me the Hyva Tank Filler Breather Cap Assembly",
    "domain": "thompsonseparts.co.uk",
    "session_id": "test-product-query"
  }' | jq -r '.message'

echo ""
echo ""
echo "Test 3: Check for hallucination (should NOT offer to contact manufacturer)"
echo "-------------------------------------------------------------------"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the technical specifications for SKU-NONEXISTENT-999?",
    "domain": "thompsonseparts.co.uk",
    "session_id": "test-hallucination-check"
  }' | jq -r '.message')

echo "$RESPONSE"
echo ""

# Check if response contains hallucinated phrases
if echo "$RESPONSE" | grep -qi "contact.*manufacturer\|search.*distributor\|call.*supplier"; then
  echo "❌ HALLUCINATION DETECTED: Response offers impossible actions"
else
  echo "✅ HALLUCINATION PREVENTION: Response correctly admits limitations"
fi
